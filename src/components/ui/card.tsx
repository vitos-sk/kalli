import * as React from 'react'
import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('border bg-card text-card-foreground', className)} {...props} />
}

// «Окно» в духе старых ОС: строка заголовка с крестиком + тело
function Window({
  title,
  className,
  bodyClassName,
  children,
}: {
  title: string
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn('border bg-card text-card-foreground', className)}>
      <header className="label flex h-9 items-center justify-between border-b px-3 text-foreground/90">
        <span className="truncate">{title}</span>
        <span aria-hidden className="grid size-4 shrink-0 place-items-center border border-primary/60 text-[10px] leading-none text-primary">×</span>
      </header>
      <div className={cn('p-4 sm:p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

export { Card, Window }
