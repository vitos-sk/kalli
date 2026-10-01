import Markdown from 'react-markdown'
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
              <Markdown
                components={{
                  ul: (p) => <ul className="space-y-2" {...p} />,
                  li: (p) => (
                    <li className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:size-1.5 before:bg-primary" {...p} />
                  ),
                  strong: (p) => <strong className="font-semibold text-primary" {...p} />,
                  code: (p) => <code className="bg-secondary px-1.5 py-0.5 font-mono text-[13px] text-primary" {...p} />,
                }}
              >
                {rest.join('\n').trim()}
              </Markdown>
            </div>
          </Window>
        )
      })}
    </div>
  )
}
