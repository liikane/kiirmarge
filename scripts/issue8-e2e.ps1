param(
  [string]$SourceExe = 'C:\kt\memilla\debug\kiirmarge.exe'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Drawing

$AE = [System.Windows.Automation.AutomationElement]
$TS = [System.Windows.Automation.TreeScope]
$CT = [System.Windows.Automation.ControlType]

function Fail($message) { Write-Output "FAIL: $message"; exit 1 }
function Info($message) { Write-Output $message }

function Find-AppWindow {
  return $AE::RootElement.FindFirst($TS::Children, (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, 'Kiirmärge')))
}

function Wait-AppWindow([int]$timeoutMs) {
  $deadline = (Get-Date).AddMilliseconds($timeoutMs)
  $win = $null
  while ((Get-Date) -lt $deadline -and $null -eq $win) {
    $win = Find-AppWindow
    if ($null -eq $win) { Start-Sleep -Milliseconds 300 }
  }
  return $win
}

function Find-ByName($rootEl, $name, $type) {
  $cond = New-Object System.Windows.Automation.AndCondition(
    (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, $name)),
    (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $type)))
  return $rootEl.FindFirst($TS::Descendants, $cond)
}

$root = Join-Path ([System.IO.Path]::GetTempPath()) ('KiirmargeIssue8-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $root | Out-Null
$notes = Join-Path $root 'Notes'
New-Item -ItemType Directory -Path $notes | Out-Null
$exe = Join-Path $root 'kiirmarge.exe'
Copy-Item $SourceExe $exe

$same = @(Get-Process -Name '*iirm*' -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $exe })
if ($same.Count -gt 0) { Fail "testkoopia juba töötab (pid $($same.Id -join ', '))" }
$others = @(Get-Process -Name '*iirm*' -ErrorAction SilentlyContinue | Where-Object { $_.Path -ne $exe })
if ($others.Count -gt 0) { Info "HOIATUS: teine kiirmarge eksemplar töötab ($($others[0].Path)) — jätkan, sest identifikaator erineb" }

function Write-Config([string]$save, [string]$close) {
  $notesToml = $notes.Replace('\', '\\')
  $lines = @(
    '[general]',
    'mode = "standalone"',
    'theme = "dark"',
    'always_on_top = true',
    'autostart = false',
    'after_save = "stay"',
    '',
    '[storage]',
    ('notes_dir = "' + $notesToml + '"'),
    'default_to_desktop = false',
    '',
    '[hotkeys]',
    'open = "Ctrl+Alt+F12"',
    ('save = "' + $save + '"'),
    ('close = "' + $close + '"'),
    'screenshot = ""'
  )
  [System.IO.File]::WriteAllText((Join-Path $root 'config.toml'), ($lines -join "`r`n"), (New-Object System.Text.UTF8Encoding($false)))
}

function Start-App {
  $process = Start-Process -FilePath $exe -PassThru
  Start-Sleep -Seconds 3
  if ($process.HasExited) { Fail "protsess lõpetas kohe (exit $($process.ExitCode))" }
  # Teine käivitus tõstab olemasoleva akna esile (üks eksemplar).
  Start-Process -FilePath $exe | Out-Null
  Start-Sleep -Seconds 2
  return $process
}

# --- 1. Vaikeklahvid Enter / Esc: spikker peab olema nuppudel ---
Write-Config 'Enter' 'Esc'
$proc = Start-App
$win = Wait-AppWindow 10000
if ($null -eq $win) { Fail 'akent ei leitud' }
Info 'OK: aken olemas'

$save = Find-ByName $win 'Salvesta' $CT::Button
if ($null -eq $save) { Fail 'nuppu "Salvesta" ei leitud (nimi muutus?)' }
Info 'OK: nupu nimi on endiselt "Salvesta" (varasemad skriptid töötavad edasi)'
if ($save.Current.HelpText -notmatch 'Enter') { Fail "„Salvesta“ vihje ei sisalda Enterit: '$($save.Current.HelpText)'" }
Info "OK: Salvesta vihje — $($save.Current.HelpText)"

$cancel = Find-ByName $win 'Tühista' $CT::Button
if ($null -eq $cancel) { Fail 'nuppu "Tühista" ei leitud (nimi muutus?)' }
if ($cancel.Current.HelpText -notmatch 'Esc') { Fail "„Tühista“ vihje ei sisalda Esci: '$($cancel.Current.HelpText)'" }
Info "OK: Tühista vihje — $($cancel.Current.HelpText)"

$rect = $win.Current.BoundingRectangle
if ($rect.Width -gt 0 -and $rect.Height -gt 0) {
  $bmp = New-Object System.Drawing.Bitmap([int]$rect.Width, [int]$rect.Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bmp)
  $graphics.CopyFromScreen([int]$rect.X, [int]$rect.Y, 0, 0, $bmp.Size)
  $shot = Join-Path (Split-Path -Parent $PSScriptRoot) '.zwork\issue8-buttons.png'
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $shot) | Out-Null
  $bmp.Save($shot, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bmp.Dispose()
  Info "OK: ekraanipilt — $shot"
} else {
  Info 'HOIATUS: akna suurust ei saanud lugeda, ekraanipilti ei tehtud'
}

Stop-Process -Id $proc.Id -Force
Start-Sleep -Milliseconds 800

# --- 2. Muudetud klahvid: spikker peab seadistust järgima ---
Write-Config 'Ctrl+S' 'Alt+X'
$proc2 = Start-App
$win2 = Wait-AppWindow 10000
if ($null -eq $win2) { Fail 'akent ei leitud teisel käivitusel' }

$save2 = Find-ByName $win2 'Salvesta' $CT::Button
if ($null -eq $save2) { Fail 'nuppu "Salvesta" ei leitud teisel käivitusel' }
if ($save2.Current.HelpText -notmatch 'Ctrl\+S') { Fail "vihje ei järgnenud seadele: '$($save2.Current.HelpText)'" }
Info "OK: muudetud salvestusklahv — $($save2.Current.HelpText)"

$cancel2 = Find-ByName $win2 'Tühista' $CT::Button
if ($null -eq $cancel2) { Fail 'nuppu "Tühista" ei leitud teisel käivitusel' }
if ($cancel2.Current.HelpText -notmatch 'Alt\+X') { Fail "vihje ei järgnenud seadele: '$($cancel2.Current.HelpText)'" }
Info "OK: muudetud sulgemisklahv — $($cancel2.Current.HelpText)"

Stop-Process -Id $proc2.Id -Force
Start-Sleep -Milliseconds 600
Info 'VALMIS'
