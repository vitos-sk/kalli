import { CircleHelp, Replace, FileSearch, Rocket, LifeBuoy, ListChecks, Route, ShieldCheck, Star, type LucideIcon } from 'lucide-react'

// Служебные страницы оболочки (не ветки пентеста)
export type SpecialId = 'questions' | 'start' | 'values' | 'situations' | 'playbooks' | 'explain' | 'route' | 'favorites' | 'labs'

export interface SpecialPage {
  id: SpecialId
  title: string
  icon: LucideIcon
  /** Живые слова для поиска */
  keywords?: string[]
}

export const SPECIAL: SpecialPage[] = [
  { id: 'questions', title: 'Вопросы и ответы', icon: CircleHelp, keywords: ['что такое', 'объясни', 'для новичка', 'помощь', 'не понимаю', 'темы'] },
  { id: 'start', title: 'С чего начать', icon: Rocket, keywords: ['с нуля', 'новичок', 'где взять ip', 'откуда ip', 'как узнать ip', 'какой ip вводить', 'установить nmap', 'цель', 'первый запуск'] },
  { id: 'values', title: 'Что подставлять', icon: Replace, keywords: ['замени', 'заглушка', 'угловые скобки', 'ip в команде', 'net', 'domain', 'port', 'что вписать', 'подставить', 'где взять'] },
  { id: 'situations', title: 'Что делать, если…', icon: LifeBuoy, keywords: ['проблема', 'не работает', 'помощь'] },
  { id: 'playbooks', title: 'Сценарии по шагам', icon: ListChecks, keywords: ['пошагово', 'по порядку', 'инструкция', 'цепочка'] },
  { id: 'explain', title: 'Разобрать вывод', icon: FileSearch, keywords: ['вставить вывод', 'разбери результат', 'что значит вывод', 'nmap результат'] },
  { id: 'route', title: 'Маршрут новичка', icon: Route, keywords: ['с чего начать', 'план', 'этапы', 'прогресс'] },
  { id: 'favorites', title: 'Избранное', icon: Star },
  { id: 'labs', title: 'Где тренироваться', icon: ShieldCheck, keywords: ['легально', 'лаборатория', 'мишень', 'площадки'] },
]
