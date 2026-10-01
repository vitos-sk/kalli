import type { Finding, LineHint } from '@/branches/types'

const DAY = 86_400_000
const daysLeft = (d: string) => {
  const t = Date.parse(d)
  return Number.isNaN(t) ? null : Math.floor((t - Date.now()) / DAY)
}

const STATUS: Record<string, string> = {
  '200': 'всё хорошо, страница отдана',
  '301': 'постоянный редирект (например, с http на https или на www)',
  '302': 'временный редирект',
  '403': 'доступ запрещён',
  '404': 'такой страницы нет',
  '500': 'ошибка на стороне сервера',
  '502': 'сервер-посредник не получил ответ от приложения',
  '503': 'сервис временно недоступен',
}

export const siteHints: LineHint[] = [
  { pattern: /^HTTP\/[\d.]+\s+(\d{3})/, text: (m) => `Код ответа ${m[1]}: ${STATUS[m[1]] ?? 'смотри значение кода HTTP'}.` },
  { pattern: /^server:\s*(.+)/i, text: (m) => `server: сервер называет свою программу${/\d/.test(m[1]) ? ' и ВЕРСИЮ — это подсказка для атакующего, лучше скрыть версию' : ''}.` },
  { pattern: /^x-powered-by:/i, text: 'x-powered-by выдаёт, на чём написан сайт (Express, PHP…). Лишняя информация — отключи.' },
  { pattern: /^strict-transport-security:/i, text: 'HSTS: браузер всегда ходит на сайт только по https. Хорошо.' },
  { pattern: /^content-security-policy:/i, text: 'CSP: ограничивает, откуда страница может грузить скрипты. Сильная защита от внедрения чужого кода (XSS).' },
  { pattern: /^x-frame-options:/i, text: 'Защита от встраивания твоего сайта в чужую страницу (clickjacking).' },
  { pattern: /^x-content-type-options:\s*nosniff/i, text: 'nosniff: браузер не «угадывает» тип файла — меньше путаницы и подмены. Хорошо.' },
  { pattern: /^location:\s*(.+)/i, text: (m) => `Редирект на ${m[1]}. Для http-адреса ждём перехода на https.` },
  { pattern: /^set-cookie:/i, text: 'Cookie. Для входа на сайт должны быть флаги Secure и HttpOnly.' },
  // dig +short
  { pattern: /"v=spf1\b/, text: 'SPF: список серверов, которым можно слать почту от имени этого домена. Чем строже (-all), тем лучше.' },
  { pattern: /"v=DMARC1\b/, text: 'DMARC: что делать с письмами, которые подделали под этот домен. p=reject — строже всего.' },
  { pattern: /^notBefore=/, text: 'Сертификат действует С этой даты.' },
  { pattern: /^notAfter=(.+)/, text: (m) => { const d = daysLeft(m[1]); return `Сертификат действует ДО этой даты${d === null ? '' : `: осталось ${d} дн.`} Не забудь продлить.` } },
  { pattern: /^\s*(?:Registry Expiry Date|paid-till|Expiry date):\s*(\S+)/i, text: (m) => { const d = daysLeft(m[1]); return `Домен оплачен до этой даты${d === null ? '' : ` (осталось ${d} дн.)`}. Не продлишь — потеряешь сайт и почту.` } },
  { pattern: /^\s*Registrar:/i, text: 'Регистратор: компания, у которой куплен домен. Продлевать нужно там.' },
  { pattern: /^\s*Name Server:/i, text: 'Серверы имён (NS): они отвечают, на какой IP ведёт домен.' },
]

export function siteAnalyze(text: string): Finding[] {
  const out: Finding[] = []

  // HTTP-заголовки (curl -I)
  if (/^HTTP\/[\d.]+\s+\d{3}/m.test(text)) {
    const has = (h: string) => new RegExp(`^${h}:`, 'im').test(text)
    const code = text.match(/^HTTP\/[\d.]+\s+(\d{3})/m)![1]
    out.push({ tone: 'info', text: `Код ответа ${code}: ${STATUS[code] ?? 'см. значение кода HTTP'}.` })
    // HSTS и CSP важны для сайтов по https (curl отвечает HTTP/2); для устройства в домашней сети по http они не нужны
    const https = /^HTTP\/2/m.test(text)
    const redirect = code === '301' || code === '302'
    if (has('strict-transport-security')) out.push({ tone: 'good', text: 'HSTS включён: браузеры ходят на сайт только по https.' })
    else if (https && !redirect) out.push({ tone: 'warn', text: 'Нет заголовка Strict-Transport-Security (HSTS). Добавь его, чтобы браузер не открывал сайт по http.' })
    if (https && !redirect && !has('content-security-policy')) out.push({ tone: 'info', text: 'Нет Content-Security-Policy. Это сильная защита от внедрения скриптов — стоит настроить.' })
    if (https && code === '200' && !has('x-content-type-options')) out.push({ tone: 'info', text: 'Нет X-Content-Type-Options: nosniff — добавь, это одна строка в настройках.' })
    if (!https && code === '200') out.push({ tone: 'info', text: 'Ответ по обычному http, без шифрования. Для устройства в домашней сети это нормально, для сайта в интернете нужен https.' })
    const server = text.match(/^server:\s*(.+)/im)?.[1]
    if (server && /\d/.test(server)) out.push({ tone: 'warn', text: `Сервер раскрывает версию (${server.trim()}). Скрой её в настройках: так сложнее подобрать готовую атаку.` })
    const pb = text.match(/^x-powered-by:\s*(.+)/im)?.[1]
    if (pb) out.push({ tone: 'warn', text: `x-powered-by: ${pb.trim()} — выдаёт технологию сайта. Отключи этот заголовок.` })
    if (/^location:\s*https:/im.test(text) && /^HTTP\/[\d.]+\s+30[12]/m.test(text)) out.push({ tone: 'good', text: 'Редирект на https работает.' })
  }

  // DNS: почтовая защита домена
  if (/"v=spf1/.test(text)) out.push({ tone: /-all/.test(text) ? 'good' : 'info', text: /-all/.test(text) ? 'SPF есть и строгий (-all).' : 'SPF есть, но мягкий (~all или ?all). Со временем лучше сделать строгим (-all).' })
  if (/"v=DMARC1/.test(text)) out.push({ tone: /p=(reject|quarantine)/.test(text) ? 'good' : 'info', text: /p=(reject|quarantine)/.test(text) ? 'DMARC есть и действует (reject/quarantine).' : 'DMARC есть, но p=none — только наблюдает. Когда убедишься, что всё работает, переключи на quarantine или reject.' })

  // Сертификат
  const na = text.match(/^notAfter=(.+)$/m)
  if (na) {
    const d = daysLeft(na[1])
    if (d !== null) out.push({ tone: d < 14 ? 'warn' : d < 30 ? 'info' : 'good', text: d < 0 ? 'Сертификат уже просрочен! Браузеры показывают посетителям предупреждение — продли сегодня.' : `Сертификат действует ещё ${d} дн.${d < 30 ? ' Пора продлевать.' : ''}`, situationId: d < 30 ? 'cert-expiry' : undefined })
  }

  // Срок домена (whois)
  const ex = text.match(/(?:Registry Expiry Date|paid-till|Expiry date):\s*(\S+)/i)
  if (ex) {
    const d = daysLeft(ex[1])
    if (d !== null) out.push({ tone: d < 60 ? 'warn' : 'good', text: d < 0 ? 'Срок домена истёк! Срочно продли у регистратора.' : `Домен оплачен ещё на ${d} дн.${d < 60 ? ' Продли заранее, пока не поздно.' : ''}` })
  }
  return out
}
