import { Star } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { CommandLine } from '@/components/CommandLine'
import { Window } from '@/components/ui/card'
import { favKey, favorites } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { BranchCommand } from '@/branches/types'

export { CommandLine }

export function CommandCard({ item, branchId, flash = false }: { item: BranchCommand; branchId: string; flash?: boolean }) {
  const favs = favorites.use()
  const key = favKey(branchId, item.cmd)
  const isFav = favs.includes(key)
  const ref = useRef<HTMLDivElement>(null)

  // переход из поиска: прокручиваем и мигаем рамкой
  useEffect(() => {
    if (flash) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [flash])

  return (
    <div ref={ref} className={cn('min-w-0 transition-shadow', flash && 'outline-2 outline-offset-2 outline-primary')}>
      <Window title={item.label} bodyClassName="space-y-3">
        <CommandLine
          cmd={item.cmd}
          flags={item.flags}
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

        <div className="space-y-2 text-[15px] leading-relaxed">
          <p><span className="label mr-2 text-[10px] text-primary">зачем</span>{item.note}</p>
          {item.see && <p><span className="label mr-2 text-[10px] text-primary">что увидишь</span>{item.see}</p>}
          {item.next && <p><span className="label mr-2 text-[10px] text-primary">дальше</span>{item.next}</p>}
        </div>
      </Window>
    </div>
  )
}

export function Commands({ items, branchId, flashCmd }: { items: BranchCommand[]; branchId: string; flashCmd?: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {items.map((c) => (
        <CommandCard key={c.cmd} item={c} branchId={branchId} flash={c.cmd === flashCmd} />
      ))}
    </div>
  )
}
