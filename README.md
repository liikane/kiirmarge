# Kiirmärge

Portatiivne kiirmärkme rakendus Windowsile: globaalne kiirklahv avab väikese akna, **Enter** salvestab
märkme Markdown-failina. Installerit ei ole vaja — rakendus on üks exe, seadistus elab selle kõrval.

> Nimi `kiirmarge` on tööpealkiri (kaalumisel ka Memilla). Projektikausta nimi on `Memilla`.

## Hetkeseis

- **Globaalne kiirklahv** (vaikimisi `Ctrl+Shift+1`) avab akna; **Esc** peidab.
- **Salve ikoon** menüüga „Ava kiirmärge" / „Välju"; sulgenupp (X) peidab akna, ei lõpeta rakendust.
- **Üks eksemplar** — teine käivitus toob olemasoleva akna esile.
- **Seaded rakenduses** (⚙): märkmete kaust, üks-fail/liitfail režiim, kiirklahvid, autostart.
- **Salvestuskoht** seadetes: Dokumendid / Töölaud / kohandatud kaust. Töölaua tee küsitakse
  Windowsilt (known folder), seega töötab ka siis, kui töölaud on OneDrive'i suunatud.
- **Klahvispikker nuppudel**: „Salvesta" ja „Tühista" näitavad kehtivat klahvi (`Enter`/`Esc`)
  ja see uueneb koos seadetega.
- **GitHubi Issue (valikuline)**: märkeruut „Saada ka GitHub Issue" — märge salvestub faili ja läheb
  lisaks Issue'ks valitud hoidlas (silt bug/idea/enhancement/documentation). Pääsuvõti on Windowsi
  mandaadihoidlas; võrguühenduseta saatmine jääb järjekorda ja läheb hiljem ise edasi.
- **Portatiivne seadistus**: `config.toml` exe kõrval; kui kaust on kirjutuskaitstud, siis
  `%APPDATA%\Kiirmarge\config.toml`.
- Märkmed: Markdown, vaikimisi `# Kiirmärge` + ajatempel + tekst (või kõik ühes liitfailis).

## Nõuded

