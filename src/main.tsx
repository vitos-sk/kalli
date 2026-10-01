import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Без StrictMode: двойное монтирование ломает жизненный цикл xterm (ошибка Viewport.dimensions)
createRoot(document.getElementById('root')!).render(<App />)
