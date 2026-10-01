import type { Finding, LineHint } from '@/branches/types'

// ---------- ifconfig / ipconfig / ip a ----------

// Маска → длина префикса: 0xffffff00 / 255.255.255.0 → 24
function prefixOf(mask: string): number {
  let n: number
  if (mask.startsWith('0x')) n = parseInt(mask, 16)
  else n = mask.split('.').reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0
  return n.toString(2).replace(/0/g, '').length
}

const IFACE_INFO: [RegExp, string][] = [
  [/^lo\d*$/, '«я сам» (петля, localhost). Тебе не сюда.'],
  [/^en0$/, 'обычно Wi-Fi или сетевая карта Mac. Если интерфейс active — твой IP в этом блоке.'],
  [/^en\d+$/, 'дополнительный сетевой интерфейс (кабель, Thunderbolt, мост). Чаще всего неактивен — пропусти.'],
  [/^(wlan\d+|eth\d+|enp\w+|wlp\w+)$/, 'сетевая карта (Wi-Fi или кабель). Смотри, есть ли внутри inet.'],
  [/^utun\d+$/, 'служебный туннель (VPN, iCloud и т. п.). Пропусти.'],
  [/^(awdl\d+|llw\d+)$/, 'служебный Wi-Fi между устройствами Apple (AirDrop). Пропусти.'],
  [/^bridge\d+$/, 'мост (Thunderbolt, виртуалки). Пропусти, если неактивен.'],
  [/^(anpi\d+|ap\d+|gif\d+|stf\d+)$/, 'служебный интерфейс системы. Пропусти.'],
  [/^(docker\d*|br-\w+|veth\w+|virbr\d+)$/, 'сеть Docker / виртуалок на этом компьютере. Не твой адрес в домашней сети.'],
]

// Порты баз и служб: если они слушают всю сеть — это плохо
const SENSITIVE: Record<string, string> = {
  '3306': 'MySQL', '5432': 'PostgreSQL', '6379': 'Redis', '27017': 'MongoDB', '9200': 'Elasticsearch', '11211': 'Memcached', '5984': 'CouchDB',
}

const isAll = (h: string) => h === '*' || h === '0.0.0.0' || h === '[::]' || h === '::'
const isLocal = (h: string) => h === '127.0.0.1' || h === 'localhost' || h === '[::1]' || h === '::1' || h.startsWith('127.')

function listenText(host: string, port: string): string {
  const db = SENSITIVE[port]
  if (isLocal(host)) return `Порт ${port}: слушает только твой компьютер (${host}). Снаружи его не видно — это нормально.`
  if (isAll(host)) {
    return `Порт ${port}: слушает ВСЕ интерфейсы — к нему может подключиться любой в твоей сети.${db ? ` Это ${db}: базе наружу быть не стоит, привяжи её к 127.0.0.1.` : ' Если это твой dev-сервер, запусти его на localhost (127.0.0.1).'}`
  }
  return `Порт ${port}: слушает адрес ${host}, доступен по этому адресу.`
}

