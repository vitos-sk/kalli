import { ChevronRight, Copy, Crosshair, X } from 'lucide-react'
import { useState } from 'react'
import { notes } from '@/lib/store'
import { useTarget, type Token } from '@/lib/target'
import { cn } from '@/lib/utils'

// Цель вводится один раз — и подставляется во все команды вместо <ip>.
// К каждой цели можно вести заметки (хранятся только в этом браузере).
// tokens — какие заглушки есть в командах на странице: лишние поля не показываем.
// Пока цель задана, блок сворачивается в одну строку.
const ALL: Token[] = ['ip', 'domain', 'net', 'port']

export function TargetField({ tokens = ALL }: { tokens?: Token[] }) {
  const { target, setTarget, port, setPort } = useTarget()
  const needPort = tokens.includes('port')
  const needHost = tokens.some((t) => t !== 'port')
  const onlyDomain = tokens.includes('domain') && !tokens.includes('ip') && !tokens.includes('net')
  const [edit, setEdit] = useState(false)
  const filled = (!needHost || !!target) && (!needPort || !!port)
  const [open, setOpen] = useState(false)
  const all = notes.use()
  const note = all[target] ?? ''

  if (filled && !edit) {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 border bg-card px-3 py-2">
        <Crosshair className="size-3.5 shrink-0 text-primary" />
        <span className="label text-[10px] text-muted-foreground">подставлено в команды:</span>
        {needHost && <span className="font-mono text-sm text-primary">{target}</span>}
        {needPort && <span className="font-mono text-sm text-primary">порт {port}</span>}
        <button type="button" onClick={() => setEdit(true)} className="label ml-auto cursor-pointer text-[10px] text-muted-foreground hover:text-primary">изменить</button>
      </div>
    )
  }

  return (
    <div className="mb-4 space-y-2 border bg-card p-3 sm:p-4">
      {needHost && <>
      <label htmlFor="target" className="label flex items-center gap-2 text-primary">
        <Crosshair className="size-3.5" /> {onlyDomain ? 'сайт: домен' : tokens.includes('net') && !tokens.includes('ip') ? 'цель: IP (сеть соберётся сама)' : 'цель: IP, домен или сеть'}
      </label>
      <div className="flex gap-2">
        <div className="flex min-w-0 flex-1 items-center border bg-black focus-within:border-primary">
          <input
            id="target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={onlyDomain ? 'домен, например example.com' : 'IP или домен, например 192.168.1.10'}
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-10 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm outline-none placeholder:text-muted-foreground/60"
          />
          {target && (
            <button type="button" onClick={() => setTarget('')} aria-label="Очистить цель" className="flex size-10 cursor-pointer items-center justify-center text-muted-foreground hover:text-primary">
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="label text-[9px] text-muted-foreground">быстро:</span>
        {[['мой компьютер', '127.0.0.1'], ['scanme.nmap.org', 'scanme.nmap.org']].map(([label, v]) => (
          <button key={v} type="button" onClick={() => setTarget(v)} className={cn('label h-7 cursor-pointer border px-2 text-[10px] transition-colors', target === v ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/50 text-primary hover:bg-primary/10')}>
            {label}
          </button>
        ))}
      </div>
      </>}
      {needPort && (
      <div className={cn('space-y-2 pt-3', needHost && 'border-t')}>
        <label htmlFor="port" className="label text-[10px] text-muted-foreground">порт — номер «двери» твоей программы</label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="port"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="например 3000"
            inputMode="numeric"
            className="h-9 w-36 border bg-black px-3 font-mono text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary"
          />
          {['3000', '5173', '8080'].map((v) => (
            <button key={v} type="button" onClick={() => setPort(v)} className={cn('label h-9 cursor-pointer border px-2.5 text-[10px] transition-colors', port === v ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/50 text-primary hover:bg-primary/10')}>
              {v}
            </button>
          ))}
        </div>
      </div>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        То, что ты впишешь, подставится в команды вместо заглушек:{' '}
        {ALL.filter((t) => tokens.includes(t)).map((t, i) => (
          <span key={t}>{i > 0 && ', '}<a href={`#/values/${t}`} className="font-mono text-primary underline underline-offset-2">&lt;{t}&gt;</a></span>
        ))}
        . Не знаешь, что вписать? <a href="#/values" className="whitespace-nowrap text-primary underline underline-offset-2">Где взять эти значения →</a> Сканируй только свои цели и учебные мишени.
      </p>

      {filled && (
        <button type="button" onClick={() => setEdit(false)} className="label h-8 cursor-pointer border border-primary/50 px-3 text-[10px] text-primary hover:bg-primary/10">готово</button>
      )}

      {needHost && <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="label flex cursor-pointer items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className={cn('size-3.5 text-primary transition-transform', open && 'rotate-90')} />
        заметки{target ? ` · ${target}` : ''}
        {note && <span className="size-1.5 bg-primary" aria-label="есть заметка" />}
      </button>}
      {needHost && open && (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => notes.set(target, e.target.value)}
            maxLength={5000}
            rows={5}
            placeholder="Что нашёл: открытые порты, версии, идеи на потом…"
            className="w-full resize-y border bg-black p-3 font-mono text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary"
          />
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{target ? 'Заметка привязана к этой цели.' : 'Общая заметка (цель не указана).'} Хранится только в браузере.</span>
            {note && (
              <button type="button" onClick={() => navigator.clipboard?.writeText(note)} className="label flex shrink-0 cursor-pointer items-center gap-1.5 text-[10px] text-primary hover:underline">
                <Copy className="size-3" /> копировать
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
