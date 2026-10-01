import { Crosshair } from 'lucide-react'
import { nmapHints } from '@/lib/nmapHints'
import { webAnalyze, webHints } from '@/lib/webinfo'
import { SampleTool } from '@/tools/SampleTool'
import type { BranchConfig } from './types'

const NIKTO_CLEAN = `- Nikto v2.5.0
+ Target IP:          203.0.113.40
+ Target Hostname:    example.com
+ Target Port:        443
+ Start Time:         2026-10-01 10:00:00
---------------------------------------------------------------------------
+ Server: nginx/1.25.3
+ /: The X-Content-Type-Options header is not set.
+ /: Uncommon header 'x-powered-by' is present.
+ 7891 requests: 0 error(s) and 2 item(s) reported on remote host
+ End Time: 2026-10-01 10:02:14 (134 seconds)`

const NIKTO_FOUND = `- Nikto v2.5.0
+ Target IP:          203.0.113.41
+ Target Hostname:    example.net
+ Target Port:        80
---------------------------------------------------------------------------
+ Server: Apache/2.2.15 (CentOS)
+ The anti-clickjacking X-Frame-Options header is not present.
+ Server leaks inodes via ETags
+ /admin/: Admin login page/section found.
+ /phpinfo.php: Output from the phpinfo() function was found.
+ /backup.zip: A backup archive was found.
+ 7891 requests: 0 error(s) and 5 item(s) reported on remote host`

const FFUF_RESULT = `/.git/                 [Status: 301, Size: 169]
/admin                 [Status: 403, Size: 277]
/api                   [Status: 200, Size: 54]
/backup                [Status: 301, Size: 169]
/dashboard             [Status: 302, Size: 0]
/uploads               [Status: 301, Size: 169]
:: Progress: [20476/20476] :: Job [1/1]`

const SQLMAP_CLEAN = `[10:14:02] [INFO] testing connection to the target URL
[10:14:03] [INFO] testing if GET parameter 'id' is dynamic
[10:14:04] [WARNING] GET parameter 'id' does not seem to be dynamic
[10:14:05] [INFO] heuristic (basic) test shows that GET parameter 'id' might not be injectable
[10:14:12] [INFO] testing 'AND boolean-based blind - WHERE or HAVING clause'
[10:14:40] all tested parameters do not appear to be injectable`

const SQLMAP_VULN = `[11:02:10] [INFO] testing connection to the target URL
[11:02:11] [INFO] GET parameter 'id' appears to be 'AND boolean-based blind - WHERE or HAVING clause' injectable
[11:02:14] [INFO] GET parameter 'id' is 'MySQL >= 5.0 AND error-based' injectable
sqlmap identified the following injection point(s):
---
Parameter: id (GET)
    Type: boolean-based blind
    Title: AND boolean-based blind - WHERE or HAVING clause
    Payload: id=1 AND 4521=4521
---
[11:02:15] [INFO] the back-end DBMS is MySQL
web server operating system: Linux Ubuntu
web application technology: PHP 7.4, Apache 2.4.41
back-end DBMS: MySQL >= 5.0`

