---
url: https://t.me/sterkin_ru/1805
---

```PowerShell
reg add HKCU\SOFTWARE\Policies\Microsoft\Windows\Explorer /v HideRecommendedSection /t REG_DWORD /d 1 /f
reg add HKLM\SOFTWARE\Microsoft\PolicyManager\current\device\Education /v IsEducationEnvironment /t REG_DWORD /d 1 /f
```
