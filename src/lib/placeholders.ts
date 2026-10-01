import type { Dest } from '@/topics/types'
import type { Token } from '@/lib/target'

// Что подставлять вместо заглушек в командах и где это взять — простыми словами
export interface PlaceholderInfo {
  token: Token
  /** Как заглушка выглядит в команде */
  mark: string
  title: string
  /** Коротко: что это */
  what: string
  /** Где взять — markdown, по шагам */
  where: string
  /** Готовые команды, которые помогают это узнать (без заглушек) */
  cmds?: string[]
  /** Кнопки «подставить»: в поле цели или порта */
  fill?: { label: string; value: string; field: 'target' | 'port' }[]
  links?: { label: string; to: Dest }[]
}

export const PLACEHOLDERS: PlaceholderInfo[] = [
  {
    token: 'ip',
    mark: '<ip>',
    title: 'IP-адрес (или домен) цели',
    what: 'Адрес устройства или сайта, который ты проверяешь. Как адрес дома: по нему команда понимает, куда «постучаться». Сюда можно вписать и домен, например `example.com`.',
    where: `- **Свой компьютер:** впиши \`127.0.0.1\` — это значит «я сам». Или свой IP в сети: его покажет команда ниже.
- **Свой роутер:** обычно это твой IP с \`1\` на конце (\`192.168.1.23\` → \`192.168.1.1\`). Точный адрес даёт \`route -n get default\` (Mac) или \`ip route\` (Linux). В Windows это «Основной шлюз» в \`ipconfig\`.
- **Другое своё устройство:** его адрес есть в списке подключённых в панели роутера.
- **Свой сайт:** впиши домен без \`https://\`.
- **Не знаешь, с чего начать?** Нажми «мой компьютер» ниже.`,
    cmds: ['ifconfig', 'ip a', 'ipconfig', 'route -n get default'],
    fill: [
      { label: 'мой компьютер (127.0.0.1)', value: '127.0.0.1', field: 'target' },
      { label: 'учебная мишень scanme.nmap.org', value: 'scanme.nmap.org', field: 'target' },
    ],
    links: [
      { label: 'Вставить вывод и найти свой IP', to: { id: 'explain' } },
      { label: 'Подробно: как узнать свой IP', to: { id: 'questions', sub: 'my-network', sub2: 'my-ip' } },
    ],
  },
  {
    token: 'net',
    mark: '<net>',
    title: 'Сеть целиком',
    what: 'Вся твоя домашняя сеть сразу, записанная как `192.168.1.0/24`. Это значит «все адреса от .1 до .254», то есть все устройства дома. Нужна, когда ищешь устройства, а не проверяешь одно.',
    where: `- **Искать не надо.** Впиши свой IP в поле цели — сеть соберётся сама: \`192.168.1.23\` → \`192.168.1.0/24\`.
- **Свой IP** покажет \`ifconfig\` (Mac), \`ip a\` (Linux) или \`ipconfig\` (Windows). Вставь вывод в «Разобрать вывод» — там будет кнопка «цель: мой IP».
- **Можно вписать и целиком:** \`192.168.1.0/24\` (цифры замени на свои).`,
    cmds: ['ifconfig', 'ip a', 'ipconfig'],
    links: [
      { label: 'Вставить вывод и найти свой IP', to: { id: 'explain' } },
      { label: 'Подробно: как узнать свой IP', to: { id: 'questions', sub: 'my-network', sub2: 'my-ip' } },
    ],
  },
  {
    token: 'domain',
    mark: '<domain>',
    title: 'Домен сайта',
    what: 'Адрес сайта словами, например `example.com`. Пиши без `https://` и без пути после `/`.',
    where: `- **Свой сайт:** возьми адрес из адресной строки браузера и убери \`https://\` и всё после первой \`/\`. Например \`https://www.example.com/page\` → \`www.example.com\` или \`example.com\`.
- **Нет своего сайта?** Для тренировки впиши \`example.com\` — это специальный домен для примеров.
- Чужие сайты без разрешения владельца не проверяем.`,
    fill: [{ label: 'пример: example.com', value: 'example.com', field: 'target' }],
    links: [{ label: 'Подробно: что такое домен', to: { id: 'questions', sub: 'basics', sub2: 'what-is-domain' } }],
  },
  {
    token: 'port',
    mark: '<port>',
    title: 'Номер порта',
    what: 'Номер «двери», на которой работает программа: например `3000`, `5173`, `8080`. Нужен, когда проверяешь конкретную программу.',
    where: `- **Свой проект:** при запуске он пишет адрес, например \`Local: http://localhost:5173\` — порт после двоеточия (\`5173\`).
- **Не помнишь?** Запусти команду со списком слушающих портов и найди свою программу.
- **Для сайтов:** \`80\` — обычный, \`443\` — защищённый (их обычно не пишут).
- **Нашёл через nmap:** порт со словом \`open\`.`,
    cmds: ['lsof -iTCP -sTCP:LISTEN -n -P', 'ss -tlnp', 'netstat -ano | findstr LISTENING'],
    fill: [
      { label: '3000', value: '3000', field: 'port' },
      { label: '5173', value: '5173', field: 'port' },
      { label: '8080', value: '8080', field: 'port' },
    ],
    links: [{ label: 'Подробно: что такое порт', to: { id: 'questions', sub: 'basics', sub2: 'what-is-port' } }],
  },
]

export const placeholderInfo = (t: Token) => PLACEHOLDERS.find((p) => p.token === t)!
