# Единый реестр категорий для справочника и FAQ — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ввести единый реестр категорий (`src/lib/categories.ts`) и сгруппировать по нему ветки справочника в сайдбаре и темы FAQ на странице «Вопросы и ответы», плюс добавить инструмент Blackbird в ветку `osint-people`.

**Architecture:** Один новый модуль-реестр (`{id, title, icon, order}[]`), на который ссылаются обязательным полем `category` типы `BranchConfig` и `Topic`. Два UI-компонента (`Sidebar.tsx`, `QuestionsPage.tsx`) группируют свои списки по этому реестру вместо плоского вывода. Контент (10 веток, 7 тем) получает проставленное значение `category`. TypeScript (обязательное поле) и скрипт `check:content` — единственная сеть проверки в проекте (юнит-тестов нет), поэтому каждый шаг проверяется через `npm run build` и/или `npm run check:content`.

**Tech Stack:** React 19 + TypeScript, Vite, lucide-react (иконки), регекс-валидатор `scripts/check-content.mjs` (без фреймворка тестов).

**Spec:** `docs/superpowers/specs/2026-10-01-category-registry-design.md`

## Global Constraints

- Названия категорий и их иконки существуют только в `src/lib/categories.ts` — ни один другой файл не хардкодит название раздела.
- `category` — обязательное (не опциональное) поле и в `BranchConfig`, и в `Topic`: отсутствие значения должно ломать сборку (`tsc`), а не тихо проваливаться в рантайме.
- Поле `order` внутри веток/тем не меняется и не переосмысливается как глобальный порядок — только порядок внутри своей категории.
- Категория с нулём элементов не рендерит заголовок (ни в сайдбаре, ни в сетке тем).
- Существующий слой «тема (FAQ) ссылается на ветку (гайд)» не трогаем — объединения сущностей нет.
- Иконки берутся только из реально существующих экспортов `lucide-react` (в этой версии пакета нет иконки `Fingerprint` — только `FingerprintPattern`; использовать `ScanSearch`).

## Review Focus

- Опечатка в значении `category` у ветки/темы (например, `'recon-net '` с пробелом или несуществующий id) — должна быть поймана `check:content`, а не молча спрятать пункт из сайдбара без ошибки.
- Категория, в которой временно 0 веток или 0 тем (`osint-tools` для тем, `osnovy` для веток) — не должна рисовать пустой заголовок раздела.
- Повтор `id` категории в самом реестре `CATEGORIES` — должен быть пойман валидатором, иначе две категории молча схлопнутся в одну при группировке.
- `nextSteps`/`route.ts`/ссылки `related` на ветки и темы, которые раньше проверялись в `check:content`, — должны продолжать проходить после того, как в файлы веток/тем добавится новое поле (регексы `check-content.mjs` не должны сломаться от лишней строки `category: '...'`).
- Сайдбар в свёрнутом виде (`collapsed`) — разделители категорий не должны задваиваться с уже существующим разделителем перед блоком «ещё/инструменты» и не должны ломать `title`-тултип по иконке.

---

## Task 1: Реестр категорий

**Files:**
- Create: `src/lib/categories.ts`
- Test: вручную — `npm run build`

**Interfaces:**
- Consumes: ничего (базовый модуль)
- Produces: `export type CategoryId = 'osnovy' | 'tvoe' | 'recon-net' | 'osint-tools' | 'web' | 'access-vuln'`, `export interface Category { id: CategoryId; title: string; icon: LucideIcon; order: number }`, `export const CATEGORIES: Category[]` (отсортирован по `order` уже в исходном коде, по возрастанию)

- [ ] **Step 1: Создать файл реестра**

```ts
// src/lib/categories.ts
import { BookOpen, Globe, KeyRound, Radar, ScanSearch, ShieldCheck, type LucideIcon } from 'lucide-react'

// Единый источник правды для группировки веток справочника и тем FAQ.
// Новое направление = новый объект здесь + поле `category` у ветки/темы.
export type CategoryId = 'osnovy' | 'tvoe' | 'recon-net' | 'osint-tools' | 'web' | 'access-vuln'

export interface Category {
  id: CategoryId
  title: string
  icon: LucideIcon
  /** Порядок раздела в сайдбаре/сетке тем (меньше — выше) */
  order: number
}

export const CATEGORIES: Category[] = [
  { id: 'osnovy', title: 'Основы', icon: BookOpen, order: 1 },
  { id: 'tvoe', title: 'Твоё', icon: ShieldCheck, order: 2 },
  { id: 'recon-net', title: 'Разведка и сеть', icon: Radar, order: 3 },
  { id: 'osint-tools', title: 'OSINT-инструменты', icon: ScanSearch, order: 4 },
  { id: 'web', title: 'Веб', icon: Globe, order: 5 },
  { id: 'access-vuln', title: 'Доступ и уязвимости', icon: KeyRound, order: 6 },
]
```