const config: BranchConfig = {
  id: 'web-advanced',
  title: 'Глубокое веб-тестирование',
  icon: Crosshair,
  order: 21,
  category: 'web',
  tool: SampleTool,
  keywords: [
    'nikto', 'nuclei', 'ffuf', 'gobuster', 'sqlmap', 'burp', 'burp suite', 'owasp zap', 'zap',
    'sql инъекция', 'sqli', 'перехватывающий прокси', 'перебор путей', 'директории сайта', 'nuclei templates',
    'интрузивный скан', 'уязвимость формы', 'профессиональные инструменты', 'serious tools',
  ],
  lineHints: [...webHints, ...nmapHints],
  analyze: (t) => webAnalyze(t),

  commandsIntro: {
    get: 'Автоматизированный и ручной разбор своего веб-приложения инструментами, которыми реально пользуются профи: Nikto/Nuclei (скан известных слабостей), ffuf/gobuster (перебор путей), Burp Suite/ZAP (ручной прокси), sqlmap (проверка на SQL-инъекции).',
    goal: 'Найти то, что не видно по заголовкам и паре путей из базовой ветки «Веб-уязвимости»: уязвимые формы, скрытые пути, неэкранированные параметры.',
    result: 'Нашёл интрузивную уязвимость (SQLi, открытый админ-путь) — чини на уровне кода/конфига сразу, это не «потом». Повтори скан и убедись, что находка исчезла.',
  },

  guide: `## Что это

Четыре инструмента, которыми реально пользуются профессионалы при тестировании веб-приложений — не учебные игрушки, а то же самое ПО, что в настоящих pentest-отчётах. Базовая ветка «Веб-уязвимости» проверяла пару путей руками; здесь — автоматизированный и куда более глубокий разбор.

**Это активное и местами интрузивное тестирование.** Некоторые из этих проверок (особенно sqlmap и nuclei с агрессивными шаблонами) отправляют много запросов и могут создавать нагрузку или даже менять данные на тестовом сервере. Запускай только на **своём** проекте или специально поднятой для практики уязвимой машине (DVWA, OWASP Juice Shop, свой стенд) — см. «Где тренироваться».

## Четыре инструмента, четыре задачи

1. **Nikto / Nuclei — быстрый автосканер.** Проверяет сайт по базе тысяч известных проблем: старые файлы, стандартные админки, устаревшие заголовки, утечки через ETag. Nikto — классика, Nuclei — современнее, работает по YAML-шаблонам и обновляется под новые CVE быстрее.
2. **ffuf / gobuster — перебор по словарю.** Подставляет в адрес тысячи слов из словаря и смотрит, какие пути реально существуют (не только служебные «обычные подозреваемые», как в базовой ветке, а всё, что в словаре). Находит то, на что нет ссылок с сайта.
3. **Burp Suite / OWASP ZAP — перехватывающий прокси.** Встаёт между браузером и сайтом: видишь и можешь менять каждый запрос и ответ вручную. Это основной инструмент, когда автоматика не находит ничего, а проверить логику приложения (например, можно ли изменить чужой заказ, поменяв id в запросе) нужно руками.
4. **sqlmap — проверка на SQL-инъекции.** Если параметр в адресе или форме напрямую попадает в SQL-запрос без экранирования, через него можно читать и менять базу данных в обход всей логики приложения. sqlmap автоматически находит и подтверждает такие места.

## Как читать вывод

- **Nikto/Nuclei:** каждая строка с \`+\` — одна находка. Чем конкретнее (найденный файл, открытая админка) — тем срочнее чинить. Общие рекомендации про заголовки — не срочно, уже разобраны в «Веб-уязвимости».
- **ffuf/gobuster:** код \`200\` или \`301\`/\`302\` — путь существует. \`403\` — существует, но закрыт (не обязательно плохо). Размер ответа (\`Size\`) помогает отличить реальные страницы от одинаковых страниц-заглушек 404.
- **sqlmap:** если пишет «does not appear to be injectable» — повезло, в этом параметре дыры нет. Если находит инъекцию — показывает тип, СУБД и может дальше вытащить список таблиц.

## Что делать с находками

- **Открытый \`/admin\` или \`/backup.zip\` без защиты** → закрой паролем/IP-фильтром или вовсе убери файл с продакшн-сервера.
- **Подтверждённая SQL-инъекция** → никогда не собирай SQL-запрос конкатенацией строк. Используй параметризованные запросы/ORM. После исправления — обязательно повтори sqlmap и убедись, что «does not appear to be injectable».
- **Найденный скрытый путь без явной уязвимости** → реши сознательно: должен ли он вообще быть доступен без пароля.`,

  commands: [
    {
      label: 'Быстрый скан известных слабостей (Nikto)',
      cmd: 'nikto -h https://<domain>',
      note: 'Проверяет сайт по базе из тысяч сигнатур: старые файлы, опасные конфиги, стандартные пути админок. Шумно и заметно в логах — предупреди себя (или команду) заранее.',
      see: 'Список строк с `+`: каждая — отдельная находка с коротким описанием.',
      next: 'Нашёл конкретный файл или путь (не общий совет по заголовкам) — проверь и закрой его в первую очередь.',
      keywords: ['nikto', 'автосканер сайта'],
      flags: [{ flag: '-h', text: 'Адрес цели (host).' }],
    },
    {
      label: 'Современный скан по шаблонам (Nuclei)',
      cmd: 'nuclei -u https://<domain> -severity medium,high,critical',
      note: 'Проверяет сайт по постоянно обновляемой базе шаблонов сообщества — от неправильных заголовков до свежих CVE в популярных CMS и фреймворках.',
      see: 'Строки вида `[template-id] [severity] URL` — каждая находка с уровнем серьёзности.',
      next: 'Сначала чини всё с severity critical/high, потом medium.',
      keywords: ['nuclei', 'шаблоны', 'cve сканер'],
      flags: [{ flag: '-severity', text: 'Показывать находки только этого уровня опасности и выше — отсекает мелкий шум.' }],
    },
    {
      label: 'Перебор путей по словарю (ffuf)',
      cmd: 'ffuf -u https://<domain>/FUZZ -w /usr/share/wordlists/dirb/common.txt -mc 200,301,302,403',
      note: 'Подставляет вместо FUZZ каждое слово из словаря и смотрит, какой код возвращает сервер — находит пути, на которые нет ссылок с сайта.',
      see: 'Таблица: путь, код ответа, размер. Реальные страницы обычно отличаются размером от страницы 404.',
      next: 'Нашёл неожиданный путь (не из списка «частых» в базовой ветке «Веб-уязвимости») — открой и проверь вручную.',
      keywords: ['ffuf', 'перебор путей', 'словарь', 'wordlist'],
      flags: [
        { flag: 'FUZZ', text: 'Место, куда ffuf подставляет каждое слово из словаря.' },
        { flag: '-mc', text: 'Показывать только ответы с этими кодами (match code).' },
      ],
    },
    {
      label: 'Перебор путей по словарю (gobuster)',
      cmd: 'gobuster dir -u https://<domain> -w /usr/share/wordlists/dirb/common.txt',
      note: 'То же самое, что ffuf, другим инструментом — часто уже стоит в Kali Linux по умолчанию.',
      see: 'Строки вида `/path (Status: 200)`.',
      keywords: ['gobuster', 'перебор директорий'],
    },
    {
      label: 'Проверить параметр на SQL-инъекцию (sqlmap)',
      cmd: 'sqlmap -u "https://<domain>/item?id=1" --batch',
      note: 'Подставляет в параметр `id` десятки вариантов SQL-синтаксиса и смотрит, меняется ли поведение сайта — так находит инъекции. Проверяй только форму/параметр своего приложения.',
      see: '«does not appear to be injectable» — параметр безопасен. Найдена инъекция — sqlmap покажет её тип и СУБД.',
      next: 'Нашёл инъекцию — переходи на параметризованные запросы в коде и перепроверь.',
      keywords: ['sqlmap', 'sql injection', 'sqli'],
      flags: [{ flag: '--batch', text: 'Не задавать уточняющих вопросов, использовать значения по умолчанию — удобно для первого прогона.' }],
    },
    {
      label: 'Вытащить список таблиц (sqlmap, после подтверждённой инъекции)',
      cmd: 'sqlmap -u "https://<domain>/item?id=1" --batch --dbs',
      note: 'Если инъекция подтвердилась — показывает, какие базы данных видны через эту дыру. Используй только чтобы оценить масштаб проблемы на своей системе, не для реального извлечения чужих данных.',
      see: 'Список названий баз данных.',
      next: 'Это подтверждение серьёзности: чини инъекцию немедленно, не жди «потом».',
      keywords: ['sqlmap dbs', 'список баз данных'],
      flags: [{ flag: '--dbs', text: 'Перечислить доступные базы данных через найденную инъекцию.' }],
    },
  ],

  situations: [
    {
      id: 'web-adv-sqli-found',
      title: 'sqlmap подтвердил SQL-инъекцию',
      answer: `**Почему это серьёзно.** Через инъекцию можно читать и менять базу в обход всей логики приложения — это один из самых опасных классов веб-уязвимостей.

**Что делать:**

1. Останови дальнейшее исследование этим инструментом — находки достаточно, дальше чинить.
2. В коде перейди на параметризованные запросы или ORM — никогда не собирай SQL конкатенацией строк с пользовательским вводом.
3. После исправления прогони sqlmap снова и убедись в ответе «does not appear to be injectable».
4. Проверь логи сервера за всё время — не использовал ли кто-то эту дыру раньше тебя.`,
      cmds: ['sqlmap -u "https://<domain>/item?id=1" --batch'],
      keywords: ['sql инъекция найдена', 'sqlmap нашёл'],
    },
    {
      id: 'web-adv-hidden-path',
      title: 'ffuf/gobuster нашёл неожиданный путь',
      answer: `**Что делать:**

1. Открой найденный путь в браузере и посмотри, что это: админка, API, остатки старой версии сайта.
2. Если это не должно быть доступно без пароля — закрой логином, IP-фильтром или удали с продакшн-сервера.
3. Если это рабочий, но «секретный по ссылке» раздел — помни: перебор по словарю его всё равно найдёт, «секретность через неизвестность адреса» не защита.`,
      cmds: ['ffuf -u https://<domain>/FUZZ -w /usr/share/wordlists/dirb/common.txt -mc 200,301,302,403'],
      keywords: ['скрытый путь', 'найден неожиданный адрес'],
    },
    {
      id: 'web-adv-noisy-scan',
      title: 'Сканирование создаёт заметную нагрузку или алерты',
      answer: `**Что это значит.** Nikto, Nuclei и sqlmap отправляют сотни-тысячи запросов за минуты — на слабом хостинге это заметная нагрузка, а системы мониторинга (fail2ban, WAF) могут начать блокировать твой же IP.

**Что делать:**

1. Запускай такие сканы в нерабочее время или на staging-копии, а не на боевом проекте с живыми пользователями.
2. Если тебя заблокировал собственный WAF/fail2ban — это даже хорошо: значит, защита работает против реального перебора.
3. Для регулярных проверок ограничивай скорость (у большинства инструментов есть флаг задержки/потоков).`,
      cmds: [],
      keywords: ['нагрузка от сканирования', 'заблокировало fail2ban', 'waf блокирует'],
    },
  ],

  playbooks: [
    {
      id: 'web-advanced-sweep',
      title: 'Глубокая проверка своего веб-приложения',
      intro: 'От автосканера до ручной проверки параметров — порядок, в котором это делают профи.',
      steps: [
        { title: 'Автоскан по базе известных слабостей', text: 'Запусти Nikto или Nuclei — это быстро укажет на очевидные проблемы.', cmd: 'nuclei -u https://<domain> -severity medium,high,critical', sampleId: 'nikto-found', goal: 'У тебя есть список находок с уровнем серьёзности.' },
        { title: 'Найди скрытые пути', text: 'Перебери пути по словарю — найдёшь то, на что нет ссылок с сайта.', cmd: 'ffuf -u https://<domain>/FUZZ -w /usr/share/wordlists/dirb/common.txt -mc 200,301,302,403', sampleId: 'ffuf', goal: 'У тебя есть список реально существующих путей сверх очевидных.' },
        { title: 'Проверь параметры форм на инъекции', text: 'Для каждого параметра, который передаётся в адресе или форме (id, search, filter…), проверь на SQL-инъекцию.', cmd: 'sqlmap -u "https://<domain>/item?id=1" --batch', sampleId: 'sqlmap-clean', goal: 'Ни один параметр не отвечает «appears to be injectable».' },
        { title: 'Проверь логику руками через прокси', text: 'То, что автоматика не находит: открой Burp Suite или ZAP, пройди ключевые сценарии (вход, оплата, чужие данные по id) и попробуй подменить значения вручную.', goal: 'Логика приложения не даёт получить доступ к чужим данным простой подменой параметра.' },
        { title: 'Закрой находки и перепроверь', text: 'Исправь код/конфиг для каждой находки, затем повтори шаги 1–3.', goal: 'Повторный прогон не находит того, что ты закрыл.' },
      ],
    },
  ],

  nextSteps: [
    { text: 'Нашёл работающий вход — проверь, нет ли перебора паролей', branchId: 'passwords' },
    { text: 'Нашёл устаревшую версию CMS/библиотеки — проверь патчи', branchId: 'exploit' },
    { text: 'Базовая проверка сайта ещё не делалась', branchId: 'web' },
  ],

  terminalSample: NIKTO_CLEAN,
  samples: [
    { id: 'nikto-clean', label: 'Nikto: чисто', cmd: 'nikto -h https://<domain>', text: NIKTO_CLEAN, explain: true },
    { id: 'nikto-found', label: 'Nikto: есть находки', cmd: 'nikto -h https://<domain>', text: NIKTO_FOUND, explain: true },
    { id: 'ffuf', label: 'ffuf: найденные пути', cmd: 'ffuf -u https://<domain>/FUZZ -w /usr/share/wordlists/dirb/common.txt -mc 200,301,302,403', text: FFUF_RESULT, explain: true },
    { id: 'sqlmap-clean', label: 'sqlmap: не уязвимо', cmd: 'sqlmap -u "https://<domain>/item?id=1" --batch', text: SQLMAP_CLEAN, explain: true },
    { id: 'sqlmap-vuln', label: 'sqlmap: найдена инъекция', cmd: 'sqlmap -u "https://<domain>/item?id=1" --batch', text: SQLMAP_VULN, explain: true },
  ],
}

export default config
