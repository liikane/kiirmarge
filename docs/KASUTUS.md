# Kiirmärge — kasutusjuhend (E2 seis)

**Kuupäev:** 20.10.2026 · **Etapp:** E3 valmis (salve ikoon, autostart, üks eksemplar)

---

## Käivitamine

```powershell
cd C:\Users\lauri\AppData\Roaming\AutoClaw-oversea-official\accounts\2ac0db3cba19576fdfb3834daf80229f226f359c138ed54749efc97f0c6051c7\projects\Memilla
npm install            # esimesel korral
npm run tauri --workspace @kiirmarge/desktop -- dev   # arendusrežiim (Vite + Tauri)
```

Või ehita binaar (front-end pakitakse binaari sisse):

```powershell
npm run tauri --workspace @kiirmarge/desktop -- build --debug --no-bundle
# -> C:\kt\memilla\debug\kiirmarge.exe
```

**Miks `C:\kt\memilla`?** Projekt asub väga pikas kaustatees (AutoClaw profiil) ja Windowsi
260-tähemärgi piir lööb `link.exe` ehituse ajal maha (viga **LNK1104**). Seetõttu on
`apps/desktop/src-tauri/.cargo/config.toml`-is `target-dir = "C:/kt/memilla"`.
Kui kolid mujale, muuda see rida või eemalda fail (lühikese tee korral pole vaja).

`cargo build` üksi annab debug-binaari, mis ootab arendusserverit (`http://localhost:1420`) —
selleks kasuta `npm run tauri ... dev`. Eraldiseisva binaari jaoks on ülalolev `tauri build` käsk.

### Käivitamine ilma installerita

**Installerit ei ole vaja.** Rakendus on üks exe (release-ehitus
`C:\kt\memilla\release\kiirmarge.exe`; töölaual on sama fail **Kiirmärge.exe**).
Konsooliakent ei avane (GUI-subsüsteem).

- topeltklõps **Kiirmärge.exe**-l, **või**
- Win+R → kleebi exe täistee → Enter.

Autostarti saab sisse lülitada seadistusest (`general.autostart = true`) — siis käivitub rakendus
Windowsi sisselogimisel ilma installerita.

