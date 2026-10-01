import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'

export type TabId = 'tool' | 'guide' | 'commands'

// Один готовый вывод для терминала («расклад»)
export interface Sample {
  id: string
  label: string
  /** Настоящая команда, результат которой это демонстрирует (покажется перед выводом) */
  cmd?: string
  text: string
  /** Показывать как пример на странице «Разобрать вывод» */
  explain?: boolean
}

// Что получает встроенный инструмент от оболочки
export interface ToolProps {
  /** Напечатать текст (по умолчанию — terminalSample ветки) в терминал построчно */
  runSample: (text?: string, label?: string, cmd?: string) => void
  /** Дополнительные примеры вывода из конфига ветки */
  samples: Sample[]
}

// Пояснение к флагу команды (показывается по клику на чип)
export interface CommandFlag {
  flag: string
  text: string
}

export interface BranchCommand {
  label: string
  cmd: string
  note: string
  flags?: CommandFlag[]
  /** Что человек увидит в ответе — простыми словами */
  see?: string
  /** Что делать дальше */
  next?: string
  /** Живые слова для поиска именно по этой команде */
  keywords?: string[]
}

// Подсказка к строке вывода терминала: по hover (десктоп) или тапу (телефон)
export interface LineHint {
  pattern: RegExp
  text: string | ((m: RegExpMatchArray) => string)
}

// «Что делать, если…»: ситуация → короткий ответ → готовые команды
export interface Situation {
  id: string
  title: string
  answer: string
  /** cmd из commands этой же ветки */
  cmds: string[]
  keywords?: string[]
}

// Шаг «что дальше» внизу гайда; branchId — куда перейти
export interface NextStep {
  text: string
  branchId?: string
}

// Вывод анализа вставленного текста
export interface Finding {
  text: string
  tone?: 'good' | 'warn' | 'info'
  /** id ситуации «что делать, если…» для перехода */
  situationId?: string
  /** Кнопки «подставить как цель» (найденный IP, адрес роутера…) */
  actions?: { label: string; target: string }[]
}

// Сценарий «по шагам»: цепочка команд с пояснением на каждом шаге
export interface PlaybookStep {
  title: string
  text: string
  cmd?: string
  /** id примера из samples — кнопка «что увидишь» напечатает его в терминал */
  sampleId?: string
  /** Как понять, что шаг выполнен: «готово, когда…» */
  goal?: string
}

export interface Playbook {
  id: string
  title: string
  intro: string
  steps: PlaybookStep[]
}

// Объяснение «зачем эти команды» для модалки в начале раздела «Команды»
export interface CommandsIntro {
  /** Что мы получаем, запуская эти команды */
  get: string
  /** Для чего это нужно */
  goal: string
  /** Что делать с результатом */
  result: string
}

// Конфиг одной ветки пентеста. Новая ветка = новый файл в src/branches/
export interface BranchConfig {
  id: string
  title: string
  icon: LucideIcon
  /** Встроенный браузерный инструмент или null (тогда вкладки «Инструмент» нет) */
  tool: ComponentType<ToolProps> | null
  /** Markdown-текст гайда */
  guide: string
  commands: BranchCommand[]
  /** Объяснение «зачем» для кнопки в начале раздела «Команды» */
  commandsIntro?: CommandsIntro
  /** Пример вывода — показывается в терминале построчно */
  terminalSample: string
  /** Порядок в сайдбаре (меньше — выше) */
  order: number
  /** true — заглушка «скоро» */
  soon?: boolean
  /** Живые слова для поиска: «пинг», «файрвол», «хост не отвечает» */
  keywords?: string[]
  /** Разбор строк терминала */
  lineHints?: LineHint[]
  situations?: Situation[]
  playbooks?: Playbook[]
  /** Разбор вставленного пользователем вывода: пустой массив — «не мой формат» */
  analyze?: (text: string) => Finding[]
  nextSteps?: NextStep[]
  /** Доп. расклады вывода (первый — тот же terminalSample) */
  samples?: Sample[]
}
