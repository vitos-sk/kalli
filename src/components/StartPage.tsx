import { Check } from 'lucide-react'
import { CommandLine } from '@/components/Commands'
import { PageTitle } from '@/components/Situations'
import { Window } from '@/components/ui/card'
import { useTarget } from '@/lib/target'
import { cn } from '@/lib/utils'

function Pick({ value, label }: { value: string; label?: string }) {
  const { target, setTarget } = useTarget()
  const on = target === value
  return (
    <button
      type="button"
      onClick={() => setTarget(value)}
      aria-pressed={on}
      className={cn('label flex h-9 cursor-pointer items-center gap-2 px-3', on ? 'border border-primary text-primary' : 'bg-primary text-primary-foreground hover:bg-foreground')}
    >
      {on && <Check className="size-3.5" />} {label ?? `подставить ${value}`}
    </button>
  )
}

const Step = ({ n }: { n: number }) => (
  <span className="grid size-7 shrink-0 place-items-center border border-primary font-mono text-xs text-primary">{n}</span>
)
const Go = ({ onClick, children, solid }: { onClick: () => void; children: React.ReactNode; solid?: boolean }) => (
  <button type="button" onClick={onClick} className={cn('label h-9 cursor-pointer px-3', solid ? 'bg-primary text-primary-foreground hover:bg-foreground' : 'border border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground')}>
    {children}
  </button>
)

// «С чего начать»: упор на своё — компьютер, роутер, сайт и домен
export function StartPage({ onGo }: { onGo: (id: string) => void }) {
  const { target } = useTarget()
  return (
    <div className="space-y-4">
      <PageTitle title="С чего начать" hint="Совсем с нуля. Мы проверяем СВОЁ: свой компьютер, роутер, проекты, сайт и домен." />

      <Window title="что такое IP и цель" bodyClassName="space-y-2 text-[15px] leading-relaxed">
        <p><strong className="text-primary">IP</strong> — адрес устройства в сети, как адрес дома. Сканер «стучится» по адресу, поэтому его нужно знать.</p>
        <p><strong className="text-primary">Домен</strong> (например, <code className="font-mono">example.com</code>) — тот же адрес словами. Его можно вводить вместо IP.</p>
        <p className="text-sm text-muted-foreground">Это и есть «цель» из поля вверху страниц. Впиши её один раз — и она подставится в команды.</p>
      </Window>

      <Window title="откуда взять цель: выбери своё" bodyClassName="space-y-5">
        <div className="space-y-2">
          <p className="flex items-center gap-3"><Step n={1} /> <span><strong>Свой компьютер и проекты</strong></span></p>
          <p className="text-sm text-muted-foreground">Адрес <span className="font-mono text-primary">127.0.0.1</span> означает «я сам». Чтобы узнать свой IP в сети, запусти команду и <strong className="text-foreground">вставь весь вывод в «Разобрать вывод»</strong> — я найду нужную строку и объясню остальное.</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div><p className="label mb-1 text-[9px] text-muted-foreground">Mac</p><CommandLine cmd="ifconfig" /></div>
            <div><p className="label mb-1 text-[9px] text-muted-foreground">Linux</p><CommandLine cmd="ip a" /></div>
            <div><p className="label mb-1 text-[9px] text-muted-foreground">Windows</p><CommandLine cmd="ipconfig" /></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Go solid onClick={() => onGo('explain')}>разобрать мой вывод</Go>
            <Pick value="127.0.0.1" />
            <Go onClick={() => onGo('home-network')}>ветка «Моя сеть»</Go>
          </div>
        </div>

        <div className="space-y-2 border-t pt-5">
          <p className="flex items-center gap-3"><Step n={2} /> <span><strong>Свой роутер и устройства дома</strong></span></p>
          <p className="text-sm text-muted-foreground">Роутер — это «шлюз». Обычно его адрес — твой IP с <span className="font-mono text-primary">.1</span> на конце (192.168.1.23 → 192.168.1.1). Точный покажет команда (Windows: «Основной шлюз» в <span className="font-mono">ipconfig</span>).</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div><p className="label mb-1 text-[9px] text-muted-foreground">Mac</p><CommandLine cmd="route -n get default" /></div>
            <div><p className="label mb-1 text-[9px] text-muted-foreground">Linux</p><CommandLine cmd="ip route | grep default" /></div>
          </div>
          <Go onClick={() => onGo('home-network')}>проверить сеть и роутер</Go>
        </div>

        <div className="space-y-2 border-t pt-5">
          <p className="flex items-center gap-3"><Step n={3} /> <span><strong>Свой сайт или домен</strong></span></p>
          <p className="text-sm text-muted-foreground">Впиши домен в поле цели (без <span className="font-mono">https://</span>). Проверим, куда он ведёт, когда истекает домен и сертификат, какие защитные заголовки включены и что открыто на сервере.</p>
          <Go onClick={() => onGo('own-site')}>проверить сайт и домен</Go>
        </div>

        <div className="space-y-2 border-t pt-5">
          <p className="flex items-center gap-3"><Step n={4} /> <span><strong>Своя лаборатория и тренировка</strong></span></p>
          <p className="text-sm text-muted-foreground">Хочешь попробовать, ничего не трогая своего: домен <span className="font-mono text-primary">scanme.nmap.org</span> держит проект nmap именно для этого. Или подними виртуалку с намеренно уязвимой системой.</p>
          <div className="flex flex-wrap gap-2">
            <Pick value="scanme.nmap.org" />
            <Go onClick={() => onGo('labs')}>где тренироваться</Go>
          </div>
        </div>

        <p className="border-l-2 border-[#f5c542] bg-accent px-3 py-2 text-sm">
          Чужие сайты, сети и серверы без разрешения владельца сканировать нельзя — это может нарушать закон.
        </p>
      </Window>

      <Window title="как поставить nmap" bodyClassName="space-y-3">
        <p className="text-sm text-muted-foreground">Для проверки сайта и домена хватит того, что уже стоит (dig, curl, whois). Nmap нужен для портов и поиска устройств.</p>
        <div><p className="label mb-1 text-[9px] text-muted-foreground">Mac (через Homebrew)</p><CommandLine cmd="brew install nmap" /></div>
        <div><p className="label mb-1 text-[9px] text-muted-foreground">Linux (Debian / Ubuntu / Kali)</p><CommandLine cmd="sudo apt install nmap" /></div>
        <p className="text-sm text-muted-foreground"><strong className="text-foreground">Windows:</strong> скачай установщик с сайта nmap.org (раздел Download) и поставь как обычную программу.</p>
        <div><p className="label mb-1 text-[9px] text-muted-foreground">Проверка, что всё встало</p><CommandLine cmd="nmap --version" /></div>
      </Window>

      <Window title="первый запуск за минуту" bodyClassName="space-y-3">
        <ol className="space-y-2 text-[15px]">
          <li className="flex gap-3"><Step n={1} /> Узнай свой IP (блок 1) и вставь вывод в «Разобрать вывод».</li>
          <li className="flex gap-3"><Step n={2} /> Нажми «цель: мой IP» — он подставится в команды.</li>
          <li className="flex gap-3"><Step n={3} /> Посмотри, что слушает твой компьютер и кто в сети — в ветке «Моя сеть».</li>
        </ol>
        {target && <CommandLine cmd={`nmap -F ${target}`} />}
        <div className="flex flex-wrap gap-2">
          <Go solid onClick={() => onGo('playbooks')}>сценарии по шагам</Go>
          <Go onClick={() => onGo('route')}>маршрут новичка</Go>
        </div>
      </Window>
    </div>
  )
}
