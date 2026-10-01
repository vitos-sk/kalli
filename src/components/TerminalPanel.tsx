import { ChevronDown, ChevronUp, FastForward, RotateCcw, Terminal as TerminalIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { XTerm } from 'react-xterm-shell'
import { useShellTerminal } from '@/lib/terminal'

const HINT_H = 56
const DEFAULT_HINT = 'Запусти пример, потом наведи на строку (на телефоне — тапни): объясню, что она значит.'

// Сворачиваемая панель снизу. xterm всегда смонтирован: содержимое не теряется.
export function TerminalPanel() {
  const { terminal, open, setOpen, running, skip, play, lastText, lastCmd, label, explain } = useShellTerminal()
  const wrap = useRef<HTMLDivElement>(null)
  const [hint, setHint] = useState<{ top: number; h: number; text: string } | null>(null)

  // на телефоне терминал ниже, чтобы не съедать экран
  const height = window.innerWidth < 768 ? 150 : 200

  // после раскрытия пересчитываем размер сетки
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(terminal.fit, 220)
      return () => window.clearTimeout(t)
    }
  }, [open, terminal])

  // новый вывод — старая подсказка не нужна
  useEffect(() => setHint(null), [running, lastText])

  // Определяем строку под курсором/пальцем и ищем для неё пояснение
  const inspect = (clientY: number) => {
    const term = terminal.term
    const screen = wrap.current?.querySelector<HTMLElement>('.xterm-screen')
    if (!term || !screen || !wrap.current) return
    const r = screen.getBoundingClientRect()
    const rowH = r.height / term.rows
    const row = Math.floor((clientY - r.top) / rowH)
    if (row < 0 || row >= term.rows) return setHint(null)
    const buf = term.buffer.active
    const line = buf.getLine(buf.viewportY + row)?.translateToString(true) ?? ''
    const text = line.trim() ? explain(line) : null
    setHint(text ? { top: r.top - wrap.current.getBoundingClientRect().top + row * rowH, h: rowH, text } : null)
  }

  return (
    <section aria-label="Терминал" className="shrink-0 border-t bg-black">
      <div className="flex h-10 items-center pr-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="label flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2 px-4 text-left text-muted-foreground transition-colors hover:text-foreground"
        >
          <TerminalIcon className="size-3.5 shrink-0 text-primary" />
          <span className="shrink-0">терминал.exe</span>
          {running && <span className="blink size-2 shrink-0 bg-primary" />}
          {label && (
            <span className="min-w-0 truncate text-foreground/80 normal-case tracking-normal">
              <span className="text-muted-foreground">{running ? 'выполняется:' : 'показан пример:'}</span> <span className="font-mono text-primary">{label}</span>
            </span>
          )}
        </button>
        {running && (
          <button type="button" onClick={skip} className="label flex h-7 cursor-pointer items-center gap-1.5 border border-primary/60 px-2 text-[10px] text-primary hover:bg-primary hover:text-primary-foreground">
            <FastForward className="size-3" /> пропустить
          </button>
        )}
        {!running && lastText && (
          <button type="button" onClick={() => play(lastText, label, lastCmd)} className="label flex h-7 cursor-pointer items-center gap-1.5 border border-primary/60 px-2 text-[10px] text-primary hover:bg-primary hover:text-primary-foreground">
            <RotateCcw className="size-3" /> ещё раз
          </button>
        )}
        <button type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Свернуть' : 'Развернуть'} className="ml-1 flex size-8 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground">
          {open ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </button>
      </div>

      {/* внутренний блок фиксированной высоты — при сворачивании xterm не пересчитывается */}
      <div className="overflow-hidden transition-[height] duration-200" style={{ height: open ? height + HINT_H : 0 }}>
        <div
          ref={wrap}
          className="relative"
          style={{ height }}
          onMouseMove={(e) => inspect(e.clientY)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setHint(null)}
          onClick={(e) => inspect(e.clientY)}
        >
          <XTerm terminal={terminal} style={{ height }} className="w-full" />
          {hint && <div aria-hidden className="pointer-events-none absolute inset-x-0 border-y border-primary/50 bg-primary/10" style={{ top: hint.top, height: hint.h }} />}
        </div>
        <div className="flex items-center gap-3 border-t bg-card px-4 text-xs leading-relaxed" style={{ height: HINT_H }}>
          <span className="label shrink-0 text-[9px] text-primary">что это</span>
          <p className={hint ? 'line-clamp-3 text-foreground' : 'line-clamp-3 text-muted-foreground'}>{hint?.text ?? DEFAULT_HINT}</p>
        </div>
      </div>
    </section>
  )
}
