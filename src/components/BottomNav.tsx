import { LifeBuoy, Menu, Rocket, Search, Star } from 'lucide-react'
import { SPECIAL } from '@/lib/special'
import { cn } from '@/lib/utils'

interface Props {
  activeId: string
  onBranches: () => void
  onSearch: () => void
  onGo: (id: string) => void
}

// Нижняя навигация для телефона: большие зоны нажатия под большой палец
export function BottomNav({ activeId, onBranches, onSearch, onGo }: Props) {
  const items = [
    { label: 'Старт', icon: Rocket, on: () => onGo('start'), active: activeId === 'start' },
    { label: 'Ветки', icon: Menu, on: onBranches, active: !SPECIAL.some((p) => p.id === activeId) },
    { label: 'Ситуации', icon: LifeBuoy, on: () => onGo('situations'), active: activeId === 'situations' },
    { label: 'Поиск', icon: Search, on: onSearch, active: false },
    { label: 'Избранное', icon: Star, on: () => onGo('favorites'), active: activeId === 'favorites' },
  ]
  return (
    <nav aria-label="Навигация" className="grid shrink-0 grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      {items.map(({ label, icon: Icon, on, active }) => (
        <button
          key={label}
          type="button"
          onClick={on}
          aria-current={active ? 'page' : undefined}
          className={cn('label flex h-14 cursor-pointer flex-col items-center justify-center gap-1 text-[8px]', active ? 'text-primary' : 'text-muted-foreground')}
        >
          <Icon className="size-5" />
          {label}
        </button>
      ))}
    </nav>
  )
}
