#!/usr/bin/env node
// Проверка контента справочника: битые ссылки, дубли id, заглушки «скоро» в навигации.
// Разбор регулярками, без сборки проекта — чтобы можно было гонять быстро и часто.
// Запуск: npm run check:content

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const BRANCHES_DIR = join(ROOT, 'src/branches')
const TOPICS_DIR = join(ROOT, 'src/topics')

const errors = []
const warnings = []
const err = (msg) => errors.push(msg)
const warn = (msg) => warnings.push(msg)

const listFiles = (dir) => readdirSync(dir).filter((f) => f.endsWith('.ts') && !['index.ts', 'types.ts'].includes(f))

// --- достаём верхнеуровневые блоки простым поиском сбалансированных скобок ---
// Находит значение после `key:` — массив `[...]` или одиночную строку `'...'`
function extractArrayBlock(src, key) {
  const idx = src.indexOf(`${key}: [`)
  if (idx === -1) return null
  let i = src.indexOf('[', idx)
  let depth = 0
  const start = i
  for (; i < src.length; i++) {
    if (src[i] === '[') depth++
    else if (src[i] === ']') {
      depth--
      if (depth === 0) return src.slice(start, i + 1)
    }
  }
  return null
}

const field = (block, key) => {
  const m = block.match(new RegExp(`${key}:\\s*'([^']*)'`))
  return m ? m[1] : undefined
}
const flag = (block, key) => new RegExp(`${key}:\\s*true`).test(block)

// Разбить массив верхнего уровня на объекты `{ ... }` (учитывая вложенность)
function splitObjects(arrBlock) {
  if (!arrBlock) return []
  const out = []
  let depth = 0
  let start = -1
  for (let i = 0; i < arrBlock.length; i++) {
    const c = arrBlock[i]
    if (c === '{') {
      if (depth === 0) start = i
      depth++
    } else if (c === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        out.push(arrBlock.slice(start, i + 1))
        start = -1
      }
    }
  }
  return out
}

// --- читаем все ветки ---
const branchFiles = listFiles(BRANCHES_DIR)
const branches = []
for (const f of branchFiles) {
  const src = readFileSync(join(BRANCHES_DIR, f), 'utf8')
  const id = field(src, 'id')
  const soon = /soon:\s*true/.test(src)
  const commandsBlock = extractArrayBlock(src, 'commands')
  const commands = splitObjects(commandsBlock).map((o) => ({ cmd: field(o, 'cmd'), note: field(o, 'note') }))
  const situationsBlock = extractArrayBlock(src, 'situations')
  const situations = splitObjects(situationsBlock).map((o) => ({
    id: field(o, 'id'),
    title: field(o, 'title'),
    cmds: [...o.matchAll(/cmds:\s*\[([^\]]*)\]/g)].flatMap((m) => [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1])),
  }))
  const playbooksBlock = extractArrayBlock(src, 'playbooks')
  const playbooks = splitObjects(playbooksBlock).map((o) => {
    const stepsBlock = extractArrayBlock(o, 'steps')
    const steps = splitObjects(stepsBlock).map((s) => ({ sampleId: field(s, 'sampleId'), goal: field(s, 'goal') }))
    return { id: field(o, 'id'), title: field(o, 'title'), steps }
  })
  const samplesBlock = extractArrayBlock(src, 'samples')
  const samples = splitObjects(samplesBlock).map((o) => ({ id: field(o, 'id') }))
  const nextStepsBlock = extractArrayBlock(src, 'nextSteps')
  const nextSteps = splitObjects(nextStepsBlock).map((o) => ({ branchId: field(o, 'branchId') }))
  branches.push({ file: f, id, soon, commands, situations, playbooks, samples, nextSteps })
}

const branchIds = new Set(branches.map((b) => b.id))
const liveBranchIds = new Set(branches.filter((b) => !b.soon).map((b) => b.id))

// --- читаем все темы ---
const topicFiles = listFiles(TOPICS_DIR)
const topics = []
for (const f of topicFiles) {
  const src = readFileSync(join(TOPICS_DIR, f), 'utf8')
  const id = field(src, 'id')
  const questionsBlock = extractArrayBlock(src, 'questions')
  const questions = splitObjects(questionsBlock).map((o) => {
    const linkBlock = o.match(/link:\s*\{([^}]*)\}/)
    let link
    if (linkBlock) {
      const toBlock = linkBlock[1].match(/to:\s*\{([^}]*)\}/)
      if (toBlock) link = { id: field(`id: '${(toBlock[1].match(/id:\s*'([^']*)'/) ?? [, ''])[1]}'`, 'id'), raw: toBlock[1] }
    }
    const related = [...o.matchAll(/'([a-z0-9-]+\/[a-z0-9-]+)'/g)].map((m) => m[1])
    return { id: field(o, 'id'), q: field(o, 'q'), link, related }
  })
  topics.push({ file: f, id, questions })
}

