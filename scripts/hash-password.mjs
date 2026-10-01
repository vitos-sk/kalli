#!/usr/bin/env node
// Считает SHA-256 от пароля — вставь результат в .env.local как VITE_LOCK_HASH.
// Запуск: node scripts/hash-password.mjs "мой-пароль"

import { createHash } from 'node:crypto'

const pw = process.argv[2]
if (!pw) {
  console.error('Использование: node scripts/hash-password.mjs "пароль"')
  process.exit(1)
}

const hash = createHash('sha256').update(pw, 'utf8').digest('hex')
console.log('\nДобавь строку в .env.local (создай файл в корне проекта, если его ещё нет):\n')
console.log(`VITE_LOCK_HASH=${hash}\n`)
console.log('Файл .env.local не коммитится в git (см. .gitignore) — пароль не попадёт в репозиторий.')
