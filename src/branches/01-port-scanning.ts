import { Radar } from 'lucide-react'
import { PortScanTool } from '@/tools/PortScanTool'
import { discoverAnalyze, discoverHints } from '@/lib/discover'
import { nmapAnalyze, nmapHints } from '@/lib/nmapHints'
import { siteAnalyze, siteHints } from '@/lib/siteinfo'
import type { BranchConfig } from './types'

const config: BranchConfig = {
  id: 'port-scanning',
  title: 'Сканирование портов',
  icon: Radar,
  order: 10,
  tool: PortScanTool,
  keywords: ['nmap', 'порт', 'порты', 'скан', 'сканер', 'файрвол', 'firewall', 'filtered', 'открытые двери', 'службы', 'ssh', 'mysql', 'rdp', 'разведка', 'найти устройства', 'найти api', 'гаджеты', 'камеры', 'принтеры', 'умный дом', 'инвентаризация', 'пентестер', 'enumeration', 'свои устройства', 'свои api', 'mqtt'],
  lineHints: [...nmapHints, ...discoverHints, ...siteHints],
  analyze: (t) => [...nmapAnalyze(t), ...discoverAnalyze(t), ...siteAnalyze(t)],

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
- "Host seems down" → цель молчит, часто она жива, просто блокирует пинг. Добавь флаг \`-Pn\`.

## Руководство: найди своё, как пентестер

Пентестер делает не «одну команду», а метод. Вот он, для **своей** домашней сети и своих проектов:

- **1. Карта.** Кто вообще есть в сети: \`sudo nmap -sn <net>\` и \`arp -a\`.
- **2. Двери.** Какие порты открыты у каждого устройства: сначала быстро (\`-F\`), потом все (\`-p-\`).
- **3. Службы.** Что за программа и версия за дверью: \`-sV\`.
- **4. Веб и API.** Где живут веб-панели и API: заголовки (\`curl -sI\`), название страницы, типовые пути (\`/health\`, \`/docs\`).
- **5. Запись и сравнение.** Сохрани результат и через неделю сравни: что новое? Это называется **инвентаризация**.

Профессионалы так и делают: сначала собирают список всего, что есть, и только потом смотрят, что с этим не так. Иди сценарием «Инвентаризация своей сети» в разделе «Сценарии по шагам».

## Где искать свои API и гаджеты

Каждое устройство «светится» своими портами:

- **3000, 5173, 8000, 8080, 5000** — твои проекты и API (Node, Python, Flask, Django).
- **80, 443, 8443** — веб-панели: роутер, NAS, принтер, камера.
- **554** — видеопоток IP-камер (RTSP).
- **631, 9100** — принтеры.
- **1883, 8883** — MQTT: датчики и умный дом. **8123** — Home Assistant.
- **22** — SSH (Raspberry Pi, серверы). **445** — общие папки Windows и NAS.
- **UDP 5353 (mDNS)** — устройства сами объявляют своё имя и службы: \`dns-sd\` (Mac) или \`avahi-browse\` (Linux).

## Как понять, что это за устройство

- **По производителю сетевой карты (MAC):** \`sudo nmap -sn\` показывает фирму — Apple, TP-Link, Raspberry Pi, Espressif (чип ESP — «умные» датчики и лампочки).
- **По заголовкам веб-службы:** \`curl -sI http://IP:порт\` — строка \`Server\`.
- **По названию страницы:** \`curl -s http://IP:порт | grep -i "<title>"\`.
- **По версии:** \`nmap -sV\`.
- **По имени в сети (mDNS).** Телефоны часто показываются с «приватным» MAC без производителя — это нормально.

## Что делать с находками

- **Незнакомое устройство** — смени пароль Wi-Fi, отключи WPS, посмотри список подключённых в панели роутера.
- **Панель или API без пароля** — включи вход, смени стандартный пароль.
- **Служба, которой ты не пользуешься** (Telnet, SMB, старый dev-сервер) — выключи.
- **Проект виден всей сети** — запусти его на 127.0.0.1.
- **Запиши и сравнивай** раз в неделю или месяц: новое устройство или порт — повод разобраться.

## Правила тренировки

- **Только своя сеть и свои устройства.** Не в кафе, офисе, общежитии и не у соседей без разрешения.
- **Только находим и записываем.** Не подбираем пароли, не ломаем чужое и не трогаем чужие умные устройства.
- **Тренируйся «в тихом режиме»:** сначала \`-F\` и \`-sn\`, а тяжёлые проверки (\`-p-\`, \`-sV\` по всей сети) — когда понимаешь, что делаешь.`,

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

    {
      label: 'Кто в сети + производитель',
      cmd: 'sudo nmap -sn <net>',
      note: 'sudo нужен, чтобы nmap показал MAC и фирму (Apple, TP-Link, Raspberry Pi…). Только своя сеть',
      keywords: ['найти устройства', 'кто в wifi', 'производитель', 'mac адрес', 'гаджеты', 'инвентаризация'],
      flags: [
        { flag: '-sn', text: 'Только узнать, кто жив, без проверки портов. Быстро и мягко.' },
        { flag: 'sudo', text: 'Права администратора: без них nmap не видит MAC-адреса соседей по сети.' },
      ],
    },
    { label: 'Таблица соседей (ARP)', cmd: 'arp -a', note: 'устройства, с которыми компьютер недавно общался, и их MAC. Работает на Mac, Linux и Windows', keywords: ['найти устройства', 'mac адрес', 'соседи'], flags: [{ flag: 'arp', text: 'Показать таблицу «IP ↔ MAC» ближайших устройств.' }] },
    {
      label: 'Найти веб-панели и API в сети',
      cmd: 'nmap -p 80,443,3000,5000,8000,8080,8443 --open <net>',
      note: 'где в твоей сети живут сайты, панели и API. Только своя сеть',
      keywords: ['найти api', 'свои api', 'веб панели', 'найти сайт в сети', 'dev-сервер'],
      flags: [
        { flag: '-p 80,443,…', text: 'Проверить только перечисленные порты: типичные для сайтов и API. Список через запятую, без пробелов.' },
        { flag: '--open', text: 'Показывать только открытые порты — меньше шума.' },
      ],
    },
    {
      label: 'Камеры, принтеры, умный дом',
      cmd: 'nmap -p 554,631,9100,1883,8123 --open <net>',
      note: 'ищем свои гаджеты по их типичным портам',
      keywords: ['камеры', 'принтеры', 'умный дом', 'гаджеты', 'mqtt', 'home assistant'],
      flags: [
        { flag: '554', text: 'RTSP: видеопоток IP-камер.' },
        { flag: '631 / 9100', text: 'Печать: принтеры (IPP и RAW).' },
        { flag: '1883', text: 'MQTT: сообщения умного дома и датчиков.' },
        { flag: '8123', text: 'Home Assistant — панель умного дома.' },
      ],
    },
    { label: 'Что за веб-служба: заголовки', cmd: 'curl -sI http://<ip>:8080', note: 'подставь свой порт. Смотри строку Server — какая программа отвечает', keywords: ['что за устройство', 'заголовки', 'server'], flags: [{ flag: '-I', text: 'Показать только заголовки ответа, без самой страницы.' }, { flag: ':8080', text: 'Порт после IP. Для порта 80 его можно не писать.' }] },
    { label: 'Что за веб-служба: название страницы', cmd: 'curl -s http://<ip>:8080 | grep -i "<title>"', note: 'название вкладки часто выдаёт устройство: «Router», «Synology», «Home Assistant»', keywords: ['что за устройство', 'название страницы'], flags: [{ flag: 'grep -i', text: 'Найти в тексте строку, не различая заглавные и строчные буквы.' }] },
    {
      label: 'Типовые пути своего API',
      cmd: 'for p in /health /docs /openapi.json /admin; do echo "== $p"; curl -s -o /dev/null -w "%{http_code}\\n" http://<ip>:3000$p; done',
      note: 'какие пути твоего API отвечают без входа (200), а какие защищены (401/403). Только свой API. Порт замени на свой',
      keywords: ['найти api', 'свои api', 'эндпоинты', 'документация api', 'swagger', 'openapi', 'health'],
      flags: [
        { flag: '-o /dev/null', text: 'Не показывать тело ответа — оно не нужно.' },
        { flag: '-w "%{http_code}"', text: 'Напечатать только код ответа: 200 — открыто, 401/403 — защищено, 404 — нет такого пути.' },
      ],
    },
    { label: 'Имена устройств в сети (Mac)', cmd: 'dns-sd -B _services._dns-sd._udp local.', note: 'устройства сами объявляют свои службы. Остановить: Ctrl+C', keywords: ['mdns', 'bonjour', 'имена устройств', 'найти устройства'], flags: [{ flag: '-B', text: 'Browse: слушать, какие службы объявляют устройства в сети.' }] },
    { label: 'Имена устройств в сети (Linux)', cmd: 'avahi-browse -art', note: 'то же для Linux. Нужен пакет avahi-utils', keywords: ['mdns', 'avahi', 'имена устройств'], flags: [{ flag: '-art', text: 'a — все службы, r — с адресами, t — показать и завершиться.' }] },
    { label: 'Записать инвентарь в файл', cmd: 'nmap -F -oN inventory.txt <net>', note: 'текстовый отчёт о всех устройствах и их портах', keywords: ['инвентаризация', 'отчёт', 'сохранить'], flags: [{ flag: '-oN', text: 'Записать результат в читаемый файл.' }] },
    { label: 'Снимок для сравнения', cmd: 'nmap -F -oX today.xml <net>', note: 'XML-файл, который умеет сравнивать ndiff. Сделай сегодня и через неделю', keywords: ['сравнить', 'baseline', 'снимок'], flags: [{ flag: '-oX', text: 'Записать результат в XML — формат для сравнения программами.' }] },
    { label: 'Что изменилось с прошлого раза', cmd: 'ndiff yesterday.xml today.xml', note: 'показывает новые и пропавшие устройства и порты. ndiff идёт вместе с nmap', keywords: ['что изменилось', 'новое устройство', 'сравнить', 'ndiff'], flags: [{ flag: 'ndiff', text: 'Сравнивает два снимка nmap и показывает разницу.' }] },
  ],

  situations: [
    { id: 'host-down', title: 'Пишет «Host seems down»', answer: 'Цель молчит на пинг. Чаще всего она жива, просто блокирует ping. Скажи nmap не проверять пингом и сразу стучать в порты.', cmds: ['nmap -Pn <ip>'], keywords: ['хост не отвечает', 'не пингуется', 'down'] },
    { id: 'all-filtered', title: 'Все порты filtered', answer: 'Перед целью файрвол: он молча отбрасывает стук. Для защищённого сервера это нормально. Убедись, что цель верная, и попробуй -Pn. Если и так всё filtered — снаружи больше ничего не увидишь.', cmds: ['nmap -Pn <ip>'], keywords: ['файрвол', 'всё закрыто'] },
    { id: 'found-open', title: 'Нашёл открытый порт — что дальше', answer: 'Узнай, что за программа сидит за дверью и какой она версии. По версии потом ищут известные уязвимости.', cmds: ['nmap -sV <ip>'], keywords: ['открыт', 'следующий шаг'] },
    { id: 'too-slow', title: 'Сканирование идёт слишком долго', answer: 'Для первого взгляда хватит самых частых портов: -F проверяет только 100 популярных. Полный обход (-p-) оставь на потом.', cmds: ['nmap -F <ip>'], keywords: ['долго', 'медленно', 'быстрее'] },
    { id: 'odd-port', title: 'Служба может сидеть на необычном порту', answer: 'По умолчанию nmap смотрит только 1000 частых портов. Админы любят вешать SSH или сайт на нестандартные номера — проверь все 65 535.', cmds: ['nmap -p- <ip>'], keywords: ['нестандартный порт', 'спрятана'] },
    { id: 'save', title: 'Хочу сохранить результат', answer: 'Добавь -oN и имя файла: вывод запишется в текстовый файл, и его не нужно листать в терминале.', cmds: ['nmap -oN scan.txt <ip>'], keywords: ['записать', 'отчёт'] },

    { id: 'whats-this-device', title: 'Что за устройство с этим IP?', answer: 'Три способа по очереди: 1) производитель по MAC (sudo nmap -sn), 2) заголовки и название страницы, если у него есть веб-панель, 3) версия службы через -sV. Телефоны часто идут с «приватным» MAC без фирмы.', cmds: ['sudo nmap -sn <net>', 'curl -sI http://<ip>:8080', 'nmap -sV -F <ip>'], keywords: ['неизвестное устройство', 'что за ip', 'чей ip'] },
    { id: 'find-my-api', title: 'Где в сети мой API или сайт?', answer: 'Ищи по типичным портам сайтов и API (80, 443, 3000, 5000, 8000, 8080, 8443). --open оставляет в выводе только открытые. Потом посмотри заголовки найденной службы.', cmds: ['nmap -p 80,443,3000,5000,8000,8080,8443 --open <net>', 'curl -sI http://<ip>:8080'], keywords: ['найти api', 'где мой сервер', 'забыл порт'] },
    { id: 'find-gadgets', title: 'Хочу найти камеры, принтеры и умный дом', answer: 'У таких устройств характерные порты: 554 (камеры), 631 и 9100 (принтеры), 1883 (MQTT), 8123 (Home Assistant). Найди их и проверь, что везде стоит пароль.', cmds: ['nmap -p 554,631,9100,1883,8123 --open <net>', 'dns-sd -B _services._dns-sd._udp local.'], keywords: ['камера', 'принтер', 'датчики', 'умная лампочка'] },
    { id: 'api-paths', title: 'Какие пути моего API открыты без входа?', answer: 'Пройдись по типовым путям: /health, /docs, /openapi.json, /admin. 200 — отвечает без входа, 401/403 — защищено. Документацию (/docs, /openapi.json) на публичном API лучше закрыть.', cmds: ['for p in /health /docs /openapi.json /admin; do echo "== $p"; curl -s -o /dev/null -w "%{http_code}\\n" http://<ip>:3000$p; done'], keywords: ['эндпоинты', 'swagger', 'открытый api'] },
    { id: 'baseline', title: 'Хочу замечать, если в сети появилось что-то новое', answer: 'Сделай снимок сети сейчас и сохрани его. Через неделю — второй снимок и сравнение: ndiff покажет новые устройства и порты.', cmds: ['nmap -F -oX today.xml <net>', 'ndiff yesterday.xml today.xml'], keywords: ['новое устройство', 'мониторинг', 'сравнить сети'] },
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

    {
      id: 'inventory',
      title: 'Инвентаризация своей сети (как пентестер)',
      intro: 'Тренировка на СВОЕЙ сети: найти все устройства, веб-панели, API и гаджеты. Только находим и записываем. Впиши свой IP в поле цели (из него соберётся сеть <net>).',
      steps: [
        { title: 'Миссия 1: карта сети', text: 'Кто вообще есть в сети. С sudo nmap покажет ещё и производителя по MAC.', cmd: 'sudo nmap -sn <net>', sampleId: 'vendors', goal: 'У тебя есть список устройств, и про каждое ты можешь сказать, что это (по производителю).' },
        { title: 'Миссия 2: кто есть кто', text: 'Сверь список с ARP-таблицей и с тем, что есть дома. Устройство без производителя — часто телефон с приватным MAC.', cmd: 'arp -a', sampleId: 'arp', goal: 'Не осталось ни одного устройства, которое ты не можешь назвать.' },
        { title: 'Миссия 3: веб-панели и API', text: 'Ищем, где в сети живут сайты, панели и API: порты 80, 443, 3000, 5000, 8000, 8080, 8443.', cmd: 'nmap -p 80,443,3000,5000,8000,8080,8443 --open <net>', sampleId: 'web-sweep', goal: 'Ты знаешь, на каких IP и портах у тебя работают веб-интерфейсы и API.' },
        { title: 'Миссия 4: что это за служба', text: 'Для найденной веб-службы смотрим заголовки. Подставь свой IP и порт.', cmd: 'curl -sI http://<ip>:8080', sampleId: 'curl-head', goal: 'Для каждой веб-службы ты знаешь, что за программа отвечает.' },
        { title: 'Миссия 5: пути своего API', text: 'Проверь типовые пути своего API. 200 — открыто без входа, 401/403 — защищено.', cmd: 'for p in /health /docs /openapi.json /admin; do echo "== $p"; curl -s -o /dev/null -w "%{http_code}\\n" http://<ip>:3000$p; done', sampleId: 'api-probe', goal: 'Ты знаешь, какие пути API открыты без входа и какие защищены.' },
        { title: 'Миссия 6: умные гаджеты', text: 'Камеры, принтеры, датчики и умный дом ищем по характерным портам.', cmd: 'nmap -p 554,631,9100,1883,8123 --open <net>', sampleId: 'gadgets', goal: 'Ты нашёл камеры, принтеры и датчики и знаешь, где стоит пароль, а где нет.' },
        { title: 'Миссия 7: запиши и сравнивай', text: 'Сделай снимок сети. Через неделю повтори и сравни командой ndiff — увидишь всё новое.', cmd: 'nmap -F -oX today.xml <net>', goal: 'У тебя есть файл-снимок сети, с которым можно сравнить следующий.' },
        { title: 'Финал: закрой лишнее', text: 'По находкам: незнакомое устройство — смени пароль Wi-Fi и отключи WPS; панель без пароля — включи вход; лишние службы (Telnet, SMB) — выключи; проект на 0.0.0.0 — перезапусти на 127.0.0.1. Потом повтори миссию 3 и убедись, что лишнее пропало.', goal: 'Повторная проверка не показывает того, что ты закрыл.' },
      ],
    },
  ],

  nextSteps: [
    { text: 'Нашёл свои устройства и API → проверь домашнюю сеть и роутер', branchId: 'home-network' },
    { text: 'Есть свой сайт или домен → проверь его снаружи', branchId: 'own-site' },
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
    { id: 'web', label: 'Обычный веб-сервер', explain: true, text: `Starting Nmap 7.94 ( https://nmap.org )
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
    { id: 'filtered', label: 'Всё filtered', explain: true, text: `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for 203.0.113.10
Host is up (0.120s latency).
All 1000 scanned ports on 203.0.113.10 are in state: filtered
Nmap done: 1 IP address (1 host up) scanned in 21.40s` },
    { id: 'down', label: 'Host seems down', text: `Starting Nmap 7.94 ( https://nmap.org )
Note: Host seems down. If it is really up, but blocking our ping probes, try -Pn
Nmap done: 1 IP address (0 hosts up) scanned in 3.12s` },

    { id: 'vendors', label: 'Кто в сети + производители', explain: true, text: `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for 192.168.1.1
Host is up (0.0021s latency).
MAC Address: 50:C7:BF:12:34:56 (TP-Link Technologies)
Nmap scan report for 192.168.1.15
Host is up (0.011s latency).
MAC Address: B8:27:EB:AA:BB:CC (Raspberry Pi Foundation)
Nmap scan report for 192.168.1.42
Host is up (0.050s latency).
MAC Address: 24:6F:28:11:22:33 (Espressif)
Nmap scan report for 192.168.1.57
Host is up (0.085s latency).
MAC Address: F0:18:98:44:55:66 (Apple)
Nmap scan report for 192.168.1.23
Host is up (0.00013s latency).
Nmap done: 256 IP addresses (5 hosts up) scanned in 2.71s` },
    { id: 'arp', label: 'Таблица соседей (arp -a)', explain: true, text: `? (192.168.1.1) at 50:c7:bf:12:34:56 on en0 ifscope [ethernet]
? (192.168.1.15) at b8:27:eb:aa:bb:cc on en0 ifscope [ethernet]
? (192.168.1.42) at 24:6f:28:11:22:33 on en0 ifscope [ethernet]
? (192.168.1.255) at ff:ff:ff:ff:ff:ff on en0 ifscope [ethernet]` },
    { id: 'web-sweep', label: 'Веб-панели и API в сети', explain: true, text: `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for 192.168.1.1
Host is up (0.0031s latency).
PORT    STATE SERVICE
80/tcp  open  http
443/tcp open  https
Nmap scan report for 192.168.1.15
Host is up (0.011s latency).
PORT     STATE SERVICE
8080/tcp open  http-proxy
Nmap scan report for 192.168.1.23
Host is up (0.00013s latency).
PORT     STATE SERVICE
3000/tcp open  ppp
5000/tcp open  upnp
Nmap done: 256 IP addresses (4 hosts up) scanned in 3.90s` },
    { id: 'curl-head', label: 'Заголовки найденной службы', explain: true, text: `HTTP/1.1 200 OK
Server: nginx/1.18.0
Content-Type: text/html
X-Powered-By: Express` },
    { id: 'api-probe', label: 'Типовые пути моего API', explain: true, text: `== /health
200
== /docs
200
== /openapi.json
200
== /admin
403` },
    { id: 'gadgets', label: 'Камеры, принтеры, умный дом', explain: true, text: `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for 192.168.1.30
Host is up (0.012s latency).
PORT    STATE SERVICE
554/tcp open  rtsp
Nmap scan report for 192.168.1.31
Host is up (0.004s latency).
PORT     STATE SERVICE
9100/tcp open  jetdirect
Nmap scan report for 192.168.1.42
Host is up (0.050s latency).
PORT     STATE SERVICE
1883/tcp open  mqtt
Nmap done: 256 IP addresses (6 hosts up) scanned in 3.20s` },
  ],
}

export default config
