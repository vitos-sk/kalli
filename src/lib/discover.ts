import type { Finding, LineHint } from '@/branches/types'

// Что обычно живёт на этих портах в домашней сети и у разработчика
const DEVICE: Record<string, string> = {
  '22': 'SSH', '80': 'веб-панель', '443': 'веб-панель (https)', '445': 'общие папки SMB',
  '554': 'камера (RTSP)', '631': 'принтер (IPP)', '1883': 'MQTT (умный дом)', '3000': 'dev-сервер или API',
  '5000': 'API / NAS / AirPlay', '8000': 'API / dev', '8080': 'веб или API', '8123': 'Home Assistant',
  '8443': 'веб-панель (https)', '9100': 'принтер',
}

// По производителю сетевой карты (MAC) часто видно, что это за устройство
const VENDORS: [RegExp, string][] = [
  [/apple/i, 'iPhone, iPad или Mac.'],
  [/tp-?link/i, 'роутер, точка доступа или умная розетка.'],
  [/raspberry/i, 'Raspberry Pi — мини-компьютер (часто сервер или умный дом).'],
  [/espressif/i, 'чип ESP: «умные» лампочки, датчики и самодельные устройства.'],
  [/samsung/i, 'телефон, ТВ или бытовая техника.'],
  [/xiaomi/i, 'телефон или устройство умного дома.'],
  [/google/i, 'Chromecast, Nest или телефон Pixel.'],
  [/amazon/i, 'Echo, Kindle или Fire TV.'],
  [/intel/i, 'ноутбук или ПК (сетевая карта Intel).'],
  [/sonos/i, 'умная колонка Sonos.'],
  [/hikvision|dahua|reolink/i, 'IP-камера.'],
  [/hp|hewlett|canon|epson|brother/i, 'принтер или МФУ.'],
]

const vendorText = (v: string) => {
  if (/unknown/i.test(v)) return 'производитель не определён: часто это телефон со случайным («приватным») MAC. Сверь по времени подключения в панели роутера.'
  return `${VENDORS.find(([re]) => re.test(v))?.[1] ?? 'по названию фирмы можно догадаться, что это за устройство.'}`
}

const CODE: Record<string, string> = {
  '200': 'путь существует и отвечает без входа. Проверь, что там нет лишнего.',
  '301': 'редирект на другой адрес.',
  '302': 'временный редирект (часто на страницу входа).',
  '401': 'нужен вход (логин и пароль). Хорошо: путь защищён.',
  '403': 'доступ запрещён. Хорошо: путь закрыт.',
  '404': 'такого пути нет.',
  '405': 'путь есть, но не для этого метода запроса.',
  '500': 'ошибка внутри приложения.',
}

export const discoverHints: LineHint[] = [
  { pattern: /^MAC Address: ([0-9A-F:]{17}) \((.+)\)/i, text: (m) => `Производитель сетевой карты — ${m[2]}: ${vendorText(m[2])}` },
  {
    pattern: /^\S+\s+\((\d+\.\d+\.\d+\.\d+)\)\s+at\s+([0-9a-f:]+)/i,
    text: (m) => (/^ff:ff/i.test(m[2]) ? 'Служебный широковещательный адрес («всем сразу»). Это не устройство.' : `Устройство ${m[1]} с MAC ${m[2]}. Первые три пары символов MAC — производитель, по ним можно догадаться, что это.`),
  },
  { pattern: /^==\s+(\S+)/, text: (m) => `Проверяем путь ${m[1]} твоего API.` },
  { pattern: /^(200|301|302|401|403|404|405|500)$/, text: (m) => `Код ${m[1]}: ${CODE[m[1]]}` },
]