Kui tahad väiksemat ja kiiremat exet, mille võib vabalt mujale kopeerida, tee release-build:
`npm run tauri --workspace @kiirmarge/desktop -- build` (väljund `C:\kt\memilla\release\`).

## Kuidas töötab

1. Rakendus käivitub **peidetud aknaga**, registreerib globaalse kiirklahvi **Ctrl+Shift+~** ja lisab
   **salve ikooni** (Windows 11 peidab uue ikooni esialgu ülevoolualasse — „Show hidden icons").
2. Kiirklahv või salve ikooni klõps näitab akent; fookus läheb kohe tekstialale.
3. **Enter** või nupp „Salvesta" kirjutab märkme faili; **Ctrl+Enter** lisab reavahetuse
   (märkeruudu real jätkab loendit uue `- [ ] `-ga). Nupp **☑** lisab kursorile
   Markdowni märkeruudu (`- [ ] `) — Obsidiani ülesannete jaoks.
   **Esc** peidab akna (mustand jääb alles). Nupp „Tühista" tühjendab mustandi.
4. **Sulgenupp (X) ei lõpeta rakendust** — aken peidetakse, rakendus jääb salve ikoonile.
   Lõpetamiseks: paremklõps salve ikoonil → **Välju**.
5. Teine käivitus ei ava uut akent — olemasolev tuuakse esile ja teine protsess lõpetab töö.
6. Esmakäivitusel luuakse seadistus ja näidatakse aken automaatselt.
7. **Seaded** avanevad akna paremas ülanurgas hammasratta (⚙) nupust — eraldi dialoogi pole.

## Kuhu failid lähevad

| Fail | Asukoht |
|------|---------|
| Seadistus | **exe kõrval** `config.toml` (portatiivne); kirjutuskaitstud kausta korral `%APPDATA%\Kiirmarge\config.toml`. Vt `docs/SEADISTUSE-ASUKOHT.md` |
| Märkmed | kaust, mis on seadetes valitud (`storage.notes_dir`); praegu `C:\Users\lauri\Desktop` |
| Märkme nimi | `YYYY-MM-DD-HHmmss.md` (üks fail märkme kohta); kui sama sekund kordub, siis `...-2.md` |
| Liitfail | kui seadetes on „Kõik märkmed ühes failis", läheb kõik ühte faili (`storage.single_file`, vaikimisi `Kiirmärkmed.md`) |

Märkme sisu:

```markdown
# Kiirmärge

**2026-10-20 01:23**

<sinu tekst>
```

## Seadistuse muutmine

Kaks võimalust:

1. **Rakenduses** — hammasratas (⚙) → muuda välju → „Salvesta seaded". Rakendus kirjutab
   `config.toml`-i uuesti (kommentaarid säilivad) ja rakendab muudatuse kohe.
2. **Käsitsi** — muuda `config.toml`-i ja käivita rakendus uuesti.

Rakenduses saab muuta:

| Seade | Mida teeb |
|-------|-----------|
| Märkmete kaust | kuhu märkmed kirjutatakse („Vali…" avab kaustavalija) |
| Salvestamise viis | „Üks fail iga märkme kohta" või „Kõik märkmed ühes failis" |
| Liitfaili nimi | faili nimi liitfaili režiimis (nt `Kiirmärkmed.md`) |
| Kiirklahv akna avamiseks | globaalne kiirklahv (vaikimisi `Ctrl+Shift+~`) |
| Salvestamise klahv | vaikimisi `Enter` (Ctrl+Enter jääb alati reavahetuseks) |
| Sulgemise klahv | vaikimisi `Esc` |
| Käivita arvuti käivitamisel | autostart (kirjutab ühe registry-kirje) |

Tähtsamad väljad `config.toml`-is:

| Väli | Tähendus |
|------|----------|
| `hotkeys.open` | globaalne kiirklahv, nt `Ctrl+Shift+~` (peab olema muuteklahviga) |
| `hotkeys.save` / `hotkeys.close` | aknasisesed klahvid (`Enter` / `Esc`); üksikklahv on lubatud |
| `storage.notes_dir` | märkmete kaust (absoluutne või suhteline `Dokumendid`/vaulti suhtes) |
| `storage.note_mode` | `per-note` = iga märge eraldi faili; `single-file` = kõik ühte |
| `storage.single_file` | liitfaili nimi, kui `note_mode = "single-file"` |
| `storage.default_to_desktop` | `true` → märkmed töölauale (kui `notes_dir` on suhteline) |
| `general.always_on_top` | kas aken on alati esiplaanil |
| `general.autostart` | `true` = käivita Windowsi sisselogimisel (vaikimisi `false`) |
| `general.mode` | `standalone` või `obsidian` (+ `storage.vault`) |

Vigase väärtuse korral **rakendus ei kuku**: kasutatakse vaikeväärtust ja aken näitab probleemide nimekirja.

## Tõrkeotsing

| Sümptom | Põhjus ja lahendus |
|---------|--------------------|
| „Kiirklahvi … ei saanud registreerida" | kombinatsioon on OS-is hõivatud → muuda `hotkeys.open`; aken näidatakse automaatselt |
| Aken ei avane kiirklahviga | vaata, kas mõni teine programm kasutab sama kombinatsiooni; käivita rakendus uuesti |
| Minimeeritud aken ei tule kiirklahviga ega ikoonilt esile | vana binaar (enne 20.10.2026 õhtut) ei taastanud minimeeritud akent — asenda `C:\kt\memilla\release\kiirmarge.exe`-ga, vt `docs/RAPORT-PARANDUSED.md` |
| `cargo build` viskab linkimisvea | MSVC Build Tools puudub → `winget install Microsoft.VisualStudio.2022.BuildTools` koos VC.Tools + Windows SDK komponendiga |
| `LNK1104: cannot open file ...target\debug\build\...` | tee liiga pikk → kontrolli, et `apps/desktop/src-tauri/.cargo/config.toml` on olemas (`target-dir = "C:/kt/memilla"`) |
| Märge ei salvestu | vaata akna all olevat veateadet; tee peab olema absoluutne ja kirjutatav |

## Failid

| Fail | Sisu |
|------|------|
| `apps/desktop/src/main.ts` | UI loogika: seadistuse laadimine, salvestus, kiirklahvid |
| `apps/desktop/src-tauri/src/lib.rs` | Rusti käsud (config, märkmed, aken), salve ikoon, üks eksemplar, autostart |
| `apps/desktop/src-tauri/tauri.conf.json` | aken, build, bundle |
| `apps/desktop/src-tauri/capabilities/default.json` | õigused (globaalne kiirklahv) |
| `docs/uuring/tauri2-ehitus.md` | kinnitatud Tauri 2 faktid (kiirklahvi formaat, õigused) |