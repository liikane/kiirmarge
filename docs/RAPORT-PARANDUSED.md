# Kolm kasutaja teatatud viga — analüüs ja parandus

**Kuupäev:** 20.10.2026 (õhtu)
**Teema:** konsooliaken, globaalne kiirklahv, minimeeritud akna taastamine
**Baas:** `RAPORT-E3.md` / `RAPORT-SEADED.md` (debug-binaar 20.10 03:53)

---

## 1. Vead ja juurpõhjused

| # | Sümptom | Juurpõhjus | Parandus |
|---|---------|------------|----------|
| 1 | Käivitamisel avaneb konsooliaken | `main.rs`-is oli `windows_subsystem = "windows"` ainult release-ehituse jaoks (`cfg_attr(not(debug_assertions), ...)`); töölaual olev binaar oli **debug-ehitus** → konsool avaneb | `#![windows_subsystem = "windows"]` on nüüd **tingimusteta**; lisaks tehtud release-ehitus (9,4 MB) |
| 2 | Globaalne kiirklahv ei too akent esile | Kiirklahv registreerus ja töötas (kontrollitud sünteetiliste klahvisündmustega), kuid **minimeeritud aken jäi pärast `show()`-d minimeerituks** — sama juur nagu viga 3 | `show_main_window` ja `show_window` kutsuvad nüüd enne `show()`-d **`unminimize()`** |
| 3 | Salveikooni klõps ei taasta minimeeritud akent | `show_window()` tegi ainult `show()` + `set_focus()`, mis ei taasta minimeeritud akent | sama parandus; kasutusel nii salveikoonil, menüül „Ava", teisel eksemplaril kui ka kiirklahvil |

**Miks vead 2 ja 3 kokku kuuluvad:** mõlemad kasutavad sama `show_window` / `show_main_window` teed.
Kui aken oli korra minimeeritud (taskbarile), jäi ta ka peale `show()`-d ikooniliseks — kasutaja jaoks
nägi see välja nii, nagu kiirklahv ega ikoon ei teeks midagi.

---

## 2. Kuidas kontrolliti (päris binaar, UI Automation + sünteetilised klahvid)

Kontrollskript: `scripts/hotkey-repro.ps1` (vajab UTF-8 BOM + CRLF — muidu PowerShell 5.1 ei parsi).

| Stsenaarium | Enne parandust | Pärast parandust |
|---|---|---|
| Peidetud aken + `Ctrl+Alt+F12` | aken tuli esile | aken tuleb esile |
| Peidetud aken + `Ctrl+Shift+~` (kasutaja kombinatsioon) | aken tuli esile | aken tuleb esile |
| Aken minimeeritud → teine eksemplar („Ava") | jäi ikooniliseks (`IsIconic=True`) | taastus (`IsIconic=False`, nähtav) |
| Konsooliaken | PE-subsüsteem 3 (konsool) debug-ehitusel | PE-subsüsteem **2 (GUI)** nii debug- kui release-ehituses |

Lisaks E4 regressioon (`scripts/e4-e2e.ps1`): märge läks vaulti, seadete paneel ja vaultide tuvastus töötavad.

> Testimise ajaks suleti töötav eksemplar (pid 22816, `Desktop\Kiirmärge.exe`) — single-instance
> blokeeris muidu testeksemplari käivitumise. Testi lõpus käivitati värskendatud binaar uuesti.

---

## 3. Mis jäi automatiseerimata

- **Päris salveikooni klõps ja paremklõpsumenüü** — sünteetiline hiireklõps ülevoolualale pole selles
  shellis usaldusväärne. Kontrollitud on sama kooditeed (`show_window`) teise eksemplari kaudu.
- **Kiirklahvi käsitsi vajutus päris klaviatuurilt** — kasutatud `keybd_event` sünteetilisi sündmusi
  mõlema kombinatsiooniga.

---

## 4. Binaarid

| Fail | Sisu |
|---|---|
| `C:\kt\memilla\release\kiirmarge.exe` | release, 9,4 MB, GUI-subsüsteem, kiirem käivitus |
| `C:\Users\lauri\Desktop\Kiirmärge.exe` | sama fail (asendatud 20.10 õhtul) |
| `C:\kt\memilla\debug\kiirmarge.exe` | debug (arenduseks), samuti ilma konsoolita |

---

## 5. Muudetud failid

| Fail | Muudatus |
|---|---|
| `apps/desktop/src-tauri/src/main.rs` | `#![windows_subsystem = "windows"]` tingimusteta |
| `apps/desktop/src-tauri/src/lib.rs` | `unminimize()` enne `show()`-d `show_main_window`-s ja `show_window`-s |
| `scripts/hotkey-repro.ps1` | repro/verifikatsioon (uus) |
| `docs/KASUTUS.md` | release-binaari viide + tõrkeotsingu rida |
