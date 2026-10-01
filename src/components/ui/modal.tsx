import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Простое модальное окно в стиле «окна» приложения: заголовок с крестиком, тело, фон закрывает
export function Modal({ title, onClose, children, className }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()} className={cn('max-h-[85vh] w-full max-w-lg overflow-y-auto border bg-card', className)}>
        <header className="label sticky top-0 flex h-10 items-center justify-between border-b bg-card px-3 text-foreground/90">
          <span className="truncate pr-2">{title}</span>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="grid size-6 shrink-0 cursor-pointer place-items-center border border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground">
            <X className="size-3.5" />
          </button>
        </header>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  )
}
