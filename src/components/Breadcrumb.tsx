import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  onClick?: () => void
}

// Единая строка пути: «раздел → подраздел». Последний крошка не кликабельна.
// На телефоне — ещё и кнопка «назад» на первый уровень (если путь длиннее одного звена).
export function Breadcrumb({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null
  const back = items.length > 1 ? items[items.length - 2] : null

  return (
    <nav aria-label="Путь" className="mb-4 flex items-center gap-1 overflow-x-auto whitespace-nowrap text-sm">
      {back && (
        <button
          type="button"
          onClick={back.onClick}
          aria-label={`Назад: ${back.label}`}
          className="mr-1 flex size-7 shrink-0 cursor-pointer items-center justify-center text-muted-foreground hover:text-primary md:hidden"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}
      {items.map((c, i) => {
        const last = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />}
            {c.onClick && !last ? (
              <button type="button" onClick={c.onClick} className="label cursor-pointer text-[11px] text-muted-foreground hover:text-primary">
                {c.label}
              </button>
            ) : (
              <span className={cn('label text-[11px]', last ? 'text-primary' : 'text-muted-foreground')}>{c.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
