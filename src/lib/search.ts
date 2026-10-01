import type { BranchConfig } from '@/branches/types'
import { SPECIAL } from '@/lib/special'
import { topics } from '@/topics'

export interface Hit {
  kind: 'branch' | 'command' | 'guide' | 'situation' | 'page' | 'playbook' | 'question' | 'recent'
  title: string
  sub: string
  /** Куда перейти: id страницы и второй сегмент (вкладка / ситуация) */
  to: { id: string; sub?: string; sub2?: string }
  /** для команд — что подсветить после перехода */
  cmd?: string
  hay: string
  boost: number
}

const clean = (s: string) => s.toLowerCase().replace(/ё/g, 'е')
// Короткие служебные слова («не», «и», «в») только мешают поиску
const tokenize = (q: string) => clean(q).split(/\s+/).filter((t) => t.length > 2)

// Грубый «стемминг» для русского: режем окончание, ищем подстроку
function stem(t: string) {
  return t.length > 7 ? t.slice(0, -3) : t.length > 5 ? t.slice(0, -2) : t.length > 3 ? t.slice(0, -1) : t
}

// Индекс строим один раз из конфигов: ситуации, ветки, гайды, команды
export function buildIndex(branches: BranchConfig[]): Hit[] {
  const out: Hit[] = []
  for (const b of branches.filter((x) => !x.soon)) {
    const kw = (b.keywords ?? []).join(' ')
    for (const s of b.situations ?? []) {
      out.push({
        kind: 'situation', title: s.title, sub: 'что делать, если…', to: { id: 'situations', sub: s.id },
        hay: clean(`${s.title} ${s.answer} ${(s.keywords ?? []).join(' ')}`), boost: 2,
      })
    }
    for (const pb of b.playbooks ?? []) {
      out.push({
        kind: 'playbook', title: pb.title, sub: 'сценарий по шагам', to: { id: 'playbooks', sub: pb.id },
        hay: clean(`${pb.title} ${pb.intro} ${pb.steps.map((st) => st.title).join(' ')}`), boost: 2,
      })
    }
    out.push({ kind: 'branch', title: b.title, sub: 'ветка', to: { id: b.id, sub: b.tool ? 'tool' : 'guide' }, hay: clean(`${b.title} ${kw}`), boost: 0 })
    for (const sec of b.guide.split(/^## /m).filter(Boolean)) {
      const [title, ...rest] = sec.split('\n')
      out.push({
        kind: 'guide', title, sub: `гайд · ${b.title}`, to: { id: b.id, sub: 'guide' },
        hay: clean(`${title} ${rest.join(' ').replace(/[*`]/g, '')}`), boost: 0,
      })
    }
    for (const c of b.commands) {
      out.push({
        kind: 'command', title: c.label, sub: c.cmd, to: { id: b.id, sub: 'commands' }, cmd: c.cmd,
        hay: clean(`${c.label} ${c.cmd} ${c.note} ${(c.flags ?? []).map((f) => f.flag + ' ' + f.text).join(' ')} ${(c.keywords ?? []).join(' ')}`),
        boost: 1,
      })
    }
  }
  for (const t of topics) {
    for (const q of t.questions) {
      out.push({
        kind: 'question', title: q.q, sub: `вопрос · ${t.title}`, to: { id: 'questions', sub: t.id, sub2: q.id },
        hay: clean(`${q.q} ${q.a.replace(/[*`]/g, '')} ${(q.keywords ?? []).join(' ')}`), boost: 3,
      })
    }
  }
  for (const p of SPECIAL) {
    out.push({ kind: 'page', title: p.title, sub: 'раздел', to: { id: p.id }, hay: clean(`${p.title} ${(p.keywords ?? []).join(' ')}`), boost: 0 })
  }
  return out
}

// Ранжируем по числу совпавших слов; заголовок и команды важнее текста гайда.
// Если слов больше двух — допускаем, что одно не нашлось.
export function search(index: Hit[], query: string, limit = 8): Hit[] {
  const tokens = tokenize(query).map(stem)
  if (!tokens.length) return index.filter((h) => h.kind === 'page').slice(0, limit)
  const need = tokens.length > 2 ? tokens.length - 1 : tokens.length
  return index
    .map((h) => {
      const matched = tokens.filter((t) => h.hay.includes(t)).length
      const inTitle = tokens.filter((t) => clean(h.title).includes(t)).length
      return { h, score: matched < need ? -1 : matched * 4 + inTitle * 2 + h.boost }
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.h)
}