- [ ] **Step 2: Проверить, что проект собирается**

Run: `npm run build`
Expected: сборка проходит без ошибок (новый файл не используется нигде, но валиден сам по себе).

- [ ] **Step 3: Commit**

```bash
git add src/lib/categories.ts
git commit -m "feat: добавить реестр категорий справочника

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Task 2: Поле `category` у веток — тип и миграция всех 11 файлов

**Files:**
- Modify: `src/branches/types.ts`
- Modify: `src/branches/01-port-scanning.ts`, `02-web.ts`, `03-passwords.ts`, `04-recon.ts`, `05-exploit.ts`, `06-secrets.ts`, `07-web-advanced.ts`, `08-network-tools.ts`, `09-osint-people.ts`, `10-home-network.ts`, `11-own-site.ts`
- Test: `npm run build`

**Interfaces:**
- Consumes: `CategoryId` из `src/lib/categories.ts` (Task 1)
- Produces: `BranchConfig.category: CategoryId` — используется в Task 4 (Sidebar) и Task 5 (check-content)

Поле в типе и во всех файлах добавляется одним шагом, потому что `category` обязательное — проект не
скомпилируется, пока не проставлено хотя бы в одном файле. Промежуточного «зелёного» состояния между
правкой типа и правкой всех веток не существует.

- [ ] **Step 1: Добавить поле в тип `BranchConfig`**

В `src/branches/types.ts` в начале файла добавить импорт:

```ts
import type { CategoryId } from '@/lib/categories'
```

И в интерфейсе `BranchConfig` (там же, где `order: number`) добавить поле сразу после `order`:

```ts
  /** Порядок в сайдбаре (меньше — выше) */
  order: number
  /** Категория направления — см. src/lib/categories.ts */
  category: CategoryId
```

- [ ] **Step 2: Проставить `category` во всех 11 файлах веток**

В каждом файле добавить поле `category: '...',` сразу после строки `order: N,` в объекте `config`.
Соответствие (из спеки):

| Файл | `category` |
|---|---|
| `01-port-scanning.ts` | `'recon-net'` |
| `02-web.ts` | `'web'` |
| `03-passwords.ts` | `'access-vuln'` |
| `04-recon.ts` | `'recon-net'` |
| `05-exploit.ts` | `'access-vuln'` |
| `06-secrets.ts` | `'access-vuln'` |
| `07-web-advanced.ts` | `'web'` |
| `08-network-tools.ts` | `'recon-net'` |
| `09-osint-people.ts` | `'osint-tools'` |
| `10-home-network.ts` | `'tvoe'` |
| `11-own-site.ts` | `'tvoe'` |

Пример правки для `src/branches/01-port-scanning.ts` (строка `order: 10,`):

```ts
  order: 10,
  category: 'recon-net',
```

Пример для `src/branches/09-osint-people.ts` (строка `order: 8,`):

```ts
  order: 8,
  category: 'osint-tools',
```

Остальные 9 файлов правятся тем же способом: найти строку `order: <число>,` в объекте `config` и
добавить следующей строкой `category: '<значение из таблицы>',`.

- [ ] **Step 3: Проверить сборку**

Run: `npm run build`
Expected: `tsc -b` проходит без ошибок «Property 'category' is missing» ни по одному из 11 файлов; `vite build` завершается успешно.

- [ ] **Step 4: Commit**

```bash
git add src/branches/types.ts src/branches/*.ts
git commit -m "feat: проставить category у всех веток справочника

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Task 3: Поле `category` у тем FAQ — тип и миграция всех 7 файлов

**Files:**
- Modify: `src/topics/types.ts`
- Modify: `src/topics/01-basics.ts`, `02-my-network.ts`, `03-my-projects.ts`, `04-devices.ts`, `05-site-domain.ts`, `06-reading-output.ts`, `07-practice.ts`
- Test: `npm run build`

**Interfaces:**
- Consumes: `CategoryId` из `src/lib/categories.ts` (Task 1)
- Produces: `Topic.category: CategoryId` — используется в Task 6 (QuestionsPage)

- [ ] **Step 1: Добавить поле в тип `Topic`**

В `src/topics/types.ts` добавить импорт:

```ts
import type { CategoryId } from '@/lib/categories'
```

И в интерфейсе `Topic` добавить поле сразу после `order`:

```ts
  order: number
  /** Категория направления — см. src/lib/categories.ts */
  category: CategoryId
  questions: Question[]
