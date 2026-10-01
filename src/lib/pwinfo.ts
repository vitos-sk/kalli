import type { Finding, LineHint } from '@/branches/types'

// Пояснения к строкам журналов входа (auth.log, fail2ban) — проверяем СВОЙ сервер
export const pwHints: LineHint[] = [
  { pattern: /Failed password for (invalid user )?(\S+) from ([\d.]+)/, text: (m) => `Неудачная попытка входа под именем «${m[2]}» с адреса ${m[3]}.${m[1] ? ' Такого пользователя даже не существует — явный перебор.' : ''}` },
  { pattern: /Accepted password for (\S+) from ([\d.]+)/, text: (m) => `Успешный вход под именем «${m[1]}» с адреса ${m[2]}. Это точно ты?` },
  { pattern: /Accepted publickey for (\S+) from ([\d.]+)/, text: (m) => `Вход по ключу (не по паролю) под именем «${m[1]}» с адреса ${m[2]} — самый безопасный способ входа.` },
  { pattern: /Ban (\S+)/, text: (m) => `fail2ban заблокировал адрес ${m[1]} — он слишком много раз ошибся с паролем.` },
  { pattern: /maxretry/i, text: 'Настройка: сколько неудачных попыток разрешено, прежде чем адрес заблокируют.' },
  { pattern: /PasswordAuthentication\s+(yes|no)/i, text: (m) => (m[1] === 'yes' ? 'Вход по паролю разрешён. Надёжнее — только по ключу (no).' : 'Вход по паролю запрещён — только по ключу. Хорошо.') },
  { pattern: /PermitRootLogin\s+(yes|no|prohibit-password)/i, text: (m) => (m[1] === 'yes' ? 'Вход под root по паролю разрешён — самая частая цель перебора. Отключи.' : 'Прямой вход под root ограничен. Хорошо.') },
]

// Разбор вставленного журнала входов своего сервера: ищем признаки перебора пароля
export function pwAnalyze(text: string): Finding[] {
  const out: Finding[] = []

  const fails = [...text.matchAll(/Failed password for (?:invalid user )?(\S+) from ([\d.]+)/g)]
  if (fails.length) {
    const byIp = new Map<string, number>()
    for (const [, , ip] of fails) byIp.set(ip, (byIp.get(ip) ?? 0) + 1)
    const top = [...byIp.entries()].sort((a, b) => b[1] - a[1])[0]
    out.push({
      tone: fails.length >= 10 ? 'warn' : 'info',
      text: `Неудачных попыток входа: ${fails.length}${top ? `, больше всего с адреса ${top[0]} (${top[1]})` : ''}. Один-два промаха — это нормально (сам ошибся). Десятки подряд с одного адреса — это перебор пароля (бот ищет слабый пароль).`,
    })
  }

  if (/PasswordAuthentication\s+yes/i.test(text)) {
    out.push({ tone: 'warn', text: 'Вход по паролю включён. Надёжнее перейти на вход по ключу и выключить пароль совсем.' })
  }
  if (/PermitRootLogin\s+yes/i.test(text)) {
    out.push({ tone: 'warn', text: 'Прямой вход под root по паролю разрешён — первая цель любого перебора. Отключи (PermitRootLogin no или prohibit-password).' })
  }
  if (/Ban\s+[\d.]+/.test(text)) {
    out.push({ tone: 'good', text: 'fail2ban уже блокирует адреса с перебором — защита работает.' })
  } else if (fails.length >= 10) {
    out.push({ tone: 'info', text: 'Перебор идёт, а автоблокировки не видно. Поставь fail2ban (Linux) или ограничь вход по IP.' })
  }

  return out
}
