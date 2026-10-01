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

// «С чего начать»: что такое IP, откуда его взять и как поставить nmap
export function StartPage({ onGo }: { onGo: (id: string) => void }) {
  const { target } = useTarget()
  return (
    <div className="space-y-4">
      <PageTitle title="С чего начать" hint="Совсем с нуля: что такое цель, откуда взять IP и как сделать первый запуск." />

      <Window title="что такое IP и цель" bodyClassName="space-y-2 text-[15px] leading-relaxed">
        <p><strong className="text-primary">IP</strong> — адрес устройства в сети, как адрес дома. Сканер «стучится» по адресу, поэтому его нужно знать.</p>
        <p><strong className="text-primary">Домен</strong> (например, <code className="font-mono">scanme.nmap.org</code>) — тот же адрес, только словами. Его можно вводить вместо IP.</p>
        <p className="text-sm text-muted-foreground">Это и есть «цель» из поля вверху страниц. Ты вписываешь её один раз — и она подставляется в команды.</p>
      </Window>

      <Window title="откуда взять IP: выбери вариант" bodyClassName="space-y-5">
        <div className="space-y-2">
          <p className="flex items-center gap-3"><Step n={1} /> <span><strong>Учебная мишень</strong> — проще всего</span></p>
          <p className="text-sm text-muted-foreground">Домен <span className="font-mono text-primary">scanme.nmap.org</span> специально держит проект nmap: его сканировать разрешено.</p>
          <Pick value="scanme.nmap.org" />
        </div>

        <div className="space-y-2 border-t pt-5">
          <p className="flex items-center gap-3"><Step n={2} /> <span><strong>Свой компьютер</strong> — безопасно и законно</span></p>
          <p className="text-sm text-muted-foreground">Адрес <span className="font-mono text-primary">127.0.0.1</span> означает «я сам». Хорошо, чтобы увидеть, как всё работает, ничего не трогая снаружи.</p>
          <Pick value="127.0.0.1" />
        </div>

        <div className="space-y-2 border-t pt-5">
          <p className="flex items-center gap-3"><Step n={3} /> <span><strong>Своё устройство в сети</strong> — роутер, второй компьютер, виртуалка</span></p>
          <p className="text-sm text-muted-foreground">Узнай свой адрес командой ниже и найди строку с <span className="font-mono">inet</span> (Mac/Linux) или «IPv4-адрес» (Windows) — вида <span className="font-mono text-primary">192.168.x.x</span>. Роутер обычно <span className="font-mono text-primary">192.168.0.1</span> или <span className="font-mono text-primary">192.168.1.1</span>.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div><p className="label mb-1 text-[9px] text-muted-foreground">Mac / Linux</p><CommandLine cmd="ifconfig" /></div>
            <div><p className="label mb-1 text-[9px] text-muted-foreground">Windows</p><CommandLine cmd="ipconfig" /></div>
          </div>
          <div className="flex flex-wrap gap-2"><Pick value="192.168.1.1" /></div>
        </div>

        <div className="space-y-2 border-t pt-5">
          <p className="flex items-center gap-3"><Step n={4} /> <span><strong>Адрес по домену</strong></span></p>
          <p className="text-sm text-muted-foreground">Если знаешь домен своего сайта, а IP нужен цифрами:</p>
          <CommandLine cmd="nslookup example.com" />
          <p className="text-xs text-muted-foreground">Но nmap понимает и домен — можно вписывать его прямо в поле цели.</p>
        </div>

        <div className="space-y-2 border-t pt-5">
          <p className="flex items-center gap-3"><Step n={5} /> <span><strong>Своя лаборатория</strong></span></p>
          <p className="text-sm text-muted-foreground">Виртуальная машина с намеренно уязвимой системой (Metasploitable, DVWA, Juice Shop). Запусти её у себя, посмотри её IP в настройках сети виртуалки или командой <span className="font-mono">ifconfig</span> / <span className="font-mono">ipconfig</span> внутри — и используй как цель. Список площадок — в разделе «Где тренироваться».</p>
          <button type="button" onClick={() => onGo('labs')} className="label cursor-pointer text-[10px] text-primary hover:underline">открыть «Где тренироваться»</button>
        </div>

        <p className="border-l-2 border-[#f5c542] bg-accent px-3 py-2 text-sm">
          Чужие сайты и серверы без разрешения владельца сканировать нельзя — это может нарушать закон.
        </p>
      </Window>

      <Window title="как поставить nmap" bodyClassName="space-y-3">
        <div><p className="label mb-1 text-[9px] text-muted-foreground">Mac (через Homebrew)</p><CommandLine cmd="brew install nmap" /></div>
        <div><p className="label mb-1 text-[9px] text-muted-foreground">Linux (Debian / Ubuntu / Kali)</p><CommandLine cmd="sudo apt install nmap" /></div>
        <p className="text-sm text-muted-foreground"><strong className="text-foreground">Windows:</strong> скачай установщик с сайта nmap.org (раздел Download) и поставь как обычную программу.</p>
        <div><p className="label mb-1 text-[9px] text-muted-foreground">Проверка, что всё встало</p><CommandLine cmd="nmap --version" /></div>
      </Window>

      <Window title="первый запуск за минуту" bodyClassName="space-y-3">
        <ol className="space-y-2 text-[15px]">
          <li className="flex gap-3"><Step n={1} /> Поставь nmap (блок выше).</li>
          <li className="flex gap-3"><Step n={2} /> Выбери цель: для первого раза хватит <span className="font-mono text-primary">scanme.nmap.org</span> или <span className="font-mono text-primary">127.0.0.1</span>.</li>
          <li className="flex gap-3"><Step n={3} /> Запусти команду в терминале на своём компьютере:</li>
        </ol>
        <CommandLine cmd={`nmap ${target || 'scanme.nmap.org'}`} />
        <p className="text-sm text-muted-foreground">Не знаешь, что значит вывод? Вставь его на странице «Разобрать вывод» — объясню по строкам.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onGo('port-scanning')} className="label h-9 cursor-pointer bg-primary px-3 text-primary-foreground hover:bg-foreground">к ветке «Сканирование портов»</button>
          <button type="button" onClick={() => onGo('explain')} className="label h-9 cursor-pointer border border-primary/60 px-3 text-primary hover:bg-primary hover:text-primary-foreground">разобрать вывод</button>
        </div>
      </Window>
    </div>
  )
}
