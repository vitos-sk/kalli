import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Без StrictMode: двойное монтирование ломает жизненный цикл xterm (ошибка Viewport.dimensions)
createRoot(document.getElementById('root')!).render(<App />)

// PWA: офлайн и установка на главный экран (только в продакшене)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}
