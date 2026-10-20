$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$AE = [System.Windows.Automation.AutomationElement]
$TS = [System.Windows.Automation.TreeScope]

$source = @(
  'using System;',
  'using System.Runtime.InteropServices;',
  'public static class W {',
  '  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);',
  '  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);',
  '  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);',
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

$running = Get-Process -Name 'Kiirmärge' -ErrorAction SilentlyContinue
if ($running) { Fail "Kiirmärge.exe juba töötab (pid $($running.Id -join ', '))" }

function New-TestApp([string]$open) {
  $dir = Join-Path ([System.IO.Path]::GetTempPath()) ('KiirmargeHK-' + [Guid]::NewGuid().ToString('N').Substring(0, 6))
  New-Item -ItemType Directory -Path $dir | Out-Null
  $exe = Join-Path $dir 'kiirmarge.exe'
  Copy-Item 'C:\kt\memilla\debug\kiirmarge.exe' $exe
  $lines = @(
    '[general]',
    'mode = "standalone"',
    'theme = "dark"',
    'always_on_top = false',
    'autostart = false',
    '',
    '[storage]',
    'notes_dir = "Kiirmärkmed"',
    '',
    '[hotkeys]',
    ('open = "' + $open + '"'),
    'save = "Enter"',
    'close = "Esc"',
    'screenshot = ""'
  )
  [System.IO.File]::WriteAllText((Join-Path $dir 'config.toml'), ($lines -join "`r`n"), (New-Object System.Text.UTF8Encoding($false)))
  return @{ Dir = $dir; Exe = $exe }
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

function HotkeyRound([string]$label, [string]$open, [byte[]]$mods, [byte]$key) {
  "=== $label (peidetud aken -> kiirklahv) ==="
  $app = New-TestApp $open
  $p = Start-Process -FilePath $app.Exe -PassThru
  Start-Sleep -Seconds 4
  if ($p.HasExited) { "  FAIL: protsess lõpetas kohe (exit $($p.ExitCode))"; return }
  $w = Find-AppWindow
  "  enne kiirklahvi: aken UIA-puus = $([bool]$w)"
  [W]::Chord($mods, $key)
  Start-Sleep -Seconds 2
  $w = Find-AppWindow
  "  pärast kiirklahvi: aken UIA-puus = $([bool]$w)"
  if ($w) {
    $hwnd = [IntPtr]$w.Current.NativeWindowHandle
    "  ikooniline=$([W]::IsIconic($hwnd)), nähtav=$([W]::IsWindowVisible($hwnd))"
  }
  Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 700
}

function MinimizeRound([string]$label, [string]$open) {
  "=== $label (minimeeritud aken -> 'Ava' teine eksemplar) ==="
  $app = New-TestApp $open
  $p = Start-Process -FilePath $app.Exe -PassThru
  Start-Sleep -Seconds 4
  if ($p.HasExited) { "  FAIL: protsess lõpetas kohe (exit $($p.ExitCode))"; return }
  Start-Process -FilePath $app.Exe -PassThru | Out-Null
  Start-Sleep -Seconds 2
  $w = Wait-AppWindow 8000
  if (-not $w) { "  FAIL: akent ei leitud"; Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue; return }
  $hwnd = [IntPtr]$w.Current.NativeWindowHandle
  [W]::ShowWindow($hwnd, 6) | Out-Null
  Start-Sleep -Milliseconds 800
  "  minimeeritud: ikooniline=$([W]::IsIconic($hwnd))"
  Start-Process -FilePath $app.Exe -PassThru | Out-Null
  Start-Sleep -Seconds 2
  "  pärast teist eksemplari: ikooniline=$([W]::IsIconic($hwnd)), nähtav=$([W]::IsWindowVisible($hwnd))"
  Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 700
}

HotkeyRound 'Ctrl+Alt+F12' 'Ctrl+Alt+F12' @(0xA2, 0xA4) 0x7B
HotkeyRound 'Ctrl+Shift+~' 'Ctrl+Shift+~' @(0xA2, 0xA0) 0xC0
MinimizeRound 'minimeerimine / Ava' 'Ctrl+Alt+F12'

'VALMIS'
