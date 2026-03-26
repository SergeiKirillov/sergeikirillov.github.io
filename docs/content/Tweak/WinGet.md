`winget install ИмяПрограммы`

## 📌Скрипт для установки: 

``` powershell
Install-Module Microsoft.WinGet.Client -Force 
Import-Module Microsoft.WinGet.Client 
Repair-WinGetPackageManager
```


## 📌Скачать WinGet: 
[https://github.com/microsoft/winget-c...](https://github.com/microsoft/winget-cli/releases)


## 📌 Полезные команды WinGet: 
- winget search [название] — поиск программы 
- winget install [ID] — установка программы 
- winget upgrade --all — обновление всех программ 
- winget list — список установленных программ 
- winget uninstall [ID] — удаление программы