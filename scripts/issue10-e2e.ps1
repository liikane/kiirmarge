param(
  [string]$SourceExe = 'C:\kt\memilla\debug\kiirmarge.exe'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$source = @(
  'using System;',
  'using System.Runtime.InteropServices;',
  'public static class W {',
  '  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);',
  '}'
) -join "`r`n"
Add-Type -TypeDefinition $source

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

function Get-ComboValue($combo) {
  try {
    $value = $combo.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
    if ($value.Current.Value) { return $value.Current.Value }
  } catch { }
  try {
    $selection = $combo.GetCurrentPattern([System.Windows.Automation.SelectionPattern]::Pattern)
    $items = $selection.Current.GetSelection()
    if ($items.Count -gt 0) { return $items[0].Current.Name }
  } catch { }
  return ''
}

function Find-LocationCombo($win) {
  $byName = Find-ByName $win 'Salvestuskoht' $CT::ComboBox
  if ($null -ne $byName) { return $byName }
  $combos = $win.FindAll($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::ComboBox)))
  foreach ($combo in $combos) {
    $value = Get-ComboValue $combo
    if ($value -eq 'Dokumendid' -or $value -eq 'Töölaud' -or $value -eq 'Kohandatud kaust') { return $combo }
  }
  return $null
}

function Set-ComboByKey($win, $combo, [string]$key, [string]$expected) {
  for ($attempt = 0; $attempt -lt 4; $attempt++) {
    [W]::SetForegroundWindow([IntPtr]$win.Current.NativeWindowHandle) | Out-Null
    Start-Sleep -Milliseconds 200
    try { $combo.SetFocus() } catch { }
    Start-Sleep -Milliseconds 150
    [System.Windows.Forms.SendKeys]::SendWait($key)
    $deadline = (Get-Date).AddMilliseconds(900)
    while ((Get-Date) -lt $deadline) {
      if ((Get-ComboValue $combo) -eq $expected) { Start-Sleep -Milliseconds 250; return }
      Start-Sleep -Milliseconds 150
    }
  }
  Fail "valik ei lülitunud '$expected' (praegu '$((Get-ComboValue $combo))')"
}

function Find-HintPath($win) {
  $texts = $win.FindAll($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::Text)))
  foreach ($text in $texts) {
    if ($text.Current.Name -like 'Märkmed: *') { return $text.Current.Name }
  }
  return ''
}

function Wait-Hint($win, [string]$expected, [int]$timeoutMs) {
  $deadline = (Get-Date).AddMilliseconds($timeoutMs)
  $hint = ''
  while ((Get-Date) -lt $deadline) {
    $hint = Find-HintPath $win
    if ($hint -eq $expected) { return $hint }
    Start-Sleep -Milliseconds 250
  }
  return $hint
}

$root = Join-Path ([System.IO.Path]::GetTempPath()) ('KiirmargeIssue10-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $root | Out-Null
$custom = Join-Path $root 'CustomNotes'
New-Item -ItemType Directory -Path $custom | Out-Null
$exe = Join-Path $root 'kiirmarge.exe'
Copy-Item $SourceExe $exe

$same = @(Get-Process -Name '*iirm*' -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $exe })
if ($same.Count -gt 0) { Fail "testkoopia juba töötab (pid $($same.Id -join ', '))" }
$others = @(Get-Process -Name '*iirm*' -ErrorAction SilentlyContinue | Where-Object { $_.Path -ne $exe })
if ($others.Count -gt 0) { Info "HOIATUS: teine kiirmarge eksemplar töötab ($($others[0].Path)) — jätkan, sest identifikaator erineb" }

