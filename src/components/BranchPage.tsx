import { ArrowRight, BookOpen, Check, SquareTerminal, Wrench } from 'lucide-react'
import { branches } from '@/branches'
import { Commands } from '@/components/Commands'
import { Guide } from '@/components/Guide'
import { TargetField } from '@/components/TargetField'
import { Window } from '@/components/ui/card'
import { learned } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useShellTerminal } from '@/lib/terminal'
import { hasPlaceholder } from '@/lib/target'
import type { BranchConfig, TabId } from '@/branches/types'

interface Props {
  branch: BranchConfig
  tab?: string
  onTab: (t: TabId) => void
  onGo: (id: string) => void
  flashCmd?: string
}

// Страница ветки: заголовок + вкладки «Инструмент / Гайд / Команды»
export function BranchPage({ branch, tab, onTab, onGo, flashCmd }: Props) {
  const { play } = useShellTerminal()
  const Tool = branch.tool
  const Icon = branch.icon
  const asTab = (['tool', 'guide', 'commands'] as string[]).includes(tab ?? '') ? (tab as TabId) : undefined
  const current: TabId = asTab && (asTab !== 'tool' || Tool) ? asTab : Tool ? 'tool' : 'guide'
  const isDone = learned.use().includes(branch.id)
  const needsTarget = branch.commands.some((c) => hasPlaceholder(c.cmd))

  return (
    <article>
      <h1 className="glitch mb-6 hidden items-center gap-3 text-3xl font-bold uppercase tracking-wide md:flex">
        <Icon className="size-6 text-primary" />
        {branch.title}
      </h1>

      <button
        type="button"
        aria-pressed={isDone}
        onClick={() => learned.toggle(branch.id)}
        className={cn('label mb-4 hidden h-8 cursor-pointer items-center gap-2 border px-3 transition-colors md:inline-flex', isDone ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/50 text-primary hover:bg-primary/10')}
      >
        <Check className="size-3.5" /> {isDone ? 'изучено' : 'отметить изученным'}
      </button>

      {needsTarget && <TargetField />}

      <Tabs value={current} onValueChange={(v) => onTab(v as TabId)}>
        <TabsList>
          {Tool && <TabsTrigger value="tool"><Wrench className="size-4" />Инструмент</TabsTrigger>}
          <TabsTrigger value="guide"><BookOpen className="size-4" />Гайд</TabsTrigger>
          <TabsTrigger value="commands"><SquareTerminal className="size-4" />Команды</TabsTrigger>
        </TabsList>

        {Tool && (
          <TabsContent value="tool">
            <Tool
              runSample={(text, label, cmd) => play(text ?? branch.terminalSample, label ?? 'пример', cmd ?? branch.commands[0]?.cmd)}
              samples={branch.samples ?? [{ id: 'default', label: 'Пример', text: branch.terminalSample }]}
            />
          </TabsContent>
        )}
        <TabsContent value="guide" className="space-y-4">
          <Guide markdown={branch.guide} />
          {branch.nextSteps && (
            <Window title="что дальше">
              <ul className="space-y-2">
                {branch.nextSteps.map((n) => {
                  const target = branches.find((b) => b.id === n.branchId)
                  return (
                    <li key={n.text} className="flex items-start gap-3 text-[15px]">
                      <ArrowRight className="mt-1 size-4 shrink-0 text-primary" />
                      <span className="flex-1">{n.text}</span>
                      {target?.soon ? (
                        <span className="label shrink-0 text-[9px] text-muted-foreground">скоро</span>
                      ) : target ? (
                        <button type="button" onClick={() => onGo(target.id)} className="label shrink-0 cursor-pointer text-primary hover:underline">открыть</button>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </Window>
          )}
        </TabsContent>
        <TabsContent value="commands"><Commands items={branch.commands} branchId={branch.id} intro={branch.commandsIntro} flashCmd={flashCmd} /></TabsContent>
      </Tabs>
    </article>
  )
}
