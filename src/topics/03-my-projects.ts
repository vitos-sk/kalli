import { Code } from 'lucide-react'
import type { Topic } from './types'

const topic: Topic = {
  id: 'my-projects',
  title: 'Мои проекты и компьютер',
  icon: Code,
  blurb: 'Какие порты открыты на компьютере и не виден ли твой проект всей сети.',
  order: 3,
  questions: [
    {
      id: 'what-listens',
      q: 'Какие порты открыл мой компьютер?',
      level: 'start',
      popular: true,
      keywords: ['слушает порт', 'lsof', 'открытые порты компьютера', 'мои порты'],
      a: `Запусти команду для своей системы и вставь вывод на странице «Разобрать вывод» — я скажу, что видно только тебе, а что всей сети.

Как читать самому:

- \`127.0.0.1:3000\` — слушает только твой компьютер. Хорошо.
- \`*:3000\` или \`0.0.0.0:3000\` — слушает **всю сеть**. Любой в твоём Wi-Fi может открыть.`,
      cmds: ['lsof -iTCP -sTCP:LISTEN -n -P', 'ss -tlnp', 'netstat -ano | findstr LISTENING'],
      link: { label: 'Разобрать вывод', to: { id: 'explain' } },
      related: ['my-projects/project-visible'],
    },
    {
      id: 'project-visible',
      q: 'Почему мой проект виден всем в Wi-Fi?',
      level: 'start',
      popular: true,
      keywords: ['dev-сервер', 'доступен всем', '0.0.0.0'],
      a: `Если в списке портов стоит \`*:3000\` или \`0.0.0.0:3000\`, программа слушает **все** подключения. Любое устройство в твоей сети может открыть твой проект. В кафе или общежитии это особенно важно.

Для разработки нужен адрес \`127.0.0.1\` (localhost) — тогда проект видишь только ты.`,
      link: { label: 'Как запустить только для себя', to: { id: 'questions', sub: 'my-projects', sub2: 'localhost-only' } },
    },
    {
      id: 'localhost-only',
      q: 'Как запустить проект только для себя?',
      level: 'next',
      keywords: ['host 127.0.0.1', 'next dev', 'vite', 'flask', 'django'],
      a: `Добавь в команду запуска адрес \`127.0.0.1\`:

- **Next.js:** \`next dev -H 127.0.0.1\`
- **Vite:** \`vite --host 127.0.0.1\`
- **Flask:** \`flask run --host 127.0.0.1\`
- **Django:** \`python manage.py runserver 127.0.0.1:8000\`
- **Python:** \`python3 -m http.server --bind 127.0.0.1\`

Потом проверь список портов: вместо \`*\` должно стоять \`127.0.0.1\`.`,
      cmds: ['lsof -iTCP -sTCP:LISTEN -n -P'],
    },
    {
      id: 'port-busy',
      q: 'Порт занят — кто его держит?',
      level: 'next',
      keywords: ['port already in use', 'порт занят', 'address already in use'],
      a: `Подставь номер порта вместо \`3000\`. В колонке \`COMMAND\` — программа, в \`PID\` — её номер. Закрой её как обычную программу.`,
      cmds: ['lsof -i :3000'],
    },
    {
      id: 'mac-firewall',
      q: 'Как включить файрвол на Mac?',
      level: 'next',
      keywords: ['файрвол mac', 'брандмауэр'],
      a: `Системные настройки → **Сеть** → **Файрвол** → включить. Он закроет входящие подключения к программам, которым ты не разрешил.

Проверить, включён ли он сейчас, можно командой (она только смотрит):`,
      cmds: ['/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate'],
    },
    {
      id: 'find-my-api',
      q: 'Как найти свой API в сети и проверить его пути?',
      level: 'next',
      keywords: ['свои api', 'эндпоинты', 'health', 'docs', 'openapi'],
      a: `Сначала найди, где в сети живут сайты и API. Потом пройдись по типовым путям своего API: \`200\` — отвечает без входа, \`401\` и \`403\` — защищено.

Впиши свой IP в поле цели. Порт \`3000\` замени на свой.`,
      cmds: ['nmap -p 80,443,3000,5000,8000,8080,8443 --open <net>', 'for p in /health /docs /openapi.json /admin; do echo "== $p"; curl -s -o /dev/null -w "%{http_code}\\n" http://<ip>:3000$p; done'],
      link: { label: 'Пошаговая тренировка', to: { id: 'playbooks', sub: 'inventory' } },
    },
  ],
}

export default topic
