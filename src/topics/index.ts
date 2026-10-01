import type { Topic } from './types'

// Оболочка сама находит все файлы тем: каждый делает `export default` с Topic.
const modules = import.meta.glob<{ default: Topic }>(['./*.ts', '!./index.ts', '!./types.ts'], { eager: true })

export const topics: Topic[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.order - b.order)

// Найти вопрос по ссылке 'тема/вопрос'
export function findQuestion(ref: string) {
  const [t, q] = ref.split('/')
  const topic = topics.find((x) => x.id === t)
  const question = topic?.questions.find((x) => x.id === q)
  return topic && question ? { topic, question } : null
}
