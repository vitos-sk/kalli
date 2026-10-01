import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'

export type TabId = 'tool' | 'guide' | 'commands'

// Один готовый вывод для терминала («расклад»)
export interface Sample {
  id: string
  label: string
  text: string
}

// Что получает встроенный инструмент от оболочки
export interface ToolProps {
  /** Напечатать текст (по умолчанию — terminalSample ветки) в терминал построчно */
  runSample: (text?: string) => void
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
}

// Подсказка к строке вывода терминала: по hover (десктоп) или тапу (телефон)
export interface LineHint {
  pattern: RegExp
  text: string | ((m: RegExpMatchArray) => string)
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
  /** Доп. расклады вывода (первый — тот же terminalSample) */
  samples?: Sample[]
}
