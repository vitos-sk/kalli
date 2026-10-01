import { HelpCircle, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CommandLine } from '@/components/CommandLine'
import { Window } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { favKey, favorites } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { BranchCommand, CommandsIntro } from '@/branches/types'

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

export function Commands({ items, branchId, intro, flashCmd }: { items: BranchCommand[]; branchId: string; intro?: CommandsIntro; flashCmd?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-4">
      {intro && (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full cursor-pointer items-center gap-3 border border-primary/60 bg-accent p-3 text-left transition-colors hover:border-primary sm:w-auto"
          >
            <HelpCircle className="size-5 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-primary">Зачем эти команды?</span>
              <span className="block text-sm text-muted-foreground">Что получим и что делать с результатом — простыми словами</span>
            </span>
          </button>
          {open && (
            <Modal title="Зачем эти команды?" onClose={() => setOpen(false)}>
              <div className="space-y-4">
                <section className="space-y-1.5">
                  <p className="label text-[10px] text-primary">что мы получим</p>
                  <p className="text-[15px] leading-relaxed text-foreground/90">{intro.get}</p>
                </section>
                <section className="space-y-1.5 border-t pt-4">
                  <p className="label text-[10px] text-primary">зачем это нужно</p>
                  <p className="text-[15px] leading-relaxed text-foreground/90">{intro.goal}</p>
                </section>
                <section className="space-y-1.5 border-t pt-4">
                  <p className="label text-[10px] text-primary">что делать с результатом</p>
                  <p className="text-[15px] leading-relaxed text-foreground/90">{intro.result}</p>
                </section>
              </div>
            </Modal>
          )}
        </>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {items.map((c) => (
          <CommandCard key={c.cmd} item={c} branchId={branchId} flash={c.cmd === flashCmd} />
        ))}
      </div>
    </div>
  )
}