// --- 1. уникальность id ---
function checkDupes(items, label, keyFn = (x) => x.id) {
  const seen = new Map()
  for (const it of items) {
    const k = keyFn(it)
    if (!k) continue
    if (!seen.has(k)) seen.set(k, [])
    seen.get(k).push(it)
  }
  for (const [k, list] of seen) {
    if (list.length > 1) err(`Дубль id «${k}» в ${label}: ${list.map((x) => x.file ?? x.title ?? '?').join(', ')}`)
  }
}
checkDupes(branches.flatMap((b) => b.situations.map((s) => ({ ...s, file: b.file }))), 'situations')
checkDupes(branches.flatMap((b) => b.playbooks.map((p) => ({ ...p, file: b.file }))), 'playbooks')
checkDupes(branches, 'branches (id веток)')
for (const t of topics) {
  checkDupes(t.questions.map((q) => ({ ...q, file: t.file })), `questions темы «${t.id}»`)
}

// --- 2. situation.cmds ссылаются на существующие команды этой же ветки ---
for (const b of branches) {
  const cmdSet = new Set(b.commands.map((c) => c.cmd))
  for (const s of b.situations) {
    for (const c of s.cmds) {
      if (!cmdSet.has(c)) err(`${b.file}: ситуация «${s.id}» ссылается на команду, которой нет среди commands: ${c}`)
    }
  }
}

// --- 3. playbook.steps[].sampleId существует среди samples этой же ветки ---
for (const b of branches) {
  const sampleSet = new Set(b.samples.map((s) => s.id))
  for (const p of b.playbooks) {
    for (const s of p.steps) {
      if (s.sampleId && !sampleSet.has(s.sampleId)) err(`${b.file}: playbook «${p.id}» — sampleId «${s.sampleId}» не найден среди samples`)
    }
    if (!p.steps.some((s) => s.goal)) warn(`${b.file}: playbook «${p.id}» — ни у одного шага нет "готово, когда…" (поле goal)`)
  }
}

// --- 4. nextSteps[].branchId — существующая и не «скоро» ветка ---
for (const b of branches) {
  for (const n of b.nextSteps) {
    if (!n.branchId) continue
    if (!branchIds.has(n.branchId)) err(`${b.file}: nextSteps ссылается на несуществующую ветку «${n.branchId}»`)
    else if (!liveBranchIds.has(n.branchId)) err(`${b.file}: nextSteps ведёт на ветку-заглушку «${n.branchId}» («скоро»)`)
  }
}

// --- 5. route.ts STAGES — существующая и не «скоро» ветка ---
const routeSrc = readFileSync(join(ROOT, 'src/lib/route.ts'), 'utf8')
const stageIds = [...routeSrc.matchAll(/branchId:\s*'([^']*)'/g)].map((m) => m[1])
for (const id of stageIds) {
  if (!branchIds.has(id)) err(`route.ts: STAGES ссылается на несуществующую ветку «${id}»`)
  else if (!liveBranchIds.has(id)) err(`route.ts: STAGES ведёт на ветку-заглушку «${id}» («скоро») — новичок дойдёт до тупика`)
}

// --- 6. одна и та же команда (cmd) с разными note — предупреждение (не ошибка) ---
const notesByCmd = new Map()
for (const b of branches) {
  for (const c of b.commands) {
    if (!c.cmd) continue
    if (!notesByCmd.has(c.cmd)) notesByCmd.set(c.cmd, new Set())
    notesByCmd.get(c.cmd).add(c.note)
  }
}
for (const [cmd, notes] of notesByCmd) {
  if (notes.size > 1) warn(`Команда «${cmd}» имеет ${notes.size} разных note в разных ветках — проверь, не разошлись ли тексты`)
}

// --- 7. link.to и related в topics — не проверяем глубоко (разный формат), но хотя бы топик существует для related ---
const topicIds = new Set(topics.map((t) => t.id))
const questionsByTopic = new Map(topics.map((t) => [t.id, new Set(t.questions.map((q) => q.id))]))
for (const t of topics) {
  for (const q of t.questions) {
    for (const r of q.related) {
      const [rt, rq] = r.split('/')
      if (!topicIds.has(rt)) err(`topics/${t.file}: вопрос «${q.id}» — related ссылается на несуществующую тему «${rt}»`)
      else if (!questionsByTopic.get(rt)?.has(rq)) err(`topics/${t.file}: вопрос «${q.id}» — related ссылается на несуществующий вопрос «${r}»`)
    }
  }
}

// --- итог ---
console.log(`Проверено: ${branches.length} веток, ${topics.length} тем.`)
if (warnings.length) {
  console.log(`\n⚠ Предупреждения (${warnings.length}):`)
  for (const w of warnings) console.log(`  - ${w}`)
}
if (errors.length) {
  console.log(`\n✗ Ошибки (${errors.length}):`)
  for (const e of errors) console.log(`  - ${e}`)
  process.exit(1)
} else {
  console.log('\n✓ Критичных проблем не найдено.')
}
