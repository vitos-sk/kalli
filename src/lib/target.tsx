import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const KEY = 'pentest-cheats:target'
// Только символы, возможные в домене / IP / CIDR. Всё остальное отбрасываем,
// чтобы в скопированную команду не попали пробелы, `;`, `|` и прочие шелл-символы.
const ALLOWED = /[^A-Za-z0-9._:/-]/g
const PLACEHOLDER = /<(?:ip|target|domain)>/g
const NET = /<net>/g

// Сеть из цели: IPv4 → x.x.x.0/24, CIDR остаётся как есть
export function netOf(target: string): string | null {
  if (/^\d+\.\d+\.\d+\.\d+\/\d+$/.test(target)) return target
  const m = target.match(/^(\d+\.\d+\.\d+)\.\d+$/)
  return m ? `${m[1]}.0/24` : null
}

interface TargetCtx {
  target: string
  setTarget: (v: string) => void
  /** Подставляет цель вместо <ip>; без цели оставляет плейсхолдер */
  apply: (cmd: string) => string
}

const Ctx = createContext<TargetCtx | null>(null)

function load(): string {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function TargetProvider({ children }: { children: ReactNode }) {
  const [target, setRaw] = useState(load)

  const setTarget = useCallback((v: string) => {
    const clean = v.replace(ALLOWED, '').slice(0, 253)
    setRaw(clean)
    try {
      localStorage.setItem(KEY, clean)
    } catch {
      /* приватный режим — просто не сохраняем */
    }
  }, [])

  const value = useMemo<TargetCtx>(
    () => ({ target, setTarget, apply: (cmd) => {
        const net = netOf(target)
        return (target ? cmd.replace(PLACEHOLDER, target) : cmd).replace(NET, net ?? '<net>')
      },
    }),
    [target, setTarget],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTarget() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTarget вне TargetProvider')
  return ctx
}

export const hasPlaceholder = (cmd: string) => /<(?:ip|target|domain|net)>/.test(cmd)
