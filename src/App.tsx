import { Menu, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { branches } from '@/branches'
import { BranchPage } from '@/components/BranchPage'
import { CommandPalette } from '@/components/CommandPalette'
import { SidebarNav } from '@/components/Sidebar'
import { TerminalPanel } from '@/components/TerminalPanel'
import type { Hit } from '@/lib/search'
import { TargetProvider } from '@/lib/target'
import { TerminalProvider, useShellTerminal } from '@/lib/terminal'
import { useHashRoute } from '@/lib/useHashRoute'
import { cn } from '@/lib/utils'

// Единая оболочка: читает список конфигов, строит сайдбар и страницу
function Shell() {
  const [route, go] = useHashRoute()
  const routeId = route.id
  const [searchOpen, setSearchOpen] = useState(false)
  const [flash, setFlash] = useState<string>()
  const [collapsed, setCollapsed] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const { idle, setHints } = useShellTerminal()

  // неизвестная или «скоро» ветка → первая готовая
  const active = branches.find((b) => b.id === routeId && !b.soon) ?? branches.find((b) => !b.soon)

  // подсказки к строкам терминала берём из конфига активной ветки
  useEffect(() => {
    setHints(active?.lineHints ?? [])
  }, [active, setHints])

  // горячие клавиши: ⌘K / Ctrl+K и «/» открывают поиск
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest('input, textarea')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((o) => !o)
      } else if (e.key === '/' && !typing) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const pick = (h: Hit) => {
    setSearchOpen(false)
    setDrawer(false)
    go(h.branch.id, h.tab)
    setFlash(h.cmd)
    if (h.cmd) window.setTimeout(() => setFlash(undefined), 2500)
  }

  // при смене ветки сбрасываем терминал
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    idle()
  }, [active?.id, idle])

  // Esc закрывает шторку
  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawer])

  if (!active) return null
  const select = (id: string) => {
    go(id)
    setDrawer(false)
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* десктопный сайдбар */}
      <aside className={cn('hidden shrink-0 border-r bg-black/60 transition-[width] duration-200 md:block', collapsed ? 'w-16' : 'w-64')}>
        <SidebarNav branches={branches} activeId={active.id} onSelect={select} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </aside>

      {/* мобильная шторка */}
      <div className={cn('fixed inset-0 z-40 md:hidden', !drawer && 'pointer-events-none')}>
        <div onClick={() => setDrawer(false)} className={cn('absolute inset-0 bg-black/70 transition-opacity', drawer ? 'opacity-100' : 'opacity-0')} />
        <aside className={cn('absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r bg-background transition-transform duration-200', drawer ? 'translate-x-0' : '-translate-x-full')}>
          <button type="button" onClick={() => setDrawer(false)} aria-label="Закрыть меню" className="absolute right-2 top-2.5 flex size-9 cursor-pointer items-center justify-center text-muted-foreground hover:text-primary">
            <X className="size-5" />
          </button>
          <SidebarNav branches={branches} activeId={active.id} onSelect={select} />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* мобильная шапка */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 md:hidden">
          <button type="button" onClick={() => setDrawer(true)} aria-label="Открыть меню" className="-ml-2 flex size-9 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground">
            <Menu className="size-5" />
          </button>
          <active.icon className="size-4 text-primary" />
          <span className="pixel min-w-0 flex-1 truncate text-base font-bold uppercase tracking-wide">{active.title}</span>
          <button type="button" onClick={() => setSearchOpen(true)} aria-label="Поиск" className="-mr-2 flex size-10 cursor-pointer items-center justify-center text-muted-foreground hover:text-primary">
            <Search className="size-5" />
          </button>
        </header>

        {/* статус-строка (десктоп) */}
        <div className="label hidden h-9 shrink-0 items-center justify-between border-b px-8 text-[10px] text-muted-foreground md:flex">
          <span>sys://{active.id}</span>
          <button type="button" onClick={() => setSearchOpen(true)} className="label flex cursor-pointer items-center gap-2 border border-primary/50 px-2 py-1 text-[10px] text-primary hover:bg-primary hover:text-primary-foreground">
            <Search className="size-3" /> поиск <kbd className="font-mono">⌘K</kbd>
          </button>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
            <BranchPage key={active.id} branch={active} tab={route.tab} onTab={(t) => go(active.id, t)} flashCmd={flash} />
          </div>
        </main>

        <TerminalPanel />
      </div>
      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} onPick={pick} />}
    </div>
  )
}

export default function App() {
  return (
    <TargetProvider>
      <TerminalProvider>
        <Shell />
      </TerminalProvider>
    </TargetProvider>
  )
}
