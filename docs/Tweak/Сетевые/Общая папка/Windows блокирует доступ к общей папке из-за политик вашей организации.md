---
url:
  - https://www.white-windows.ru/windows-blokiruet-dostup-k-obshhej-papke-iz-za-politik-vashej-organizatsii/
---
![](images/Pasted%20image%2020260221171737.png)

- **gpedit.msc**
	- **«Конфигурация компьютера»** → **«Административные шаблоны»** → **«Сеть»** → **«Рабочая станция Lanman»**
		- **«Включить небезопасные гостевые входы»**. - Включить
или
- **regedit**
	- **HKLM\SOFTWARE\Policies\Microsoft\Windows\LanmanWorkstation\Parameters**
		- **AllowInsecureGuestAuth**(**DWORD**-32бита) - 1 
