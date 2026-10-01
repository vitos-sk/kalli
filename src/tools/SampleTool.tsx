import { Play } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Window } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ToolProps } from '@/branches/types'

// Универсальный инструмент: выбрать пример вывода и показать его в терминале
export function SampleTool({ runSample, samples }: ToolProps) {
  const [id, setId] = useState(samples[0]?.id)
  const current = samples.find((s) => s.id === id) ?? samples[0]

  return (
    <Window title="запуск примера" bodyClassName="space-y-4">
      <div className="space-y-2">
        <p className="label text-[10px] text-muted-foreground">выбери пример</p>
        <div className="flex flex-wrap gap-2">
          {samples.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === id}
              onClick={() => setId(s.id)}
              className={cn('cursor-pointer border px-3 py-2 text-sm transition-colors', s.id === id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/60')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">
            Наведи на строку в терминале (на телефоне — тапни), и я объясню, что она значит.
          </p>
          <p className="text-xs text-muted-foreground/70">Это демонстрация: ничего не выполняется. Свой вывод вставь на странице «Разобрать вывод».</p>
        </div>
        <Button onClick={() => runSample(current?.text, current?.label)} className="shrink-0">
          <Play /> Запустить пример
        </Button>
      </div>
    </Window>
  )
}
