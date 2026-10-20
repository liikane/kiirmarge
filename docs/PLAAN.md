# Kiirmärkme rakendus — arhitektuuri- ja arendusplaan

> See on plaanivastus: lähtekoodi veel ei ole. Kood valmib etapite kaupa pärast eraldi korraldust.
> Nimi `kiirmarge` on tööpealkiri ja kinnitamisel muudetav.

## 1. Arhitektuur

Pordid ja adapterid (heksagonaalne arhitektuur), kolm kihti:

- **core** — puhas TypeScript, ilma platvormi-API-deta: märkme mudel, failinime mall, Markdown-i koostamine (wiki- vs standardlingid), konfiguratsiooni skeem + valideerimine, kiirklahvide parsimine ja kontroll, kasutusjuhud (mustand → salvesta / tühista).
- **pordid** — `ConfigStore`, `NoteStore`, `HotkeyService`, `TrayService`, `WindowService`, `Clock`.
- **adapterid** — kestade kaupa: Tauri töölauarakendus (failid, globaalne kiirklahv, süsteemisalve ikoon, alati esiplaanil aken), Obsidiani plugin (vault, manused, käsk/modaal), hiljem Android.

UI on õhuke (vanilla TS + Vite) ja core'ist sõltumatu. Äriloogika, märkme formaat, seadistus ja salvestamine on maksimaalselt jagatavad.

## 2. Tehnoloogiate võrdlus ja soovitus

| Kriteerium | Tauri 2 | Electron | .NET (WPF/WinUI 3, MAUI) | Flutter |
|---|---|---|---|---|
| Jagatav TS-core Obsidiani pluginaga | ✅ | ✅ | ❌ (dubleerimine) | ❌ (Dart) |
| Paigaldusmaht | ~5–15 MB | ~80–150 MB | ~50+ MB | ~20–40 MB |
| Mälu kasutus | väike | suur (150–300 MB) | keskmine | keskmine |
| Globaalne kiirklahv / salve ikoon / alati esiplaanil | ametlikud pluginad | sisseehitatud | sisseehitatud | pluginate kaudu (nõrgem) |
| Linux / macOS | ✅ | ✅ | Linuxis nõrk (MAUI puudub) | ✅ |
| Android / iOS | ✅ (Tauri 2) | ❌ | ✅ (MAUI) | ✅ |
| Peamine miinus | vajab Rusi tööriistaketti; ekraanipüüdmiseks oma Rust-käsk | maht ja mälu; Androidile ei lähe | core tuleks TS-ist dubleerida | core tuleks kaks korda kirjutada |

**Soovitus: Tauri 2 + puhas TS core.** Electron on varuplaan, mille korral muutub ainult `apps/desktop` kest — core ja plugin jäävad samaks.

Kontrollitud selles masinas: Node 24 ja npm 11 on olemas; Rusi (cargo/rustc) ei ole → E1 ei vaja seda, E2 eeldab `rustup` + VS Build Toolsi paigaldust (või Electroni valikut).

## 3. Ühine põhikood, Obsidiani plugin ja iseseisev rakendus

- `packages/core` — jagatav loogika: konfiguratsioon, failinimi, Markdown, kiirklahvide valideerimine, salvestusvood (~80% loogikast).
- `apps/desktop` (Tauri) — OS-funktsioonid: globaalne kiirklahv, süsteemisalve ikoon, hüpikaken, lõikelaud, ekraanipilt.
- `apps/obsidian-plugin` — Obsidiani API kohandused: vault, manused, `![[...]]`, käsk „Ava kiirmärge“.

**Aus piir:** globaalne kiirklahv, süsteemisalve ikoon, alati esiplaanil hüpikaken ja ekraanipilt on võimalikud ainult taustarakenduses. Obsidiani plugin saab teha modaali/popout-akna, kirjutada otse vaulti ja toetada mobiili, aga ei saa registreerida OS-i globaalset kiirklahvi ega tagada alati-esiplaanil akent. Valikuline „sild“ (plugin ↔ taustarakendus) on hilisem moodul.

**Platvormistrateegia:** Windows 11 esmalt (WebView2 on kaasas) → vanemad Windowsid (WebView2 olemasolu kontroll) → Linux/macOS sama Tauri koodiga → Android Tauri 2 mobiilina. Formaadikontrakt (Markdown + manused) on igal platvormil sama.

## 4. MVP täpne ulatus

1. Globaalne kiirklahv (vaikimisi `Ctrl+Alt+N`) avab väikese kiirmärkmeakna Windows 11-s.
2. Üks tekstiala + nupud „Salvesta“ ja „Tühista“; Esc sulgeb, seadistatav salvestusklahv (vaikimisi `Ctrl+S`) salvestab.
3. Salvestus `<notesFolder>/YYYY-MM-DD-HHmmss.md` — päis, kuupäev-kellaaeg, kasutaja tekst.
4. Kõik seadistused `config.toml`-is: luuakse esmakäivitusel kommentaaridega, valideeritakse, vigade korral kasutatakse turvalisi vaikeväärtusi + selge teade; kasutaja käsitsi tehtud muudatusi üle ei kirjutata.
5. Kiirklahvi saab configus muuta; toetuseta või hõivatud kombinatsioon → arusaadav veateade.
6. Töötab ilma Obsidianita (standalone-režiim, standardsed Markdown-lingid).

Märkus: süsteemisalve ikoon on kirjelduses esimene moodul pärast MVP-d (E3); soovitan sama järjekorda hoida — see on ühtlasi varuvariant, kui kiirklahv on hõivatud.

## 5. Hilisemate moodulite nimekiri (soovitatud järjekord)

