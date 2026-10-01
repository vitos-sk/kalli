import { Check, PanelLeftClose, PanelLeftOpen, ShieldHalf } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { learned } from '@/lib/store'
import { SPECIAL } from '@/lib/special'
import { cn } from '@/lib/utils'
import type { BranchConfig } from '@/branches/types'

interface Props {
  branches: BranchConfig[]
  activeId: string
  onSelect: (id: string) => void
  /** Свёрнутый вид — только иконки (десктоп) */
  collapsed?: boolean
  onToggle?: () => void
}

// Список веток. Используется и в десктопном сайдбаре, и в мобильной шторке.
export function SidebarNav({ branches, activeId, onSelect, collapsed = false, onToggle }: Props) {
  const done = learned.use()
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-14 items-center gap-2.5 px-4', collapsed && 'justify-center px-0')}>
        <ShieldHalf className="size-5 shrink-0 text-primary" />
        {!collapsed && <span className="pixel text-base font-bold uppercase tracking-wide">pentest<span className="text-primary">/</span>cheats</span>}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2" aria-label="Ветки пентеста">
        {branches.map((b) => {
          const Icon = b.icon
          const active = b.id === activeId
          return (
            <button
              key={b.id}
              type="button"
              disabled={b.soon}
              title={collapsed ? b.title : undefined}
              aria-current={active ? 'page' : undefined}
              onClick={() => onSelect(b.id)}
              className={cn(
                'label flex w-full items-center gap-3 border-l-2 border-transparent px-3 py-3 text-left transition-colors',
                collapsed && 'justify-center px-0',
                b.soon
                  ? 'cursor-not-allowed text-muted-foreground/50'
                  : 'cursor-pointer text-muted-foreground hover:bg-accent hover:text-foreground',
                active && 'border-primary bg-accent text-primary hover:text-primary',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate">{b.title}</span>
                  {b.soon && <Badge>скоро</Badge>}
                  {done.includes(b.id) && <Check className="size-4 text-primary" aria-label="изучено" />}
                </>
              )}
            </button>
          )
        })}

        <div className="my-2 border-t" />
        {SPECIAL.map((p) => {
          const Icon = p.icon
          const active = p.id === activeId
          return (
            <button
              key={p.id}
              type="button"
              title={collapsed ? p.title : undefined}
              aria-current={active ? 'page' : undefined}
              onClick={() => onSelect(p.id)}
              className={cn(
                'label flex w-full cursor-pointer items-center gap-3 border-l-2 border-transparent px-3 py-3 text-left text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                collapsed && 'justify-center px-0',
                active && 'border-primary bg-accent text-primary hover:text-primary',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="min-w-0 flex-1 truncate">{p.title}</span>}
            </button>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="label mx-3 mb-2 space-y-1 border-t pt-3 text-[9px] leading-relaxed text-muted-foreground">
          <p>system status: <span className="text-primary">stable</span></p>
          <p>keep going<span className="blink text-primary">_</span></p>
        </div>
      )}

      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Развернуть сайдбар' : 'Свернуть сайдбар'}
          className={cn(
            'label m-2 flex h-9 cursor-pointer items-center gap-2 px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <><PanelLeftClose className="size-4" /> Свернуть</>}
        </button>
      )}
    </div>
  )
}
