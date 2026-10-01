import { ExternalLink } from 'lucide-react'
import { PageTitle } from '@/components/Situations'
import { Window } from '@/components/ui/card'

interface Lab {
  name: string
  url: string
  text: string
  level: string
}

// Площадки, где тренироваться можно легально
const LABS: Lab[] = [
  { name: 'scanme.nmap.org', url: 'https://scanme.nmap.org', level: 'для начала', text: 'Мишень проекта nmap: её разрешено сканировать. Лучшее место для первых команд.' },
  { name: 'TryHackMe', url: 'https://tryhackme.com', level: 'с нуля', text: 'Уроки и комнаты в браузере с пошаговыми подсказками. Ничего не надо ставить.' },
  { name: 'PortSwigger Web Security Academy', url: 'https://portswigger.net/web-security', level: 'веб', text: 'Бесплатный курс по веб-уязвимостям с готовыми учебными лабораториями.' },
  { name: 'OverTheWire', url: 'https://overthewire.org/wargames/', level: 'командная строка', text: 'Игры, где уровень за уровнем учишься работать в консоли Linux.' },
  { name: 'OWASP Juice Shop', url: 'https://owasp.org/www-project-juice-shop/', level: 'веб, у себя', text: 'Намеренно уязвимый магазин: запускаешь у себя на компьютере и ломаешь сколько хочешь.' },
  { name: 'DVWA', url: 'https://github.com/digininja/DVWA', level: 'веб, у себя', text: 'Ещё одно намеренно уязвимое веб-приложение для локальной практики.' },
  { name: 'Hack The Box', url: 'https://www.hackthebox.com', level: 'средний', text: 'Машины и задания посложнее. Хорошо, когда базовые команды уже знакомы.' },
  { name: 'VulnHub', url: 'https://www.vulnhub.com', level: 'у себя', text: 'Скачиваемые уязвимые виртуальные машины для домашней лаборатории.' },
]

export function Labs() {
  return (
    <div className="space-y-4">
      <PageTitle title="Где тренироваться" hint="Сканировать и взламывать можно только то, что тебе разрешено." />

      <Window title="правила" bodyClassName="space-y-2 text-[15px] leading-relaxed">
        <p><strong className="text-primary">Только своё.</strong> Свой компьютер, своя виртуалка, свой сервер.</p>
        <p><strong className="text-primary">Или с разрешением.</strong> Письменное согласие владельца, где указано, что и когда можно проверять.</p>
        <p><strong className="text-primary">Или специальные площадки.</strong> Ниже — места, созданные именно для тренировки.</p>
        <p className="text-sm text-muted-foreground">Сканирование чужих систем без разрешения может нарушать закон.</p>
      </Window>

      <div className="grid gap-4 sm:grid-cols-2">
        {LABS.map((l) => (
          <Window key={l.name} title={l.level}>
            <p className="mb-1 font-medium">{l.name}</p>
            <p className="mb-3 text-sm text-muted-foreground">{l.text}</p>
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="label inline-flex items-center gap-1.5 text-primary hover:underline">
              открыть <ExternalLink className="size-3" />
            </a>
          </Window>
        ))}
      </div>
    </div>
  )
}
