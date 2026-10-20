$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$AE = [System.Windows.Automation.AutomationElement]
$TS = [System.Windows.Automation.TreeScope]
$CT = [System.Windows.Automation.ControlType]

function Fail($message) { Write-Output "FAIL: $message"; exit 1 }
function Info($message) { Write-Output $message }

$running = Get-Process -Name 'kiirmarge' -ErrorAction SilentlyContinue
if ($running) {
  Fail "kiirmarge.exe juba töötab (pid $($running.Id -join ', ')) — sule see enne testi"
}

$root = Join-Path ([System.IO.Path]::GetTempPath()) 'KiirmargeE4'
if (Test-Path $root) { Remove-Item $root -Recurse -Force }
$vault = Join-Path $root 'Vault'
New-Item -ItemType Directory -Path (Join-Path $vault 'Kiirmärkmed') -Force | Out-Null

$exeSource = 'C:\kt\memilla\debug\kiirmarge.exe'
if (-not (Test-Path $exeSource)) { Fail "exe puudub: $exeSource" }
$exe = Join-Path $root 'kiirmarge.exe'
Copy-Item $exeSource $exe

$vaultToml = $vault.Replace('\', '\\')
$configLines = @(
  '[general]',
  'mode = "obsidian"',
  'theme = "dark"',
  'always_on_top = false',
  'autostart = false',
  '',
  '[storage]',
  ('vault = "' + $vaultToml + '"'),
  'notes_dir = "Kiirmärkmed"',
  'link_style = "auto"',
  '',
  '[hotkeys]',
  'open = "Ctrl+Alt+F12"',
  'save = "Enter"',
  'close = "Esc"',
  'screenshot = ""'
)
$configText = $configLines -join "`r`n"
$configPath = Join-Path $root 'config.toml'
[System.IO.File]::WriteAllText($configPath, $configText, (New-Object System.Text.UTF8Encoding($false)))
$beforeHash = (Get-FileHash $configPath -Algorithm SHA256).Hash

Info "Testkaust: $root"

$first = Start-Process -FilePath $exe -PassThru
Start-Sleep -Seconds 2
if ($first.HasExited) { Fail "esimene protsess lõpetas kohe (exit $($first.ExitCode))" }
Info 'OK: esimene protsess töötab (aken peaks olema peidetud)'

$second = Start-Process -FilePath $exe -PassThru
Start-Sleep -Seconds 2
if (-not $second.HasExited) { Info 'HOIATUS: teine protsess ei lõpetanud ise (single-instance?)' } else { Info 'OK: teine protsess lõpetas ise (üks eksemplar)' }

$deadline = (Get-Date).AddSeconds(10)
$win = $null
while ((Get-Date) -lt $deadline -and $null -eq $win) {
  $win = $AE::RootElement.FindFirst($TS::Children, (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, 'Kiirmärge')))
  if ($null -eq $win) { Start-Sleep -Milliseconds 300 }
}
if ($null -eq $win) { Fail 'akent "Kiirmärge" ei leitud' }
Info "OK: aken leitud ($($win.Current.Name))"

function Find-ByName($rootEl, $name, $type) {
  $cond = New-Object System.Windows.Automation.AndCondition(
    (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, $name)),
    (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $type)))
  return $rootEl.FindFirst($TS::Descendants, $cond)
}

$edit = $win.FindFirst($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::Edit)))
if ($null -eq $edit) { Fail 'tekstiala ei leitud' }
$valuePattern = $edit.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
$valuePattern.SetValue('E4 testmärge — Obsidiani režiim')
Info 'OK: tekstiala täidetud'

Start-Sleep -Milliseconds 300
$saveButton = Find-ByName $win 'Salvesta' $CT::Button
if ($null -eq $saveButton) { Fail 'nuppu "Salvesta" ei leitud' }
$saveButton.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
Start-Sleep -Seconds 2

$noteFolder = Join-Path $vault 'Kiirmärkmed'
$files = @(Get-ChildItem $noteFolder -Filter '*.md' -ErrorAction SilentlyContinue)
if ($files.Count -eq 0) { Fail "märget ei tekkinud kausta $noteFolder" }
$note = $files | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$content = [System.IO.File]::ReadAllText($note.FullName, [System.Text.Encoding]::UTF8)
Info "OK: märge salvestus vaulti — $($note.FullName)"
if ($content -match 'E4 testmärge') { Info 'OK: sisu sisaldab testteksti' } else { Fail "sisu ei sisalda testteksti: $content" }
if ($content -match '# Kiirmärge') { Info 'OK: päis on olemas' } else { Info "HOIATUS: päis puudub: $content" }

$settingsButton = Find-ByName $win 'Seaded' $CT::Button
if ($null -eq $settingsButton) { Fail 'nuppu "Seaded" ei leitud' }
$settingsButton.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
Start-Sleep -Milliseconds 900

foreach ($label in @('Režiim', 'Obsidiani vault', 'Lingistiil', 'Märkmete kaust')) {
  $found = $win.FindFirst($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, $label)))
  if ($found) { Info "OK: '$label' olemas ($($found.Current.ControlType.ProgrammaticName))" } else { Info "HOIATUS: silti '$label' ei leitud" }
}

$modeCombo = Find-ByName $win 'Režiim' $CT::ComboBox
if ($modeCombo) {
  try {
    $modeValue = $modeCombo.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).Current.Value
    Info "OK: režiimi ripploend, väärtus: $modeValue"
  } catch {
    Info "HOIATUS: režiimi väärtust ei saanud lugeda: $($_.Exception.Message)"
  }
} else { Info 'HOIATUS: režiimi ripploendit ei leitud' }

$vaultCombo = Find-ByName $win 'Obsidiani vault' $CT::ComboBox
if ($vaultCombo) {
  try {
    $ec = $vaultCombo.GetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern)
    $ec.Expand()
    Start-Sleep -Milliseconds 700
    $items = $vaultCombo.FindAll($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::ListItem)))
    $names = @($items | ForEach-Object { $_.Current.Name })
    $joined = $names -join ' | '
    Info "OK: vaulti valikud: $joined"
    $ec.Collapse()
  } catch {
    Info "HOIATUS: vaulti valikute lugemine ebaõnnestus: $($_.Exception.Message)"
  }
} else { Info 'HOIATUS: vaulti ripploendit ei leitud' }

$afterHash = (Get-FileHash $configPath -Algorithm SHA256).Hash
if ($beforeHash -eq $afterHash) { Info 'OK: config.toml jäi puutumata' } else { Fail 'config.toml muutus ilma salvestamata!' }

Stop-Process -Id $first.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500
Info 'VALMIS'
