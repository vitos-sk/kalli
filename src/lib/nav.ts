// Переход по hash-адресу из любого места (без передачи go через props)
export function goTo(id: string, sub?: string, sub2?: string) {
  window.location.hash = '/' + [id, sub, sub2].filter(Boolean).join('/')
}
