/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** SHA-256 пароля для LockGate (см. scripts/hash-password.mjs). Не задан — замок выключен. */
  readonly VITE_LOCK_HASH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
