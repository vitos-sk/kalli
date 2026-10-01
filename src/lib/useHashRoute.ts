import { useCallback, useEffect, useState } from 'react'

export interface Route {
  id: string
  /** Второй сегмент: вкладка ветки или id ситуации */
  sub?: string
}

// #/port-scanning/commands -> { id, sub }
function read(): Route {
  const [id = '', sub] = window.location.hash.replace(/^#\/?/, '').split('/')
  return { id, sub: sub || undefined }
}

// Минимальный роутинг по hash: работает без сервера и с деплоем на статике
export function useHashRoute(): [Route, (id: string, sub?: string) => void] {
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const go = useCallback((id: string, sub?: string) => {
    window.location.hash = sub ? `/${id}/${sub}` : `/${id}`
  }, [])
  return [route, go]
}
