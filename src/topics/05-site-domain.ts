import { Globe } from 'lucide-react'
import type { Topic } from './types'

const topic: Topic = {
  id: 'site-domain',
  title: 'Сайт, с которым работаешь',
  icon: Globe,
  blurb: 'Куда ведёт домен, когда он истекает, цел ли «замочек» и защищён ли сайт.',
  order: 5,
  questions: [
    {
      id: 'domain-ip',
      q: 'На какой IP ведёт домен?',
      level: 'start',
      keywords: ['dns', 'dig', 'ip сайта'],
      a: `Впиши домен в поле цели (без \`https://\`) и запусти команду. В ответе будет IP-адрес. Пусто — значит, у домена нет такой записи.`,
      cmds: ['dig +short <domain>'],
    },
    {
      id: 'domain-expiry',
      q: 'Когда истекает домен?',
      level: 'start',
      popular: true,
      keywords: ['whois', 'срок домена', 'продлить домен', 'tld'],
      a: `В выводе ищи строку \`Registry Expiry Date\` — это дата, до которой домен оплачен. Продлевать нужно у регистратора. Включи автопродление, иначе потеряешь сайт и почту.`,
      cmds: ['whois <domain>'],
    },
    {
      id: 'cert-expiry',
      q: 'Когда истекает сертификат («замочек»)?',
      level: 'start',
      keywords: ['ssl', 'https', 'сертификат'],
      a: `Сертификат — то, что даёт замочек рядом с адресом сайта. Смотри строку \`notAfter\`: это последний день действия. Просроченный сертификат пугает посетителей предупреждением браузера. Если используешь Let's Encrypt, продление обычно автоматическое — проверь, что оно работает.`,
      cmds: ['echo | openssl s_client -connect <domain>:443 -servername <domain> 2>/dev/null | openssl x509 -noout -dates'],
    },
    {
      id: 'site-security',
      q: 'Как проверить защитные настройки сайта?',
      level: 'next',
      keywords: ['заголовки', 'hsts', 'csp', 'версия сервера'],
      a: `Команда покажет «служебные» заголовки ответа. Хорошо, если есть \`strict-transport-security\`, \`content-security-policy\`, \`x-content-type-options\`. Плохо, если сервер выдаёт версию (\`server: nginx/1.18.0\`) или \`x-powered-by\`.

Вставь вывод в «Разобрать вывод» — объясню по строкам.`,
      cmds: ['curl -sI https://<domain>'],
      link: { label: 'Разобрать вывод', to: { id: 'explain' } },
    },
    {
      id: 'mail-spoof',
      q: 'Как защитить почту домена от подделки?',
      level: 'next',
      keywords: ['spf', 'dmarc', 'спам от моего домена'],
      a: `Нужны две записи в DNS: **SPF** (кто может слать письма от твоего имени) и **DMARC** (что делать с подделками). Проверь, есть ли они. Если нет — добавь у DNS-провайдера.`,
      cmds: ['dig +short TXT <domain>', 'dig +short TXT _dmarc.<domain>'],
    },
    {
      id: 'server-open',
      q: 'Что открыто на сервере моего сайта?',
      level: 'next',
      keywords: ['порты сервера', 'nmap сервер'],
      a: `Для сайта обычно достаточно \`80\`, \`443\` и \`22\` (для управления). База данных (\`3306\`, \`5432\`) снаружи — плохо. Проверяй только **свой** сервер, а у облачного хостера прочитай правила про сканирование.`,
      cmds: ['nmap -F <domain>'],
    },
    {
      id: 'site-https',
      q: 'Сайт открывается по http, а не по https',
      level: 'next',
      keywords: ['редирект', 'не защищено'],
      a: `Запрос на \`http\` должен отвечать кодом \`301\` и отправлять на \`https\`. Если отвечает \`200\` — настрой редирект на сервере.`,
      cmds: ['curl -sI http://<domain>'],
    },
  ],
}

export default topic
