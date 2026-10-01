import { AlertTriangle, ArrowRight, Check } from 'lucide-react'
import { useMemo, useState } from 'react'
import { branches } from '@/branches'
import { PageTitle } from '@/components/Situations'
import { Window } from '@/components/ui/card'
import { explainLine } from '@/lib/explain'
import { cn } from '@/lib/utils'
import type { Finding } from '@/branches/types'

const MAX = 20000
const ICON = { good: Check, warn: AlertTriangle, info: ArrowRight }
const TONE = { good: 'text-primary', warn: 'text-[#f5c542]', info: 'text-muted-foreground' }

// Вставляешь свой вывод — получаешь итог и пояснение к каждой строке. Всё считается в браузере.
export function Explain({ onSituation }: { onSituation: (id: string) => void }) {
  const [text, setText] = useState('')

  const ready = branches.filter((b) => !b.soon)
  const hints = useMemo(() => ready.flatMap((b) => b.lineHints ?? []), [ready])
  const sample = ready.find((b) => b.samples?.length)?.samples?.[1]?.text ?? ''

  const findings: Finding[] = useMemo(() => (text.trim() ? ready.flatMap((b) => b.analyze?.(text) ?? []) : []), [ready, text])
  const lines = useMemo(() => text.split('\n').slice(0, 300), [text])

  return (
    <div className="space-y-4">
      <PageTitle title="Разобрать вывод" hint="Вставь результат nmap — объясню, что в нём важно, и подскажу, что делать дальше." />

      <Window title="вставь вывод" bodyClassName="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          rows={9}
          spellCheck={false}
          aria-label="Вывод для разбора"
          placeholder={'Starting Nmap 7.94 ( https://nmap.org )\nPORT   STATE SERVICE\n22/tcp open  ssh\n…'}
          className="w-full resize-y border bg-black p-3 font-mono text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary"
        />
        <div className="flex flex-wrap items-center gap-2">
          {sample && (
            <button type="button" onClick={() => setText(sample)} className="label h-9 cursor-pointer border border-primary/60 px-3 text-primary hover:bg-primary hover:text-primary-foreground">
              вставить пример
            </button>
          )}
          {text && (
            <button type="button" onClick={() => setText('')} className="label h-9 cursor-pointer px-3 text-muted-foreground hover:text-foreground">
              очистить
            </button>
          )}
          <span className="text-xs text-muted-foreground sm:ml-auto">Текст остаётся в твоём браузере — никуда не отправляется.</span>
        </div>
      </Window>

      {text.trim() && (
        <>
          <Window title="итог">
            {findings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Не узнал формат. Пока я понимаю вывод nmap — проверь, что вставлен весь текст.</p>
            ) : (
              <ul className="space-y-3">
                {findings.map((f, i) => {
                  const Icon = ICON[f.tone ?? 'info']
                  return (
                    <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed">
                      <Icon className={cn('mt-1 size-4 shrink-0', TONE[f.tone ?? 'info'])} />
                      <span className="flex-1">{f.text}</span>
                      {f.situationId && (
                        <button type="button" onClick={() => onSituation(f.situationId!)} className="label shrink-0 cursor-pointer text-[10px] text-primary hover:underline">
                          что делать
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Window>

          <Window title="построчно" bodyClassName="p-0 sm:p-0">
            <ul className="divide-y">
              {lines.map((line, i) => {
                if (!line.trim()) return null
                const why = explainLine(hints, line)
                return (
                  <li key={i} className="px-4 py-2.5">
                    <code className={cn('block overflow-x-auto whitespace-pre font-mono text-sm', /\bopen\b/.test(line) && 'text-primary')}>{line}</code>
                    {why && <p className="mt-1 border-l-2 border-primary pl-3 text-sm text-muted-foreground">{why}</p>}
                  </li>
                )
              })}
            </ul>
          </Window>
        </>
      )}
    </div>
  )
}
