import { PanelLeftClose, PanelLeftOpen, ShieldHalf } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SPECIAL, type SpecialGroup } from '@/lib/special'
import { cn } from '@/lib/utils'
import type { BranchConfig } from '@/branches/types'
import { CATEGORIES } from '@/lib/categories'

interface Props {
  branches: BranchConfig[]
  activeId: string
  onSelect: (id: string) => void
  /** Свёрнутый вид — только иконки (десктоп) */
  collapsed?: boolean
  onToggle?: () => void
}

const GROUP_LABEL: Record<SpecialGroup, string | null> = {
  top: null,
  tools: 'инструменты',
  progress: 'твой прогресс',
  more: 'ещё',
}

// Одна строка навигации — общая для веток и служебных страниц
function NavItem({
  id,
  title,
  Icon,
  active,
  collapsed,
  disabled,
  onSelect,
  right,
}: {
  id: string
  title: string
  Icon: BranchConfig['icon']
  active: boolean
  collapsed: boolean
  disabled?: boolean
  onSelect: (id: string) => void
  right?: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={collapsed ? title : undefined}
      aria-current={active ? 'page' : undefined}
      onClick={() => onSelect(id)}
      className={cn(
        'label flex w-full items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-left transition-colors',
        collapsed && 'justify-center px-0',
        disabled ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer text-muted-foreground hover:bg-accent hover:text-foreground',
        active && 'border-primary bg-accent text-primary hover:text-primary',
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{title}</span>
          {right}
        </>
      )}
    </button>
  )
}

// Подпись раздела в стиле панелей вроде Vercel: мелкий капс с отступом сверху
function GroupLabel({ children }: { children: string }) {
  return <p className="label mb-1 mt-4 px-3 text-[9px] text-muted-foreground/70 first:mt-0">{children}</p>
}

// Список веток и служебных страниц. Используется и в десктопном сайдбаре, и в мобильной шторке.
export function SidebarNav({ branches, activeId, onSelect, collapsed = false, onToggle }: Props) {
  const top = SPECIAL.filter((p) => p.group === 'top')
  const groups: SpecialGroup[] = ['tools', 'progress', 'more']

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-14 shrink-0 items-center gap-2.5 px-4', collapsed && 'justify-center px-0')}>
        <ShieldHalf className="size-5 shrink-0 text-primary" />
        {!collapsed && <span className="pixel text-base font-bold uppercase tracking-wide">pentest<span className="text-primary">/</span>cheats</span>}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="Навигация">
        {/* входные точки — без подписи, всегда сверху */}
        <div className="space-y-1">
          {top.map((p) => (
            <NavItem key={p.id} id={p.id} title={p.title} Icon={p.icon} active={p.id === activeId} collapsed={collapsed} onSelect={onSelect} />
          ))}
        </div>

        {!collapsed && <GroupLabel>справочник</GroupLabel>}
        {collapsed && <div className="my-3 border-t" />}
        {CATEGORIES.map((cat) => {
          const items = branches.filter((b) => b.category === cat.id)
          if (!items.length) return null
          return (
            <div key={cat.id}>
              {!collapsed && <p className="label mb-1 mt-3 px-3 text-[9px] text-muted-foreground/50 first:mt-0">{cat.title}</p>}
              {collapsed && <div className="my-2 border-t border-dashed" />}
              <div className="space-y-1">
                {items.map((b) => (
                  <NavItem
                    key={b.id}
                    id={b.id}
                    title={b.title}
                    Icon={b.icon}
                    active={b.id === activeId}
                    collapsed={collapsed}
                    disabled={b.soon}
                    onSelect={onSelect}
                    right={b.soon && <Badge>скоро</Badge>}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {groups.map((g) => {
          const label = GROUP_LABEL[g]
          const items = SPECIAL.filter((p) => p.group === g)
          if (!items.length) return null
          return (
            <div key={g}>
              {!collapsed && label && <GroupLabel>{label}</GroupLabel>}
              {collapsed && <div className="my-3 border-t" />}
              <div className="space-y-1">
                {items.map((p) => (
                  <NavItem key={p.id} id={p.id} title={p.title} Icon={p.icon} active={p.id === activeId} collapsed={collapsed} onSelect={onSelect} />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="label mx-3 mb-2 shrink-0 space-y-1 border-t pt-3 text-[9px] leading-relaxed text-muted-foreground">
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
            'label m-2 flex h-9 shrink-0 cursor-pointer items-center gap-2 px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <><PanelLeftClose className="size-4" /> Свернуть</>}
        </button>
      )}
    </div>
  )
}
