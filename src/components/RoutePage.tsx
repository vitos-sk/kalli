import { Check, MapPin } from 'lucide-react'
import { branches } from '@/branches'
import { PageTitle } from '@/components/Situations'
import { STAGES } from '@/lib/route'
import { learned } from '@/lib/store'
import { cn } from '@/lib/utils'

// Маршрут новичка: этапы по порядку, прогресс и «ты здесь»
export function RoutePage({ onOpen }: { onOpen: (id: string) => void }) {
  const done = learned.use()
  const stages = STAGES.map((st) => {
    const branch = branches.find((b) => b.id === st.branchId)
    return { ...st, branch, ready: !!branch && !branch.soon, isDone: done.includes(st.branchId) }
  })
  const finished = stages.filter((s) => s.isDone).length
  const current = stages.find((s) => s.ready && !s.isDone)?.branchId
  const pct = Math.round((finished / stages.length) * 100)

  return (
    <div>
      <PageTitle title="Маршрут новичка" hint="Этапы по порядку. Отмечай изученное — здесь видно, где ты и что дальше." />

      <div className="mb-8 border bg-card p-4">
        <div className="label mb-2 flex justify-between text-[10px] text-muted-foreground">
          <span>прогресс</span>
          <span className="text-primary">{finished} / {stages.length}</span>
        </div>
        <div className="h-3 border">
          <div className="stripes h-full transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ol className="relative ml-4 space-y-4 border-l pl-6 sm:ml-5 sm:pl-8">
        {stages.map((st, i) => (
          <li key={st.branchId} className="relative">
            <span
              className={cn(
                'absolute -left-[41px] top-4 grid size-8 place-items-center border bg-background font-mono text-xs sm:-left-[49px]',
                st.isDone ? 'border-primary bg-primary text-primary-foreground' : st.branchId === current ? 'border-primary text-primary' : 'text-muted-foreground',
              )}
            >
              {st.isDone ? <Check className="size-4" /> : i + 1}
            </span>
            <div className={cn('border bg-card p-4', st.branchId === current && 'border-primary/70', !st.ready && 'opacity-60')}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="pixel text-lg font-bold uppercase tracking-wide">{st.title}</h2>
                {st.branchId === current && (
                  <span className="label flex items-center gap-1 text-[10px] text-primary"><MapPin className="size-3" /> ты здесь</span>
                )}
                {!st.ready && <span className="label text-[10px] text-muted-foreground">скоро</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{st.text}</p>
              {st.ready && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => onOpen(st.branchId)} className="label h-9 cursor-pointer bg-primary px-3 text-primary-foreground hover:bg-foreground">
                    открыть
                  </button>
                  <button
                    type="button"
                    aria-pressed={st.isDone}
                    onClick={() => learned.toggle(st.branchId)}
                    className={cn('label h-9 cursor-pointer border px-3', st.isDone ? 'border-primary text-primary' : 'border-primary/50 text-primary hover:bg-primary/10')}
                  >
                    {st.isDone ? 'изучено ✓' : 'отметить изученным'}
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
