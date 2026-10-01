import { Globe } from 'lucide-react'
import { nmapAnalyze, nmapHints } from '@/lib/nmapHints'
import { siteAnalyze, siteHints } from '@/lib/siteinfo'
import { SampleTool } from '@/tools/SampleTool'
import type { BranchConfig } from './types'

// Даты в примерах считаем от «сегодня», чтобы пример не устаревал
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const opensslDate = (days: number) => {
  const d = new Date(Date.now() + days * 86_400_000)
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2)} 12:00:00 ${d.getUTCFullYear()} GMT`
}
const isoDate = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().replace(/\.\d+Z$/, 'Z')

const HEADERS_WEAK = `HTTP/2 200
server: nginx/1.18.0
content-type: text/html; charset=utf-8
x-powered-by: Express`

const config: BranchConfig = {
  id: 'own-site',
  title: 'Мой сайт и домен',
  icon: Globe,
  order: 6,
  tool: SampleTool,
  keywords: ['домен', 'tld', 'dns', 'dig', 'whois', 'сертификат', 'ssl', 'https', 'заголовки', 'curl', 'сайт', 'почта домена', 'spf', 'dmarc', 'срок домена', 'мой сайт'],
  lineHints: [...siteHints, ...nmapHints],
  analyze: (t) => [...siteAnalyze(t), ...nmapAnalyze(t)],

  guide: `## Что это

Проверка своего сайта и домена снаружи: куда ведёт домен, не истекают ли домен и сертификат, какие защитные заголовки включены, что открыто на сервере. Это обычные запросы вроде тех, что делает любой браузер.

## Что вводим

