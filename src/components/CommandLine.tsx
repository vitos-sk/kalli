import { AlertTriangle, Check, ChevronRight, Copy, HelpCircle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { PlaceholderHelp } from '@/components/PlaceholderHelp'
import { copyText } from '@/lib/clipboard'
import { breakdown } from '@/lib/glossary'
import { goTo } from '@/lib/nav'
import { placeholderInfo } from '@/lib/placeholders'
import { TOKEN_RE, tokenKey, unresolved, useTarget, type Token } from '@/lib/target'
import { cn } from '@/lib/utils'
import type { CommandFlag } from '@/branches/types'

// Заглушки <ip>, <net>… — кликабельные «чипы»: нажми, и под командой раскроется объяснение
function Cmd({ text, active, onToken }: { text: string; active: Token | null; onToken: (t: Token) => void }) {
  return text.split(/(<(?:ip|target|domain|net|port)>)/).map((part, i) => {
    const m = part.match(new RegExp(TOKEN_RE.source))
    if (!m) return <span key={i}>{part}</span>
    const t = tokenKey(m[1])
    return (
      <button
        key={i}
        type="button"
        onClick={() => onToken(t)}
        aria-label={`Что вписать вместо ${part}`}
        aria-expanded={active === t}
        className={cn('mx-0.5 inline-flex cursor-pointer items-center gap-1 border border-primary/70 px-1.5 text-primary transition-colors hover:bg-primary hover:text-primary-foreground', active === t ? 'bg-primary text-primary-foreground' : 'bg-primary/15')}
      >
        {part}
        <HelpCircle className="size-3" />
      </button>
    )
  })
}

// Строка команды с копированием. Цель, сеть и порт подставляются из поля цели.
// Если в команде остались места «для замены» — это сразу видно и объяснено.
export function CommandLine({ cmd, before, flags }: { cmd: string; before?: ReactNode; flags?: CommandFlag[] }) {
  const { apply } = useTarget()
  const [done, setDone] = useState(false)
  const [help, setHelp] = useState<Token | null>(null)
  const [parts, setParts] = useState(false)
  const rows = breakdown(cmd, flags)
  const full = apply(cmd)
  const open = unresolved(full)

  const onCopy = async () => {
    await copyText(full)
    setDone(true)
    window.setTimeout(() => setDone(false), 1400)
  }
  const toggle = (t: Token) => setHelp((h) => (h === t ? null : t))

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center gap-2 border bg-black py-2 pl-3 pr-1.5">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm leading-8">
          <span className="select-none text-primary">$ </span>
          <Cmd text={full} active={help} onToken={toggle} />
        </code>
        {before}
        <button
          type="button"
          onClick={onCopy}
          aria-label="Скопировать команду"
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {done ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
        </button>
      </div>

      {rows.length > 0 && (
        <div>
          <button type="button" aria-expanded={parts} onClick={() => setParts((v) => !v)} className="label flex cursor-pointer items-center gap-1.5 text-[10px] text-primary hover:underline">
            <ChevronRight className={cn('size-3.5 transition-transform', parts && 'rotate-90')} />
            что здесь написано? (разбор по частям)
          </button>
          {parts && (
            <dl className="mt-2 divide-y border bg-card">
              {rows.map((r) => (
                <div key={r.token} className="grid gap-1 px-3 py-2.5 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-4">
                  <dt className="break-all font-mono text-sm text-primary">{r.token}</dt>
                  <dd className="text-sm leading-relaxed text-foreground/90">{r.text}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {open.length > 0 && (
        <div className="space-y-1.5 border-l-2 border-[#f5c542] bg-accent px-3 py-2 text-sm">
          <p className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#f5c542]" /><span>В команде есть место, которое нужно <strong>заменить на своё</strong>:</span></p>
          <ul className="space-y-1">
            {open.map((t) => (
              <li key={t} className="flex flex-wrap items-center gap-x-2">
                <span className="font-mono text-primary">{placeholderInfo(t).mark}</span>
                <span className="text-muted-foreground">— {placeholderInfo(t).title.toLowerCase()}</span>
                <button type="button" onClick={() => toggle(t)} className="label cursor-pointer text-[10px] text-primary underline underline-offset-2 hover:no-underline">
                  где взять?
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {help && <PlaceholderHelp token={help} onClose={() => setHelp(null)} onGo={goTo} />}
    </div>
  )
}
