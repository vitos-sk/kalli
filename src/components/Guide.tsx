import { Md } from '@/components/Md'
import { Window } from '@/components/ui/card'

// Гайд делим по «## Заголовкам» на окна: каждое — один вопрос шпаргалки
export function Guide({ markdown }: { markdown: string }) {
  const sections = markdown.split(/^## /m).filter(Boolean)

  return (
    <div className="space-y-4">
      {sections.map((sec, i) => {
        const [title, ...rest] = sec.split('\n')
        return (
          <Window key={title} title={`${String(i + 1).padStart(2, '0')} // ${title}`}>
            <div className="space-y-3 text-[15px] leading-relaxed text-foreground/90">
              <Md>{rest.join('\n').trim()}</Md>
            </div>
          </Window>
        )
      })}
    </div>
  )
}