Süsteemisalve ikoon + autostart · pildi kleepimine (Ctrl+V) · failide lohistamine · ekraanipilt · Obsidiani vaultide tuvastus (`%APPDATA%\obsidian\obsidian.json`) ja mitme vaulti + sihtkausta valik · Obsidiani plugin · OCR · AI kokkuvõte ja märksõnad · automaatne liigitamine (reeglid → AI) · sünkroonimine (failipõhine) · Linux · Android.

## 6. Arendusetapid ja hinnanguline maht

Iga etapp lõpeb töötava ja testitava versiooniga; alustan ainult tellitud etappi.

| Etapp | Sisu | Maht |
|---|---|---|
| E1 | Skelett + core + konfiguratsioon: config, valideerimine, failinimi, Markdown, kiirklahvid + ühiktestid (`node --test`, sõltuvusteta) | 0,5–1 p |
| E2 | Tauri kest: aken, globaalne kiirklahv, salvestus → MVP punktid 1–6 (eeldab Rusi) | 1–2 p |
| E3 | Süsteemisalve ikoon, autostart, üks-eksemplar, veateadete viimistlus | 0,5–1 p |
| E4 | Obsidiani režiim: vaultide tuvastus, vaulti/kausta valik, wiki-lingid | 1 p |
| E5 | Manused: pildi kleepimine, failide lohistamine, manuste kaust | 1–2 p |
| E6 | Ekraanipilt (piirkonna valik) + OCR | 1–2 p |
| E7 | Obsidiani plugin jagatud core'iga | 1–2 p |
| E8 | AI kokkuvõte, märksõnad, liigitamine | 1–2 p |
| E9 | Sünkroonimise tugi + dokumentatsioon | 0,5–1 p |
| E10 | Linux + Android | 2–4 p |

Kokku ~9–17 päeva; MVP (E1–E2) ~2–3 päeva. Hinnangud on antud kiirendatud AI-arenduse eeldusel.

## 7. Kavandatav kaustastruktuur

```
kiirmarge/                  # tööpealkiri
├─ package.json             # npm workspaces (juur)
├─ tsconfig.base.json
├─ packages/core/           # puhas TS: config/, note/, hotkey/, ports/, usecases/ + *.test.ts
├─ apps/desktop/            # src/ (TS UI + Vite), src-tauri/ (Rust), tauri.conf.json
├─ apps/obsidian-plugin/    # (E7) manifest.json, main.ts, esbuild.config.mjs
└─ docs/                    # PLAAN.md, config.example.toml
```

Iga loodud faili täpse asukoha näitan igas etapis eraldi.

## 8. Konfiguratsioonifail: TOML

Põhjendus: kommentaarid + sektsioonid + ranged tüübid; puuduvad YAML-i taanderea- ja tüübivigad (nt „NO“ tõlgendus) ning JSON5 on JS-i lõhnaga ja sektsioonideta. Parser: `smol-toml` (väike, sõltuvusteta); hiljem saab sama faili vajadusel lugeda ka Rusti `toml` teegiga.

```toml
# %APPDATA%\Kiirmarge\config.toml  (luuakse esmakäivitusel kommentaaridega)

[general]
mode = "standalone"        # "standalone" | "obsidian"
theme = "dark"             # "dark" | "light" | "system"
always_on_top = true

[storage]
vault = ""                 # obsidian-režiimis vaulti juurkaust
notes_dir = "Kiirmärkmed"  # suhteline vaulti/baaskausta või absoluutne tee
attachments_dir = "Kiirmärkmed/manused"
default_to_desktop = false
link_style = "auto"        # "auto" | "wiki" (![[..]]) | "markdown"
filename_format = "YYYY-MM-DD-HHmmss.md"
datetime_format = "YYYY-MM-DD HH:mm"

[hotkeys]
open = "Ctrl+Alt+N"
save = "Ctrl+S"
close = "Esc"
screenshot = ""            # tühi = välja lülitatud
```

## 9. Peamised riskid

1. **Rusti tööriistakett puudub** → E1 on sellest sõltumatu; E2 eeldab paigaldust, varuplaan Electron (muutub ainult kest).
2. **Kiirklahvide konfliktid ja OS-i reservatsioonid** → valideerimine, selge veateade, salve/akna avamise varuvariant.
3. **Obsidiani piirangud** (OS-i globaalne kiirklahv, iseseisev aken) → aus kaherajaline lahendus, sild hiljem.
4. **Vaulti kirjutamine** (osalised failid, sünkroonimiskonfliktid) → aatomiline kirjutamine (temp + rename), ainult seadistatud kaustadesse, kunagi ei kustutata.
5. **Vanemad Windowsid vajavad WebView2 bootstrapperit** → kontroll enne käivitust (puudutab ainult hilisemat etappi).
6. **Androidi tugi Tauri 2-l on noorem** → hiline etapp, varuplaan Capacitor/oma kest; core jääb TS-iks.

## 10. Küsimused, millele on enne vaja vastust

1. Kas Tauri 2 (nõuab Rusi + VS Build Toolsi paigaldust) sobib, või eelistad Electronit? Soovitus: Tauri.
2. Kas etappide järjekord sobib (E4 vaulti kirjutamine, E7 plugin), või on Obsidiani plugin varem vajalik?
3. Projektijuure nimi ja asukoht: `kiirmarge/` siin projektikaustas (soovitan) või mujal (nt sinu Obsidiani hoidlas)?
4. Kas kinnitad vaikeväärtused: eestikeelne UI, config `%APPDATA%\Kiirmarge\config.toml`, kiirklahvid `Ctrl+Alt+N` / `Ctrl+S` / `Esc`, standalone'is vaikimisi `Dokumendid\Kiirmärkmed`?
