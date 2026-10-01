import type { LucideIcon } from 'lucide-react'

// Куда ведёт ссылка «открыть полностью»
export interface Dest {
  id: string
  sub?: string
  sub2?: string
}

// Один вопрос новичка: короткий ответ простыми словами + готовые команды
export interface Question {
  id: string
  q: string
  /** Ответ: простой markdown (абзацы, списки, **жирный**, `код`) */
  a: string
  /** Готовые команды; <ip>, <domain>, <net> подставятся из поля цели */
  cmds?: string[]
  /** 'start' — для самых новичков, 'next' — когда база уже понятна */
  level?: 'start' | 'next'
  /** Показывать в «Популярных» на главной */
  popular?: boolean
  /** Живые слова для поиска */
  keywords?: string[]
  link?: { label: string; to: Dest }
  /** Что почитать дальше: 'тема/вопрос' */
  related?: string[]
}

// Тема (направление). Новая тема = новый файл в src/topics/
export interface Topic {
  id: string
  title: string
  icon: LucideIcon
  /** Одна фраза: о чём эта тема */
  blurb: string
  order: number
  questions: Question[]
}
