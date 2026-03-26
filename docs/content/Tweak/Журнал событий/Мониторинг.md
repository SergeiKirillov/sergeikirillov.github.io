---
url:
  - https://www.outsidethebox.ms/22879/
tags:
  - powershell
  - windows
  - журнал
---
## Идея – мониторинг журнала событий
[Известно](https://www.outsidethebox.ms/12241/#event), что при выходе из сна в журнал **Система** (System) пишется событие с кодом **1** от источника **Microsoft-Windows-Power-Troubleshooter**.
## О различных типах журналов событий в Windows
![](images/Pasted%20image%2020260301082531.png)
- **Журналы Windows**. Это старые журналы: Приложения, Безопасность, Установка, Система и что-то еще по мелочи.
- **Журналы приложений и служб**. Десятки новых журналов появились в Windows Vista. Они работают на основе [ETW](https://learn.microsoft.com/en-us/windows-hardware/drivers/devtest/event-tracing-for-windows--etw-) и событий .NET.

## Мониторинг журналов Windows
Выход из сна регистрируется в журнале Система. Для журналов Windows быстро нашлись два родственных способа:
- [создание фонового задания PowerShell](https://web.archive.org/web/20210312161823/https:/community.idera.com/database-tools/powershell/powertips/b/tips/posts/responding-to-new-event-log-entries-part-2) для мониторинга журнала с помощью [класса EventLog](https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.eventlog)
- регистрация события WMI ([временная](https://learn-powershell.net/2013/08/02/powershell-and-events-wmi-temporary-event-subscriptions/) или [постоянная](https://learn-powershell.net/2013/08/14/powershell-and-events-permanent-wmi-event-subscriptions/)) для отслеживания системных событий
Мне приглянулся первый вариант, потому что в примере нужно был лишь поменять название журнала, ИД и источник события. Я лишь слегка заточил его под выход из сна.
### Скрипт
Командлет **Register-ObjectEvent** по сути [создает фоновое задание](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/register-objectevent?view=powershell-7.2#example-2-specify-an-action-to-respond-to-an-event) (PowerShell job).
   
```powershell
# Запускать от администратора
# Журнал (Get-EventLog -AsString)
$log =[System.Diagnostics.EventLog]'System'
$log.EnableRaisingEvents=$true

# Имя фонового задания
$jobname='ResumeFromSleep'

 # Действия при появлении события 
 $action   = { 
     # Путь к файлу с отловленными событиями 
     $logFile   =   "C:\temp\ResumeFromSleep.txt" 
     $entry   =   $Event  .SourceEventArgs.Entry    
     # Искомое событие: ID 1 от 'Microsoft-Windows-Power-Troubleshooter' 
     if   (  $entry  .EventId   -eq   1   -and   $entry  .Source   -eq   'Microsoft-Windows-Power-Troubleshooter'  ) { 
         # Сообщение 
         $msg   =   "Resumed from sleep: event $($entry.EventId) from $($entry.Source) is: $($entry.Message)"        
         $msg   |   Out-File   -Append   -FilePath   $logFile   -Encoding   Unicode         
         Write-Host   $msg 
     } 
 } 
 # Отменяем регистрацию предыдущих фоновых заданий с таким же именем 
 Unregister-Event   -SourceIdentifier   $jobname   -ErrorAction   SilentlyContinue 
 # Регистрируем и запускаем фоновую задачу 
 $job   =   Register-ObjectEvent   -InputObject   $log   -EventName   EntryWritten   -SourceIdentifier   $jobname   -Action   $action 
 Receive-Job   $job 
 Write-Host   "Monitoring started for Event ID 1 (Power-Troubleshooter)." 
 # Необязательно: блокируем появление приглашения на ввод следующей команды 
 # Имеет смысл только для выполнения в консоли 
 while   (  $true  ) {   Start-Sleep   -Seconds   1 } 
 <# остановка мониторинга и полное удаление фонового задания 
 Get-Job -Name 'ResumeFromSleep' | Stop-Job -PassThru | Remove-Job 
 #> 
```   
При наступлении события (выходе из сна) его свойства выводятся на экран и выполняется запись в текстовый файл, что вы можете легко изменить под свои нужды.

### Демо

Тестовое событие пишется в журнал утилитой **eventcreate**, но смысл тот же. Каждое событие одновременно выводится в консоль и текстовый файл, изменения в котором отслеживает командлет **Get-Content**.
![](images/demo-monitoring.mp4)

### Организация запуска скрипта
У работы фоновых заданий есть неочевидные тонкости.
#### Тестовый запуск
Для теста просто вызовите скрипт из консоли: `.\ResumeFromSleep.ps1`. Теперь можно отправить систему в сон, а после выхода проверить наличие записей в тестовом файле на диске.
Для отмены мониторинга фоновое задание нужно остановить. Заодно можно и удалить.
```powershell
Get-Job -Name ResumeFromSleep | Stop-Job -PassThru | Remove-Job
```
Учтите, что фоновая работа зависит от наличия родительского процесса. Закрыв текущую сессию консоли, вы также прекратите отслеживание.

#### Регулярный запуск
В общем случае скрипт нужно запускать отдельным процессом. Для разовых запусков подходит такой вариант:

```powershell
Start-Process -Verb RunAs -FilePath powershell -ArgumentList "-WindowStyle hidden -ex bypass -File C:\Path\ResumeFromSleep.ps1"
```

Для регулярной работы имеет смысл создать для запуска… запланированное задание на однократный запуск от имени SYSTEM или [для всех пользователей](https://www.outsidethebox.ms/21628/#_5610)! Да, по условиям задачи планировщик не выполняет такие задания автоматически. Однако на запуск по требованию это не распространяется. Поэтому можно воспользоваться разделом реестра Run для выполнения при старте системы!

Код ниже создает задание ResumeFromSleep для запуска нашего скрипта таким образом, чтобы оно выполнялось при работе от батареи и не завершалось автоматически. Этот модуль PowerShell я разбирал в статье про [выполнение заданий на закате и восходе солнца](https://www.outsidethebox.ms/20351/#_Toc132).

```powerShell
 #Переменные 
 #путь к скрипту и УЗ системы 
 $path   =   "C:\Program Files\Scripts" 
 $system   =   "NT AUTHORITY\SYSTEM" 
 #Создание задания 
 $taskname   =   "ResumeFromSleep" 
 #Общие: выполнять с наивысшими правами от имени системы вне зависимости от входа 
 $principal   =   New-ScheduledTaskPrincipal   -UserId   $system   -LogonType   ServiceAccount 
 #Триггер 
 $trigger   =   New-ScheduledTaskTrigger   -Once   -At   00:01 
 #Параметры: #запускать при работе от батареи; немедленно если пропущено; не останавливать 
 $settings   =   New-ScheduledTaskSettingsSet   -AllowStartIfOnBatteries   -StartWhenAvailable   -ExecutionTimeLimit   0 
 #Команда... 
 $execute   =   "powershell" 
 #... и ее параметры командной строки 
 $argument   =   "-ExecutionPolicy Bypass -WindowStyle Hidden -file $path\ResumeFromSleep.ps1" 
 #Действие: "команда + параметры командной строки" 
 $action   =   New-ScheduledTaskAction   -Execute   $execute   -Argument   $argument 
 #Создать задание в планировщике 
 Register-ScheduledTask   -TaskName   $taskname   -Action   $action   -Trigger   $trigger   -Settings   $settings   -Principal   $principal 
 <# 
 $trigger = @( 
     #Запускать ежедневно сразу после полуночи (не пробуждая ПК) 
     $(New-ScheduledTaskTrigger -Daily -At 00:01), 
     #Запускать при входе пользователя в систему 
     $(New-ScheduledTaskTrigger -AtLogon) 
 ) 
 #> 
```

Запуск задания проще всего добавить в HKLM старой доброй **reg add**:
```powershell
reg add HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run /v ResumeFromSleep /t REG_SZ /d "powershell -ex bypass -noprofile -command Start-ScheduledTask -Taskname ResumeFromSleep"
```

Теперь запланированное задание будет форсироваться при старте ОС и запускать «невидимую» фоновую задачу PowerShell в [сеансе 0](https://www.outsidethebox.ms/21628/#_5610) для мониторинга событий в журнале.

Чтобы остановить отслеживание, просто завершите запланированное задание:
```powershell
Stop-ScheduledTask -Taskname ResumeFromSleep
```
![](images/Pasted%20image%2020260301084603.png)



## Мониторинг журналов приложений и служб
Допустим, мы хотим выполнять задачу при переходе системы в режим энергосбережения. Для начала надо выяснить, какое событие при этом пишется в журналы.

### Поиск журнала и события

Это  [несложно организовать](https://t.me/sterkin_ru/1399) с помощью **Get-WinEvent**. Включив режим экономии батареи, вы помимо прочих найдете такое событие:

- журнал: `Microsoft-Windows-PushNotification-Platform/Operational`
- ИД: `1025`
- сообщение: `A Power event was fired: BatterySaverStateChange [PowerEventType] true [Enabled].`
- пользователь: `система, S-1-5-18`

В _данном_ случае следует конкретизировать пользователя. Дело в том, что одновременно регистрируется такое же событие от имени интерактивного пользователя. Если опираться только на ИД события, скрипт отработает дважды.

![](images/Pasted%20image%2020260301084704.png)
Итак, у нас есть критерии для мониторинга.

### Скрипт
Для отслеживания журналов приложений и служб предусмотрен класс [EventLogWatcher](https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.eventing.reader.eventlogwatcher?view=dotnet-plat-ext-6.0). Спасибо за подсказки, [Вадимс Поданс](https://www.sysadmins.lv/).
```powershell
# Запускать от администратора
# Журнал
$log = "Microsoft-Windows-PushNotification-Platform/Operational"
$watcher = New-Object System.Diagnostics.Eventing.Reader.EventLogWatcher $log
$watcher.Enabled = $true
# Имя фонового задания
$jobname = 'BatterySaver'
# Действия при появлении события
$action = {
    # Путь к файлу с отловленными событиями
    $logFile = "C:\temp\BatterySaver.txt"
    $entry = $Event.SourceEventArgs.Entry    
    # Искомое событие: ID 1025
        if ($eventArgs.EventRecord.Id -eq 1025 -and
            $eventArgs.EventRecord.UserID -eq 'S-1-5-18' -and
            $eventArgs.EventRecord.FormatDescription() -eq 'A Power event was fired: BatterySaverStateChange [PowerEventType] true [Enabled].'
        ) {        
        # Сообщение
        $msg = "Triggered: event $($eventArgs.EventRecord.Id) from $($eventArgs.EventRecord.UserID) with message: $($eventArgs.EventRecord.FormatDescription())"
        $msg | Out-File -Append -FilePath $logFile -Encoding Unicode
        # Необязательно: форсируем вывод в консоль (при использовании Receive-Job)
        Write-Host $msg
    }
}
# Отменяем регистрацию предыдущих фоновых заданий с таким же именем
Unregister-Event -SourceIdentifier $jobname -ErrorAction SilentlyContinue
$job = Register-ObjectEvent -InputObject $watcher -EventName 'EventRecordWritten' -SourceIdentifier $jobname -Action $action
Receive-Job $job
Write-Host "Monitoring started for Event ID 1025"
# Необязательно: блокируем появление приглашения на ввод следующей команды
# Имеет смысл только для выполнения в консоли
while ($true) { Start-Sleep -Seconds 1 }
<# остановка мониторинга и полное удаление фонового задания
Get-Job -Name 'BatterySaver' | Stop-Job -PassThru | Remove-Job
$watcher.Dispose()
#>
```

Организация запуска скрипта такая же, как и в случае с мониторингом журнала события Windows.

Протестировать действие при конкретном событии на компьютере без батареи не получится, но вы легко можете скорректировать скрипт под любой журнал и событие.