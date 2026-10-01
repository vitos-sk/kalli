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
