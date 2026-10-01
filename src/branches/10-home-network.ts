import { Router } from 'lucide-react'
import { netAnalyze, netHints } from '@/lib/netinfo'
import { nmapAnalyze, nmapHints } from '@/lib/nmapHints'
import { SampleTool } from '@/tools/SampleTool'
import type { BranchConfig } from './types'

const IFCONFIG = `lo0: flags=8049<UP,LOOPBACK,RUNNING,MULTICAST> mtu 16384
	inet 127.0.0.1 netmask 0xff000000
	inet6 ::1 prefixlen 128
en0: flags=8863<UP,BROADCAST,SMART,RUNNING,SIMPLEX,MULTICAST> mtu 1500
	ether 52:7d:5e:85:9a:f9
	inet6 fe80::101e:f8b1:3dbf:ac0d%en0 prefixlen 64 secured scopeid 0xb
	inet 192.168.1.23 netmask 0xffffff00 broadcast 192.168.1.255
	media: autoselect
	status: active
awdl0: flags=8863<UP,BROADCAST,SMART,RUNNING,SIMPLEX,MULTICAST> mtu 1500
	media: autoselect
	status: active
utun0: flags=8051<UP,POINTOPOINT,RUNNING,MULTICAST> mtu 1380
	inet6 fe80::d06:1d0e:b33e:62be%utun0 prefixlen 64 scopeid 0xf
en3: flags=8863<UP,BROADCAST,SMART,RUNNING,SIMPLEX,MULTICAST> mtu 1500
	ether ca:8b:8d:6b:ac:be
	media: none
	status: inactive`

