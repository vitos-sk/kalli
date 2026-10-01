import { AlertTriangle, ArrowRight, Check } from 'lucide-react'
import { useMemo, useState } from 'react'
import { branches } from '@/branches'
import { PageTitle } from '@/components/Situations'
import { Window } from '@/components/ui/card'
import { explainLine } from '@/lib/explain'
import { commandInfo, genericHints, ipFinding, stripAnsi } from '@/lib/generic'
import { useTarget } from '@/lib/target'
import { cn } from '@/lib/utils'
import type { Finding } from '@/branches/types'

const MAX = 20000
const ICON = { good: Check, warn: AlertTriangle, info: ArrowRight }
const TONE = { good: 'text-primary', warn: 'text-[#f5c542]', info: 'text-muted-foreground' }

// Что страница умеет разбирать — показываем, если формат не узнан
const SUPPORTED = ['ifconfig / ip a / ipconfig', 'route / ip route (адрес роутера)', 'arp -a', 'nmap', 'lsof / ss (слушающие порты)', 'ping', 'curl -I (заголовки)', 'dig / whois / openssl (домен и сертификат)']

// Вставляешь свой вывод — получаешь итог и пояснение к каждой строке. Всё считается в браузере.
export function Explain({ onSituation }: { onSituation: (id: string) => void }) {
  const [raw, setRaw] = useState('')
  const { target, setTarget } = useTarget()

  const ready = useMemo(() => branches.filter((b) => !b.soon), [])
  const hints = useMemo(() => [...genericHints, ...ready.flatMap((b) => b.lineHints ?? [])], [ready])
  // примеры по группам (по веткам), чтобы не было «стены» кнопок
  const groups = useMemo(
    () => ready.map((b) => ({ title: b.title, items: (b.samples ?? []).filter((x) => x.explain) })).filter((g) => g.items.length),
    [ready],
  )

  // чистим цветовые коды терминала; всё остальное (строки приглашения тоже) разбираем как есть
  const text = useMemo(() => stripAnsi(raw), [raw])

  const findings: Finding[] = useMemo(() => {
    if (!text.trim()) return []
    const seen = new Set<string>()
    const specific = ready.flatMap((b) => b.analyze?.(text) ?? [])
    const all = [
      ...commandInfo(text),
      ...specific,
      // универсальный разбор адресов — когда ничего более точного с кнопками «цель» не нашли
      ...(specific.some((f) => f.actions) ? [] : ipFinding(text)),
    ]
    // общий разбор nmap подключён в нескольких ветках — убираем повторы по тексту
    return all.filter((f) => !seen.has(f.text) && !!seen.add(f.text))
  }, [ready, text])

  const lines = useMemo(() => text.split('\n').slice(0, 300), [text])

  return (
    <div className="space-y-4">
      <PageTitle title="Разобрать вывод" hint="Вставь вывод любой команды — объясню, что в нём важно, где твой IP и роутер и что делать дальше. Строку с приглашением терминала (❯) можно не стирать." />

      <Window title="вставь вывод" bodyClassName="space-y-3">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value.slice(0, MAX))}
          rows={9}
          spellCheck={false}
          aria-label="Вывод для разбора"
          placeholder={'Вставь сюда вывод команды, например:\n\n❯ route -n get default\n    gateway: 192.168.1.1\n  interface: en0'}
          className="w-full resize-y border bg-black p-3 font-mono text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary"
        />

        <div className="space-y-3">
          <p className="label text-[10px] text-muted-foreground">или попробуй на примере</p>
          {groups.map((g) => (
            <div key={g.title} className="space-y-1.5">
              <p className="label text-[9px] text-muted-foreground/70">{g.title}</p>
              <div className="flex flex-wrap gap-2">
                {g.items.map((x) => (
                  <button key={x.id} type="button" onClick={() => setRaw(x.text)} className="cursor-pointer border border-primary/50 px-3 py-1.5 text-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                    {x.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {raw && (
            <button type="button" onClick={() => setRaw('')} className="label h-9 cursor-pointer px-3 text-muted-foreground hover:text-foreground">
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
              <div className="space-y-3 text-[15px] leading-relaxed">
                <p>Этот формат я пока не узнал, но строки внизу разобрал по смыслу, где смог. Вот что я понимаю хорошо:</p>
                <ul className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                  {SUPPORTED.map((s) => (
                    <li key={s} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 bg-primary" />{s}</li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground">Проверь, что вставлен весь вывод. Нужна другая команда — скажи, добавим.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {findings.map((f, i) => {
                  const Icon = ICON[f.tone ?? 'info']
                  return (
                    <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed">
                      <Icon className={cn('mt-1 size-4 shrink-0', TONE[f.tone ?? 'info'])} />
                      <span className="min-w-0 flex-1">
                        {f.text}
                        {f.actions && (
                          <span className="mt-2 flex flex-wrap gap-2">
                            {f.actions.map((a) => (
                              <button
                                key={a.target}
                                type="button"
                                onClick={() => setTarget(a.target)}
                                className={cn('label h-8 cursor-pointer px-2.5 text-[10px]', target === a.target ? 'border border-primary text-primary' : 'bg-primary text-primary-foreground hover:bg-foreground')}
                              >
                                {target === a.target ? '✓ ' : ''}{a.label}
                              </button>
                            ))}
                          </span>
                        )}
                      </span>
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
