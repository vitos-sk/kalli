import type { Finding, LineHint } from '@/branches/types'

// Убираем цветовые escape-коды терминала — при копировании они иногда попадают в текст
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]/g
export const stripAnsi = (s: string) => s.replace(ANSI, '')

// Значки приглашения терминала: ❯ › » > $ % #
const PROMPT = /^\s*[❯›»>$%#]\s+(\S.*)$/

// Подсказки, которые работают для любого вставленного текста
export const genericHints: LineHint[] = [
  { pattern: PROMPT, text: (m) => `Это команда, которую ты запустил: ${m[1].replace(/\s{2,}.*$/, '').trim()}. Ниже — её результат.` },
  { pattern: /^\s*[❯›»>$%#]\s*$/, text: 'Пустое приглашение терминала: он ждёт новую команду. Не часть вывода.' },
  { pattern: /^\s*(?:\/|~)\S*(?:\s+\d+(?:\.\d+)?[smh])?\s*$/, text: 'Строка приглашения терминала: текущая папка (и сколько секунд шла прошлая команда). Это не часть вывода.' },
]

// Что делает команда и на что смотреть в её выводе
const COMMANDS: [RegExp, string, string][] = [
  [/^(ifconfig|ip\s+a(ddr)?|ipconfig)\b/, 'показывает сетевые интерфейсы и их адреса', 'Ищи блок со status: active и в нём inet 192.168.x.x (Windows: «IPv4-адрес») — это твой IP.'],
  [/^(route\b.*default|ip\s+route|netstat\s+-rn)/, 'показывает маршрут по умолчанию: куда уходит весь интернет-трафик', 'Ищи gateway (шлюз) — это адрес твоего роутера.'],
  [/^arp\b/, 'показывает таблицу «соседей»: IP и MAC устройств рядом', 'Первые три пары в MAC — фирма. ff:ff:ff:ff:ff:ff — служебный адрес, не устройство.'],
  [/^(sudo\s+)?nmap\b/, 'сканер: обходит порты и ищет устройства', 'Ищи строки open — это открытые «двери».'],
  [/lsof|^ss\b|netstat/, 'показывает, какие порты слушает компьютер', '127.0.0.1 — только ты, * или 0.0.0.0 — вся сеть.'],
  [/^curl\b/, 'делает запрос к сайту или API', 'Смотри код ответа (200, 301, 403…) и заголовки.'],
  [/^(dig|nslookup|host)\b/, 'спрашивает DNS, на какой IP ведёт домен', 'В ответе IP-адреса и записи: MX — почта, TXT — SPF и DMARC.'],
  [/^whois\b/, 'справка о домене', 'Ищи Registry Expiry Date — когда домен заканчивается.'],
  [/^ping\b/, 'проверяет, отвечает ли устройство', 'Смотри потери (packet loss) и время ответа (ms).'],
  [/^(traceroute|tracert)\b/, 'показывает путь пакетов до цели по шагам (хопам)', 'Звёздочки * — узел не ответил на проверку, это нормально.'],
  [/openssl/, 'читает сертификат сайта', 'notAfter — до какой даты он действует.'],
  [/^ndiff\b/, 'сравнивает два снимка nmap', 'Строки с «+» — новое, с «-» — пропало.'],
]

// Ищем в тексте строки приглашения и объясняем, что за команда запускалась
export function commandInfo(text: string): Finding[] {
  const out: Finding[] = []
  const seen = new Set<string>()
  for (const line of text.split('\n')) {
    const m = line.match(PROMPT)
    if (!m) continue
    const cmd = m[1].replace(/\s{2,}.*$/, '').trim()
    if (!cmd || seen.has(cmd)) continue
    seen.add(cmd)
    const info = COMMANDS.find(([re]) => re.test(cmd))
    if (info) out.push({ tone: 'info', text: `Ты запустил «${cmd}» — ${info[1]}. ${info[2]}` })
    if (out.length >= 3) break
  }
  return out
}

// Любой IP-адрес из текста: что это за адрес и можно ли подставить как цель
export function ipFinding(text: string): Finding[] {
  const ips = [...new Set([...text.matchAll(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/g)].map((m) => m[1]))]
    .filter((ip) => ip.split('.').every((o) => Number(o) <= 255) && !/^(255|0)\./.test(ip) && !/\.255$/.test(ip))
    .slice(0, 4)
  if (!ips.length) return []
  const kind = (ip: string) =>
    /^127\./.test(ip) ? 'это ты сам (localhost)'
    : /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip) ? 'домашний адрес, виден только внутри сети'
    : /^169\.254\./.test(ip) ? 'служебный адрес (сеть не настроена)'
    : 'адрес в интернете'
  return [{
    tone: 'info',
    text: `Адреса в тексте: ${ips.map((ip) => `${ip} — ${kind(ip)}`).join('; ')}. Любой можно подставить как цель.`,
    actions: ips.map((ip) => ({ label: `цель: ${ip}`, target: ip })),
  }]
}
