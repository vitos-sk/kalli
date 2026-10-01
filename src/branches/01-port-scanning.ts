import { Radar } from 'lucide-react'
import { PortScanTool } from '@/tools/PortScanTool'
import type { BranchConfig, Finding, LineHint } from './types'

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

// Разбор вставленного вывода nmap: частые расклады из гайда
function analyze(text: string): Finding[] {
  const out: Finding[] = []
  if (/Host seems down/i.test(text)) {
    out.push({ tone: 'warn', text: 'Цель не ответила на пинг. Она может быть жива и просто блокировать его — повтори с флагом -Pn.', situationId: 'host-down' })
  }
  if (/are in state: filtered/i.test(text)) {
    out.push({ tone: 'info', text: 'Все порты filtered: цель за файрволом. Для защищённой цели это норма.', situationId: 'all-filtered' })
  }
  const ports = [...text.matchAll(/^(\d+)\/(?:tcp|udp)\s+open\s+\S+/gm)].map((m) => m[1])
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
  } else if (/Nmap scan report|Host is up/.test(text) && !/filtered/.test(text)) {
    out.push({ tone: 'good', text: 'Открытых портов не видно.' })
  }
  return out
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
  keywords: ['nmap', 'порт', 'порты', 'скан', 'сканер', 'файрвол', 'firewall', 'filtered', 'открытые двери', 'службы', 'ssh', 'mysql', 'rdp', 'разведка'],
  lineHints,
  analyze,

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
      keywords: ['быстро', 'обзор', 'первый запуск', 'учебная мишень', 'с чего начать'],
      cmd: 'nmap scanme.nmap.org',
      note: 'scanme.nmap.org — официальная учебная мишень, её разрешено сканировать',
      flags: [{ flag: 'scanme.nmap.org', text: 'Цель сканирования: домен или IP. Эту мишень проект nmap специально держит для тренировок.' }],
    },
    {
      label: 'Стучать, даже если молчит',
      keywords: ['хост не отвечает', 'host seems down', 'host down', 'пинг заблокирован', 'не пингуется', 'молчит'],
      cmd: 'nmap -Pn <ip>',
      note: 'обходит блокировку пинга',
      flags: [{ flag: '-Pn', text: 'Не проверять пингом, жив ли хост, а сразу стучать в порты. Нужно, когда пишет «Host seems down», а цель на самом деле жива.' }],
    },
    {
      label: 'Все 65 тысяч дверей',
      keywords: ['все порты', 'полное сканирование', '65535', 'ничего не пропустить'],
      cmd: 'nmap -p- <ip>',
      note: 'не только частые порты',
      flags: [{ flag: '-p-', text: 'Все порты с 1 по 65535. По умолчанию nmap смотрит только 1000 самых частых. Медленнее, зато ничего не пропустишь.' }],
    },
    {
      label: 'Узнать версии служб',
      keywords: ['версия', 'версии', 'баннер', 'уязвимости', 'что за программа', 'service version'],
      cmd: 'nmap -sV <ip>',
      note: 'какая служба и версия за дверью — мостик к поиску уязвимостей',
      flags: [{ flag: '-sV', text: 'Спросить у каждой открытой двери, что за программа там сидит и какой версии. По версии потом ищут известные уязвимости.' }],
    },
    {
      label: 'Быстро, только частые порты',
      cmd: 'nmap -F <ip>',
      note: '100 самых популярных портов — для первого взгляда',
      keywords: ['быстро', 'долго', 'медленно', 'ускорить'],
      flags: [{ flag: '-F', text: 'Fast: проверить 100 самых частых портов вместо 1000. Быстро, но редкие порты не увидишь.' }],
    },
    {
      label: 'Сохранить результат в файл',
      cmd: 'nmap -oN scan.txt <ip>',
      note: 'текстовый файл scan.txt появится в текущей папке',
      keywords: ['сохранить', 'записать', 'отчёт', 'файл'],
      flags: [{ flag: '-oN', text: 'Output Normal: записать результат в обычном читаемом виде в указанный файл.' }],
    },
  ],

  situations: [
    { id: 'host-down', title: 'Пишет «Host seems down»', answer: 'Цель молчит на пинг. Чаще всего она жива, просто блокирует ping. Скажи nmap не проверять пингом и сразу стучать в порты.', cmds: ['nmap -Pn <ip>'], keywords: ['хост не отвечает', 'не пингуется', 'down'] },
    { id: 'all-filtered', title: 'Все порты filtered', answer: 'Перед целью файрвол: он молча отбрасывает стук. Для защищённого сервера это нормально. Убедись, что цель верная, и попробуй -Pn. Если и так всё filtered — снаружи больше ничего не увидишь.', cmds: ['nmap -Pn <ip>'], keywords: ['файрвол', 'всё закрыто'] },
    { id: 'found-open', title: 'Нашёл открытый порт — что дальше', answer: 'Узнай, что за программа сидит за дверью и какой она версии. По версии потом ищут известные уязвимости.', cmds: ['nmap -sV <ip>'], keywords: ['открыт', 'следующий шаг'] },
    { id: 'too-slow', title: 'Сканирование идёт слишком долго', answer: 'Для первого взгляда хватит самых частых портов: -F проверяет только 100 популярных. Полный обход (-p-) оставь на потом.', cmds: ['nmap -F <ip>'], keywords: ['долго', 'медленно', 'быстрее'] },
    { id: 'odd-port', title: 'Служба может сидеть на необычном порту', answer: 'По умолчанию nmap смотрит только 1000 частых портов. Админы любят вешать SSH или сайт на нестандартные номера — проверь все 65 535.', cmds: ['nmap -p- <ip>'], keywords: ['нестандартный порт', 'спрятана'] },
    { id: 'save', title: 'Хочу сохранить результат', answer: 'Добавь -oN и имя файла: вывод запишется в текстовый файл, и его не нужно листать в терминале.', cmds: ['nmap -oN scan.txt <ip>'], keywords: ['записать', 'отчёт'] },
  ],

  playbooks: [
    {
      id: 'first-look',
      title: 'Первый обход цели',
      intro: 'Для учебной мишени или своей лаборатории. Идём от быстрого к подробному.',
      steps: [
        { title: 'Быстрый взгляд', text: 'Сначала самое быстрое: 100 частых портов. Смотрим, жива ли цель и что видно сразу.', cmd: 'nmap -F <ip>', sampleId: 'web' },
        { title: 'Цель молчит? Добавь -Pn', text: 'Если вывод «Host seems down» — цель часто жива и просто не отвечает на пинг. Стучим без пинга.', cmd: 'nmap -Pn <ip>', sampleId: 'down' },
        { title: 'Проверь все двери', text: 'Теперь все 65 535 портов. Дольше, зато службы на нестандартных портах не пропадут.', cmd: 'nmap -p- <ip>' },
        { title: 'Узнай, что за службы', text: 'Для открытых портов выясняем программу и версию — это основа для поиска уязвимостей.', cmd: 'nmap -sV <ip>' },
        { title: 'Сохрани результат', text: 'Запиши вывод в файл, чтобы не потерять и вернуться к нему позже.', cmd: 'nmap -oN scan.txt <ip>' },
      ],
    },
    {
      id: 'own-router',
      title: 'Проверь свой роутер или домашний сервер',
      intro: 'Защитный сценарий: посмотреть на свою сеть глазами снаружи и закрыть лишнее. IP роутера обычно 192.168.0.1 или 192.168.1.1.',
      steps: [
        { title: 'Что у тебя открыто', text: 'Быстро смотрим частые порты на своём устройстве.', cmd: 'nmap -F <ip>', sampleId: 'web' },
        { title: 'Что за службы', text: 'Для открытых портов узнаём, какая программа и какой версии там работает.', cmd: 'nmap -sV <ip>' },
        { title: 'Закрой лишнее', text: 'Если нашёл порт, которым не пользуешься (например, 23 Telnet или 3389), отключи службу или закрой порт в настройках роутера и обнови прошивку. Потом повтори шаг 1 и убедись, что порт пропал.' },
      ],
    },
  ],

  nextSteps: [
    { text: 'Открыты 80 или 443 → проверь сам сайт на уязвимости', branchId: 'web' },
    { text: 'Открыт 22 (SSH) → проверка паролей', branchId: 'passwords' },
    { text: 'Узнал версии служб → ищи, чем они уязвимы', branchId: 'exploit' },
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
