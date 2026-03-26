На помощь приходит групповая политика Settings Page Visibility (https://gpsearch.azurewebsites.net/#13859). Она существует для пользователя (HKCU) и компьютера (HKLM), то есть для всех его пользователей.

```PowerShell
reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer /v SettingsPageVisibility /t REG_SZ /d "hide:home" /f
```

Ещё варианты:
• скрыть несколько страниц: hide:home;sound
• скрыть все, кроме заданных: showonly:display;storagesense