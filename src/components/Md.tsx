import Markdown from 'react-markdown'

// Единый вид простого markdown: абзацы, списки, жирный (акцент), код
export function Md({ children }: { children: string }) {
  return (
    <Markdown
      components={{
        ul: (p) => <ul className="space-y-2" {...p} />,
        ol: (p) => <ol className="list-decimal space-y-2 pl-5 marker:text-primary" {...p} />,
        li: (p) => <li className="relative [ul>&]:pl-5 [ul>&]:before:absolute [ul>&]:before:left-0 [ul>&]:before:top-[0.55em] [ul>&]:before:size-1.5 [ul>&]:before:bg-primary" {...p} />,
        strong: (p) => <strong className="font-semibold text-primary" {...p} />,
        code: (p) => <code className="bg-secondary px-1.5 py-0.5 font-mono text-[13px] text-primary" {...p} />,
      }}
    >
      {children}
    </Markdown>
  )
}