export function discoverAnalyze(text: string): Finding[] {
  const out: Finding[] = []

  // Несколько устройств в одном выводе nmap (поиск по сети)
  const parts = text.split(/^Nmap scan report for /m).slice(1)
  if (parts.length > 1) {
    const hosts = parts.map((p) => {
      const head = p.split('\n')[0]
      return {
        ip: head.match(/(\d+\.\d+\.\d+\.\d+)/)?.[1] ?? head.trim(),
        ports: [...p.matchAll(/^(\d+)\/(?:tcp|udp)\s+open\s+(\S+)/gm)].map((m) => ({ port: m[1], svc: m[2] })),
        mac: p.match(/^MAC Address: \S+ \((.+)\)/m)?.[1],
      }
    })
    const withPorts = hosts.filter((h) => h.ports.length)
    if (withPorts.length) {
      out.push({ tone: 'info', text: `Устройств с открытыми портами: ${withPorts.length} из ${hosts.length}. Вот карта:` })
      for (const h of withPorts) {
        out.push({ tone: 'info', text: `${h.ip}: ${h.ports.map((p) => `${p.port} (${DEVICE[p.port] ?? p.svc})`).join(', ')}` })
      }
    }
    const macs = hosts.filter((h) => h.mac)
    if (macs.length) {
      const count: Record<string, number> = {}
      for (const h of macs) count[h.mac!] = (count[h.mac!] ?? 0) + 1
      out.push({ tone: 'info', text: `Производители в сети: ${Object.entries(count).map(([v, n]) => `${v}${n > 1 ? ` ×${n}` : ''}`).join(', ')}. Каждое устройство должно быть тебе знакомо.` })
      if (macs.some((h) => /unknown/i.test(h.mac!))) out.push({ tone: 'info', text: 'Есть устройства с неопределённым производителем — часто это телефоны с приватным MAC.' })
    }
  }

  // Таблица соседей (arp -a)
  const arp = [...text.matchAll(/^\S+\s+\((\d+\.\d+\.\d+\.\d+)\)\s+at\s+([0-9a-f:]+)/gim)].filter((m) => !/^ff:ff/i.test(m[2]) && !/incomplete/i.test(m[2]))
  if (arp.length) {
    out.push({ tone: 'info', text: `В таблице соседей ${arp.length} устройств: ${arp.map((m) => m[1]).join(', ')}. Служебный адрес ff:ff:ff:ff:ff:ff не считается.` })
    out.push({ tone: 'info', text: 'Это только те, с кем компьютер недавно общался. Полный список даёт sudo nmap -sn. Первые три пары в MAC — производитель.', situationId: 'whats-this-device' })
  }

  // Предупреждения по типам устройств
  if (/^554\/tcp\s+open/m.test(text)) out.push({ tone: 'warn', text: 'Порт 554 (RTSP) — похоже на камеру. Проверь, что стоит пароль и что камера не доступна из интернета.' })
  if (/^1883\/tcp\s+open/m.test(text)) out.push({ tone: 'warn', text: 'Порт 1883 (MQTT) — брокер умного дома. Без пароля любой в сети читает показания и шлёт команды: включи авторизацию.' })
  if (/^(631|9100)\/tcp\s+open/m.test(text)) out.push({ tone: 'info', text: 'Найден принтер (631 / 9100). Проверь, что его веб-панель закрыта паролем.' })
  if (/^445\/tcp\s+open/m.test(text) && parts.length > 1) out.push({ tone: 'warn', text: 'Порт 445 (SMB, общие папки) открыт. Если папками не пользуешься — отключи.' })

  // Проверка типовых путей своего API: «== /путь», потом код
  const probes = [...text.matchAll(/^==\s+(\S+)\s*\n(\d{3})\s*$/gm)].map((m) => ({ path: m[1], code: m[2] }))
  if (probes.length) {
    const open = probes.filter((p) => p.code === '200').map((p) => p.path)
    const guarded = probes.filter((p) => p.code === '401' || p.code === '403').map((p) => p.path)
    if (open.length) out.push({ tone: 'info', text: `Отвечают без входа (200): ${open.join(', ')}. Это нормально для /health. А /docs и /openapi.json на публичном API лучше закрыть.` })
    if (guarded.length) out.push({ tone: 'good', text: `Защищены (401/403): ${guarded.join(', ')}. Так и должно быть.` })
    if (probes.some((p) => p.code === '500')) out.push({ tone: 'warn', text: 'Часть путей отвечает ошибкой 500 — посмотри логи приложения.' })
  }
  return out
}
