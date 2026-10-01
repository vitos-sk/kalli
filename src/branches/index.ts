import type { BranchConfig } from './types'

// Оболочка сама находит все конфиги: каждый файл в этой папке
// (кроме index/types) должен делать `export default` с BranchConfig.
const modules = import.meta.glob<{ default: BranchConfig }>(['./*.ts', '!./index.ts', '!./types.ts'], {
  eager: true,
})

export const branches: BranchConfig[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.order - b.order)
