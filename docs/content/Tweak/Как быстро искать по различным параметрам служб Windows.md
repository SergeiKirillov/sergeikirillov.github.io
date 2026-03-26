---
url:
  - https://t.me/sterkin_ru/1742
---

 Get-Service  - для получения сведений о службах
```powershell
Get-Service | Out-GridView
```

По умолчанию выводится всего три параметра служб: имя, отображаемое имя и статус. Все доступные параметры можно отобразить так:

```powershell
Get-Service | Select-Object * | Out-GridView
```


Продолжая пост про задания планировщика (https://t.me/sterkin_ru/1718), вот список всех заданий с командами:
```powershell

$tasklist = @()
Get-ScheduledTask | ForEach-Object {
    $task = [xml](Export-ScheduledTask -TaskName $_.URI)
    $taskdetails = New-Object -Type Psobject -Property @{
        "Name" =  $_.URI
        "Action" = $task.Task.Actions.Exec.Command
   }
   $tasklist += $taskdetails
}
$tasklist | Select-Object Name,Action | Out-GridView
```

![[out-gridview.mp4]]