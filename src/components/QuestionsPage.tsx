import { ArrowLeft, ArrowRight, Check, ChevronRight, Rocket, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CommandLine } from '@/components/Commands'
import { Md } from '@/components/Md'
import { PageTitle } from '@/components/Situations'
import { TargetField } from '@/components/TargetField'
import { branches } from '@/branches'
import { buildIndex, search } from '@/lib/search'
import { understood } from '@/lib/store'
import { hasPlaceholder, tokensIn } from '@/lib/target'
import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/lib/categories'
import { findQuestion, topics } from '@/topics'
import type { Question, Topic } from '@/topics/types'

type Go = (id: string, sub?: string, sub2?: string) => void
const LEVEL = { start: 'с нуля', next: 'дальше' } as const
type Filter = 'all' | 'start' | 'next'

const key = (t: string, q: string) => `${t}::${q}`

// Один вопрос-«раскрывашка»: ответ, команды, ссылки
function QuestionItem({ topic, q, open, onToggle, go }: { topic: Topic; q: Question; open: boolean; onToggle: () => void; go: Go }) {
  const done = understood.use().includes(key(topic.id, q.id))
  const ref = useRef<HTMLLIElement>(null)

  // переход по ссылке на конкретный вопрос — прокручиваем к нему
  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [open])

  return (
    <li ref={ref} className={cn('scroll-mt-4 border bg-card', open && 'border-primary/60')}>
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left">
        <ChevronRight className={cn('size-4 shrink-0 text-primary transition-transform', open && 'rotate-90')} />
        <span className="min-w-0 flex-1">{q.q}</span>
        {done && <Check className="size-4 shrink-0 text-primary" aria-label="понятно" />}
        {q.level && <span className="label hidden shrink-0 text-[9px] text-muted-foreground sm:block">{LEVEL[q.level]}</span>}
      </button>

      {open && (
        <div className="space-y-4 border-t p-4">
          <div className="space-y-3 text-[15px] leading-relaxed text-foreground/90">
            <Md>{q.a}</Md>
          </div>

          {q.cmds && (
            <div className="space-y-2">
              {q.cmds.map((c) => (
                <CommandLine key={c} cmd={c} />
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {q.link && (
              <button type="button" onClick={() => go(q.link!.to.id, q.link!.to.sub, q.link!.to.sub2)} className="label flex h-9 cursor-pointer items-center gap-2 bg-primary px-3 text-primary-foreground hover:bg-foreground">
                {q.link.label} <ArrowRight className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              aria-pressed={done}
              onClick={() => understood.toggle(key(topic.id, q.id))}
              className={cn('label flex h-9 cursor-pointer items-center gap-2 border px-3', done ? 'border-primary text-primary' : 'border-primary/50 text-primary hover:bg-primary/10')}
            >
              <Check className="size-3.5" /> {done ? 'понятно ✓' : 'мне понятно'}
            </button>
          </div>

          {q.related && (
            <div className="space-y-2 border-t pt-3">
              <p className="label text-[9px] text-muted-foreground">читай дальше</p>
              <div className="flex flex-wrap gap-2">
                {q.related.map((r) => {
                  const f = findQuestion(r)
                  return f ? (
                    <button key={r} type="button" onClick={() => go('questions', f.topic.id, f.question.id)} className="cursor-pointer border border-border px-3 py-1.5 text-left text-sm transition-colors hover:border-primary/60 hover:text-primary">
                      {f.question.q}
                    </button>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

// Главная: поиск + популярные вопросы + темы. Тема: список вопросов с фильтром.
export function QuestionsPage({ topicId, qid, go }: { topicId?: string; qid?: string; go: Go }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const done = understood.use()
  const index = useMemo(() => buildIndex(branches).filter((h) => h.kind === 'question'), [])
  const topic = topics.find((t) => t.id === topicId)

  // ---------- тема ----------
  if (topic) {
    const list = topic.questions.filter((x) => filter === 'all' || x.level === filter)
    const count = topic.questions.filter((x) => done.includes(key(topic.id, x.id))).length
    const Icon = topic.icon
    const needsTarget = topic.questions.some((x) => x.cmds?.some(hasPlaceholder))
    return (
      <div>
        <button type="button" onClick={() => go('questions')} className="label mb-4 flex cursor-pointer items-center gap-2 text-[10px] text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-3.5" /> все темы
        </button>
        <h1 className="glitch mb-2 flex items-center gap-3 text-2xl font-bold uppercase tracking-wide md:text-3xl">
          <Icon className="size-6 shrink-0 text-primary" /> {topic.title}
        </h1>
        <p className="mb-1 text-sm text-muted-foreground">{topic.blurb}</p>
        <p className="label mb-5 text-[10px] text-primary">понятно: {count} из {topic.questions.length}</p>

        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Уровень">
          {([['all', 'все вопросы'], ['start', 'для самых новичков'], ['next', 'дальше']] as const).map(([v, label]) => (
            <button key={v} type="button" aria-pressed={filter === v} onClick={() => setFilter(v)} className={cn('label h-9 cursor-pointer border px-3', filter === v ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground')}>
              {label}
            </button>
          ))}
        </div>

        {needsTarget && <TargetField tokens={tokensIn(topic.questions.flatMap((x) => x.cmds ?? []))} />}
        <ul className="space-y-2">
          {list.map((x) => (
            <QuestionItem key={x.id} topic={topic} q={x} open={x.id === qid} onToggle={() => go('questions', topic.id, x.id === qid ? undefined : x.id)} go={go} />
          ))}
          {list.length === 0 && <li className="border border-dashed p-6 text-center text-sm text-muted-foreground">В этом уровне вопросов нет. Выбери «все вопросы».</li>}
        </ul>
      </div>
    )
  }

  // ---------- главная ----------
  const results = q.trim() ? search(index, q, 8) : []
  const popular = topics.flatMap((t) => t.questions.filter((x) => x.popular).map((x) => ({ t, x })))
  const total = topics.reduce((n, t) => n + t.questions.length, 0)

  return (
    <div className="space-y-6">
      <PageTitle title="Что тебя интересует?" hint="Выбери тему или спроси своими словами. Всё объясняю простыми словами, с примерами и готовыми командами." />

      <div className="flex items-center gap-2 border bg-card focus-within:border-primary">
        <Search className="ml-3 size-4 shrink-0 text-primary" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Например: как узнать свой IP, что такое порт…"
          aria-label="Поиск по вопросам"
          className="h-12 min-w-0 flex-1 bg-transparent px-2 text-base outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      {q.trim() ? (
        <ul className="space-y-2">
          {results.length === 0 && <li className="border border-dashed p-6 text-center text-sm text-muted-foreground">Ничего не нашлось. Попробуй другое слово или выбери тему ниже.</li>}
          {results.map((h) => (
            <li key={`${h.to.sub}-${h.to.sub2}`}>
              <button type="button" onClick={() => go('questions', h.to.sub, h.to.sub2)} className="flex w-full cursor-pointer items-center gap-3 border bg-card px-4 py-3 text-left transition-colors hover:border-primary/60">
                <span className="min-w-0 flex-1">
                  <span className="block">{h.title}</span>
                  <span className="label block text-[9px] text-muted-foreground">{h.sub}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-primary" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <button type="button" onClick={() => go('start')} className="flex w-full cursor-pointer items-center gap-3 border border-primary/60 bg-accent p-4 text-left transition-colors hover:border-primary">
            <Rocket className="size-5 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Совсем с нуля? Начни здесь</span>
              <span className="block text-sm text-muted-foreground">Что такое цель, откуда взять IP, как поставить nmap и сделать первый запуск.</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-primary" />
          </button>

          <section className="space-y-5">
            <h2 className="label text-[10px] text-muted-foreground">темы</h2>
            {CATEGORIES.map((cat) => {
              const items = topics.filter((t) => t.category === cat.id)
              if (!items.length) return null
              return (
                <div key={cat.id}>
                  <p className="label mb-2 text-[9px] text-muted-foreground/70">{cat.title}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((t) => {
                      const Icon = t.icon
                      const n = t.questions.filter((x) => done.includes(key(t.id, x.id))).length
                      return (
                        <button key={t.id} type="button" onClick={() => go('questions', t.id)} className="flex cursor-pointer flex-col gap-2 border bg-card p-4 text-left transition-colors hover:border-primary/60">
                          <span className="flex items-center gap-3">
                            <Icon className="size-5 shrink-0 text-primary" />
                            <span className="pixel text-base font-bold uppercase tracking-wide">{t.title}</span>
                          </span>
                          <span className="text-sm text-muted-foreground">{t.blurb}</span>
                          <span className="label mt-auto text-[9px] text-primary">
                            {t.questions.length} вопросов{n > 0 ? ` · понятно ${n}` : ''}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </section>

          <section>
            <h2 className="label mb-3 text-[10px] text-muted-foreground">популярные вопросы</h2>
            <ul className="space-y-2">
              {popular.map(({ t, x }) => (
                <li key={`${t.id}-${x.id}`}>
                  <button type="button" onClick={() => go('questions', t.id, x.id)} className="flex min-h-12 w-full cursor-pointer items-center gap-3 border bg-card px-4 py-3 text-left transition-colors hover:border-primary/60">
                    <span className="min-w-0 flex-1">{x.q}</span>
                    <span className="label hidden shrink-0 text-[9px] text-muted-foreground sm:block">{t.title}</span>
                    <ChevronRight className="size-4 shrink-0 text-primary" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="label mt-3 text-[9px] text-muted-foreground">всего вопросов: {total}. Не нашёл своего? Попробуй поиск на ⌘K.</p>
          </section>
        </>
      )}
    </div>
  )
}
