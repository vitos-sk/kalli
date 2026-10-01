import { Crosshair, X } from 'lucide-react'
import { useTarget } from '@/lib/target'

// Цель вводится один раз — и подставляется во все команды вместо <ip>
export function TargetField() {
  const { target, setTarget } = useTarget()
  return (
    <div className="mb-4 space-y-2 border bg-card p-3 sm:p-4">
      <label htmlFor="target" className="label flex items-center gap-2 text-primary">
        <Crosshair className="size-3.5" /> цель
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center border bg-black focus-within:border-primary">
          <input
            id="target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="IP или домен, например 192.168.1.10"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-10 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm outline-none placeholder:text-muted-foreground/60"
          />
          {target && (
            <button type="button" onClick={() => setTarget('')} aria-label="Очистить цель" className="flex size-10 cursor-pointer items-center justify-center text-muted-foreground hover:text-primary">
              <X className="size-4" />
            </button>
          )}
        </div>
        <button type="button" onClick={() => setTarget('scanme.nmap.org')} className="label h-10 cursor-pointer border border-primary/60 px-3 text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
          scanme.nmap.org
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Подставится в команды вместо <span className="font-mono text-primary">&lt;ip&gt;</span>. Сканируй только свои цели и учебные мишени.
      </p>
    </div>
  )
}
