import { useEffect, useRef } from 'react'
import { PlaceholderHelp } from '@/components/PlaceholderHelp'
import { PageTitle } from '@/components/Situations'
import { TargetField } from '@/components/TargetField'
import { PLACEHOLDERS } from '@/lib/placeholders'

// «Что подставлять и где взять»: по карточке на каждую заглушку из команд
export function ValuesPage({ openToken, go }: { openToken?: string; go: (id: string, sub?: string, sub2?: string) => void }) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({})

  // переход по ссылке на конкретную заглушку — прокручиваем к ней
  useEffect(() => {
    if (openToken) refs.current[openToken]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [openToken])

  return (
    <div className="space-y-4">
      <PageTitle
        title="Что подставлять и где взять"
        hint="В командах бывают места вроде <ip> или <net>. Это «пустые клетки»: вместо них нужно вписать своё. Здесь по каждой — что это и где взять значение."
      />
      <TargetField />
      {PLACEHOLDERS.map((p) => (
        <div key={p.token} ref={(el) => { refs.current[p.token] = el }} className="scroll-mt-4">
          <PlaceholderHelp token={p.token} onGo={go} />
        </div>
      ))}
    </div>
  )
}
