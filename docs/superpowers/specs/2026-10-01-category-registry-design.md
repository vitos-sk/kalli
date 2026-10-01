# Единый реестр категорий для справочника и FAQ

Дата: 2026-10-01
Статус: approved (design), план реализации — следующим шагом

## Проблема

В сайдбаре («справочник») 10 веток пентеста (`src/branches/*.ts`) показываются одним плоским
списком, отсортированным по числовому полю `order` (5, 6, 7, 8, 10, 11, 15, 20, 21, 30, 50).
Порядок логичен (сперва «своё», потом разведка → сеть → веб → пароли → патчи), но в сайдбаре нет
визуальных подписей-разделов — поэтому непонятно, какие ветки относятся к одному направлению
(«веб» и «веб-продвинутый» выглядят не связанными друг с другом, «секреты» зажаты между сетевыми
темами и веб).

Отдельно, раздел «Вопросы и ответы» (`src/topics/*.ts`, 7 тем) частично пересекается по смыслу с
ветками (`my-network` ↔ `home-network`, `site-domain` ↔ `own-site`), и название направления в
каждом случае продублировано вручную в двух файлах без единого источника правды.

## Решение

Единый реестр категорий `src/lib/categories.ts` — таблица `{ id, title, icon, order }`. И `BranchConfig`,
и `Topic` получают обязательное поле `category: CategoryId`, ссылающееся на этот реестр. Темы (FAQ) и
ветки (полные гайды) остаются двумя отдельными слоями контента (FAQ ссылается на гайд через `link`/`related`)
— это решение принято осознанно, не трогаем формат подачи, только группировку и источник названий категорий.

### Реестр категорий

```ts
// src/lib/categories.ts
export type CategoryId = 'osnovy' | 'tvoe' | 'recon-net' | 'osint-tools' | 'web' | 'access-vuln'

export interface Category {
  id: CategoryId
  title: string
  icon: LucideIcon
  order: number
}

export const CATEGORIES: Category[] = [
  { id: 'osnovy',      title: 'Основы',               icon: BookOpen,    order: 1 },
  { id: 'tvoe',        title: 'Твоё',                 icon: ShieldCheck, order: 2 },
  { id: 'recon-net',   title: 'Разведка и сеть',      icon: Radar,       order: 3 },
  { id: 'osint-tools', title: 'OSINT-инструменты',    icon: Fingerprint, order: 4 },
  { id: 'web',         title: 'Веб',                  icon: Globe,       order: 5 },
  { id: 'access-vuln', title: 'Доступ и уязвимости',  icon: KeyRound,    order: 6 },
]
```

### Распределение контента по категориям

| Категория | Ветки (`src/branches`) | Темы (`src/topics`) |
|---|---|---|
| `osnovy` | — | `basics`, `reading-output`, `practice` |
| `tvoe` | `home-network`, `own-site` | `my-network`, `site-domain`, `my-projects`, `devices` |
| `recon-net` | `recon`, `port-scanning`, `network-tools` | — |
| `osint-tools` | `osint-people` | — |
| `web` | `web`, `web-advanced` | — |
| `access-vuln` | `passwords`, `exploit`, `secrets` | — |

Пустая категория у тем или веток — не ошибка: это честная карта того, где что раскрыто (например,
«Основы» — только FAQ, в ветках этому нет отдельного полного гайда).

### Изменения типов

`src/branches/types.ts` — `BranchConfig` получает обязательное поле:
```ts
category: CategoryId
```

`src/topics/types.ts` — `Topic` получает то же обязательное поле.

Оба файла импортируют `CategoryId` из `src/lib/categories.ts`.

### Миграция контента (простановка `category` в существующих файлах)

Ветки (`src/branches/`): `01-port-scanning.ts`→`recon-net`, `02-web.ts`→`web`, `03-passwords.ts`→`access-vuln`,
`04-recon.ts`→`recon-net`, `05-exploit.ts`→`access-vuln`, `06-secrets.ts`→`access-vuln`, `07-web-advanced.ts`→`web`,
`08-network-tools.ts`→`recon-net`, `09-osint-people.ts`→`osint-tools`, `10-home-network.ts`→`tvoe`, `11-own-site.ts`→`tvoe`.

Темы (`src/topics/`): `01-basics.ts`→`osnovy`, `02-my-network.ts`→`tvoe`, `03-my-projects.ts`→`tvoe`,
`04-devices.ts`→`tvoe`, `05-site-domain.ts`→`tvoe`, `06-reading-output.ts`→`osnovy`, `07-practice.ts`→`osnovy`.

Поле `order` внутри каждого файла не меняется — оно по-прежнему сортирует элементы **внутри** своей
категории, абсолютные числа между категориями больше не важны.

### UI: сайдбар (`src/components/Sidebar.tsx`)

Блок веток (сейчас — один `GroupLabel('справочник')` + плоский `branches.map`, строки ~95–116) меняется на:
группировка `branches` по `b.category`, категории — по порядку `CATEGORIES` (по `order`), внутри категории —
по `order` ветки как сейчас. Категория не рендерится, если в ней 0 веток (актуально для `osnovy`).
Общий заголовок «справочник» над всем блоком остаётся. Иконка и подпись раздела берутся из `CATEGORIES`,
а не придумываются в компоненте.

### UI: «Вопросы и ответы» (`src/components/QuestionsPage.tsx`)

Сетка карточек тем на главной (строки ~181–201) группируется тем же способом: подпись категории (из
`CATEGORIES`) + сетка карточек тем этой категории, категории по порядку `order`. Поиск, «популярные
вопросы», переходы по `related`/`link` не меняются — они обращаются к темам/веткам по `id`, категория
на эту логику не влияет.

### Новый контент: Blackbird в ветке `osint-people`

В `src/branches/09-osint-people.ts` (категория `osint-tools`) добавляется инструмент **Blackbird** —
асинхронный сканер аккаунтов по нику, быстрее и с более широким покрытием сайтов, чем Sherlock:

- Новая команда в `commands`: `blackbird -u <username>` (или аналогичный реальный синтаксис — проверить
  актуальный CLI проекта на этапе реализации) с `note`/`see`/`next`/`keywords` в стиле соседних команд.
- В разделе гайда «Четыре инструмента, четыре вопроса» добавляется пятый пункт про Blackbird как более
  быстрый/современный инструмент поиска по нику, дополняющий Sherlock/Maigret (не заменяющий — у каждого
  свой охват сайтов).
- `keywords` ветки — добавить `'blackbird'`.
- При необходимости — новый пример вывода в `samples`/`terminalSample`, по аналогии с `SHERLOCK_RESULT`.

## Что не меняется

- Роутинг (`useHashRoute`, `nav.ts`), поиск (`lib/search.ts`), `StartPage`, `Breadcrumb` — все они
  обращаются к веткам/темам по `id`, а не по позиции в списке или группе.
- Формат веток и тем как два отдельных слоя контента (FAQ → гайд) — не объединяются в одну сущность.
- Числовые `order` внутри веток/тем — не трогаем, кроме смысла (теперь это порядок внутри категории).

## Границы задачи

- Не делаем аналитику/счётчик популярности категорий — только реестр с полем `order`, которое задаёт
  приоритет показа вручную. Фраза «на будущее — хранение категорий самых популярных направлений» закрыта
  тем, что реестр централизован и расширяем (новую категорию/направление добавить — один объект в массиве
  `CATEGORIES` плюс поле `category` у новых веток/тем), без двойных источников правды.
- Не трогаем контент других веток/тем, кроме добавления Blackbird в `osint-people`.
