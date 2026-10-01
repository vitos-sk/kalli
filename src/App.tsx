import { Menu, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { branches } from '@/branches'
import { BranchPage } from '@/components/BranchPage'
import { CommandPalette } from '@/components/CommandPalette'
import { Explain } from '@/components/Explain'
import { Breadcrumb, type Crumb } from '@/components/Breadcrumb'
import { topics as topicsRef } from '@/topics'
import { Favorites } from '@/components/Favorites'
import { Labs } from '@/components/Labs'
import { QuestionsPage } from '@/components/QuestionsPage'
import { StartPage } from '@/components/StartPage'
import { Playbooks } from '@/components/Playbooks'
import { RoutePage } from '@/components/RoutePage'
import { ValuesPage } from '@/components/ValuesPage'
import { Situations } from '@/components/Situations'
import { SidebarNav } from '@/components/Sidebar'
import { TerminalPanel } from '@/components/TerminalPanel'
import type { Hit } from '@/lib/search'
import { SPECIAL } from '@/lib/special'
import { recentPages } from '@/lib/store'
import { TargetProvider } from '@/lib/target'
import { TerminalProvider, useShellTerminal } from '@/lib/terminal'
import { useHashRoute } from '@/lib/useHashRoute'
import { cn } from '@/lib/utils'

const LAST = 'pentest-cheats:last'

// Единая оболочка: читает список конфигов, строит сайдбар и страницу
function Shell() {
  const [route, go] = useHashRoute()
  const [collapsed, setCollapsed] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [flash, setFlash] = useState<string>()
  const { idle, setHints } = useShellTerminal()

  const special = SPECIAL.find((p) => p.id === route.id)
  // неизвестная или «скоро» ветка → первая готовая
  const active = special ? undefined : (branches.find((b) => b.id === route.id && !b.soon) ?? branches.find((b) => !b.soon))
  const pageId = special?.id ?? active?.id ?? ''
  const title = special?.title ?? active?.title ?? ''
  const Icon = special?.icon ?? active?.icon

  // пустой адрес → возвращаем туда, где человек был в прошлый раз
  useEffect(() => {
    if (route.id) return
    try {
      const [id, sub] = (localStorage.getItem(LAST) ?? '').split('/')
      // первый заход — на «Вопросы и ответы»
      go(id || 'questions', id ? sub || undefined : undefined)
    } catch {
      go('questions')
    }
  }, [route.id, go])
  useEffect(() => {
    if (!route.id) return
    try {
      localStorage.setItem(LAST, `${route.id}/${route.sub ?? ''}`)
    } catch {
      /* ignore */
    }
  }, [route])

  // подсказки к строкам терминала берём из конфига активной ветки
  useEffect(() => {
    setHints(active?.lineHints ?? [])
  }, [active, setHints])

  // при смене страницы сбрасываем терминал (первый показ — пропускаем)
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    idle()
  }, [pageId, idle])

  // горячие клавиши: ⌘K / Ctrl+K и «/» открывают поиск; Esc закрывает шторку
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest('input, textarea')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((o) => !o)
      } else if (e.key === '/' && !typing) {
        e.preventDefault()
        setSearchOpen(true)
      } else if (e.key === 'Escape') setDrawer(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const select = (id: string) => {
    go(id)
    setDrawer(false)
  }
  const pick = (h: Hit) => {
    setSearchOpen(false)
    setDrawer(false)
    go(h.to.id, h.to.sub, h.to.sub2)
    setFlash(h.cmd)
    if (h.cmd) window.setTimeout(() => setFlash(undefined), 2500)
  }


  // Путь для хлебной крошки: раздел → подраздел, с кликом на предыдущий уровень
  const crumbs: Crumb[] = (() => {
    if (active) {
      const list: Crumb[] = [{ label: active.title, onClick: () => go(active.id) }]
      if (route.sub) list.push({ label: route.sub === 'tool' ? 'Инструмент' : route.sub === 'guide' ? 'Гайд' : 'Команды' })
      return list
    }
    if (!special) return []
    const list: Crumb[] = [{ label: special.title, onClick: () => go(special.id) }]
    if (route.sub) {
      if (special.id === 'questions') {
        const t = topicsRef.find((x) => x.id === route.sub)
        if (t) {
          list.push({ label: t.title, onClick: () => go('questions', t.id) })
          if (route.sub2) {
            const q = t.questions.find((x) => x.id === route.sub2)
            if (q) list.push({ label: q.q })
          }
        }
      } else if (special.id === 'playbooks') {
        const pb = branches.flatMap((b) => b.playbooks ?? []).find((x) => x.id === route.sub)
        if (pb) list.push({ label: pb.title })
      } else if (special.id === 'situations') {
        const s2 = branches.flatMap((b) => b.situations ?? []).find((x) => x.id === route.sub)
        if (s2) list.push({ label: s2.title })
      } else if (special.id === 'values') {
        list.push({ label: route.sub })
      }
    }
    return list
  })()

  // запоминаем страницу для «недавних» в поиске — по уже готовому пути (хлебной крошке)
  useEffect(() => {
    if (!pageId || crumbs.length === 0) return
    recentPages.push({ id: route.id, sub: route.sub, sub2: route.sub2, label: crumbs.map((c) => c.label).join(' › ') })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, route.sub, route.sub2])

  if (!pageId) return null

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* десктопный сайдбар */}
      <aside className={cn('hidden shrink-0 border-r bg-black/60 transition-[width] duration-200 md:block', collapsed ? 'w-16' : 'w-64')}>
        <SidebarNav branches={branches} activeId={pageId} onSelect={select} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </aside>

      {/* мобильная шторка */}
      <div className={cn('fixed inset-0 z-40 md:hidden', !drawer && 'pointer-events-none')}>
        <div onClick={() => setDrawer(false)} className={cn('absolute inset-0 bg-black/70 transition-opacity', drawer ? 'opacity-100' : 'opacity-0')} />
        <aside className={cn('absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r bg-background transition-transform duration-200', drawer ? 'translate-x-0' : '-translate-x-full')}>
          <button type="button" onClick={() => setDrawer(false)} aria-label="Закрыть меню" className="absolute right-1 top-1 flex size-11 cursor-pointer items-center justify-center text-muted-foreground hover:text-primary">
            <X className="size-5" />
          </button>
          <SidebarNav branches={branches} activeId={pageId} onSelect={select} />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* мобильная шапка: гамбургер открывает всю навигацию, поиск — рядом */}
        <header className="flex h-12 shrink-0 items-center gap-1 border-b pl-1 pr-2 md:hidden">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Открыть меню"
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center text-muted-foreground hover:text-primary"
          >
            <Menu className="size-5" />
          </button>
          {Icon && <Icon className="size-4 shrink-0 text-primary" />}
          <span className="pixel min-w-0 flex-1 truncate text-base font-bold uppercase tracking-wide">{title}</span>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Поиск"
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center text-muted-foreground hover:text-primary"
          >
            <Search className="size-5" />
          </button>
        </header>

        {/* статус-строка (десктоп) */}
        <div className="label hidden h-9 shrink-0 items-center justify-between border-b px-8 text-[10px] text-muted-foreground md:flex">
          <span>sys://{pageId}</span>
          <button type="button" onClick={() => setSearchOpen(true)} className="label flex cursor-pointer items-center gap-2 border border-primary/50 px-2 py-1 text-[10px] text-primary hover:bg-primary hover:text-primary-foreground">
            <Search className="size-3" /> поиск <kbd className="font-mono">⌘K</kbd>
          </button>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
            <Breadcrumb items={crumbs} />
            {route.id === 'questions' && <QuestionsPage topicId={route.sub} qid={route.sub2} go={go} />}
            {route.id === 'values' && <ValuesPage openToken={route.sub} go={go} />}
            {route.id === 'start' && <StartPage onGo={select} />}
            {route.id === 'situations' && <Situations openId={route.sub} onOpen={(id) => go('situations', id)} />}
            {route.id === 'playbooks' && <Playbooks openId={route.sub} onOpen={(id) => go('playbooks', id)} />}
            {route.id === 'explain' && <Explain onSituation={(id) => go('situations', id)} />}
            {route.id === 'route' && <RoutePage onOpen={select} />}
            {route.id === 'favorites' && <Favorites />}
            {route.id === 'labs' && <Labs />}
            {active && <BranchPage key={active.id} branch={active} tab={route.sub} onTab={(t) => go(active.id, t)} onGo={select} flashCmd={flash} />}
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
