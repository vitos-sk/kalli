import type { LucideIcon } from 'lucide-react'
import type { BranchConfig } from '@/branches/types'
import type { CategoryId } from './categories'

// Хелпер для веток-заглушек «скоро»
export function soon(id: string, title: string, icon: LucideIcon, order: number, category: CategoryId): BranchConfig {
  return { id, title, icon, order, category, soon: true, tool: null, guide: '', commands: [], terminalSample: '' }
}
