import type { LineHint } from '@/branches/types'

// Пояснение к строке вывода по списку подсказок; null — не нашлось
export function explainLine(hints: LineHint[], line: string): string | null {
  for (const h of hints) {
    const m = line.match(h.pattern)
    if (m) return typeof h.text === 'function' ? h.text(m) : h.text
  }
  return null
}