const config: BranchConfig = {
  id: 'home-network',
  title: 'Моя сеть и роутер',
  icon: Router,
  order: 5,
  tool: SampleTool,
  keywords: ['мой ip', 'ifconfig', 'ipconfig', 'роутер', 'wifi', 'вайфай', 'домашняя сеть', 'устройства в сети', 'кто подключён', 'мой компьютер', 'порты компьютера', 'слушает порт', 'lsof', 'dev-сервер', 'localhost'],
  lineHints: [...netHints, ...nmapHints],
  analyze: (t) => [...netAnalyze(t), ...nmapAnalyze(t)],

  guide: `## Что это

Проверка своего: свой компьютер, свой роутер, свои проекты. Смотришь на домашнюю сеть так, как её увидел бы чужой человек в том же Wi-Fi, и закрываешь лишнее. Главные вопросы: какой у меня IP, кто ещё в сети, что у меня «торчит» наружу.

## Что вводим

- Сначала свой IP: \`ifconfig\` (Mac) или \`ip a\` (Linux) или \`ipconfig\` (Windows). Вставь вывод на странице «Разобрать вывод» — я найду нужную строку.
- Роутер — это «шлюз». Обычно это твой IP с **.1** на конце: 192.168.1.23 → 192.168.1.1.
- Сеть записывается как \`192.168.1.0/24\` — все адреса от .1 до .254. Впиши свой IP в поле цели, и \`<net>\` соберётся сам.
- Работаем только со своим Wi-Fi и своими устройствами.

## Как читать ifconfig

- **lo0** — «я сам» (127.0.0.1). Пропусти.
- **en0** — обычно твой Wi-Fi или кабель. Нужен блок, где написано **status: active**.
- **inet 192.168.x.x** — твой IP. Это и искали.
- **inet6** — IPv6, длинный адрес с двоеточиями. Пока игнорируй.
- **utun, awdl, llw, bridge, anpi, gif, stf** — служебные: VPN, AirDrop, мосты. Пропусти.
- **netmask 0xffffff00** — то же, что /24: сеть до 254 устройств.

## Как читать «что слушает мой компьютер»

- \`127.0.0.1:3000\` или \`localhost\` — слушает только твой компьютер. Нормально.
- \`*:5173\` или \`0.0.0.0\` — слушает всю сеть: любой в твоём Wi-Fi может открыть твой проект.
- Базы (**5432** PostgreSQL, **3306** MySQL, **6379** Redis, **27017** MongoDB) наружу быть не должны.
- Лишнее закрой: останови программу или запусти её на 127.0.0.1.`,

  commands: [
    { label: 'Мой IP (Mac)', cmd: 'ifconfig', note: 'найди блок с status: active и в нём строку inet. Или вставь вывод в «Разобрать вывод»', keywords: ['мой ip', 'узнать ip', 'какой у меня ip', 'адрес'], flags: [{ flag: 'ifconfig', text: 'Показать все сетевые интерфейсы компьютера и их адреса.' }] },
    { label: 'Мой IP (Linux)', cmd: 'ip a', note: 'ищи inet у интерфейса со статусом UP (eth0, wlan0…)', keywords: ['мой ip', 'линукс'] },
    { label: 'Мой IP (Windows)', cmd: 'ipconfig', note: 'ищи «IPv4-адрес» и «Основной шлюз» (это роутер)', keywords: ['мой ip', 'виндовс'] },
    { label: 'Адрес роутера (Mac)', cmd: 'route -n get default', note: 'в строке gateway — адрес роутера', keywords: ['адрес роутера', 'шлюз', 'gateway'], flags: [{ flag: 'default', text: 'Маршрут по умолчанию: туда уходит весь трафик в интернет — то есть к роутеру.' }] },
    { label: 'Жив ли роутер или устройство', cmd: 'ping -c 4 <ip>', note: 'Windows: ping -n 4. Без этого флага пинг идёт бесконечно — остановить: Ctrl+C', keywords: ['пинг', 'отвечает ли', 'жив ли', 'проверить связь', 'задержка'], flags: [{ flag: '-c 4', text: 'Отправить 4 запроса и остановиться. На Windows тот же смысл у -n 4.' }] },
    { label: 'Адрес роутера (Linux)', cmd: 'ip route | grep default', note: 'после слова via — адрес роутера', keywords: ['адрес роутера', 'шлюз'] },
    {
      label: 'Кто в моей сети',
      cmd: 'nmap -sn <net>',
      note: 'список живых устройств. Только своя сеть. <net> соберётся из твоего IP в поле цели',
      keywords: ['устройства', 'кто подключён', 'кто в wifi', 'незнакомое устройство'],
      flags: [
        { flag: '-sn', text: 'Только узнать, кто жив, без проверки портов. Быстро и мягко.' },
        { flag: '/24', text: 'Сеть из 254 адресов: от .1 до .254. Так записывают домашнюю сеть.' },
      ],
    },
    {
      label: 'Что слушает мой компьютер (Mac)',
      cmd: 'sudo lsof -iTCP -sTCP:LISTEN -n -P',
      note: 'какие программы открыли порты. *:порт — вся сеть, 127.0.0.1:порт — только ты',
      keywords: ['слушает порт', 'открытые порты компьютера', 'dev-сервер', 'мои проекты', 'порт занят'],
      flags: [
        { flag: '-iTCP', text: 'Только TCP-соединения.' },
        { flag: '-sTCP:LISTEN', text: 'Только те, что ждут подключения (слушают порт).' },
        { flag: '-n -P', text: 'Не заменять IP и порты именами — остаются цифры, так проще читать.' },
      ],
    },
    { label: 'Что слушает мой компьютер (Linux)', cmd: 'ss -tlnp', note: 'то же для Linux. Local Address: 0.0.0.0 — вся сеть, 127.0.0.1 — только ты', keywords: ['слушает порт', 'порты'], flags: [{ flag: '-tlnp', text: 't — TCP, l — слушающие, n — цифры, p — показать программу.' }] },
    { label: 'Что слушает мой компьютер (Windows)', cmd: 'netstat -ano | findstr LISTENING', note: 'в последнем столбце номер процесса (PID)', keywords: ['слушает порт', 'порты'] },
    { label: 'Что торчит у роутера', cmd: 'nmap -F <ip>', note: 'впиши адрес роутера в поле цели. Telnet (23) быть не должно', keywords: ['роутер открытые порты', 'проверить роутер'], flags: [{ flag: '-F', text: 'Быстро: 100 самых частых портов.' }] },
    { label: 'Виден ли мой проект по сети', cmd: 'nmap -p 3000,5173,8080 <ip>', note: 'впиши свой IP в сети. open — проект доступен всем в Wi-Fi', keywords: ['dev-сервер', 'проект виден', 'мои порты'], flags: [{ flag: '-p 3000,5173,8080', text: 'Проверить только перечисленные порты. Список через запятую, без пробелов.' }] },
  ],

  situations: [
    { id: 'my-ip', title: 'Не знаю свой IP / не понял вывод ifconfig', answer: 'Запусти команду и найди активный интерфейс (на Mac обычно en0, status: active). В нём строка inet с цифрами и точками, вида 192.168.x.x — это твой IP. Остальное служебное. Проще всего: вставь весь вывод на странице «Разобрать вывод», и я покажу нужное.', cmds: ['ifconfig', 'ip a', 'ipconfig'], keywords: ['мой ip', 'ifconfig не понятно', 'какой ip'] },
    { id: 'router-ip', title: 'Не знаю адрес роутера', answer: 'Роутер — это шлюз по умолчанию. Обычно он на .1 в твоей сети (192.168.1.23 → 192.168.1.1), но точный адрес покажет команда.', cmds: ['route -n get default', 'ip route | grep default'], keywords: ['шлюз', 'gateway', 'панель роутера'] },
    { id: 'find-devices', title: 'Хочу увидеть все устройства в сети', answer: 'Впиши свой IP в поле цели — <net> соберётся в твою сеть (например, 192.168.1.0/24). Команда покажет все живые устройства. Сверь список с тем, что у тебя дома.', cmds: ['nmap -sn <net>'], keywords: ['кто в wifi', 'кто подключён'] },
    { id: 'unknown-device', title: 'Вижу незнакомое устройство', answer: 'Не паникуй: это бывает телевизор, лампочка или телефон гостя. Если не можешь объяснить устройство: смени пароль Wi-Fi (WPA2/WPA3), отключи WPS, посмотри список подключённых в панели роутера и отключи лишнее.', cmds: ['nmap -sn <net>'], keywords: ['чужой в wifi', 'взломали wifi'] },
    { id: 'exposed-port', title: 'Мой проект виден всей сети', answer: 'Если в списке слушающих портов стоит *:порт или 0.0.0.0, к проекту может подключиться любой в твоём Wi-Fi. Для разработки запусти сервер на localhost (127.0.0.1) — в настройках сервера это параметр host. Базы данных (Postgres, MySQL, Redis, Mongo) тем более держи только на localhost.', cmds: ['sudo lsof -iTCP -sTCP:LISTEN -n -P', 'nmap -p 3000,5173,8080 <ip>'], keywords: ['dev-сервер', 'localhost', 'доступен всем'] },
    { id: 'router-open', title: 'Что у роутера торчит и это плохо?', answer: 'Нормально: 80/443 (панель управления) и 53 (DNS) — но только изнутри сети. Плохо: 23 (Telnet), 21 (FTP) и любая панель управления, доступная из интернета. Отключи ненужное в настройках роутера, обнови прошивку и смени пароль администратора, если он стандартный.', cmds: ['nmap -F <ip>'], keywords: ['telnet роутер', 'безопасность роутера'] },
  ],

  playbooks: [
    {
      id: 'my-network-audit',
      title: 'Проверь свою сеть за 5 минут',
      intro: 'Защитный сценарий: узнать свой IP, увидеть устройства, проверить роутер и свои проекты.',
      steps: [
        { title: 'Узнай свой IP', text: 'Запусти команду и вставь весь вывод на странице «Разобрать вывод» — найду твой IP, сеть и вероятный адрес роутера. Потом впиши IP в поле цели.', cmd: 'ifconfig', sampleId: 'ifconfig' },
        { title: 'Кто в твоей сети', text: 'Список живых устройств. Сверь с тем, что есть дома: роутер, телефоны, ТВ, компьютеры.', cmd: 'nmap -sn <net>', sampleId: 'devices' },
        { title: 'Проверь роутер', text: 'Смени цель в поле на адрес роутера (обычно твой IP с .1 на конце). Смотри, нет ли Telnet (23) и лишних открытых портов.', cmd: 'nmap -F <ip>', sampleId: 'router' },
        { title: 'Что слушает твой компьютер', text: 'Какие твои проекты и базы данных видны всей сети. *:порт — вся сеть, 127.0.0.1:порт — только ты.', cmd: 'sudo lsof -iTCP -sTCP:LISTEN -n -P', sampleId: 'lsof' },
        { title: 'Закрой лишнее', text: 'Нашёл лишнее — исправь: запусти проект на 127.0.0.1, отключи Telnet/WPS/UPnP на роутере, обнови прошивку, смени стандартный пароль администратора. Потом повтори проверку и убедись, что лишнее пропало.' },
      ],
    },
  ],

  nextSteps: [
    { text: 'Нашёл открытые порты у роутера или сервера → разберись подробнее', branchId: 'port-scanning' },
    { text: 'Есть свой сайт или домен → проверь его снаружи', branchId: 'own-site' },
  ],

  terminalSample: IFCONFIG,
  samples: [
    { id: 'ifconfig', label: 'ifconfig: найти свой IP', text: IFCONFIG, explain: true },
    { id: 'route', label: 'Адрес роутера (route)', explain: true, text: `❯ route -n get default
   route to: default
destination: default
       mask: default
    gateway: 192.168.1.1
  interface: en0
      flags: <UP,GATEWAY,DONE,STATIC,PRCLONING,GLOBAL>
 recvpipe  sendpipe  ssthresh  rtt,msec    rttvar  hopcount      mtu     expire
       0         0         0         0         0         0      1500         0` },
    { id: 'ping', label: 'Пинг роутера', explain: true, text: `PING 192.168.1.1 (192.168.1.1): 56 data bytes
64 bytes from 192.168.1.1: icmp_seq=0 ttl=64 time=2.314 ms
64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=2.101 ms
64 bytes from 192.168.1.1: icmp_seq=2 ttl=64 time=2.457 ms
64 bytes from 192.168.1.1: icmp_seq=3 ttl=64 time=2.288 ms

--- 192.168.1.1 ping statistics ---
4 packets transmitted, 4 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 2.101/2.290/2.457/0.126 ms` },
    { id: 'lsof', label: 'Что слушает мой компьютер', explain: true, text: `COMMAND     PID USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node      48211 vs     23u  IPv4 0x1c2a3b4c5d6e7f8      0t0  TCP *:5173 (LISTEN)
node      48230 vs     19u  IPv4 0x1c2a3b4c5d6e7f9      0t0  TCP 127.0.0.1:3000 (LISTEN)
postgres    712 vs      7u  IPv4 0x1c2a3b4c5d6e7fa      0t0  TCP 127.0.0.1:5432 (LISTEN)
redis-ser  1033 vs      6u  IPv4 0x1c2a3b4c5d6e7fb      0t0  TCP *:6379 (LISTEN)` },
    { id: 'devices', label: 'Кто в моей сети (nmap -sn)', explain: true, text: `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for 192.168.1.1
Host is up (0.0021s latency).
Nmap scan report for 192.168.1.15
Host is up (0.011s latency).
Nmap scan report for 192.168.1.23
Host is up (0.00013s latency).
Nmap scan report for 192.168.1.57
Host is up (0.085s latency).
Nmap done: 256 IP addresses (4 hosts up) scanned in 2.71s` },
    { id: 'router', label: 'Проверка роутера', explain: true, text: `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for 192.168.1.1
Host is up (0.0031s latency).
Not shown: 96 closed tcp ports
PORT    STATE SERVICE
23/tcp  open  telnet
53/tcp  open  domain
80/tcp  open  http
443/tcp open  https
Nmap done: 1 IP address (1 host up) scanned in 0.52s` },
  ],
}

export default config
