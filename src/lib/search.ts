import type { BranchConfig, TabId } from '@/branches/types'

export interface Hit {
  kind: 'branch' | 'command' | 'guide'
  branch: BranchConfig
  title: string
  sub: string
  tab: TabId
  /** для команд — что подсветить после перехода */
  cmd?: string
  hay: string
  boost: number
}

const clean = (s: string) => s.toLowerCase().replace(/ё/g, 'е')

// Грубый «стемминг» для русского: режем окончание, ищем подстроку
function stem(t: string) {
  return t.length > 5 ? t.slice(0, -3) : t.length > 3 ? t.slice(0, -1) : t
}

// Индекс строим один раз из конфигов: ветки, разделы гайда, команды
export function buildIndex(branches: BranchConfig[]): Hit[] {
  const out: Hit[] = []
  for (const b of branches.filter((x) => !x.soon)) {
    const kw = (b.keywords ?? []).join(' ')
    out.push({
      kind: 'branch', branch: b, title: b.title, sub: 'ветка', tab: b.tool ? 'tool' : 'guide',
      hay: clean(`${b.title} ${kw}`), boost: 3,
    })
    for (const sec of b.guide.split(/^## /m).filter(Boolean)) {
      const [title, ...rest] = sec.split('\n')
      out.push({
        kind: 'guide', branch: b, title, sub: `гайд · ${b.title}`, tab: 'guide',
        hay: clean(`${title} ${rest.join(' ').replace(/[*`]/g, '')} ${kw}`), boost: 0,
      })
    }
    for (const c of b.commands) {
      out.push({
        kind: 'command', branch: b, title: c.label, sub: c.cmd, tab: 'commands', cmd: c.cmd,
        hay: clean(`${c.label} ${c.cmd} ${c.note} ${(c.flags ?? []).map((f) => f.flag + ' ' + f.text).join(' ')} ${kw}`),
        boost: 1,
      })
    }
  }
  return out
}

// Все слова запроса должны найтись; заголовок и команды важнее текста гайда
export function search(index: Hit[], query: string, limit = 8): Hit[] {
  const tokens = clean(query).split(/\s+/).filter(Boolean).map(stem)
  if (!tokens.length) return index.filter((h) => h.kind !== 'guide').slice(0, limit)
  return index
    .map((h) => {
      if (!tokens.every((t) => h.hay.includes(t))) return { h, score: -1 }
      const inTitle = tokens.filter((t) => clean(h.title).includes(t)).length
      return { h, score: h.boost + inTitle * 2 }
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.h)
}
