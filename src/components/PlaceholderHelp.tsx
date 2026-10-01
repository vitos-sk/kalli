import { ArrowRight, Check, Copy, X } from 'lucide-react'
import { useState } from 'react'
import { Md } from '@/components/Md'
import { copyText } from '@/lib/clipboard'
import { placeholderInfo } from '@/lib/placeholders'
import { netOf, useTarget, type Token } from '@/lib/target'
import { cn } from '@/lib/utils'

function Plain({ cmd }: { cmd: string }) {
  const [ok, setOk] = useState(false)
  return (
    <div className="flex items-center gap-2 border bg-black py-1.5 pl-3 pr-1">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm"><span className="select-none text-primary">$ </span>{cmd}</code>
      <button
        type="button"
        aria-label="Скопировать команду"
        onClick={async () => { await copyText(cmd); setOk(true); window.setTimeout(() => setOk(false), 1400) }}
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground"
      >
        {ok ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
      </button>
    </div>
  )
}

// Объяснение одной заглушки: что это, где взять, кнопки «подставить».
// Используется под командой (compact) и на странице «Что подставлять» (полная карточка).
export function PlaceholderHelp({ token, onClose, onGo }: { token: Token; onClose?: () => void; onGo: (id: string, sub?: string, sub2?: string) => void }) {
  const info = placeholderInfo(token)
  const { target, setTarget, port, setPort } = useTarget()
  const net = netOf(target)

  return (
    <div className="space-y-3 border border-primary/60 bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="label text-[10px] text-primary">что сюда вписать</p>
          <h3 className="mt-1 text-lg"><span className="font-mono text-primary">{info.mark}</span> — {info.title}</h3>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Закрыть объяснение" className="flex size-8 shrink-0 cursor-pointer items-center justify-center text-muted-foreground hover:text-primary">
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="space-y-3 text-[15px] leading-relaxed text-foreground/90">
        <Md>{info.what}</Md>
      </div>

      {token === 'net' && (
        <p className="border-l-2 border-primary bg-accent px-3 py-2 text-sm">
          {net ? <>Сейчас из твоей цели <span className="font-mono">{target}</span> получается сеть <span className="font-mono text-primary">{net}</span>.</> : <>Сейчас цель не похожа на IP-адрес, поэтому сеть собрать нельзя. Впиши свой IP (например <span className="font-mono">192.168.1.23</span>) в поле цели.</>}
        </p>
      )}

      <div className="space-y-2">
        <p className="label text-[10px] text-muted-foreground">где взять</p>
        <div className="space-y-2 text-[15px] leading-relaxed text-foreground/90">
          <Md>{info.where}</Md>
        </div>
      </div>

      {info.cmds && (
        <div className="space-y-2">
          <p className="label text-[10px] text-muted-foreground">команды, которые помогут узнать</p>
          {info.cmds.map((c) => <Plain key={c} cmd={c} />)}
        </div>
      )}

      {info.fill && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="label text-[10px] text-muted-foreground">подставить сразу:</span>
          {info.fill.map((f) => {
            const on = (f.field === 'port' ? port : target) === f.value
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={on}
                onClick={() => (f.field === 'port' ? setPort(f.value) : setTarget(f.value))}
                className={cn('label h-9 cursor-pointer px-3 text-[10px]', on ? 'border border-primary text-primary' : 'bg-primary text-primary-foreground hover:bg-foreground')}
              >
                {on ? '✓ ' : ''}{f.label}
              </button>
            )
          })}
        </div>
      )}

      {info.links && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t pt-3">
          {info.links.map((l) => (
            <button key={l.label} type="button" onClick={() => onGo(l.to.id, l.to.sub, l.to.sub2)} className="label flex cursor-pointer items-center gap-1.5 text-[10px] text-primary hover:underline">
              {l.label} <ArrowRight className="size-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
