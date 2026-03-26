---
url:
---
Наиболее часто используемым алгоритмом управления перегрузкой TCP является ==CUBIC==, который широко применяется как в Linux, так и в Windows.
В дополнение к этому Google разработала и выпустила алгоритм ==BBR==, который продемонстрировал отличную производительность. 
Microsoft также разработала и внедрила алгоритм ==Compound TCP== для Windows Server. Здесь мы кратко опишем процесс перехода с CUBIC на эти два алгоритма.

## Windows: from CUBIC to CTCP
Сначала давайте проверим текущий алгоритм управления перегрузкой TCP с помощью команды 
`netsh int tcp show global`, 
а дополнительную информацию можно найти с помощью команды 
`netsh int tcp show supplemental` 
Здесь вы можете увидеть текущий алгоритм. 

Переход CTCP
```Powershell
netsh int tcp set supplemental template=internet congestionprovider=CTCP
netsh int tcp set supplemental template=internetcustom congestionprovider=CTCP
netsh int tcp set supplemental template=Datacenter congestionprovider=DCTCP
netsh int tcp set supplemental template=Datacentercustom congestionprovider=DCTCP
```


Возвращение назад,  CUBIC.
```PowerShell
netsh int tcp set supplemental template=internet congestionprovider=CUBIC
netsh int tcp set supplemental template=internetcustom congestionprovider=CUBIC
netsh int tcp set supplemental template=Datacenter congestionprovider=CUBIC
netsh int tcp set supplemental template=Datacentercustom congestionprovider=CUBIC
```



## Linux: from CUBIC to BBR
Actually, now we can simply switch to BBR from CUBIC by `sysctl` on Linux. Let’s check our current TCP congrestion control algorithm:

```fallback
sysctl net.ipv4.tcp_congestion_control
```

If the output is `net.ipv4.tcp_congestion_control = cubic` or something like that, means that our current algorithm is CUBIC, let’s edit `/etc/sysctl.conf` to change it to BBR:

```fallback
net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr
```

Now, save and apply using `sysctl -p`, check our algorithm again, we will see `net.ipv4.tcp_congestion_control = bbr`. By the way, it shows `ipv4` in the message, but don’t worry, it also works for IPv6.
