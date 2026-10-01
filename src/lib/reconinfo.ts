import type { Finding, LineHint } from '@/branches/types'

export const reconHints: LineHint[] = [
  // crt.sh (JSON с сертификатами) — оттуда достают поддомены
  { pattern: /"name_value":\s*"([^"]+)"/, text: (m) => `Имя из сертификата: ${m[1]}. Это поддомен, на который когда-то выпускали сертификат — он мог остаться рабочим.` },
  { pattern: /"common_name":/, text: 'Основное имя сертификата — то же самое, что и name_value, только без переносов.' },
  { pattern: /"issuer_name":/, text: 'Кто выпустил сертификат (центр сертификации). Для разведки не важно — пропусти.' },
  { pattern: /^\[\]$/, text: 'Пустой ответ: для этого домена в базе сертификатов ничего не нашлось.' },
  // Wayback Machine CDX API
  { pattern: /^(https?:\/\/\S+)\s/, text: (m) => `Адрес из архива интернета: ${m[1]}. Страница когда-то существовала — возможно, существует и сейчас, или в ней остались старые пути и параметры.` },
  { pattern: /web\.archive\.org\/web\/(\d{4})/, text: (m) => `Снимок сделан в ${m[1]} году.` },
  // подбор поддоменов по словарю
  { pattern: /^(\S+\.\S+)\.\s+\d+\s+IN\s+A\s+(\d+\.\d+\.\d+\.\d+)/, text: (m) => `Поддомен ${m[1]} существует и ведёт на ${m[2]}.` },
  { pattern: /^;;\s*connection timed out/i, text: 'Этот поддомен не ответил — скорее всего, его не существует.' },
]

// Разбор вывода crt.sh, Wayback CDX и перебора поддоменов: находим уникальные имена
export function reconAnalyze(text: string): Finding[] {
  const out: Finding[] = []

  // crt.sh: JSON-массив с полем name_value
  const certNames = [...new Set([...text.matchAll(/"name_value":\s*"([^"]+)"/g)].flatMap((m) => m[1].split('\n')))]
  if (certNames.length) {
    const clean = certNames.filter((n) => !n.startsWith('*.'))
    const wildcard = certNames.filter((n) => n.startsWith('*.'))
    out.push({ tone: 'info', text: `Найдено поддоменов в сертификатах: ${clean.length}. ${clean.slice(0, 12).join(', ')}${clean.length > 12 ? '…' : ''}` })
    if (wildcard.length) out.push({ tone: 'info', text: `Есть «звёздочные» записи (${wildcard.join(', ')}) — сертификат выпущен сразу на все поддомены. Это нормально, но не говорит, какие именно существуют.` })
    out.push({ tone: 'info', text: 'Следующий шаг: проверь, какие из найденных поддоменов отвечают на запрос, и просканируй их порты.', situationId: 'check-subdomains' })
  }

  // Wayback CDX: строки вида "url timestamp ..."
  const waybackUrls = [...new Set([...text.matchAll(/^(https?:\/\/\S+)/gm)].map((m) => m[1]))]
  if (waybackUrls.length > 1 && !certNames.length) {
    const admin = waybackUrls.filter((u) => /admin|login|api|backup|\.sql|\.env|config/i.test(u))
    out.push({ tone: 'info', text: `В архиве нашлось ${waybackUrls.length} адресов этого сайта за прошлые годы.` })
    if (admin.length) out.push({ tone: 'warn', text: `Среди них есть интересные: ${admin.slice(0, 8).join(', ')}. Проверь, не остались ли эти пути доступны сейчас — и не было ли забытой панели или конфигурационного файла.` })
  }

  // dig на список поддоменов: строки вида "sub.domain. 300 IN A 1.2.3.4"
  const resolved = [...text.matchAll(/^(\S+)\.\s+\d+\s+IN\s+A\s+(\d+\.\d+\.\d+\.\d+)/gm)]
  if (resolved.length) {
    out.push({ tone: 'good', text: `Из списка откликнулись: ${resolved.map((m) => `${m[1]} → ${m[2]}`).join(', ')}.` })
    out.push({ tone: 'info', text: 'Проверь, что на этих адресах работает — следующий шаг: сканирование портов.', situationId: 'check-subdomains' })
  }
  return out
}