export const netHints: LineHint[] = [
  // route -n get default (Mac)
  { pattern: /^\s*gateway:\s*(\S+)/, text: (m) => `gateway — это шлюз, то есть ТВОЙ РОУТЕР: ${m[1]}. Это и искали. Его адрес можно открыть в браузере — там панель роутера.` },
  { pattern: /^\s*interface:\s*(\S+)/, text: (m) => `interface — через какой сетевой интерфейс идёт связь (${m[1]}${m[1] === 'en0' ? ': обычно Wi-Fi или кабель Mac' : ''}).` },
  { pattern: /^\s*route to:/, text: 'Какой маршрут спрашивали. default — «всё, что не в моей сети», то есть путь в интернет.' },
  { pattern: /^\s*(destination|mask):/, text: 'Для маршрута по умолчанию тут просто «default». Это не адрес — пропусти.' },
  { pattern: /^\s*flags:\s*</, text: 'Служебные флаги маршрута. Для новичка можно пропустить.' },
  { pattern: /^\s*recvpipe\b/, text: 'Служебная таблица со счётчиками. Можно пропустить.' },
  { pattern: /^\s*0\s+0\s+0\s+0\s+0\s+0\s+\d+\s+0\s*$/, text: 'Значения служебной таблицы. mtu 1500 — обычный размер пакета. Пропусти.' },
  // route / ip route на Linux и Windows
  { pattern: /^default via (\d+\.\d+\.\d+\.\d+) dev (\S+)/, text: (m) => `default via — маршрут по умолчанию идёт через ${m[1]}. Это ТВОЙ РОУТЕР (интерфейс ${m[2]}).` },
  { pattern: /^\s*0\.0\.0\.0\s+0\.0\.0\.0\s+(\d+\.\d+\.\d+\.\d+)/, text: (m) => `Маршрут по умолчанию через ${m[1]} — это ТВОЙ РОУТЕР.` },
  // ping
  { pattern: /^PING (\S+)/, text: (m) => `Начало: проверяем, отвечает ли ${m[1]}.` },
  { pattern: /bytes from (\S+?):.*time[=<]([\d.]+)\s*ms/, text: (m) => `Ответ от ${m[1]} за ${m[2]} мс. Меньше 20 мс — рядом (домашняя сеть), 20–100 — нормально, больше 200 — медленно.` },
  { pattern: /(\d+(?:\.\d+)?)% packet loss|\((\d+)%\s*(?:loss|потер)/i, text: (m) => ((m[1] ?? m[2]) === '0' || (m[1] ?? m[2]) === '0.0' ? 'Потерь нет: устройство отвечает на каждый запрос. Хорошо.' : `Потеряно ${m[1] ?? m[2]}% запросов. Если 100% — устройство молчит или блокирует пинг (это не всегда значит, что оно выключено).`) },
  { pattern: /^(round-trip|rtt)\b/, text: 'Итог по времени: минимум / среднее / максимум / разброс (мс).' },
  // ifconfig: заголовок интерфейса
  {
    pattern: /^([a-z][\w-]*\d*):\s+flags=/,
    text: (m) => `Интерфейс ${m[1]} — ${IFACE_INFO.find(([re]) => re.test(m[1]))?.[1] ?? 'сетевой интерфейс. Смотри, есть ли внутри inet и status: active.'}`,
  },
  // ip a: заголовок «2: eth0: <...>»
  { pattern: /^\d+:\s+(\S+):\s+<[^>]*>/, text: (m) => `Интерфейс ${m[1]} — ${IFACE_INFO.find(([re]) => re.test(m[1]))?.[1] ?? 'сетевой интерфейс. Смотри, есть ли внутри inet.'}` },
  { pattern: /^\s*inet\s+127\./, text: 'Это ты сам (localhost). Не твой адрес в сети.' },
  {
    pattern: /^\s*inet\s+(\d+\.\d+\.\d+\.\d+)\s+netmask\s+(\S+)/,
    text: (m) => `ТВОЙ IPv4-адрес в сети: ${m[1]} — это то, что искали. Маска даёт сеть /${prefixOf(m[2])}${prefixOf(m[2]) === 24 ? ' (до 254 устройств)' : ''}.`,
  },
  { pattern: /^\s*inet\s+(\d+\.\d+\.\d+\.\d+)\/(\d+)/, text: (m) => `ТВОЙ IPv4-адрес: ${m[1]}, сеть /${m[2]}${m[2] === '24' ? ' (до 254 устройств)' : ''}. Это то, что искали.` },
  { pattern: /^\s*inet6\b/, text: 'IPv6-адрес (длинный, с двоеточиями). Для начала можно игнорировать — ищи строку inet с цифрами и точками.' },
  { pattern: /^\s*status:\s*inactive/, text: 'Интерфейс не подключён — пропусти этот блок.' },
  { pattern: /^\s*status:\s*active/, text: 'Интерфейс подключён и работает. Твой IP ищи в этом блоке.' },
  { pattern: /^\s*ether\s/, text: 'MAC-адрес — «серийный номер» сетевой карты. Это не IP.' },
  // Windows ipconfig
  { pattern: /IPv4/, text: 'ТВОЙ IPv4-адрес в сети — это то, что искали.' },
  { pattern: /(Default Gateway|Основной шлюз)/, text: 'Шлюз — это твой роутер. Его адрес пригодится для проверки роутера.' },
  { pattern: /(Subnet Mask|Маска подсети)/, text: 'Маска подсети: 255.255.255.0 значит сеть /24, до 254 устройств.' },
  // lsof / ss: слушающие порты
  { pattern: /^COMMAND\s+PID/, text: 'Шапка: COMMAND — программа, PID — номер процесса, NAME — адрес и порт, на котором она слушает.' },
  { pattern: /TCP\s+(\S+):(\d+)\s+\(LISTEN\)/, text: (m) => listenText(m[1], m[2]) },
  { pattern: /^LISTEN\s+\d+\s+\d+\s+(\S+):(\d+)/, text: (m) => listenText(m[1], m[2]) },
  { pattern: /^State\s+Recv-Q/, text: 'Шапка ss: Local Address:Port — где слушает программа. 127.0.0.1 — только ты, 0.0.0.0 или * — вся сеть.' },
  // nmap -sn: поиск устройств
  {
    pattern: /^Nmap done: (\d+) IP addresses? \((\d+) hosts? up\)/,
    text: (m) => `Проверил ${m[1]} адресов, живых ${m[2]}. Каждое живое — устройство в сети: роутер, телефоны, ТВ. Незнакомое — повод разобраться.`,
  },
]

interface Net { ip: string; prefix: number; iface?: string; gateway?: string }

// Достаём из ifconfig / ipconfig / ip a активные IPv4-адреса (без localhost и служебных)
function parseNets(text: string): { nets: Net[]; skipped: string[] } {
  const nets: Net[] = []
  const skipped: string[] = []
  // ifconfig (mac/bsd): блоки по заголовку «name: flags=»
  const blocks = text.split(/^(?=[a-z][\w-]*\d*:\s+flags=)/m).filter((b) => /^[a-z][\w-]*\d*:\s+flags=/.test(b))
  for (const b of blocks) {
    const name = b.match(/^([\w-]+):/)![1]
    const inet = b.match(/^\s*inet\s+(\d+\.\d+\.\d+\.\d+)\s+netmask\s+(\S+)/m)
    const inactive = /status:\s*inactive/.test(b)
    if (inet && !inet[1].startsWith('127.') && !inet[1].startsWith('169.254.') && !inactive) nets.push({ ip: inet[1], prefix: prefixOf(inet[2]), iface: name })
    else skipped.push(name)
  }
  // ip a (linux)
  if (!blocks.length) {
    let cur = ''
    for (const line of text.split('\n')) {
      const h = line.match(/^\d+:\s+(\S+?):/)
      if (h) cur = h[1]
      const i = line.match(/^\s*inet\s+(\d+\.\d+\.\d+\.\d+)\/(\d+)/)
      if (i && !i[1].startsWith('127.') && !i[1].startsWith('169.254.')) nets.push({ ip: i[1], prefix: Number(i[2]), iface: cur })
      else if (h && !/\bUP\b/.test(line)) skipped.push(cur)
    }
  }
  // Windows ipconfig
  if (!nets.length) {
    const gw = text.match(/(?:Default Gateway|Основной шлюз)[ .]*:\s*(\d+\.\d+\.\d+\.\d+)/)?.[1]
    for (const m of text.matchAll(/IPv4[^:\n]*:\s*(\d+\.\d+\.\d+\.\d+)/g)) {
      const mask = text.slice(m.index).match(/(?:Subnet Mask|Маска подсети)[ .]*:\s*(\d+\.\d+\.\d+\.\d+)/)?.[1]
      nets.push({ ip: m[1], prefix: mask ? prefixOf(mask) : 24, gateway: gw })
    }
  }
  return { nets, skipped }
}

export function netAnalyze(text: string): Finding[] {
  const out: Finding[] = []

  // 1. свой IP
  // именно ifconfig / ip a / ipconfig, а не слово IPv4 из столбца TYPE у lsof
  if (/flags=\d|^\d+:\s+\S+:\s+<|IPv4[^\n:]*:\s*\d+\.\d+\.\d+\.\d+/m.test(text)) {
    const { nets, skipped } = parseNets(text)
    if (nets.length === 0) {
      out.push({ tone: 'warn', text: 'Не нашёл активный IPv4-адрес. Возможно, нет подключения к сети. Проверь Wi-Fi или кабель и повтори команду.' })
    }
    for (const n of nets) {
      const base = n.ip.split('.').slice(0, 3).join('.')
      const gw = n.gateway ?? `${base}.1`
      out.push({
        tone: 'good',
        text: `Твой IP в сети: ${n.ip}${n.iface ? ` (интерфейс ${n.iface})` : ''}. Это адрес твоего устройства внутри дома.`,
        actions: [{ label: `цель: мой IP ${n.ip}`, target: n.ip }],
      })
      out.push({
        tone: 'info',
        text: `Твоя сеть: ${base}.0/${n.prefix}${n.prefix === 24 ? ' (до 254 устройств)' : ''}. Роутер, скорее всего, ${gw}${n.gateway ? '' : ' (обычно это адрес с .1 на конце — точный покажет команда ниже)'}.`,
        actions: [{ label: `цель: роутер ${gw}`, target: gw }],
        situationId: 'router-ip',
      })
    }
    if (skipped.length) {
      const list = [...new Set(skipped)].slice(0, 6).join(', ')
      out.push({ tone: 'info', text: `Остальные интерфейсы (${list}…) — служебные: «я сам», VPN-туннели, AirDrop, мосты. Их можно игнорировать.` })
    }
    if (nets.length) out.push({ tone: 'info', text: 'Следующий шаг: посмотри, какие устройства есть в твоей сети.', situationId: 'find-devices' })
  }

  // 1b. маршрут по умолчанию → роутер
  const gw =
    text.match(/^\s*gateway:\s*(\d+\.\d+\.\d+\.\d+)/m)?.[1] ??
    text.match(/^default via (\d+\.\d+\.\d+\.\d+)/m)?.[1] ??
    text.match(/^\s*0\.0\.0\.0\s+0\.0\.0\.0\s+(\d+\.\d+\.\d+\.\d+)/m)?.[1]
  if (gw) {
    const iface = text.match(/^\s*interface:\s*(\S+)/m)?.[1] ?? text.match(/^default via \S+ dev (\S+)/m)?.[1]
    out.push({
      tone: 'good',
      text: `Твой роутер (шлюз): ${gw}${iface ? `, связь через ${iface}` : ''}. Через него весь трафик уходит в интернет. Открой этот адрес в браузере — там панель роутера.`,
      actions: [{ label: `цель: роутер ${gw}`, target: gw }],
    })
    out.push({ tone: 'info', text: 'Следующий шаг: проверь, что у роутера открыто снаружи. Telnet (порт 23) быть не должно.', situationId: 'router-open' })
  }

  // 1c. ping
  const loss = text.match(/(\d+(?:\.\d+)?)% packet loss/)?.[1] ?? text.match(/\((\d+)%\s*(?:loss|потер)/i)?.[1]
  if (loss !== undefined) {
    const n = Number(loss)
    const avg = text.match(/=\s*[\d.]+\/([\d.]+)\//)?.[1]
    if (n === 0) out.push({ tone: 'good', text: `Устройство отвечает без потерь${avg ? `, в среднем ${avg} мс` : ''}.${avg && Number(avg) < 20 ? ' Меньше 20 мс — оно рядом, в твоей сети.' : ''}` })
    else if (n === 100) out.push({ tone: 'warn', text: 'Ни один запрос не вернулся. Устройство выключено, адрес неверный или оно блокирует пинг. Если уверен, что оно работает, проверяй порты с флагом -Pn.', situationId: 'host-down' })
    else out.push({ tone: 'warn', text: `Потеряно ${n}% запросов — связь нестабильна (слабый Wi-Fi, перегруженная сеть).` })
  }

  // 2. слушающие порты (lsof / ss)
  const listens = [
    ...[...text.matchAll(/TCP\s+(\S+):(\d+)\s+\(LISTEN\)/g)].map((m) => ({ host: m[1], port: m[2] })),
    ...[...text.matchAll(/^LISTEN\s+\d+\s+\d+\s+(\S+):(\d+)/gm)].map((m) => ({ host: m[1], port: m[2] })),
  ]
  if (listens.length) {
    const exposed = listens.filter((l) => isAll(l.host))
    const local = listens.filter((l) => isLocal(l.host))
    if (local.length) out.push({ tone: 'good', text: `Только для твоего компьютера (localhost): порты ${[...new Set(local.map((l) => l.port))].join(', ')}. Снаружи не видны.` })
    if (exposed.length) {
      out.push({
        tone: 'warn',
        text: `Доступны всей сети: порты ${[...new Set(exposed.map((l) => l.port))].join(', ')}. Любое устройство в твоём Wi-Fi может к ним подключиться. Если это твои проекты — привяжи их к 127.0.0.1.`,
        situationId: 'exposed-port',
      })
      for (const l of exposed) {
        if (SENSITIVE[l.port]) out.push({ tone: 'warn', text: `${SENSITIVE[l.port]} (порт ${l.port}) слушает всю сеть. Базе данных там быть не должно — закрой или привяжи к localhost.` })
      }
    }
  }

  // 3. nmap -sn: устройства в сети
  const done = text.match(/Nmap done: (\d+) IP addresses? \((\d+) hosts? up\)/)
  if (done && !/^PORT\s+STATE/m.test(text)) {
    out.push({ tone: 'info', text: `В сети ${done[2]} живых устройств из ${done[1]} проверенных адресов. Сверь список с тем, что у тебя дома: роутер, телефоны, ТВ, компьютеры.` })
    out.push({ tone: 'warn', text: 'Незнакомое устройство? Смени пароль Wi-Fi, отключи WPS и посмотри список подключённых в панели роутера.', situationId: 'unknown-device' })
  }
  return out
}
