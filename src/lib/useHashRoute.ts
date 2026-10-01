import { useCallback, useEffect, useState } from 'react'
import type { TabId } from '@/branches/types'

export interface Route {
  id: string
  tab?: TabId
}

const TABS: TabId[] = ['tool', 'guide', 'commands']

// #/port-scanning/commands -> { id, tab }
function read(): Route {
  const [id = '', tab = ''] = window.location.hash.replace(/^#\/?/, '').split('/')
  return { id, tab: TABS.includes(tab as TabId) ? (tab as TabId) : undefined }
}

// Минимальный роутинг по hash: работает без сервера и с деплоем на статике
export function useHashRoute(): [Route, (id: string, tab?: TabId) => void] {
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const go = useCallback((id: string, tab?: TabId) => {
    window.location.hash = tab ? `/${id}/${tab}` : `/${id}`
  }, [])
  return [route, go]
}
