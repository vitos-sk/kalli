import { ChevronRight } from 'lucide-react'
import { branches } from '@/branches'
import { CommandCard } from '@/components/Commands'
import { Md } from '@/components/Md'
import { TargetField } from '@/components/TargetField'
import { cn } from '@/lib/utils'

// «Что делать, если…»: человек приходит с проблемой, а не с названием инструмента
export function Situations({ openId, onOpen }: { openId?: string; onOpen: (id?: string) => void }) {
  const items = branches.flatMap((b) => (b.situations ?? []).map((s) => ({ b, s })))

  return (
    <div>
      <PageTitle title="Что делать, если…" hint="Выбери ситуацию — получишь короткий ответ и готовую команду." />
      <TargetField />
      <ul className="space-y-2">
        {items.map(({ b, s }) => {
          const open = s.id === openId
          return (
            <li key={`${b.id}-${s.id}`} className={cn('border bg-card', open && 'border-primary/60')}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => onOpen(open ? undefined : s.id)}
                className="flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left"
              >
                <ChevronRight className={cn('size-4 shrink-0 text-primary transition-transform', open && 'rotate-90')} />
                <span className="min-w-0 flex-1">
                  <span className="block">{s.title}</span>
                  <span className="label block text-[9px] text-muted-foreground">{b.title}</span>
                </span>
              </button>
              {open && (
                <div className="space-y-4 border-t p-4">
                  <div className="space-y-3 text-[15px] leading-relaxed text-foreground/90"><Md>{s.answer}</Md></div>
                  {s.cmds.map((cmd) => {
                    const item = b.commands.find((c) => c.cmd === cmd)
                    return item ? <CommandCard key={cmd} item={item} branchId={b.id} /> : null
                  })}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Общий заголовок служебных страниц
export function PageTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6">
      <h1 className="glitch hidden text-3xl font-bold uppercase tracking-wide md:block">{title}</h1>
      {hint && <p className="text-sm text-muted-foreground md:mt-2">{hint}</p>}
    </div>
  )
}
