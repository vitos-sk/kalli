import type { LucideIcon } from 'lucide-react'
import type { BranchConfig } from '@/branches/types'

// Хелпер для веток-заглушек «скоро»
export function soon(id: string, title: string, icon: LucideIcon, order: number): BranchConfig {
  return { id, title, icon, order, soon: true, tool: null, guide: '', commands: [], terminalSample: '' }
}
