import { useSyncExternalStore } from 'react'

// Маленькое хранилище множества строк в localStorage (избранное, «изучено»)
export function createSetStore(key: string) {
  const read = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? '[]')
    } catch {
      return []
    }
  }
  const set = new Set<string>(read())
  const subs = new Set<() => void>()
  let snap = [...set]

  const emit = () => {
    snap = [...set]
    try {
      localStorage.setItem(key, JSON.stringify(snap))
    } catch {
      /* приватный режим — живём без сохранения */
    }
    subs.forEach((f) => f())
  }

  return {
    /** Хук: актуальный массив значений */
    use: () =>
      useSyncExternalStore(
        (cb) => (subs.add(cb), () => subs.delete(cb)),
        () => snap,
      ),
    /** Убрать все значения с префиксом (сброс прогресса сценария) */
    clearPrefix(prefix: string) {
      for (const v of [...set]) if (v.startsWith(prefix)) set.delete(v)
      emit()
    },
    toggle(v: string) {
      if (set.has(v)) set.delete(v)
      else set.add(v)
      emit()
    },
  }
}

export const favorites = createSetStore('pentest-cheats:fav')
export const learned = createSetStore('pentest-cheats:learned')
export const favKey = (branchId: string, cmd: string) => `${branchId}::${cmd}`

// Хранилище «ключ → текст» (заметки к целям)
export function createMapStore(key: string) {
  const read = (): Record<string, string> => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? '{}')
    } catch {
      return {}
    }
  }
  let snap = read()
  const subs = new Set<() => void>()
  return {
    use: () =>
      useSyncExternalStore(
        (cb) => (subs.add(cb), () => subs.delete(cb)),
        () => snap,
      ),
    set(k: string, v: string) {
      snap = { ...snap }
      if (v) snap[k] = v
      else delete snap[k]
      try {
        localStorage.setItem(key, JSON.stringify(snap))
      } catch {
        /* приватный режим */
      }
      subs.forEach((f) => f())
    },
  }
}

export const notes = createMapStore('pentest-cheats:notes')
export const playbookDone = createSetStore('pentest-cheats:playbooks')
export const understood = createSetStore('pentest-cheats:understood')