```

- [ ] **Step 2: Проставить `category` во всех 7 файлах тем**

Соответствие (из спеки):

| Файл | `category` |
|---|---|
| `01-basics.ts` | `'osnovy'` |
| `02-my-network.ts` | `'tvoe'` |
| `03-my-projects.ts` | `'tvoe'` |
| `04-devices.ts` | `'tvoe'` |
| `05-site-domain.ts` | `'tvoe'` |
| `06-reading-output.ts` | `'osnovy'` |
| `07-practice.ts` | `'osnovy'` |

Пример правки для `src/topics/02-my-network.ts` (строка `order: 2,`):

```ts
  order: 2,
  category: 'tvoe',
```

Остальные 6 файлов — тем же способом: после строки `order: <число>,` добавить `category: '<значение>',`.

- [ ] **Step 3: Проверить сборку**

Run: `npm run build`
Expected: без ошибок типов по всем 7 файлам тем.

- [ ] **Step 4: Commit**

```bash
git add src/topics/types.ts src/topics/*.ts
git commit -m "feat: проставить category у всех тем FAQ

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Task 4: Валидация категорий в `check:content`

**Files:**
- Modify: `scripts/check-content.mjs`
- Test: `npm run check:content`

**Interfaces:**
- Consumes: список `CATEGORIES` — т.к. скрипт не импортирует TS-модули (работает регексом по исходникам, без сборки), список допустимых id дублируется здесь явной константой, синхронизированной с `src/lib/categories.ts` вручную (так же, как сам скрипт уже не импортирует типы проекта нигде).
- Produces: новые проверки в общем выводе `errors`/`warnings` скрипта.

- [ ] **Step 1: Добавить константу допустимых id и чтение поля `category`**

В `scripts/check-content.mjs` после блока `const field = ...` / `const flag = ...` (строки 38–42) добавить:

```js
// Должно оставаться в синхроне со src/lib/categories.ts (CategoryId)
const VALID_CATEGORIES = new Set(['osnovy', 'tvoe', 'recon-net', 'osint-tools', 'web', 'access-vuln'])
```

- [ ] **Step 2: Собирать `category` при чтении веток**

В цикле чтения веток (строка `branches.push({ file: f, id, soon, commands, situations, playbooks, samples, nextSteps })`,
около строки 91) добавить извлечение поля и положить в объект:

```js
  const category = field(src, 'category')
  branches.push({ file: f, id, soon, category, commands, situations, playbooks, samples, nextSteps })
```

- [ ] **Step 3: Собирать `category` при чтении тем**

В цикле чтения тем (строка `topics.push({ file: f, id, questions })`, около строки 114) добавить:

```js
  const category = field(src, 'category')
  topics.push({ file: f, id, category, questions })
```

- [ ] **Step 4: Добавить саму проверку**

После блока «1. уникальность id» (после строки `checkDupes(branches, 'branches (id веток)')`, перед
циклом `for (const t of topics) { checkDupes(...) }`, то есть сразу после строки 132) добавить новый блок:

```js
// --- 1b. у каждой ветки и темы есть валидная category ---
for (const b of branches) {
  if (!b.category) err(`${b.file}: отсутствует поле category`)
  else if (!VALID_CATEGORIES.has(b.category)) err(`${b.file}: category «${b.category}» не входит в CATEGORIES (src/lib/categories.ts)`)
}
for (const t of topics) {
  if (!t.category) err(`topics/${t.file}: отсутствует поле category`)
  else if (!VALID_CATEGORIES.has(t.category)) err(`topics/${t.file}: category «${t.category}» не входит в CATEGORIES (src/lib/categories.ts)`)
}
```

- [ ] **Step 5: Проверить сам реестр `CATEGORIES` на дубли id**

После блока из Step 4 добавить ещё одну проверку — дубль `id` внутри самого реестра категорий
ломает группировку молча (две категории схлопнутся в одну), поэтому читаем `src/lib/categories.ts`
отдельно и считаем вхождения каждого id:

```js
// --- 1c. в самом реестре категорий нет повторяющихся id ---
const categoriesSrc = readFileSync(join(ROOT, 'src/lib/categories.ts'), 'utf8')
const categoryIdMatches = [...categoriesSrc.matchAll(/\{\s*id:\s*'([^']*)'/g)].map((m) => m[1])
const categoryIdCounts = new Map()
for (const id of categoryIdMatches) categoryIdCounts.set(id, (categoryIdCounts.get(id) ?? 0) + 1)
for (const [id, count] of categoryIdCounts) {
  if (count > 1) err(`src/lib/categories.ts: id «${id}» встречается ${count} раза в CATEGORIES`)
}
```

- [ ] **Step 6: Запустить проверку и убедиться, что она проходит**

Run: `npm run check:content`
Expected: `✓ Критичных проблем не найдено.` (все 10+1 веток и 7 тем уже получили `category` в Task 2–3, а в `CATEGORIES` все 6 id уникальны).

- [ ] **Step 7: Проверить, что проверка реально ловит ошибку (ручной smoke-тест)**

Временно испортить значение в любом файле, например в `src/branches/01-port-scanning.ts` поменять
`category: 'recon-net',` на `category: 'recon-nett',`, запустить `npm run check:content` и убедиться,
что скрипт завершается с ненулевым кодом и печатает строку вида
`01-port-scanning.ts: category «recon-nett» не входит в CATEGORIES`. Затем вернуть правильное значение
обратно и ещё раз прогнать `npm run check:content`, убедившись, что снова всё чисто.

- [ ] **Step 8: Commit**

```bash
git add scripts/check-content.mjs
git commit -m "feat: проверять поле category в check:content

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Task 5: Группировка веток в сайдбаре

**Files:**
- Modify: `src/components/Sidebar.tsx:1-6` (импорты), `src/components/Sidebar.tsx:95-116` (блок веток)
- Test: `npm run build`, затем ручная проверка в `npm run dev`

**Interfaces:**
- Consumes: `CATEGORIES` из `src/lib/categories.ts` (Task 1), `BranchConfig.category` (Task 2)
- Produces: не меняет внешний API `SidebarNav` (те же пропсы `Props`)

- [ ] **Step 1: Добавить импорт реестра категорий**

В `src/components/Sidebar.tsx` после существующего импорта типа `BranchConfig` (строка 6) добавить:

```ts
import { CATEGORIES } from '@/lib/categories'
```

- [ ] **Step 2: Заменить плоский блок веток на группировку по категориям**

Заменить текущий блок (строки 95–116):

```tsx
        {!collapsed && <GroupLabel>справочник</GroupLabel>}
        {collapsed && <div className="my-3 border-t" />}
        <div className="space-y-1">
          {branches.map((b) => (
            <NavItem
              key={b.id}
              id={b.id}
              title={b.title}
              Icon={b.icon}
              active={b.id === activeId}
              collapsed={collapsed}
              disabled={b.soon}
              onSelect={onSelect}
              right={
                <>
                  {b.soon && <Badge>скоро</Badge>}
                  {done.includes(b.id) && <Check className="size-4 text-primary" aria-label="изучено" />}
                </>
              }
            />
          ))}
        </div>
```

на:

```tsx
        {!collapsed && <GroupLabel>справочник</GroupLabel>}
        {collapsed && <div className="my-3 border-t" />}
        {CATEGORIES.map((cat) => {
          const items = branches.filter((b) => b.category === cat.id)
          if (!items.length) return null
          return (
            <div key={cat.id}>
              {!collapsed && <p className="label mb-1 mt-3 px-3 text-[9px] text-muted-foreground/50 first:mt-0">{cat.title}</p>}
              {collapsed && <div className="my-2 border-t border-dashed" />}
              <div className="space-y-1">
                {items.map((b) => (
                  <NavItem
                    key={b.id}
                    id={b.id}
                    title={b.title}
                    Icon={b.icon}
                    active={b.id === activeId}
                    collapsed={collapsed}
                    disabled={b.soon}
                    onSelect={onSelect}
                    right={
                      <>
                        {b.soon && <Badge>скоро</Badge>}
                        {done.includes(b.id) && <Check className="size-4 text-primary" aria-label="изучено" />}
                      </>
                    }
                  />
                ))}
              </div>
            </div>
          )
        })}
```

- [ ] **Step 3: Проверить сборку**

Run: `npm run build`
Expected: без ошибок типов (JSX и импорты валидны).

- [ ] **Step 4: Ручная проверка в браузере**

Run: `npm run dev`, открыть выведенный адрес (обычно `http://localhost:5173`).
Expected: в сайдбаре под заголовком «справочник» видно пять подписей-разделов по порядку —
«Твоё», «Разведка и сеть», «OSINT-инструменты», «Веб», «Доступ и уязвимости» (раздел «Основы» не
показан, т.к. в нём пока нет веток) — и под каждой лежат ровно те ветки, что перечислены в таблице
из Task 2. Свернуть сайдбар кнопкой внизу — вместо подписей между категориями должны появиться
тонкие пунктирные разделители, список по-прежнему кликабелен.

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: группировать ветки в сайдбаре по категориям

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Task 6: Группировка тем на странице «Вопросы и ответы»

**Files:**
- Modify: `src/components/QuestionsPage.tsx:1-13` (импорты), `src/components/QuestionsPage.tsx:181-201` (сетка тем)
- Test: `npm run build`, затем ручная проверка в `npm run dev`

**Interfaces:**
- Consumes: `CATEGORIES` из `src/lib/categories.ts` (Task 1), `Topic.category` (Task 3)
- Produces: не меняет внешний API `QuestionsPage` (те же пропсы)

- [ ] **Step 1: Добавить импорт реестра категорий**

В `src/components/QuestionsPage.tsx` рядом с импортом `findQuestion, topics` (строка 12) добавить:

```ts
import { CATEGORIES } from '@/lib/categories'
```

- [ ] **Step 2: Заменить плоскую сетку тем на группировку по категориям**

Заменить текущий блок (строки 181–201):

```tsx
          <section>
            <h2 className="label mb-3 text-[10px] text-muted-foreground">темы</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {topics.map((t) => {
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
          </section>
```

на:

```tsx
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
```

- [ ] **Step 3: Проверить сборку**

Run: `npm run build`
Expected: без ошибок типов.

- [ ] **Step 4: Ручная проверка в браузере**

Run: `npm run dev`, открыть раздел «Вопросы и ответы».
Expected: карточки тем разбиты на группы с подписями «Основы» и «Твоё» (только эти две категории
сейчас содержат темы), в «Основы» — basics/reading-output/practice, в «Твоё» — my-network/my-projects/
devices/site-domain. Поиск по вопросам и «популярные вопросы» ниже работают как раньше.

- [ ] **Step 5: Commit**

```bash
git add src/components/QuestionsPage.tsx
git commit -m "feat: группировать темы FAQ по категориям

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Task 7: Добавить Blackbird в ветку `osint-people`

**Files:**
- Modify: `src/branches/09-osint-people.ts`
- Test: `npm run build`, `npm run check:content`

**Interfaces:**
- Consumes: ничего нового
- Produces: ничего, что использовали бы другие задачи (контентная правка)

Источник по реальному CLI: [p1ngul1n0/blackbird на GitHub](https://github.com/p1ngul1n0/blackbird) —
установка клонированием репозитория и `pip install -r requirements.txt`, запуск
`python blackbird.py -u <ник> --show-all`.

- [ ] **Step 1: Добавить пример вывода Blackbird**

В `src/branches/09-osint-people.ts` после константы `SHERLOCK_RESULT` (после строки 25, `const SHERLOCK_RESULT = ...`) добавить:

```ts
const BLACKBIRD_RESULT = `[*] Running Blackbird v1.4 — 605 sites
[*] Target username: test_user

[FOUND] GitHub          https://github.com/test_user
[FOUND] Reddit          https://reddit.com/user/test_user
[FOUND] X / Twitter     https://x.com/test_user
[FOUND] Telegram        https://t.me/test_user
[NOT FOUND] TikTok
[NOT FOUND] Instagram

[*] 4 accounts found out of 605 checked in 6.2s`
```

- [ ] **Step 2: Обновить вводный раздел гайда**

В поле `guide` заменить подзаголовок и список (строка `## Четыре инструмента, четыре вопроса` и пункты
1–4, строки 86–91) на:

```
## Пять инструментов, пять вопросов

1. **theHarvester — какие у организации email и поддомены торчат в открытом доступе?** Собирает со поисковиков, сертификатов и других открытых источников.
2. **Holehe — на каких сервисах зарегистрирована эта почта?** Проверяет почту по механизму «восстановление пароля» десятков сайтов — если форма говорит «письмо отправлено», аккаунт существует.
3. **Sherlock / Maigret — какие соцсети привязаны к этому нику?** Проверяет один никнейм на сотнях площадок разом.
4. **Blackbird — то же самое, но быстрее и шире.** Проверяет никнейм асинхронно сразу на 600+ сайтах за секунды и умеет искать ещё и по email; хорошая вторая проверка, если Sherlock/Maigret не нашли нужный аккаунт — охват сайтов у инструментов частично не совпадает.
5. **Have I Been Pwned — утекал ли этот email или пароль в известных утечках?** Официальная база собранных публичных утечек, с API для автоматической проверки.
```

- [ ] **Step 3: Добавить строку про Blackbird в раздел «Как читать вывод»**

После строки про Sherlock/Maigret в разделе «Как читать вывод» (строка 96) добавить следующей строкой:

```
- **Blackbird:** `[FOUND]` / `[NOT FOUND]` — то же самое, что `[+]`/`[-]` у Sherlock, просто другой формат вывода. В конце — сводка «N accounts found out of M checked».
```

- [ ] **Step 4: Добавить команду Blackbird**

В массив `commands` после блока «То же самое, но шире (Maigret)» (после строки `keywords: ['maigret', 'html отчёт osint'],\n    },`, то есть после закрытия этого объекта, строка 140) добавить новый объект команды:

```ts
    {
      label: 'Быстрый поиск по нику на 600+ сайтах (Blackbird)',
      cmd: 'python blackbird.py -u test_user --show-all',
      note: 'Blackbird — более новый и быстрый инструмент: проверяет никнейм асинхронно сразу на 600+ сайтах за секунды (а не последовательно, как Sherlock) и дополнительно умеет искать по email. Ставится клонированием репозитория: `git clone https://github.com/p1ngul1n0/blackbird && cd blackbird && pip install -r requirements.txt`.',
      see: '`[FOUND]` — аккаунт существует на сайте, `[NOT FOUND]` — нет. Флаг `--show-all` печатает и не найденные тоже, без него — только найденные.',
      next: 'Сравни результат со списком от Sherlock/Maigret — охват сайтов у инструментов разный, какой-то аккаунт может найтись только здесь.',
      keywords: ['blackbird', 'быстрый поиск по нику', 'async osint'],
    },
```

- [ ] **Step 5: Добавить `blackbird` в keywords ветки и пример в samples**

В массиве `keywords` ветки (строка 63, список начинается с `'osint', 'holehe', 'sherlock', 'maigret',`)
добавить `'blackbird'` сразу после `'maigret'`:

```ts
    'osint', 'holehe', 'sherlock', 'maigret', 'blackbird', 'theharvester', 'have i been pwned', 'hibp', 'утечка пароля',
```

В массив `samples` (после записи `{ id: 'sherlock', ... }`, строка 224) добавить:

```ts
    { id: 'blackbird', label: 'Blackbird: найденные аккаунты', cmd: 'python blackbird.py -u test_user --show-all', text: BLACKBIRD_RESULT, explain: true },
```

- [ ] **Step 6: Проверить сборку и контент**

Run: `npm run build && npm run check:content`
Expected: оба проходят без ошибок (новая команда и сэмпл синтаксически корректны, `check:content`
не находит дублей id и битых ссылок — у Blackbird нет `situations`/`playbooks`, которые могли бы
ссылаться на несуществующий `sampleId`).

- [ ] **Step 7: Commit**

```bash
git add src/branches/09-osint-people.ts
git commit -m "feat: добавить Blackbird в ветку OSINT: почта, ники, соцсети

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Task 8: Финальная проверка всей ветки

**Files:** нет изменений — только верификация.

- [ ] **Step 1: Полная сборка**

Run: `npm run build`
Expected: успешно, без ошибок и предупреждений TypeScript.

- [ ] **Step 2: Контент-проверка**

Run: `npm run check:content`
Expected: `✓ Критичных проблем не найдено.`

- [ ] **Step 3: Линт**

Run: `npm run lint`
Expected: без ошибок (новые/изменённые файлы соответствуют правилам oxlint проекта).

- [ ] **Step 4: Ручной обзор в браузере**

Run: `npm run dev`, пройти по сайдбару и по «Вопросам и ответам», убедиться, что группировка выглядит
так, как описано в Task 5 Step 4 и Task 6 Step 4, и что переход по ветке `osint-people` показывает
новую команду Blackbird в разделе «Команды».
