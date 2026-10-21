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
  '  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);',
  '  public const uint KEYUP = 2;',
  '  public static void CtrlEnter() {',
  '    keybd_event(0xA2, 0, 0, UIntPtr.Zero);',
  '    keybd_event(0x0D, 0, 0, UIntPtr.Zero);',
  '    System.Threading.Thread.Sleep(120);',
  '    keybd_event(0x0D, 0, KEYUP, UIntPtr.Zero);',
  '    keybd_event(0xA2, 0, KEYUP, UIntPtr.Zero);',
  '  }',
  '}'
) -join "`r`n"
Add-Type -TypeDefinition $source

function Fail($message) { Write-Output "FAIL: $message"; exit 1 }
function Info($message) { Write-Output $message }

$running = Get-Process -Name 'Kiirmärge' -ErrorAction SilentlyContinue
if ($running) { Fail "Kiirmärge.exe juba töötab (pid $($running.Id -join ', '))" }

$root = Join-Path ([System.IO.Path]::GetTempPath()) 'KiirmargeIssue2Keys'
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
[System.IO.File]::WriteAllText((Join-Path $root 'config.toml'), ($lines -join "`r`n"), (New-Object System.Text.UTF8Encoding($false)))

$first = Start-Process -FilePath $exe -PassThru
Start-Sleep -Seconds 4
if ($first.HasExited) { Fail "protsess lõpetas kohe (exit $($first.ExitCode))" }
Start-Process -FilePath $exe -PassThru | Out-Null
Start-Sleep -Seconds 3

$deadline = (Get-Date).AddSeconds(10)
$win = $null
while ((Get-Date) -lt $deadline -and $null -eq $win) {
  $win = $AE::RootElement.FindFirst($TS::Children, (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, 'Kiirmärge')))
  if ($null -eq $win) { Start-Sleep -Milliseconds 300 }
}
if ($null -eq $win) { Fail 'akent ei leitud' }

$hwnd = [IntPtr]$win.Current.NativeWindowHandle
[K]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 400

$edit = $win.FindFirst($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::Edit)))
if ($null -eq $edit) { Fail 'tekstiala ei leitud' }
$editValue = $edit.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
$editValue.SetValue('- [ ] tere')
$edit.SetFocus()
Start-Sleep -Milliseconds 400

[K]::CtrlEnter()
Start-Sleep -Milliseconds 600
$value = $editValue.Current.Value
$expected = "- [ ] tere`n- [ ] "
if ($value -eq $expected) {
  Info 'OK: Ctrl+Enter jätkas märkeruutude loendit'
} else {
  Info "HOIATUS: ootasin [$expected], sain [$value]"
}

Stop-Process -Id $first.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 600
'VALMIS'
