import { Star } from 'lucide-react'
import { branches } from '@/branches'
import { CommandCard } from '@/components/Commands'
import { PageTitle } from '@/components/Situations'
import { TargetField } from '@/components/TargetField'
import { favKey, favorites } from '@/lib/store'

// Команды, отмеченные звездой — быстрый доступ без поиска
export function Favorites() {
  const favs = favorites.use()
  const items = branches.flatMap((b) =>
    b.commands.filter((c) => favs.includes(favKey(b.id, c.cmd))).map((c) => ({ b, c })),
  )

  return (
    <div>
      <PageTitle title="Избранное" hint="Твои частые команды. Добавляй звездой на карточке команды." />
      {items.length === 0 ? (
        <div className="border border-dashed p-8 text-center text-sm text-muted-foreground">
          <Star className="mx-auto mb-3 size-6 text-primary" />
          Пока пусто. Открой вкладку «Команды» и нажми звезду у нужной.
        </div>
      ) : (
        <>
          <TargetField />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {items.map(({ b, c }) => (
              <CommandCard key={favKey(b.id, c.cmd)} item={c} branchId={b.id} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