| Asi | Nõue |
|-----|------|
| OS | Windows 10/11 (WebView2 on Windows 11-s olemas; Windows 10 vajab WebView2 Runtime'i) |
| Node | 24+ (npm 11) |
| Rust | 1.77.2+ (ehitatud 1.99-ga) |
| MSVC | Visual Studio Build Tools 2022 + Windows SDK (`link.exe` on vajalik) |

MSVC paigaldus: `winget install Microsoft.VisualStudio.2022.BuildTools` (komponendid
`VC.Tools.x86.x64` + `Windows11SDK.*`).

## Kiirestart

```powershell
npm install

# arendus (Vite + Tauri, aken avaneb)
npm run tauri --workspace @kiirmarge/desktop -- dev

# eraldiseisev binaar (front-end pakitakse sisse)
npm run tauri --workspace @kiirmarge/desktop -- build --debug --no-bundle
# -> C:\kt\memilla\debug\kiirmarge.exe  (vt "Pikk tee" allpool)
```

`cargo build` üksi annab debug-binaari, mis ootab arendusserverit `http://localhost:1420`.

## Testid

```powershell
npm test                # core: 109 testi (node --test)
npm run typecheck       # core + desktop (tsc --noEmit)
cd apps/desktop/src-tauri; cargo test   # 6 testi (Rust: failiteed, liitfail)
```

## Windowsi testbuildi kontrollimine ja avaldamine

GitHubis vali **Actions → Windowsi kontrollitav build → Run workflow**. Töövoog käivitub
ainult käsitsi, käivitab testid ning loob Tauri release-buildist unsigned portable
`kiirmarge.exe` faili (installerit ei looda). Eduka käivituse artefakt sisaldab ainult EXE-faili,
`build-info.txt` faili commit SHA ja versiooniga ning `SHA256SUMS.txt` kontrollsummaga.
Artefakt on Actionsi käivituse lehel allalaaditav 7 päeva.

Kontrolli allalaaditud artefakti PowerShellis samas kaustas:

```powershell
$expected = (Get-Content .\SHA256SUMS.txt).Split(' ')[0]
$actual = (Get-FileHash .\kiirmarge.exe -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actual -ne $expected) { throw 'SHA-256 kontroll ebaõnnestus' }
Get-Content .\build-info.txt
```

Enne EXE käivitamist veendu, et `build-info.txt` commit SHA vastab soovitud lähtekoodi
commitile. Artefakt on allkirjastamata ning Windows võib kuvada SmartScreeni hoiatuse.
See build pole Windowsi GUI-test: kasutajaliidese ja päris Windowsi käitumise kontrollimiseks
tuleb rakendust eraldi Windowsis katsetada. Build ega testid ei kasuta kasutaja märkmeid,
paroole, `config.toml` faili ega Obsidiani vault'i; üles laetakse ainult eespool nimetatud
kolm buildi väljundfaili.

Kui soovid kontrollitud versiooni avaldada, loo see käsitsi GitHubi **Releases → Draft a new
release** lehel ning lisa kontrollitud EXE koos `build-info.txt` ja `SHA256SUMS.txt` failidega.
Töövoog ei loo GitHub Release'i ega avalda midagi automaatselt.

## Klahvid

| Klahv | Mida teeb |
|-------|-----------|
| `Ctrl+Shift+1` | näita akent (globaalne, muudetav seadetes) |
| `Enter` | salvesta märge |
| `Ctrl+Enter` | reavahetus tekstis |
| `Esc` | peida aken (seadete paneelil sulgeb paneeli) |

## Kuhu failid lähevad

| Fail | Asukoht |
|------|---------|
| Seadistus | exe kõrval `config.toml` (portatiivne) või `%APPDATA%\Kiirmarge\config.toml` |
| Märkmed | seadetes valitud kaust (`storage.notes_dir`); üks fail märkme kohta või üks liitfail |

Lähemalt: `docs/SEADISTUSE-ASUKOHT.md`, `docs/KASUTUS.md`.

## Struktuur

```
packages/core/          puhas TypeScript, platvormist sõltumatu
  src/config/           seadistuse tüübid, vaikeväärtused, valideerimine, TOML lugemine/kirjutamine
  src/hotkey/           kiirklahvide parsimine, valideerimine, Tauri accelerator
  src/note/             failinimi, Markdown (üksikmärge + liitfaili osa)
  src/paths/            märkmete sihtkausta lahendamine
  src/ports/            liidesed: Clock, ConfigStore, NoteStore, Hotkey/Window/TrayService
  src/usecases/         loadConfig, saveNote, discardNote
apps/desktop/           Tauri 2 kest
  src/main.ts           kogu UI-loogika (seaded, salvestus, kiirklahvid)
  src-tauri/src/lib.rs  Rusti käsud: config, märkmed, aken, salve ikoon, autostart, dialoog
docs/                   plaan, raportid, kasutusjuhend
```

Põhimõte: **äri­loogika on `packages/core`-is ja testitud**; Rust teeb ainult OS-toiminguid
(failid, aken, salve ikoon, dialoog). Core ei tohi importida Tauri API-sid.

## Teadaolevad eripärad

1. **Pikk tee.** Selle masina projektitee on >260 tähemärki ja `link.exe` annab vea `LNK1104`.
   Lahendus (ei ole repos, masinapõhine): `apps/desktop/src-tauri/.cargo/config.toml`

   ```toml
   [build]
   target-dir = "C:/kt/memilla"
   ```

2. **Installerit ei tehta** — `bundle.active = false`. Vajadusel `tauri build` (release) + NSIS hiljem.
3. **Debug-binaar** on ~12 MB ja aeglasem kui release; lõpptoote jaoks tasub release-build.
4. `hotkeys.open` peab olema muuteklahviga; aknasisesed (`Enter`, `Esc`) võivad olla üksikklahvid.
   Tilde kirjutatakse `~` (teisendub Tauri jaoks `backquote`-ks).

## Dokumendid

| Fail | Sisu |
|------|------|
| `docs/PLAAN.md` | arhitektuuri- ja arendusplaan (etapid E1–E10) |
| `docs/KASUTUS.md` | kasutusjuhend (paigaldus, näited, seaded, tõrkeotsing) |
| `docs/SEADISTUSE-ASUKOHT.md` | miks seadistus on exe kõrval (portatiivne) |
| `docs/RAPORT-E1.md`, `RAPORT-E2.md`, `RAPORT-E3.md`, `RAPORT-SEADED.md` | etappide raportid |
| `docs/RAPORT-ISSUE-*.md` | üksikute Issue'de teostus ja kontrollid |
| `docs/uuring/tauri2-ehitus.md` | kinnitatud Tauri 2 faktid (kiirklahvid, õigused) |

## Litsents

**Otsustamata.** Enne avalikuks tegemist vali litsents (nt MIT) või jäta repo privaatseks.