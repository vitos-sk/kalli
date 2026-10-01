import { Radar } from 'lucide-react'
import { PortScanTool } from '@/tools/PortScanTool'
import type { BranchConfig, LineHint } from './types'

// Что обычно живёт на частых портах — для подсказок по строкам
const PORTS: Record<string, string> = {
  '21': 'FTP — передача файлов',
  '22': 'SSH — вход в управление сервером',
  '25': 'SMTP — почтовый сервер',
  '53': 'DNS — «телефонная книга» интернета',
  '80': 'обычный сайт (HTTP)',
  '443': 'сайт по защищённому каналу (HTTPS)',
  '3306': 'база данных MySQL',
  '3389': 'удалённый рабочий стол Windows',
  '9929': 'nping-echo — служба тестовой мишени scanme, на реальных серверах её почти не бывает',
}

const lineHints: LineHint[] = [
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

const config: BranchConfig = {
  id: 'port-scanning',
  title: 'Сканирование портов',
  icon: Radar,
  order: 10,
  tool: PortScanTool,
  keywords: ['nmap', 'порт', 'порты', 'скан', 'сканер', 'пинг', 'ping', 'файрвол', 'firewall', 'filtered', 'host down', 'хост не отвечает', 'открытые двери', 'версии', 'службы', 'ssh', 'mysql', 'rdp', 'разведка'],
  lineHints,

  guide: `## Что это

Представь здание. IP или домен — это здание, порты — это двери (их около 65 тысяч). За каждой открытой дверью сидит служба. Сканирование — это обойти двери и постучать: какие открыты, какие заперты.

## Что вводим

Инструмент — **nmap**, терминальная штука (в браузере не работает — тут нужен терминал). Вводим IP или домен цели.

Двери в лицо:

- **22** — SSH (вход в управление сервером)
- **80** — сайт
- **443** — сайт по защищённому
- **3306** — база MySQL
- **3389** — удалённый стол Windows

## Как читать вывод

У каждой двери одно из трёх:

- **open** — открыта, за ней служба. Самое интересное.
- **closed** — есть, но за ней никого.
- **filtered** — перед дверью охранник (файрвол), не видно, открыта ли.

Частые расклады:

- Открыты 22, 80, 443 → обычный веб-сервер: есть сайт и вход по SSH.
- Открыт только 443 → хорошо запертый сервер, светит минимум.
- Всё filtered → файрвол рубит всё, цель за охраной. Для защищённой цели это норма.
- "Host seems down" → цель молчит, часто она жива, просто блокирует пинг. Добавь флаг \`-Pn\`.`,

  commands: [
    {
      label: 'Базовый обход',
      cmd: 'nmap scanme.nmap.org',
      note: 'scanme.nmap.org — официальная учебная мишень, её разрешено сканировать',
      flags: [{ flag: 'scanme.nmap.org', text: 'Цель сканирования: домен или IP. Эту мишень проект nmap специально держит для тренировок.' }],
    },
    {
      label: 'Стучать, даже если молчит',
      cmd: 'nmap -Pn <ip>',
      note: 'обходит блокировку пинга',
      flags: [{ flag: '-Pn', text: 'Не проверять пингом, жив ли хост, а сразу стучать в порты. Нужно, когда пишет «Host seems down», а цель на самом деле жива.' }],
    },
    {
      label: 'Все 65 тысяч дверей',
      cmd: 'nmap -p- <ip>',
      note: 'не только частые порты',
      flags: [{ flag: '-p-', text: 'Все порты с 1 по 65535. По умолчанию nmap смотрит только 1000 самых частых. Медленнее, зато ничего не пропустишь.' }],
    },
    {
      label: 'Узнать версии служб',
      cmd: 'nmap -sV <ip>',
      note: 'какая служба и версия за дверью — мостик к поиску уязвимостей',
      flags: [{ flag: '-sV', text: 'Спросить у каждой открытой двери, что за программа там сидит и какой версии. По версии потом ищут известные уязвимости.' }],
    },
  ],

  terminalSample: `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for scanme.nmap.org (45.33.32.156)
Host is up (0.089s latency).
Not shown: 996 closed tcp ports
PORT     STATE    SERVICE
22/tcp   open     ssh
80/tcp   open     http
443/tcp  closed   https
9929/tcp open     nping-echo
Nmap done: 1 IP address (1 host up) scanned in 1.82s`,

  samples: [
    { id: 'scanme', label: 'Учебная мишень scanme', text: `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for scanme.nmap.org (45.33.32.156)
Host is up (0.089s latency).
Not shown: 996 closed tcp ports
PORT     STATE    SERVICE
22/tcp   open     ssh
80/tcp   open     http
443/tcp  closed   https
9929/tcp open     nping-echo
Nmap done: 1 IP address (1 host up) scanned in 1.82s` },
    { id: 'web', label: 'Обычный веб-сервер', text: `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for shop.example.test (203.0.113.40)
Host is up (0.031s latency).
Not shown: 997 closed tcp ports
PORT    STATE SERVICE
22/tcp  open  ssh
80/tcp  open  http
443/tcp open  https
Nmap done: 1 IP address (1 host up) scanned in 1.44s` },
    { id: 'only443', label: 'Заперт, виден только 443', text: `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for example.test (203.0.113.25)
Host is up (0.045s latency).
Not shown: 999 filtered tcp ports (no-response)
PORT    STATE SERVICE
443/tcp open  https
Nmap done: 1 IP address (1 host up) scanned in 4.97s` },
    { id: 'filtered', label: 'Всё filtered', text: `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for 203.0.113.10
Host is up (0.120s latency).
All 1000 scanned ports on 203.0.113.10 are in state: filtered
Nmap done: 1 IP address (1 host up) scanned in 21.40s` },
    { id: 'down', label: 'Host seems down', text: `Starting Nmap 7.94 ( https://nmap.org )
Note: Host seems down. If it is really up, but blocking our ping probes, try -Pn
Nmap done: 1 IP address (0 hosts up) scanned in 3.12s` },
  ],
}

export default config
