import { Check, ChevronRight, Eye, RotateCcw } from 'lucide-react'
import { branches } from '@/branches'
import { CommandLine } from '@/components/Commands'
import { PageTitle } from '@/components/Situations'
import { TargetField } from '@/components/TargetField'
import { playbookDone } from '@/lib/store'
import { useShellTerminal } from '@/lib/terminal'
import { cn } from '@/lib/utils'

// Сценарии по шагам: идёшь по порядку, отмечаешь «готово», прогресс сохраняется
export function Playbooks({ openId, onOpen }: { openId?: string; onOpen: (id?: string) => void }) {
  const done = playbookDone.use()
  const { play } = useShellTerminal()
  const items = branches.flatMap((b) => (b.playbooks ?? []).map((pb) => ({ b, pb })))
  const key = (pbId: string, i: number) => `${pbId}::${i}`

  const current = items.find(({ pb }) => pb.id === openId)

  // список сценариев
  if (!current) {
    return (
      <div>
        <PageTitle title="Сценарии по шагам" hint="Не знаешь, с чего начать? Выбери сценарий и иди по шагам: каждый — команда и пояснение." />
        <ul className="space-y-3">
          {items.map(({ b, pb }) => {
            const n = pb.steps.filter((_, i) => done.includes(key(pb.id, i))).length
            return (
              <li key={pb.id}>
                <button type="button" onClick={() => onOpen(pb.id)} className="flex w-full cursor-pointer items-center gap-3 border bg-card p-4 text-left transition-colors hover:border-primary/60">
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg">{pb.title}</span>
                    <span className="label block text-[9px] text-muted-foreground">{b.title} · {pb.steps.length} шагов</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{pb.intro}</span>
                  </span>
                  <span className="label shrink-0 text-[10px] text-primary">{n}/{pb.steps.length}</span>
                  <ChevronRight className="size-4 shrink-0 text-primary" />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  const { b, pb } = current
  const firstOpen = pb.steps.findIndex((_, i) => !done.includes(key(pb.id, i)))
  const finished = firstOpen === -1

  return (
    <div>
      <button type="button" onClick={() => onOpen(undefined)} className="label mb-3 cursor-pointer text-[10px] text-muted-foreground hover:text-primary">← все сценарии</button>
      <PageTitle title={pb.title} hint={pb.intro} />
      <TargetField />

      <ol className="space-y-3">
        {pb.steps.map((st, i) => {
          const isDone = done.includes(key(pb.id, i))
          const isCurrent = i === firstOpen
          const sample = st.sampleId ? b.samples?.find((s) => s.id === st.sampleId) : undefined
          return (
            <li key={i} className={cn('border bg-card', isCurrent && 'border-primary/70', isDone && 'opacity-60')}>
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <span className={cn('grid size-7 shrink-0 place-items-center border font-mono text-xs', isDone ? 'border-primary bg-primary text-primary-foreground' : isCurrent ? 'border-primary text-primary' : 'text-muted-foreground')}>
                  {isDone ? <Check className="size-4" /> : i + 1}
                </span>
                <h2 className="min-w-0 flex-1">{st.title}</h2>
              </div>
              <div className="space-y-3 p-4">
                <p className="text-[15px] leading-relaxed text-foreground/90">{st.text}</p>
                {st.cmd && <CommandLine cmd={st.cmd} />}
                {st.goal && (
                  <p className="border-l-2 border-primary bg-accent px-3 py-2 text-sm">
                    <span className="label mr-2 text-[9px] text-primary">готово, когда</span>
                    {st.goal}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {sample && (
                    <button type="button" onClick={() => play(sample.text)} className="label flex h-9 cursor-pointer items-center gap-2 border border-primary/60 px-3 text-primary hover:bg-primary hover:text-primary-foreground">
                      <Eye className="size-3.5" /> что увидишь
                    </button>
                  )}
                  <button
                    type="button"
                    aria-pressed={isDone}
                    onClick={() => playbookDone.toggle(key(pb.id, i))}
                    className={cn('label h-9 cursor-pointer px-3', isDone ? 'border border-primary text-primary' : 'bg-primary text-primary-foreground hover:bg-foreground')}
                  >
                    {isDone ? 'готово ✓' : 'готово, дальше'}
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {finished && (
        <p className="mt-4 border border-primary/60 bg-accent p-4 text-sm">Сценарий пройден. Загляни в «Что дальше» в гайде ветки «{b.title}».</p>
      )}
      <button type="button" onClick={() => playbookDone.clearPrefix(`${pb.id}::`)} className="label mt-4 flex cursor-pointer items-center gap-2 text-[10px] text-muted-foreground hover:text-primary">
        <RotateCcw className="size-3" /> начать заново
      </button>
    </div>
  )
}
