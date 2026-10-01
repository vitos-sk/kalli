import { useCallback, useEffect, useState } from 'react'

export interface Route {
  id: string
  /** Второй сегмент: вкладка ветки или id ситуации */
  sub?: string
  /** Третий сегмент: например, id вопроса внутри темы */
  sub2?: string
}

// #/port-scanning/commands -> { id, sub }
function read(): Route {
  const [id = '', sub, sub2] = window.location.hash.replace(/^#\/?/, '').split('/')
  return { id, sub: sub || undefined, sub2: sub2 || undefined }
}

// Минимальный роутинг по hash: работает без сервера и с деплоем на статике
export function useHashRoute(): [Route, (id: string, sub?: string, sub2?: string) => void] {
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const go = useCallback((id: string, sub?: string, sub2?: string) => {
    window.location.hash = '/' + [id, sub, sub2].filter(Boolean).join('/')
  }, [])
  return [route, go]
}
