import type { Finding, LineHint } from '@/branches/types'

// Что обычно живёт на частых портах — для подсказок по строкам
export const PORTS: Record<string, string> = {
  '21': 'FTP — передача файлов',
  '22': 'SSH — вход в управление сервером',
  '23': 'Telnet — старый вход без шифрования. На роутере и серверах его быть не должно: отключи',
  '25': 'SMTP — почтовый сервер',
  '53': 'DNS — «телефонная книга» интернета',
  '80': 'обычный сайт (HTTP)',
  '443': 'сайт по защищённому каналу (HTTPS)',
  '3306': 'база данных MySQL',
  '3389': 'удалённый рабочий стол Windows',
  '5432': 'база данных PostgreSQL',
  '6379': 'Redis — хранилище в памяти, наружу открывать нельзя',
  '7547': 'TR-069 — удалённое управление роутером провайдером',
  '8080': 'альтернативный порт сайта или панели управления',
  '9929': 'nping-echo — служба тестовой мишени scanme, на реальных серверах её почти не бывает',
}

// Разбор вставленного вывода nmap: частые расклады из гайда
export function nmapAnalyze(text: string): Finding[] {
  const out: Finding[] = []
  if (/Host seems down/i.test(text)) {
    out.push({ tone: 'warn', text: 'Цель не ответила на пинг. Она может быть жива и просто блокировать его — повтори с флагом -Pn.', situationId: 'host-down' })
  }
  if (/are in state: filtered/i.test(text)) {
    out.push({ tone: 'info', text: 'Все порты filtered: цель за файрволом. Для защищённой цели это норма.', situationId: 'all-filtered' })
  }
  // несколько устройств в одном выводе (поиск по сети) разбирает discoverAnalyze
  const multi = (text.match(/^Nmap scan report for/gm) ?? []).length > 1
  const ports = multi ? [] : [...text.matchAll(/^(\d+)\/(?:tcp|udp)\s+open\s+\S+/gm)].map((m) => m[1])
  if (ports.length) {
    out.push({ tone: 'info', text: `Открытых портов: ${ports.length} (${ports.join(', ')}). За каждым сидит служба.` })
    if (ports.length === 1 && ports[0] === '443') {
      out.push({ tone: 'good', text: 'Виден только 443 — хорошо запертый сервер, светит минимум.' })
    } else if (['22', '80', '443'].every((p) => ports.includes(p))) {
      out.push({ tone: 'info', text: 'Открыты 22, 80 и 443 — обычный веб-сервер: есть сайт и вход по SSH.' })
    }
    if (ports.includes('3306')) out.push({ tone: 'warn', text: 'MySQL (3306) виден снаружи. Базе данных обычно не место в открытом интернете.' })
    if (ports.includes('3389')) out.push({ tone: 'warn', text: 'Удалённый стол Windows (3389) открыт наружу — частая цель. На своём сервере закрой или спрячь за VPN.' })
    if (ports.includes('21') || ports.includes('23')) out.push({ tone: 'warn', text: 'FTP/Telnet передают данные открытым текстом — лучше заменить на защищённые аналоги.' })
    out.push({ tone: 'info', text: 'Следующий шаг: узнай версии служб на открытых портах.', situationId: 'found-open' })
  } else if (/are in state: closed/.test(text)) {
    out.push({ tone: 'good', text: 'Открытых портов не видно.' })
  }
  return out
}

export const nmapHints: LineHint[] = [
  { pattern: /^Starting Nmap/, text: 'Шапка: nmap запустился. Версия программы в скобках — просто информация.' },
  { pattern: /^Nmap scan report for (\S+)(?: \(([\d.]+)\))?/, text: (m) => `Кого сканируем: ${m[1]}${m[2] ? ' → IP ' + m[2] : ''}. Дальше идёт всё, что нашли у этой цели.` },
  { pattern: /^Host is up/, text: 'Хост отвечает — «здание» на месте. В скобках задержка: чем меньше, тем ближе цель.' },
  { pattern: /^Note: Host seems down/, text: 'Цель молчит. Часто она жива и просто блокирует пинг. Повтори с флагом -Pn.' },
  { pattern: /^All (\d+) scanned ports .* filtered/, text: (m) => `Все ${m[1]} проверенных портов filtered: файрвол рубит всё. Для защищённой цели это норма.` },
  { pattern: /^Not shown: (\d+) (closed|filtered)/, text: (m) => `${m[1]} портов в состоянии ${m[2]} — nmap их не печатает, чтобы не засорять вывод. Самое важное — в таблице ниже.` },
  { pattern: /^PORT\s+STATE/, text: 'Шапка таблицы: PORT — номер двери и протокол, STATE — открыта ли, SERVICE — какая служба за ней.' },
  { pattern: /^(\d+)\/(?:tcp|udp)\s+open\s+(\S+)/, text: (m) => `Порт ${m[1]} ОТКРЫТ (${m[2]}). ${PORTS[m[1]] ?? 'Служба слушает — это самое интересное, смотри её версию флагом -sV.'}` },
  { pattern: /^(\d+)\/(?:tcp|udp)\s+closed/, text: (m) => `Порт ${m[1]} закрыт: дверь есть, но за ней никого. Атаковать тут нечего.` },
  { pattern: /^(\d+)\/(?:tcp|udp)\s+filtered/, text: (m) => `Порт ${m[1]} filtered: перед дверью охранник (файрвол), открыта ли она — не видно.` },
  { pattern: /^Nmap done/, text: 'Итог: сколько адресов проверили, сколько оказались живыми и за сколько секунд.' },
]
