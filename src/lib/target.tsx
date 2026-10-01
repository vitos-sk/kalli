import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const KEY = 'pentest-cheats:target'
const PORT_KEY = 'pentest-cheats:port'
// Только символы, возможные в домене / IP / CIDR. Всё остальное отбрасываем,
// чтобы в скопированную команду не попали пробелы, `;`, `|` и прочие шелл-символы.
const ALLOWED = /[^A-Za-z0-9._:/-]/g
const TARGET_TOKEN = /<(?:ip|target|domain)>/g
const NET_TOKEN = /<net>/g
const PORT_TOKEN = /<port>/g

// Заглушки, которые встречаются в командах: ip (и target), domain, net, port
export type Token = 'ip' | 'domain' | 'net' | 'port'
export const TOKEN_RE = /<(ip|target|domain|net|port)>/g

/** <target> — то же, что <ip> */
export const tokenKey = (t: string): Token => (t === 'target' ? 'ip' : (t as Token))

/** Какие заглушки ещё остались в команде (после подстановки) */
export function unresolved(cmd: string): Token[] {
  return [...new Set([...cmd.matchAll(TOKEN_RE)].map((m) => tokenKey(m[1])))]
}

// Сеть из цели: IPv4 → x.x.x.0/24, CIDR остаётся как есть
export function netOf(target: string): string | null {
  if (/^\d+\.\d+\.\d+\.\d+\/\d+$/.test(target)) return target
  const m = target.match(/^(\d+\.\d+\.\d+)\.\d+$/)
  return m ? `${m[1]}.0/24` : null
}

interface TargetCtx {
  target: string
  setTarget: (v: string) => void
  port: string
  setPort: (v: string) => void
  /** Подставляет цель, сеть и порт вместо заглушек; чего не знаем — оставляет как есть */
  apply: (cmd: string) => string
}

const Ctx = createContext<TargetCtx | null>(null)

function load(key: string): string {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}
function save(key: string, v: string) {
  try {
    localStorage.setItem(key, v)
  } catch {
    /* приватный режим — просто не сохраняем */
  }
}

export function TargetProvider({ children }: { children: ReactNode }) {
  const [target, setTargetRaw] = useState(() => load(KEY))
  const [port, setPortRaw] = useState(() => load(PORT_KEY))

  const setTarget = useCallback((v: string) => {
    const clean = v.replace(ALLOWED, '').slice(0, 253)
    setTargetRaw(clean)
    save(KEY, clean)
  }, [])
  const setPort = useCallback((v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 5)
    setPortRaw(clean)
    save(PORT_KEY, clean)
  }, [])

  const value = useMemo<TargetCtx>(
    () => ({
      target,
      setTarget,
      port,
      setPort,
      apply: (cmd) => {
        const net = netOf(target)
        return cmd
          .replace(TARGET_TOKEN, (m) => target || m)
          .replace(NET_TOKEN, (m) => net ?? m)
          .replace(PORT_TOKEN, (m) => port || m)
      },
    }),
    [target, setTarget, port, setPort],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTarget() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTarget вне TargetProvider')
  return ctx
}

export const hasPlaceholder = (cmd: string) => /<(?:ip|target|domain|net|port)>/.test(cmd)

/** Какие заглушки (ip/domain/net/port) встречаются в списке команд */
export function tokensIn(cmds: (string | undefined)[]): Token[] {
  const found = new Set<Token>()
  for (const c of cmds) if (c) for (const t of unresolved(c)) found.add(t)
  return [...found]
}
