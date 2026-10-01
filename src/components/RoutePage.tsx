import { branches } from '@/branches'
import { PageTitle } from '@/components/Situations'
import { STAGES } from '@/lib/route'
import { cn } from '@/lib/utils'

// Маршрут новичка: этапы по порядку, от простого к сложному
export function RoutePage({ onOpen }: { onOpen: (id: string) => void }) {
  const stages = STAGES.map((st) => {
    const branch = branches.find((b) => b.id === st.branchId)
    return { ...st, branch, ready: !!branch && !branch.soon }
  })

  return (
    <div>
      <PageTitle title="Маршрут новичка" hint="Этапы по порядку: с чего начать и куда идти дальше." />

      <ol className="relative ml-4 space-y-4 border-l pl-6 sm:ml-5 sm:pl-8">
        {stages.map((st, i) => (
          <li key={st.branchId} className="relative">
            <span className="absolute -left-[41px] top-4 grid size-8 place-items-center border bg-background font-mono text-xs text-muted-foreground sm:-left-[49px]">
              {i + 1}
            </span>
            <div className={cn('border bg-card p-4', !st.ready && 'opacity-60')}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="pixel text-lg font-bold uppercase tracking-wide">{st.title}</h2>
                {!st.ready && <span className="label text-[10px] text-muted-foreground">скоро</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{st.text}</p>
              {st.ready && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => onOpen(st.branchId)} className="label h-9 cursor-pointer bg-primary px-3 text-primary-foreground hover:bg-foreground">
                    открыть
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
