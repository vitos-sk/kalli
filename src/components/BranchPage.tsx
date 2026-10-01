import { BookOpen, SquareTerminal, Wrench } from 'lucide-react'
import { Commands } from '@/components/Commands'
import { Guide } from '@/components/Guide'
import { TargetField } from '@/components/TargetField'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useShellTerminal } from '@/lib/terminal'
import { hasPlaceholder } from '@/lib/target'
import type { BranchConfig, TabId } from '@/branches/types'

interface Props {
  branch: BranchConfig
  tab?: TabId
  onTab: (t: TabId) => void
  flashCmd?: string
}

// Страница ветки: заголовок + вкладки «Инструмент / Гайд / Команды»
export function BranchPage({ branch, tab, onTab, flashCmd }: Props) {
  const { play } = useShellTerminal()
  const Tool = branch.tool
  const Icon = branch.icon
  const current: TabId = tab && (tab !== 'tool' || Tool) ? tab : Tool ? 'tool' : 'guide'
  const needsTarget = branch.commands.some((c) => hasPlaceholder(c.cmd))

  return (
    <article>
      <h1 className="glitch mb-6 hidden items-center gap-3 text-3xl font-bold uppercase tracking-wide md:flex">
        <Icon className="size-6 text-primary" />
        {branch.title}
      </h1>

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
              runSample={(text) => play(text ?? branch.terminalSample)}
              samples={branch.samples ?? [{ id: 'default', label: 'Пример', text: branch.terminalSample }]}
            />
          </TabsContent>
        )}
        <TabsContent value="guide"><Guide markdown={branch.guide} /></TabsContent>
        <TabsContent value="commands"><Commands items={branch.commands} flashCmd={flashCmd} /></TabsContent>
      </Tabs>
    </article>
  )
}
