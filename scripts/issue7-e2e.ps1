param(
  [string]$SourceExe = 'C:\kt\memilla\debug\kiirmarge.exe'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms

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

function Find-TextLike($win, [string]$prefix) {
  $texts = $win.FindAll($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::Text)))
  foreach ($text in $texts) {
    if ($text.Current.Name -like ($prefix + '*')) { return $text.Current.Name }
  }
  return ''
}

function Wait-TextLike($win, [string]$prefix, [int]$timeoutMs) {
  $deadline = (Get-Date).AddMilliseconds($timeoutMs)
  while ((Get-Date) -lt $deadline) {
    $found = Find-TextLike $win $prefix
    if ($found -ne '') { return $found }
    Start-Sleep -Milliseconds 250
  }
  return ''
}

function Invoke-Button($win, [string]$name) {
  $button = Find-ByName $win $name $CT::Button
  if ($null -eq $button) { Fail "nuppu „$name“ ei leitud" }
  $button.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
}

$root = Join-Path ([System.IO.Path]::GetTempPath()) ('KiirmargeIssue7-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $root | Out-Null
$notes = Join-Path $root 'Notes'
New-Item -ItemType Directory -Path $notes | Out-Null
$exe = Join-Path $root 'kiirmarge.exe'
Copy-Item $SourceExe $exe

$same = @(Get-Process -Name '*iirm*' -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $exe })
if ($same.Count -gt 0) { Fail "testkoopia juba töötab (pid $($same.Id -join ', '))" }

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
  'save = "Enter"',
  'close = "Esc"',
  'screenshot = ""',
  '',
  '[github]',
  'enabled = true',
  'repo = "liikane/kiirmarge"',
  'label = "enhancement"',
  'send_by_default = true'
)
$configFile = Join-Path $root 'config.toml'
[System.IO.File]::WriteAllText($configFile, ($lines -join "`r`n"), (New-Object System.Text.UTF8Encoding($false)))
$queueFile = Join-Path $root 'github-queue.json'

$existing = (cmdkey /list | Select-String -SimpleMatch 'Kiirmarge')
if ($existing) { Info 'HOIATUS: mandaadihoidlas on juba Kiirmarge kirje — tokeni samme ei tehta' }

function Start-App {
  $process = Start-Process -FilePath $exe -PassThru
  Start-Sleep -Seconds 3
  if ($process.HasExited) { Fail "protsess lõpetas kohe (exit $($process.ExitCode))" }
  Start-Process -FilePath $exe | Out-Null
  Start-Sleep -Seconds 2
  return $process
}

function Stop-App($process) {
  Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 700
  $stale = @(Get-Process -Name '*iirm*' -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $exe })
  foreach ($item in $stale) { Stop-Process -Id $item.Id -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Milliseconds 400
}

$proc = Start-App
$win = Wait-AppWindow 10000
if ($null -eq $win) { Fail 'akent ei leitud' }
Info 'OK: aken olemas'

# --- 1. Märkeruut on nähtav (github.enabled = true) ---
$checkbox = $null
$boxes = $win.FindAll($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::CheckBox)))
foreach ($box in $boxes) {
  if ($box.Current.Name -like '*GitHub*') { $checkbox = $box }
}
if ($null -eq $checkbox) { Fail 'märkeruutu „Saada ka GitHub Issue" ei leitud' }
Info "OK: märkeruut olemas — $($checkbox.Current.Name)"

$edit = $win.FindFirst($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::Edit)))
$edit.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).SetValue("Testida GitHubi voogu`r`nTeine rida")
Start-Sleep -Milliseconds 300

Invoke-Button $win 'Salvesta'
$status = Wait-TextLike $win 'GitHub:' 8000
if ($status -eq '') { Fail 'GitHubi tulemust staatusereal ei näidatud' }
if ($status -notmatch 'puudub') { Fail "oodatud teadet pääsuvõtme puudumise kohta, oli: '$status'" }
Info "OK: ilma võtmeta — $status"

$files = @(Get-ChildItem $notes -Filter '*.md' -ErrorAction SilentlyContinue)
if ($files.Count -ne 1) { Fail "märkmefaile peaks olema 1, oli $($files.Count)" }
$content = [System.IO.File]::ReadAllText($files[0].FullName, [System.Text.Encoding]::UTF8)
if ($content -notmatch 'Testida GitHubi voogu') { Fail 'märkmefailis pole teksti' }
Info "OK: märkmefail salvestati — $($files[0].Name)"
if (Test-Path $queueFile) {
  $queued = [System.IO.File]::ReadAllText($queueFile, [System.Text.Encoding]::UTF8)
  if ($queued -notmatch '^\s*\[\s*\]\s*$') { Fail "pääsuvõtme puudumine ei tohi järjekorda panna: $queued" }
}
Info 'OK: pääsuvõtme puudumine ei läinud järjekorda'