$customToml = $custom.Replace('\', '\\')
$lines = @(
  '[general]',
  'mode = "standalone"',
  'theme = "dark"',
  'always_on_top = true',
  'autostart = false',
  'after_save = "stay"',
  '',
  '[storage]',
  ('notes_dir = "' + $customToml + '"'),
  'default_to_desktop = false',
  '',
  '[hotkeys]',
  'open = "Ctrl+Alt+F12"',
  'save = "Enter"',
  'close = "Esc"',
  'screenshot = ""'
)
$configFile = Join-Path $root 'config.toml'
[System.IO.File]::WriteAllText($configFile, ($lines -join "`r`n"), (New-Object System.Text.UTF8Encoding($false)))

$documents = [Environment]::GetFolderPath('MyDocuments')
$desktop = [Environment]::GetFolderPath('Desktop')

$proc = Start-Process -FilePath $exe -PassThru
Start-Sleep -Seconds 3
if ($proc.HasExited) { Fail "protsess lõpetas kohe (exit $($proc.ExitCode))" }
# Teine käivitus tõstab olemasoleva akna esile (üks eksemplar).
Start-Process -FilePath $exe | Out-Null
Start-Sleep -Seconds 2
$win = Wait-AppWindow 10000
if ($null -eq $win) { Fail 'akent ei leitud' }
Info 'OK: aken olemas'

$settings = Find-ByName $win 'Seaded' $CT::Button
if ($null -eq $settings) { Fail 'seadete nuppu ei leitud' }
$settings.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
Start-Sleep -Milliseconds 700
Info 'OK: seaded avatud'

$rect = $win.Current.BoundingRectangle
if ($rect.Width -gt 0 -and $rect.Height -gt 0) {
  $bmp = New-Object System.Drawing.Bitmap([int]$rect.Width, [int]$rect.Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bmp)
  $graphics.CopyFromScreen([int]$rect.X, [int]$rect.Y, 0, 0, $bmp.Size)
  $shot = Join-Path (Split-Path -Parent $PSScriptRoot) '.zwork\issue10-settings.png'
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $shot) | Out-Null
  $bmp.Save($shot, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bmp.Dispose()
  Info "OK: ekraanipilt — $shot"
}

$combo = Find-LocationCombo $win
if ($null -eq $combo) { Fail 'välja "Salvestuskoht" ei leitud' }
$value = Get-ComboValue $combo
if ($value -ne 'Kohandatud kaust') { Fail "absoluutse teega peaks valik olema „Kohandatud kaust“, oli '$value'" }
Info "OK: absoluutne tee -> $value"

$hint = Wait-Hint $win ("Märkmed: " + $custom) 5000
if ($hint -ne ("Märkmed: " + $custom)) { Fail "vale lahendatud tee: '$hint'" }
Info "OK: $hint"

Set-ComboByKey $win $combo '{HOME}' 'Dokumendid'
$hint = Wait-Hint $win ("Märkmed: " + (Join-Path $documents 'Kiirmärkmed')) 5000
if ($hint -ne ("Märkmed: " + (Join-Path $documents 'Kiirmärkmed'))) { Fail "„Dokumendid“ lahendus vale: '$hint'" }
Info "OK: $hint"

Set-ComboByKey $win $combo '{DOWN}' 'Töölaud'
$expectedDesktop = "Märkmed: " + (Join-Path $desktop 'Kiirmärkmed')
$hint = Wait-Hint $win $expectedDesktop 5000
if ($hint -ne $expectedDesktop) { Fail "„Töölaud“ lahendus vale: '$hint' (oodatud '$expectedDesktop')" }
Info "OK: $hint"

$saveSettings = Find-ByName $win 'Salvesta seaded' $CT::Button
if ($null -eq $saveSettings) { Fail 'nuppu "Salvesta seaded" ei leitud' }
$saveSettings.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
Start-Sleep -Milliseconds 1200

$text = [System.IO.File]::ReadAllText($configFile, [System.Text.Encoding]::UTF8)
if ($text -notmatch 'default_to_desktop = true') { Fail "seadistusse ei kirjutatud default_to_desktop = true:`n$text" }
Info 'OK: seadistusse kirjutati default_to_desktop = true'
if ($text -notmatch 'notes_dir = "Kiirmärkmed"') { Fail "notes_dir ei normaliseerunud suhteliseks:`n$text" }
Info 'OK: notes_dir jäi suhteliseks ("Kiirmärkmed")'

$status = ''
$texts = $win.FindAll($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::Text)))
foreach ($item in $texts) {
  if ($item.Current.Name -like 'Seaded salvestatud*') { $status = $item.Current.Name }
}
if ($status -eq '') { Fail 'kinnitust "Seaded salvestatud" ei leitud' }
if ($status -notlike ('*' + (Join-Path $desktop 'Kiirmärkmed') + '*')) { Fail "kinnituses vale tee: '$status'" }
Info "OK: $status"

# Kohandatud kausta valik: peab pakkuma seni kehtinud teed (märkmed ei liigu)
Set-ComboByKey $win $combo '{END}' 'Kohandatud kaust'
$hint = Wait-Hint $win $expectedDesktop 5000
if ($hint -ne $expectedDesktop) { Fail "„Kohandatud kaust“ muutis lahendatud teed: '$hint'" }
Info "OK: kohandatud kaust pakkus seni kehtinud teed ($hint)"

Stop-Process -Id $proc.Id -Force
Start-Sleep -Milliseconds 600
Info 'VALMIS'
