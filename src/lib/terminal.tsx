import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useXTerm, type XTermHandle } from 'react-xterm-shell'
import type { LineHint } from '@/branches/types'
import { useTarget } from '@/lib/target'
import { explainLine } from '@/lib/explain'

const FONT = '"JetBrains Mono Variable", ui-monospace, monospace'
// полный сброс экрана и прокрутки через escape-последовательность (reset() падает в xterm)
const CLEAR = '\x1bc'
const LINE_DELAY = 110 // мс между строками — эффект «набора»
const IDLE_HINT = '\x1b[90m> терминал только показывает готовый пример — ничего не выполняется\x1b[0m\r\n'
// «юзер@машина» слева от команды — чтобы строка выглядела как настоящий терминал
const PS = '\x1b[1;32mguest@target\x1b[0m\x1b[1m:\x1b[0m\x1b[1;34m~\x1b[0m\x1b[1m$ \x1b[0m'
const TYPE_DELAY = 28 // мс между символами при «наборе» команды

// Лёгкая подсветка состояний портов (ANSI). Исходный текст не меняется.
function highlight(line: string): string {
  if (line.startsWith('PORT ')) return `\x1b[1m${line}\x1b[0m`
  if (line.startsWith('Nmap scan report')) return `\x1b[1m${line}\x1b[0m`
  return line
    .replace(/^(\d+\/\w+\s+)(open)/, '\x1b[37m$1\x1b[1;35m$2\x1b[0m')
    .replace(/^(\d+\/\w+\s+)(closed)/, '\x1b[90m$1$2\x1b[0m')
    .replace(/^(\d+\/\w+\s+)(filtered)/, '\x1b[37m$1\x1b[33m$2\x1b[0m')
}

interface TerminalCtx {
  terminal: XTermHandle
  open: boolean
  setOpen: (v: boolean) => void
  /** Напечатать текст построчно (раскрывает панель) */
  play: (text: string, label?: string, cmd?: string) => void
  /** Очистить и показать подсказку */
  idle: () => void
  running: boolean
  /** Мгновенно допечатать остаток вывода */
  skip: () => void
  /** Текст последнего запущенного вывода — для кнопки «ещё раз» */
  lastText: string
  lastCmd: string
  /** Название примера, который сейчас/последним печатался — для шапки терминала */
  label: string
  /** Подсказки текущей ветки и поиск пояснения по строке */
  setHints: (h: LineHint[]) => void
  explain: (line: string) => string | null
}

const Ctx = createContext<TerminalCtx | null>(null)

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(() => window.innerWidth >= 768) // на телефоне свёрнут по умолчанию
  const [running, setRunning] = useState(false)
  const [lastText, setLastText] = useState('')
  const [lastCmd, setLastCmd] = useState('')
  const { apply } = useTarget()
  const [label, setLabel] = useState('')
  const timer = useRef<number | undefined>(undefined)
  const pending = useRef<string[]>([]) // ещё не напечатанные строки вывода
  const typingRest = useRef('') // непропечатанный хвост самой команды (для «пропустить»)
  const hinted = useRef(false) // подсказка уже на экране — второй раз не печатаем
  const hints = useRef<LineHint[]>([])

  const handle = useXTerm({
    webgl: false,
    webLinks: false,
    cursorBlink: false,
    fontSize: 13,
    theme: {
      background: '#000000',
      foreground: '#ece6d3',
      cursor: '#f23f9c',
      magenta: '#f23f9c',
      brightMagenta: '#f23f9c',
      white: '#ece6d3',
      yellow: '#f5c542',
      brightBlack: '#6b6760',
    },
    // косметический терминал: ввода нет
    options: { disableStdin: true, fontFamily: FONT, cursorStyle: 'underline', cursorInactiveStyle: 'none' },
  })

  // идентичность handle нестабильна между рендерами — держим первый экземпляр в ref
  const ref = useRef(handle)
  const terminal = ref.current

  const stop = useCallback(() => {
    window.clearTimeout(timer.current)
    setRunning(false)
  }, [])

  const idle = useCallback(() => {
    stop()
    pending.current = []
    setLastText('')
    setLastCmd('')
    setLabel('')
    terminal.write(CLEAR)
    terminal.write(IDLE_HINT)
    hinted.current = true
  }, [stop, terminal])

  const play = useCallback(
    (text: string, newLabel?: string, cmd?: string) => {
      stop()
      terminal.write(CLEAR)
      setOpen(true)
      setRunning(true)
      setLastText(text)
      setLastCmd(cmd ?? '')
      setLabel(newLabel ?? '')
      pending.current = text.split('\n')

      // печатаем вывод по строке с небольшим разбросом задержки
      const printOutput = () => {
        const next = () => {
          const line = pending.current.shift()
          if (line === undefined) return setRunning(false)
          terminal.write(highlight(line) + '\r\n')
          timer.current = window.setTimeout(next, LINE_DELAY + Math.random() * 90)
        }
        timer.current = window.setTimeout(next, 150)
      }

      if (cmd) {
        // сначала «печатаем» саму команду после приглашения — как в настоящем терминале
        const shown = apply(cmd)
        terminal.write(PS)
        typingRest.current = shown
        let i = 0
        const typeChar = () => {
          if (i < shown.length) {
            typingRest.current = shown.slice(i + 1)
            terminal.write(shown[i++])
            timer.current = window.setTimeout(typeChar, TYPE_DELAY + Math.random() * 35)
          } else {
            typingRest.current = ''
            terminal.write('\r\n')
            printOutput()
          }
        }
        timer.current = window.setTimeout(typeChar, 300)
      } else {
        typingRest.current = ''
        printOutput()
      }
    },
    [stop, terminal, apply],
  )

  const skip = useCallback(() => {
    window.clearTimeout(timer.current)
    // если ещё печатали саму команду — дописываем остаток и переводим строку
    if (typingRest.current) {
      terminal.write(typingRest.current + '\r\n')
      typingRest.current = ''
    }
    for (const line of pending.current) terminal.write(highlight(line) + '\r\n')
    pending.current = []
    setRunning(false)
  }, [terminal])

  const setHints = useCallback((h: LineHint[]) => {
    hints.current = h
  }, [])

  const explain = useCallback((line: string) => explainLine(hints.current, line), [])

  useEffect(() => {
    // веб-шрифт мог догрузиться после первого замера ячеек — пересчитываем
    document.fonts.load(`13px ${FONT}`).then(() => {
      if (terminal.term) terminal.term.options.fontFamily = FONT
      terminal.fit()
      if (!hinted.current) terminal.write(IDLE_HINT) // первая подсказка — когда xterm уже готов
    })
    return () => window.clearTimeout(timer.current)
    // eslint-disable-next-line
  }, [])

  const value = useMemo(
    () => ({ terminal, open, setOpen, play, idle, running, skip, lastText, lastCmd, label, setHints, explain }),
    [terminal, open, play, idle, running, skip, lastText, lastCmd, label, setHints, explain],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useShellTerminal() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useShellTerminal вне TerminalProvider')
  return ctx
}
