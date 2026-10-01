import { BookOpen, CornerDownLeft, FolderOpen, Search, SquareTerminal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { branches } from '@/branches'
import { buildIndex, search, type Hit } from '@/lib/search'
import { cn } from '@/lib/utils'

const ICON = { branch: FolderOpen, guide: BookOpen, command: SquareTerminal }
const KIND = { branch: 'ветка', guide: 'гайд', command: 'команда' }

// Окно поиска (⌘K / Ctrl+K / «/»): по веткам, гайдам и командам
export function CommandPalette({ onClose, onPick }: { onClose: () => void; onPick: (h: Hit) => void }) {
  const index = useMemo(() => buildIndex(branches), [])
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const results = useMemo(() => search(index, q), [index, q])
  const list = useRef<HTMLUListElement>(null)

  useEffect(() => setActive(0), [q])
  useEffect(() => {
    list.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') (e.preventDefault(), setActive((a) => Math.min(a + 1, results.length - 1)))
    else if (e.key === 'ArrowUp') (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)))
    else if (e.key === 'Enter' && results[active]) onPick(results[active])
    else if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-3 pt-4 sm:pt-[12vh]" onMouseDown={onClose}>
      <div role="dialog" aria-label="Поиск" onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-xl border bg-card">
        <header className="label flex h-9 items-center justify-between border-b px-3">
          <span>поиск</span>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="grid size-5 cursor-pointer place-items-center border border-primary/60 text-primary">×</button>
        </header>
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 shrink-0 text-primary" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="хост не отвечает, версии, -Pn…"
            className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <ul ref={list} className="max-h-[55vh] overflow-y-auto p-1.5">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Ничего не нашлось. Попробуй другое слово.</li>}
          {results.map((h, i) => {
            const Icon = ICON[h.kind]
            return (
              <li key={`${h.kind}-${h.branch.id}-${h.title}-${i}`}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => onPick(h)}
                  className={cn('flex w-full cursor-pointer items-center gap-3 border-l-2 px-3 py-2.5 text-left', i === active ? 'border-primary bg-accent' : 'border-transparent')}
                >
                  <Icon className={cn('size-4 shrink-0', i === active ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{h.title}</span>
                    <span className={cn('block truncate text-xs text-muted-foreground', h.kind === 'command' && 'font-mono')}>{h.sub}</span>
                  </span>
                  <span className="label shrink-0 text-[9px] text-muted-foreground">{KIND[h.kind]}</span>
                </button>
              </li>
            )
          })}
        </ul>
        <footer className="label hidden items-center gap-4 border-t px-3 py-2 text-[9px] text-muted-foreground sm:flex">
          <span>↑↓ выбрать</span>
          <span className="flex items-center gap-1"><CornerDownLeft className="size-3" /> открыть</span>
          <span>esc закрыть</span>
        </footer>
      </div>
    </div>
  )
}
