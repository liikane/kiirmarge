$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$AE = [System.Windows.Automation.AutomationElement]
$TS = [System.Windows.Automation.TreeScope]
$CT = [System.Windows.Automation.ControlType]

$source = @(
  'using System;',
  'using System.Runtime.InteropServices;',
  'public static class K {',
  '  [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);',
  '  public const uint KEYUP = 2;',
  '  public static void Chord(byte[] mods, byte key) {',
  '    for (int i = 0; i < mods.Length; i++) keybd_event(mods[i], 0, 0, UIntPtr.Zero);',
  '    keybd_event(key, 0, 0, UIntPtr.Zero);',
  '    System.Threading.Thread.Sleep(120);',
  '    keybd_event(key, 0, KEYUP, UIntPtr.Zero);',
  '    for (int i = mods.Length - 1; i >= 0; i--) keybd_event(mods[i], 0, KEYUP, UIntPtr.Zero);',
  '  }',
  '}'
) -join "`r`n"
Add-Type -TypeDefinition $source

function Fail($message) { Write-Output "FAIL: $message"; exit 1 }
function Info($message) { Write-Output $message }

$running = Get-Process -Name '*iirm*' -ErrorAction SilentlyContinue
if ($running) { Fail "kiirmarge.exe juba töötab (pid $($running.Id -join ', '))" }

$root = Join-Path ([System.IO.Path]::GetTempPath()) 'KiirmargeIssue11'
if (Test-Path $root) { Remove-Item $root -Recurse -Force -ErrorAction SilentlyContinue }
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
  'after_save = "confirm"',
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
[System.IO.File]::WriteAllText((Join-Path $root 'config.toml'), ($lines -join "`r`n"), (New-Object System.Text.UTF8Encoding($false)))

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

$first = Start-Process -FilePath $exe -PassThru
Start-Sleep -Seconds 4
if ($first.HasExited) { Fail "protsess lõpetas kohe (exit $($first.ExitCode))" }
Start-Process -FilePath $exe -PassThru | Out-Null
Start-Sleep -Seconds 3

$win = Wait-AppWindow 10000
if ($null -eq $win) { Fail 'akent ei leitud' }
Info 'OK: aken olemas'

$edit = $win.FindFirst($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::Edit)))
if ($null -eq $edit) { Fail 'tekstiala ei leitud' }
$editValue = $edit.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
$editValue.SetValue('Kinnitusvaate test')
Start-Sleep -Milliseconds 300

$save = Find-ByName $win 'Salvesta' $CT::Button
if ($null -eq $save) { Fail 'nuppu "Salvesta" ei leitud' }
$save.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
Start-Sleep -Milliseconds 1200

$title = $win.FindFirst($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, 'Salvestatud!')))
if ($null -eq $title) { Fail 'kinnitust "Salvestatud!" ei leitud' }
Info 'OK: kinnitus "Salvestatud!" kuvati'

$savedText = $win.FindFirst($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, 'Kinnitusvaate test')))
if ($null -eq $savedText) { Info 'HOIATUS: salvestatud teksti kinnitusvaates ei leitud' } else { Info 'OK: salvestatud tekst on kinnitusvaates' }

$files = @(Get-ChildItem $notes -Filter '*.md' -ErrorAction SilentlyContinue)
if ($files.Count -eq 0) { Fail "märget ei tekkinud kausta $notes" }
$note = $files | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$content = [System.IO.File]::ReadAllText($note.FullName, [System.Text.Encoding]::UTF8)
if ($content -match 'Kinnitusvaate test') { Info "OK: märge salvestus — $($note.Name)" } else { Fail "failis pole teksti: $content" }

Info 'Ootan 6 s, et kinnitus kaoks ja aken peituks…'
Start-Sleep -Seconds 6
$after = Find-AppWindow
if ($null -ne $after) { Fail 'aken ei peitunud 5 sekundi järel' }
Info 'OK: aken peitus 5 sekundi järel'

[K]::Chord(@(0xA2, 0xA4), 0x7B)
Start-Sleep -Seconds 2
$reopened = Wait-AppWindow 6000
if ($null -eq $reopened) { Fail 'kiirklahv ei avanud akent pärast peitmist' }
Info 'OK: kiirklahv avas akna uuesti'

$staleTitle = $reopened.FindFirst($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, 'Salvestatud!')))
if ($null -eq $staleTitle) { Info 'OK: kinnitusvaade on lähtestatud' } else { Info 'HOIATUS: kinnitusvaade jäi nähtavale' }

Stop-Process -Id $first.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 600
'VALMIS'
