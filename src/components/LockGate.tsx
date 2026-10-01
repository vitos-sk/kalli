import { Lock } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

const SESSION_KEY = 'pentest-cheats:unlocked'
// Хэш пароля задаётся при сборке через .env.local (VITE_LOCK_HASH), в репозиторий не попадает.
// Если хэш не задан — замок выключен (локальная разработка без пароля).
const HASH = import.meta.env.VITE_LOCK_HASH as string | undefined

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Замок уровня браузера: держит чужих вне приложения. Это не серверная защита —
// пароль проверяется в самом браузере, поэтому от человека, читающего код сайта
// (devtools, исходники), не спасает. Для серьёзной защиты нужен сервер с авторизацией.
export function LockGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => !HASH || sessionStorage.getItem(SESSION_KEY) === HASH)
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    setWrong(false)
  }, [value])

  if (unlocked) return <>{children}</>

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setChecking(true)
    const hash = await sha256Hex(value)
    setChecking(false)
    if (hash === HASH) {
      sessionStorage.setItem(SESSION_KEY, hash)
      setUnlocked(true)
    } else {
      setWrong(true)
      setValue('')
    }
  }

  return (
    <div className="flex h-dvh items-center justify-center bg-black px-4">
      <form onSubmit={submit} className="w-full max-w-xs space-y-4 border border-primary/50 bg-card p-6">
        <div className="flex items-center gap-2 text-primary">
          <Lock className="size-4" />
          <span className="label text-[10px]">доступ закрыт</span>
        </div>
        <input
          autoFocus
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="пароль"
          autoComplete="current-password"
          className="h-10 w-full border bg-black px-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
        />
        {wrong && <p className="text-xs text-red-400">Неверный пароль</p>}
        <button
          type="submit"
          disabled={checking || !value}
          className="h-10 w-full cursor-pointer border border-primary bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {checking ? '…' : 'войти'}
        </button>
      </form>
    </div>
  )
}
