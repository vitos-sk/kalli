import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as React from 'react'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

// Сегмент-переключатель: на мобилке на всю ширину, на десктопе компактный
function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'grid w-full auto-cols-fr grid-flow-col gap-1 border bg-card p-1 sm:inline-grid sm:w-auto',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'label inline-flex h-10 cursor-pointer items-center justify-center gap-2 px-4 text-muted-foreground transition-colors hover:text-foreground',
        'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('mt-5 outline-none', className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
