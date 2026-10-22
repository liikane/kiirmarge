$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$AE = [System.Windows.Automation.AutomationElement]
$TS = [System.Windows.Automation.TreeScope]
$CT = [System.Windows.Automation.ControlType]

$source = @(
  'using System;',
  'using System.Runtime.InteropServices;',
  'public static class W {',
  '  [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr hWnd, int nIndex);',
  '  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);',
  '}'
) -join "`r`n"
Add-Type -TypeDefinition $source

$GWL_EXSTYLE = -20
$WS_EX_TOPMOST = 8

function Fail($message) { Write-Output "FAIL: $message"; exit 1 }
function Info($message) { Write-Output $message }

$running = Get-Process -Name '*iirm*' -ErrorAction SilentlyContinue
if ($running) { Fail "Kiirmärge.exe juba töötab (pid $($running.Id -join ', '))" }

$root = Join-Path ([System.IO.Path]::GetTempPath()) 'KiirmargeIssue1'
if (Test-Path $root) { Remove-Item $root -Recurse -Force }
New-Item -ItemType Directory -Path $root | Out-Null
$notes = Join-Path $root 'Notes'
New-Item -ItemType Directory -Path $notes | Out-Null
$exe = Join-Path $root 'kiirmarge.exe'
Copy-Item 'C:\kt\memilla\debug\kiirmarge.exe' $exe

$notesToml = $notes.Replace('\', '\\')
$lines = @(
  '[general]',
  'mode = "standalone"',
  'theme = "dark"',
  'always_on_top = true',
  'autostart = false',
  '',
  '[storage]',
  ('notes_dir = "' + $notesToml + '"'),
  '',
  '[hotkeys]',
  'open = "Ctrl+Alt+F12"',
  'save = "Enter"',
  'close = "Esc"',
  'screenshot = ""'
)
$configPath = Join-Path $root 'config.toml'
[System.IO.File]::WriteAllText($configPath, ($lines -join "`r`n"), (New-Object System.Text.UTF8Encoding($false)))

function Get-Topmost([IntPtr]$hwnd) {
  $exStyle = [W]::GetWindowLong($hwnd, $GWL_EXSTYLE)
  return (($exStyle -band $WS_EX_TOPMOST) -ne 0)
}

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

function Invoke-Button($element) {
  $pattern = $null
  if ($element.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$pattern)) {
    $pattern.Invoke()
    return
  }
  if ($element.TryGetCurrentPattern([System.Windows.Automation.TogglePattern]::Pattern, [ref]$pattern)) {
    $pattern.Toggle()
    return
  }
  Fail 'nupp ei toeta Invoke- ega Toggle-mustrit'
}

$first = Start-Process -FilePath $exe -PassThru
Start-Sleep -Seconds 4
if ($first.HasExited) { Fail "protsess lõpetas kohe (exit $($first.ExitCode))" }
Start-Process -FilePath $exe -PassThru | Out-Null
Start-Sleep -Seconds 3

$win = Wait-AppWindow 10000
if ($null -eq $win) { Fail 'akent ei leitud' }
$hwnd = [IntPtr]$win.Current.NativeWindowHandle
[W]::SetForegroundWindow($hwnd) | Out-Null
Info "OK: aken olemas (HWND=$hwnd)"

$initial = Get-Topmost $hwnd
Info "alguses alati esiplaanil: $initial"
if (-not $initial) { Fail 'alguses peaks aken olema alati esiplaanil (config always_on_top = true)' }

$pin = Find-ByName $win 'Kinnita ekraanile' $CT::Button
if ($null -eq $pin) { Fail 'nuppu "Kinnita ekraanile" ei leitud' }
Info 'OK: nööpnõela nupp olemas'

Invoke-Button $pin
Start-Sleep -Milliseconds 1200
$afterFirst = Get-Topmost $hwnd
Info "pärast 1. klõpsu alati esiplaanil: $afterFirst"
if ($afterFirst) { Fail 'pärast väljalülitamist ei tohiks aken olla alati esiplaanil' }

$configText = [System.IO.File]::ReadAllText($configPath, [System.Text.Encoding]::UTF8)
if ($configText -match 'always_on_top = false') { Info 'OK: seadistusse salvestus always_on_top = false' } else { Fail "config'is pole always_on_top = false: $configText" }

Invoke-Button $pin
Start-Sleep -Milliseconds 1200
$afterSecond = Get-Topmost $hwnd
Info "pärast 2. klõpsu alati esiplaanil: $afterSecond"
if (-not $afterSecond) { Fail 'uuesti sisselülitamine ei andnud esiplaanile' }

# Kolmas klõps välja + taaskäivitus: kas olek püsib?
Invoke-Button $pin
Start-Sleep -Milliseconds 1200
Stop-Process -Id $first.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 1000

$secondRun = Start-Process -FilePath $exe -PassThru
Start-Sleep -Seconds 4
if ($secondRun.HasExited) { Fail 'taaskäivitus ebaõnnestus' }
Start-Process -FilePath $exe -PassThru | Out-Null
Start-Sleep -Seconds 3
$win2 = Wait-AppWindow 10000
if ($null -eq $win2) { Fail 'taaskäivitusel akent ei leitud' }
$hwnd2 = [IntPtr]$win2.Current.NativeWindowHandle
$persisted = Get-Topmost $hwnd2
Info "taaskäivitusel alati esiplaanil: $persisted"
if ($persisted) { Fail 'väljalülitatud olek ei püsinud taaskäivitusel' }
Info 'OK: olek püsib taaskäivitusel'

Stop-Process -Id $secondRun.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 600
'VALMIS'
