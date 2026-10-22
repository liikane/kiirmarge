$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$AE = [System.Windows.Automation.AutomationElement]
$TS = [System.Windows.Automation.TreeScope]
$CT = [System.Windows.Automation.ControlType]

function Fail($message) { Write-Output "FAIL: $message"; exit 1 }
function Info($message) { Write-Output $message }

$running = Get-Process -Name '*iirm*' -ErrorAction SilentlyContinue
if ($running) { Fail "kiirmarge.exe juba töötab (pid $($running.Id -join ', '))" }

$root = Join-Path ([System.IO.Path]::GetTempPath()) 'KiirmargeIssue3'
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
Info 'OK: aken olemas'

function Find-ByName($rootEl, $name, $type) {
  $cond = New-Object System.Windows.Automation.AndCondition(
    (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, $name)),
    (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $type)))
  return $rootEl.FindFirst($TS::Descendants, $cond)
}

$edit = $win.FindFirst($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::Edit)))
if ($null -eq $edit) { Fail 'tekstiala ei leitud' }
$checkboxButton = Find-ByName $win 'Lisa märkeruut' $CT::Button
if ($null -eq $checkboxButton) { Fail 'nuppu "Lisa märkeruut" ei leitud' }

$buttonRect = $checkboxButton.Current.BoundingRectangle
$editRect = $edit.Current.BoundingRectangle
Info ("nupu asukoht: Top={0}, Bottom={1}" -f [int]$buttonRect.Top, [int]$buttonRect.Bottom)
Info ("tekstiala asukoht: Top={0}, Bottom={1}" -f [int]$editRect.Top, [int]$editRect.Bottom)

if ($buttonRect.Top -lt $editRect.Top) {
  Info 'OK: nupp on tekstialast kõrgemal'
} else {
  Fail "nupp ei ole tekstialast kõrgemal (nupp.Top=$([int]$buttonRect.Top), tekstiala.Top=$([int]$editRect.Top))"
}
$pin = Find-ByName $win 'Kinnita ekraanile' $CT::Button
$gear = Find-ByName $win 'Seaded' $CT::Button
if ($null -eq $pin -or $null -eq $gear) { Fail 'päise nuppe ei leitud' }
$pinTop = [int]$pin.Current.BoundingRectangle.Top
$gearTop = [int]$gear.Current.BoundingRectangle.Top
$cbTop = [int]$buttonRect.Top
if (([Math]::Abs($cbTop - $pinTop) -le 4) -and ([Math]::Abs($cbTop - $gearTop) -le 4)) {
  Info 'OK: ☑ on samal real 📌 ja ⚙ nupuga'
} else {
  Fail "nupud ei ole samal real: ☑=$cbTop 📌=$pinTop ⚙=$gearTop"
}

$editValue = $edit.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
$checkboxButton.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
Start-Sleep -Milliseconds 500
$value = $editValue.Current.Value
if ($value -eq '- [ ] ') { Info 'OK: nupp lisas märkeruudu' } else { Fail "ootasin '- [ ] ', sain: [$value]" }

Stop-Process -Id $first.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 600
'VALMIS'
