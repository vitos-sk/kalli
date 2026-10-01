import { Check, Copy, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Window } from '@/components/ui/card'
import { favKey, favorites } from '@/lib/store'
import { hasPlaceholder, useTarget } from '@/lib/target'
import { cn } from '@/lib/utils'
import type { BranchCommand } from '@/branches/types'

// Копирование с запасным вариантом для http / старых браузеров
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
}

// Невставленные <ip> подсвечиваем — их надо заменить
function Cmd({ text }: { text: string }) {
  return text.split(/(<[^>]+>)/).map((part, i) =>
    part.startsWith('<') ? (
      <span key={i} className="bg-primary/15 px-0.5 text-primary">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

// Строка команды с копированием; target подставляется вместо <ip>
export function CommandLine({ cmd, before }: { cmd: string; before?: React.ReactNode }) {
  const { apply } = useTarget()
  const [done, setDone] = useState(false)
  const full = apply(cmd)
  const onCopy = async () => {
    await copy(full)
    setDone(true)
    window.setTimeout(() => setDone(false), 1400)
  }
  return (
    <div className="flex items-center gap-2 border bg-black py-2 pl-3 pr-1.5">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm">
        <span className="select-none text-primary">$ </span>
        <Cmd text={full} />
      </code>
      {before}
      <button
        type="button"
        onClick={onCopy}
        aria-label="Скопировать команду"
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        {done ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
      </button>
    </div>
  )
}

export function CommandCard({ item, branchId, flash = false }: { item: BranchCommand; branchId: string; flash?: boolean }) {
  const { target } = useTarget()
  const favs = favorites.use()
  const key = favKey(branchId, item.cmd)
  const isFav = favs.includes(key)
  const [flag, setFlag] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const flagInfo = item.flags?.find((f) => f.flag === flag)

  // переход из поиска: прокручиваем и мигаем рамкой
  useEffect(() => {
    if (flash) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [flash])

  return (
    <div ref={ref} className={cn('transition-shadow', flash && 'outline-2 outline-offset-2 outline-primary')}>
      <Window title={item.label} bodyClassName="space-y-3">
        <CommandLine
          cmd={item.cmd}
          before={
            <button
              type="button"
              onClick={() => favorites.toggle(key)}
              aria-label={isFav ? 'Убрать из избранного' : 'В избранное'}
              aria-pressed={isFav}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-primary"
            >
              <Star className={cn('size-4', isFav && 'fill-primary text-primary')} />
            </button>
          }
        />

        {hasPlaceholder(item.cmd) && !target && (
          <p className="text-xs text-primary/90">Впиши цель вверху — <span className="font-mono">&lt;ip&gt;</span> подставится сам.</p>
        )}

        {item.flags && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="label text-[9px] text-muted-foreground">что значит:</span>
              {item.flags.map((f) => (
                <button
                  key={f.flag}
                  type="button"
                  aria-pressed={flag === f.flag}
                  onClick={() => setFlag(flag === f.flag ? null : f.flag)}
                  className={cn(
                    'cursor-pointer border px-2 py-1 font-mono text-xs transition-colors',
                    flag === f.flag ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/50 text-primary hover:bg-primary/10',
                  )}
                >
                  {f.flag}
                </button>
              ))}
            </div>
            {flagInfo && <p className="border-l-2 border-primary bg-accent px-3 py-2 text-sm">{flagInfo.text}</p>}
          </div>
        )}

        <p className="text-sm text-muted-foreground">{item.note}</p>
      </Window>
    </div>
  )
}

export function Commands({ items, branchId, flashCmd }: { items: BranchCommand[]; branchId: string; flashCmd?: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((c) => (
        <CommandCard key={c.cmd} item={c} branchId={branchId} flash={c.cmd === flashCmd} />
      ))}
    </div>
  )
}
