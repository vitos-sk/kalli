import type { Finding, LineHint } from '@/branches/types'

// Пояснения к типовым строкам при проверке своего сайта на распространённые слабости
export const webHints: LineHint[] = [
  { pattern: /^== (\S+)/, text: (m) => `Проверяем путь ${m[1]} — какой код ответа он возвращает.` },
  { pattern: /^(\d{3})$/, text: (m) => codeText(m[1]) },
  { pattern: /index of\s*\/?/i, text: 'Листинг каталога: сервер показывает список файлов в папке вместо страницы. Часто так случайно «светят» бэкапы и конфиги.' },
  { pattern: /DB_PASSWORD|DB_PASS|SECRET_KEY|API_KEY/i, text: 'Похоже на секрет (пароль или ключ), который не должен быть виден снаружи.' },
  { pattern: /<input[^>]*type=["']?password/i, text: 'Поле ввода пароля на странице — стоит проверить, что форма передаёт его только по https.' },
  { pattern: /Set-Cookie:(?!.*Secure)(?!.*HttpOnly)/i, text: 'Cookie без флагов Secure/HttpOnly — её легче перехватить или прочитать чужим скриптом.' },
]

function codeText(code: string): string {
  if (code === '200') return '200 — страница открыта без пароля. Если это админка или внутренний инструмент — закрой её.'
  if (code === '401' || code === '403') return `${code} — доступ закрыт. Это и есть ожидаемый результат для админки.`
  if (code === '404') return '404 — такой страницы нет. Хорошо, если ты её не создавал.'
  return `Код ${code} — смотри общее значение кодов HTTP.`
}

// Типовые «чувствительные» пути, которые стоит проверить на своём сайте
export const SENSITIVE_PATHS = ['/admin', '/.env', '/.git/config', '/wp-admin', '/phpmyadmin', '/.well-known/security.txt', '/backup.sql', '/config.php']

// Разбор вывода проверки путей своего сайта (curl в цикле) и общих признаков слабостей
export function webAnalyze(text: string): Finding[] {
  const out: Finding[] = []

  // блоки вида "== /admin" + код на следующей строке
  const blocks = [...text.matchAll(/^==\s*(\S+)\s*\n(\d{3})/gm)]
  if (blocks.length) {
    const open = blocks.filter(([, , code]) => code === '200')
    if (open.length) {
      out.push({
        tone: 'warn',
        text: `Без пароля открыты: ${open.map(([, p]) => p).join(', ')}. Если это служебные страницы — закрой их логином или IP-фильтром.`,
      })
    } else {
      out.push({ tone: 'good', text: 'Ни один из проверенных путей не открылся без пароля (200). Хороший знак.' })
    }
  }

  if (/index of\s*\/?/i.test(text)) {
    out.push({ tone: 'warn', text: 'Найден листинг каталога (список файлов папки). Отключи его в настройках сервера (в nginx — autoindex off).' })
  }

  if (/DB_PASSWORD|DB_PASS|SECRET_KEY|API_KEY|AWS_SECRET/i.test(text)) {
    out.push({ tone: 'warn', text: 'В ответе виден похожий на секрет текст (пароль или ключ). Срочно убери файл из публичного доступа и смени значение.' })
  }

  if (/Set-Cookie:(?!.*Secure)/i.test(text)) {
    out.push({ tone: 'info', text: 'Есть cookie без флага Secure — она может уйти по незащищённому каналу. Добавь Secure и HttpOnly.' })
  }

  return out
}
