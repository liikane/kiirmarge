$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$AE = [System.Windows.Automation.AutomationElement]
$TS = [System.Windows.Automation.TreeScope]

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

$root = Join-Path ([System.IO.Path]::GetTempPath()) 'KiirmargeIssue9'
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
  '',
  '[storage]',
  ('notes_dir = "' + $notesToml + '"'),
  '',
  '[hotkeys]',
  'open = "Ctrl+Shift+1"',
  'save = "Enter"',
  'close = "Esc"',
  'screenshot = ""'
)
[System.IO.File]::WriteAllText((Join-Path $root 'config.toml'), ($lines -join "`r`n"), (New-Object System.Text.UTF8Encoding($false)))

$first = Start-Process -FilePath $exe -PassThru
Start-Sleep -Seconds 4
if ($first.HasExited) { Fail "protsess lõpetas kohe (exit $($first.ExitCode))" }
$before = $AE::RootElement.FindFirst($TS::Children, (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, 'Kiirmärge')))
Info "enne kiirklahvi: aken UIA-puus = $([bool]$before)"
if ($before) { Fail 'aken peaks alguses peidetud olema (kui on nähtav, siis kiirklahvi registreerimine ebaõnnestus)' }

[K]::Chord(@(0xA2, 0xA0), 0x31)
Start-Sleep -Seconds 2

$deadline = (Get-Date).AddSeconds(8)
$after = $null
while ((Get-Date) -lt $deadline -and $null -eq $after) {
  $after = $AE::RootElement.FindFirst($TS::Children, (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, 'Kiirmärge')))
  if ($null -eq $after) { Start-Sleep -Milliseconds 300 }
}
if ($null -eq $after) { Fail 'Ctrl+Shift+1 ei avanud akent' }
Info 'OK: Ctrl+Shift+1 avas akna'

Stop-Process -Id $first.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 600
'VALMIS'
