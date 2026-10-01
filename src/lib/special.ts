import { CircleHelp, Replace, FileSearch, Rocket, LifeBuoy, ListChecks, Route, ShieldCheck, Star, type LucideIcon } from 'lucide-react'

// Служебные страницы оболочки (не ветки пентеста)
export type SpecialId = 'questions' | 'start' | 'values' | 'situations' | 'playbooks' | 'explain' | 'route' | 'favorites' | 'labs'

export type SpecialGroup = 'top' | 'tools' | 'progress' | 'more'

export interface SpecialPage {
  id: SpecialId
  title: string
  icon: LucideIcon
  /** Группа в сайдбаре: top — без подписи, наверху; tools/progress/more — с подписью-разделом */
  group: SpecialGroup
  /** Живые слова для поиска */
  keywords?: string[]
}

export const SPECIAL: SpecialPage[] = [
  { id: 'questions', title: 'Вопросы и ответы', icon: CircleHelp, group: 'top', keywords: ['что такое', 'объясни', 'для новичка', 'помощь', 'не понимаю', 'темы'] },
  { id: 'start', title: 'С чего начать', icon: Rocket, group: 'top', keywords: ['с нуля', 'новичок', 'где взять ip', 'откуда ip', 'как узнать ip', 'какой ip вводить', 'установить nmap', 'цель', 'первый запуск'] },
  { id: 'values', title: 'Что подставлять', icon: Replace, group: 'tools', keywords: ['замени', 'заглушка', 'угловые скобки', 'ip в команде', 'net', 'domain', 'port', 'что вписать', 'подставить', 'где взять'] },
  { id: 'situations', title: 'Что делать, если…', icon: LifeBuoy, group: 'tools', keywords: ['проблема', 'не работает', 'помощь'] },
  { id: 'playbooks', title: 'Сценарии по шагам', icon: ListChecks, group: 'tools', keywords: ['пошагово', 'по порядку', 'инструкция', 'цепочка'] },
  { id: 'explain', title: 'Разобрать вывод', icon: FileSearch, group: 'tools', keywords: ['вставить вывод', 'разбери результат', 'что значит вывод', 'nmap результат'] },
  { id: 'route', title: 'Маршрут новичка', icon: Route, group: 'progress', keywords: ['с чего начать', 'план', 'этапы', 'прогресс'] },
  { id: 'favorites', title: 'Избранное', icon: Star, group: 'progress' },
  { id: 'labs', title: 'Где тренироваться', icon: ShieldCheck, group: 'more', keywords: ['легально', 'лаборатория', 'мишень', 'площадки'] },
]