# --- 2. Seaded: võtme salvestamine mandaadihoidlasse ---
Invoke-Button $win 'Seaded'
Start-Sleep -Milliseconds 900

if (-not $existing) {
  $passwordEdit = $null
  $edits = $win.FindAll($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::Edit)))
  foreach ($candidate in $edits) {
    if ($candidate.Current.IsPassword) { $passwordEdit = $candidate }
  }
  if ($null -eq $passwordEdit) { Fail 'pääsuvõtme välja (password) ei leitud' }

  try {
    $passwordEdit.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).SetValue('github_pat_vale_testvaartus')
  } catch {
    $passwordEdit.SetFocus()
    [System.Windows.Forms.SendKeys]::SendWait('github_pat_vale_testvaartus')
  }
  Start-Sleep -Milliseconds 300
  Invoke-Button $win 'Salvesta võti'
  Start-Sleep -Milliseconds 1500

  $tokenStatus = Find-TextLike $win 'Token on salvestatud'
  if ($tokenStatus -eq '') { Fail 'kinnitust „Token on salvestatud" ei leitud' }
  Info "OK: $tokenStatus"

  $cmdkey = (cmdkey /list | Select-String -SimpleMatch 'Kiirmarge')
  if (-not $cmdkey) { Fail 'Windowsi mandaadihoidlas (cmdkey) ei ole Kiirmarge kirjet' }
  Info 'OK: kirje on Windowsi mandaadihoidlas'

  Invoke-Button $win 'Testi ühendust'
  $testStatus = Wait-TextLike $win 'GitHubi pääsuvõti on kehtetu' 20000
  if ($testStatus -eq '') { Fail "401-test ei andnud oodatud teadet: '$(Find-TextLike $win 'GitHub')'" }
  Info "OK: päris API vastas 401 — $testStatus"

  Invoke-Button $win 'Kustuta võti'
  Start-Sleep -Milliseconds 1200
  $cleared = Find-TextLike $win 'Token puudub'
  if ($cleared -eq '') { Fail 'pärast kustutamist ei näidata „Token puudub"' }
  $cmdkeyAfter = (cmdkey /list | Select-String -SimpleMatch 'Kiirmarge')
  if ($cmdkeyAfter) { Fail 'mandaadihoidlasse jäi kirje alles' }
  Info 'OK: võti kustutati mandaadihoidlast'
} else {
  Info 'HOIATUS: tokeni samme vahele jäetud (olemasolev kirje)'
}

Stop-App $proc

# --- 3. Järjekord: ootel kirje leitakse ja teada antakse ---
$queuedJson = '[{"id":"test-1","repo":"liikane/kiirmarge","title":"Ootel test","body":"Ootel kirje","label":"bug","noteDir":"' + $notes.Replace('\', '\\') + '","noteFile":"2026-01-01-000000.md","createdAt":"2026-01-01T00:00:00.000Z","attempts":0}]'
[System.IO.File]::WriteAllText($queueFile, $queuedJson, (New-Object System.Text.UTF8Encoding($false)))

$proc2 = Start-App
$win2 = Wait-AppWindow 10000
if ($null -eq $win2) { Fail 'akent ei leitud teisel käivitusel' }
$notice = Wait-TextLike $win2 'GitHubi järjekorras on 1 märget' 8000
if ($notice -eq '') { Fail "järjekorra teadet ei leitud (leitud: '$(Find-TextLike $win2 'GitHubi')')" }
Info "OK: $notice"
Stop-App $proc2

# --- 4. Seadistusse kirjutati [github] ---
$config = [System.IO.File]::ReadAllText($configFile, [System.Text.Encoding]::UTF8)
if ($config -notmatch '\[github\]') { Fail 'seadistuses puudub [github] sektsioon' }
if ($config -notmatch 'enabled = true') { Fail 'seadistuses puudub enabled = true' }
if ($config -notmatch 'repo = "liikane/kiirmarge"') { Fail 'seadistuses puudub repo' }
Info 'OK: seadistus sisaldab [github] sektsiooni'

Info 'VALMIS'