Домен без \`https://\`, например \`example.com\`, — в поле цели вверху. Домен — это имя сайта, **TLD** — его окончание (.com, .de, .ru). У каждой зоны свой реестр, срок оплаты видно в \`whois\`: забудешь продлить — потеряешь и сайт, и почту.

Проверяй только свои домены и серверы. Если сайт на облаке (AWS, Hetzner, DigitalOcean…), прочитай правила хостера про сканирование портов.

## Как читать вывод

- **dig:** A — IP сайта, MX — почта, NS — серверы имён, TXT — служебные записи (SPF, DMARC).
- **Сертификат:** \`notAfter\` — до какого числа он действует. Просрочился — браузеры пугают посетителей.
- **Заголовки:** 200 — всё хорошо, 301 — редирект. Нужны \`strict-transport-security\`, \`content-security-policy\`, \`x-content-type-options\`. Не нужны \`server\` с версией и \`x-powered-by\`.
- **whois:** \`Registry Expiry Date\` — когда домен заканчивается.
- **nmap:** на сервере сайта обычно нужны только 80 и 443 (и 22 для управления). База данных (3306, 5432) снаружи — плохо.`,

  commands: [
    { label: 'На какой IP ведёт домен', cmd: 'dig +short <domain>', note: 'просто IP-адрес в ответ. Пусто — запись A не настроена', keywords: ['ip домена', 'как узнать ip сайта', 'куда ведёт домен'], flags: [{ flag: 'dig', text: 'Утилита запросов к DNS — «телефонной книге» интернета.' }, { flag: '+short', text: 'Только ответ, без служебного текста.' }] },
    { label: 'Серверы имён (NS)', cmd: 'dig +short NS <domain>', note: 'кто отвечает за DNS домена. Сверь с настройками у регистратора', keywords: ['ns', 'dns серверы'], flags: [{ flag: 'NS', text: 'Тип записи: серверы имён — кто хранит настройки домена.' }] },
    { label: 'Почта домена (MX)', cmd: 'dig +short MX <domain>', note: 'какие серверы принимают почту домена', keywords: ['mx', 'почта'], flags: [{ flag: 'MX', text: 'Тип записи: почтовые серверы домена.' }] },
    { label: 'Защита почты: SPF', cmd: 'dig +short TXT <domain>', note: 'ищи строку v=spf1 — кому можно слать почту от твоего имени', keywords: ['spf', 'txt', 'подделка писем', 'спам от моего домена'], flags: [{ flag: 'TXT', text: 'Тип записи: текст. Тут живут SPF и подтверждения владения доменом.' }] },
    { label: 'Защита почты: DMARC', cmd: 'dig +short TXT _dmarc.<domain>', note: 'нет записи — письма от твоего имени подделать проще', keywords: ['dmarc', 'подделка писем'] },
    { label: 'Когда истекает домен', cmd: 'whois <domain>', note: 'ищи Registry Expiry Date. У некоторых зон (.ru) дата называется paid-till', keywords: ['срок домена', 'tld', 'регистратор', 'продлить домен'], flags: [{ flag: 'whois', text: 'Справочник регистраций: кто регистратор, когда домен заканчивается.' }] },
    { label: 'Когда истекает сертификат', cmd: 'echo | openssl s_client -connect <domain>:443 -servername <domain> 2>/dev/null | openssl x509 -noout -dates', note: 'notAfter — последний день действия сертификата', keywords: ['ssl', 'https сертификат', 'срок сертификата'], flags: [{ flag: '-noout -dates', text: 'Не печатать сам сертификат, показать только даты действия.' }, { flag: '-servername', text: 'Сказать серверу, какой именно сайт нужен (если на одном IP их несколько).' }] },
    { label: 'Защитные заголовки сайта', cmd: 'curl -sI https://<domain>', note: 'смотри strict-transport-security, content-security-policy; лишнее — server с версией и x-powered-by', keywords: ['заголовки', 'hsts', 'csp', 'безопасность сайта', 'версия сервера'], flags: [{ flag: '-s', text: 'Тихий режим: без полоски загрузки.' }, { flag: '-I', text: 'Показать только заголовки ответа, без самой страницы.' }] },
    { label: 'Работает ли редирект на https', cmd: 'curl -sI http://<domain>', note: 'ждём код 301 и location: https://…', keywords: ['http на https', 'редирект', 'не защищённое соединение'] },
    { label: 'Что открыто на сервере сайта', cmd: 'nmap -F <domain>', note: 'только свой сервер. Нужны 80/443; база данных наружу — плохо', keywords: ['порты сервера', 'открытые порты сайта'], flags: [{ flag: '-F', text: 'Быстро: 100 самых частых портов.' }] },
    { label: 'Настройки шифрования (TLS)', cmd: 'nmap --script ssl-enum-ciphers -p 443 <domain>', note: 'оценка A–F; старые протоколы (TLS 1.0/1.1) лучше отключить', keywords: ['tls', 'шифрование', 'ssl настройки'], flags: [{ flag: '--script', text: 'Запустить готовый скрипт nmap (здесь — проверка шифров).' }, { flag: '-p 443', text: 'Только порт 443 — защищённый сайт.' }] },
  ],

  situations: [
    { id: 'domain-ip', title: 'Не знаю, на какой IP ведёт мой домен', answer: 'Спроси у DNS. Если ответ пустой — запись A не настроена или домен указывает куда-то ещё (CNAME).', cmds: ['dig +short <domain>'], keywords: ['ip сайта'] },
    { id: 'cert-expiry', title: 'Сертификат скоро истекает', answer: 'Проверь дату. Если используешь Let\'s Encrypt — продление обычно автоматическое: убедись, что задача автообновления (например, certbot renew) работает. Просроченный сертификат пугает посетителей предупреждением браузера.', cmds: ['echo | openssl s_client -connect <domain>:443 -servername <domain> 2>/dev/null | openssl x509 -noout -dates'], keywords: ['ssl', 'https не работает'] },
    { id: 'domain-expiry', title: 'Когда истекает мой домен', answer: 'Смотри Registry Expiry Date в whois. Продлевать нужно у регистратора (его название тоже есть в выводе). Включи автопродление, чтобы не потерять сайт и почту.', cmds: ['whois <domain>'], keywords: ['tld', 'срок домена'] },
    { id: 'site-https', title: 'Сайт открывается по http, а не по https', answer: 'Запрос на http должен отвечать кодом 301 и отправлять на https. Если отвечает 200 — настрой редирект на сервере и включи HSTS.', cmds: ['curl -sI http://<domain>', 'curl -sI https://<domain>'], keywords: ['не защищено', 'редирект'] },
    { id: 'mail-spoof', title: 'Боюсь, что от моего домена шлют поддельные письма', answer: 'Нужны две записи: SPF (кто может слать от твоего имени) и DMARC (что делать с подделками). Проверь, есть ли они; если нет — добавь у DNS-провайдера. В DMARC постепенно переходи с p=none на quarantine и reject.', cmds: ['dig +short TXT <domain>', 'dig +short TXT _dmarc.<domain>'], keywords: ['спам', 'подделка', 'почта'] },
    { id: 'server-version', title: 'Сервер раскрывает версию', answer: 'Заголовки server и x-powered-by подсказывают, что и какой версии у тебя работает. Скрой их: в nginx — server_tokens off; в Apache — ServerTokens Prod; в Express — app.disable("x-powered-by").', cmds: ['curl -sI https://<domain>'], keywords: ['версия nginx', 'скрыть версию'] },
  ],

  playbooks: [
    {
      id: 'site-checkup',
      title: 'Чек-ап своего сайта',
      intro: 'Защитный сценарий для своего домена: от DNS до открытых портов. Впиши домен в поле цели.',
      steps: [
        { title: 'Куда ведёт домен', text: 'Проверь, что домен указывает на нужный IP.', cmd: 'dig +short <domain>', sampleId: 'dns' },
        { title: 'Когда истекает домен', text: 'Найди Registry Expiry Date и включи автопродление у регистратора.', cmd: 'whois <domain>', sampleId: 'whois' },
        { title: 'Сертификат', text: 'Посмотри дату notAfter. Если меньше 30 дней — продли.', cmd: 'echo | openssl s_client -connect <domain>:443 -servername <domain> 2>/dev/null | openssl x509 -noout -dates', sampleId: 'cert' },
        { title: 'Редирект на https', text: 'Запрос на http должен отвечать 301 и отправлять на https.', cmd: 'curl -sI http://<domain>', sampleId: 'redirect' },
        { title: 'Защитные заголовки', text: 'Нужны HSTS, CSP, nosniff. Лишнее — версия сервера и x-powered-by.', cmd: 'curl -sI https://<domain>', sampleId: 'headers-weak' },
        { title: 'Что открыто на сервере', text: 'Для сайта достаточно 80 и 443 (и 22 для управления). Остальное — повод закрыть.', cmd: 'nmap -F <domain>', sampleId: 'ports' },
      ],
    },
  ],

  nextSteps: [
    { text: 'На сервере открыты лишние порты → разберись подробнее', branchId: 'port-scanning' },
    { text: 'Хочешь проверить сам сайт на уязвимости → веб-уязвимости', branchId: 'web' },
    { text: 'Проверь и свою домашнюю сеть', branchId: 'home-network' },
  ],

  terminalSample: HEADERS_WEAK,
  samples: [
    { id: 'headers-weak', label: 'Заголовки: слабые', text: HEADERS_WEAK, explain: true },
    { id: 'headers-good', label: 'Заголовки: хорошие', explain: true, text: `HTTP/2 200
server: nginx
content-type: text/html; charset=utf-8
strict-transport-security: max-age=63072000; includeSubDomains
content-security-policy: default-src 'self'
x-content-type-options: nosniff
x-frame-options: DENY` },
    { id: 'redirect', label: 'Редирект с http', text: `HTTP/1.1 301 Moved Permanently
server: nginx
location: https://example.com/` },
    { id: 'cert', label: 'Сертификат (скоро истечёт)', explain: true, text: `notBefore=${opensslDate(-70)}
notAfter=${opensslDate(19)}` },
    { id: 'whois', label: 'Срок домена (whois)', explain: true, text: `   Domain Name: EXAMPLE.COM
   Registrar: Example Registrar, Inc.
   Registry Expiry Date: ${isoDate(200)}
   Name Server: NS1.EXAMPLE.NET` },
    { id: 'dns', label: 'DNS: IP и защита почты', explain: true, text: `93.184.216.34
"v=spf1 include:_spf.google.com ~all"
"v=DMARC1; p=none; rua=mailto:dmarc@example.com"` },
    { id: 'ports', label: 'Порты сервера сайта', explain: true, text: `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for example.com (203.0.113.40)
Host is up (0.031s latency).
Not shown: 96 filtered tcp ports (no-response)
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
443/tcp  open  https
3306/tcp open  mysql
Nmap done: 1 IP address (1 host up) scanned in 2.30s` },
  ],
}

export default config
