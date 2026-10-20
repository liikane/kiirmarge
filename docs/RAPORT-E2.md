# E2 — Tauri kest: raport

**Kuupäev:** 20.10.2026
**Projekt:** Memilla (`packages/core` + `apps/desktop`)
**Etapp:** E2 — aken, globaalne kiirklahv, salvestus (MVP punktid 1–6)
**Eelmine:** `docs/RAPORT-E1.md` (core + seadistus)

---

## 1. Mis tehti

### 1.1 MSVC tööriistakett (eeldus)

| Samm | Tulemus |
|------|---------|
| `winget install Microsoft.VisualStudio.2022.BuildTools` | VS Build Tools 2022, MSVC **14.44.35207**, Windows SDK **10.0.26100.0** |
| Paigaldatud komponendid | ainult `VC.Tools.x86.x64` + `Windows11SDK.26100` (võimalikult väike, ketta ruumi oli ~10 GB) |
| Kontroll | `vswhere` leiab BuildToolsi, `link.exe` ja `cl.exe` olemas |

### 1.2 Tee pikkuse probleem (oluline!)

Esimene `cargo build` kukkus veaga:

```
LINK : fatal error LNK1104: cannot open file
'...\Memilla\apps\desktop\src-tauri\target\debug\build\icu_properties_data-...\build_script_build-....exe'
```

Põhjus ei olnud MSVC, vaid **Windowsi 260 tähemärgi tee piir**: AutoClaw profiili tee on juba ~180 tähemärki,
`target\debug\build\<kast>-<hash>\...exe` lisab veel ~150.

**Lahendus:** `apps/desktop/src-tauri/.cargo/config.toml` seab `target-dir = "C:/kt/memilla"`.
Nüüd töötavad `cargo build`, `cargo test` ja `npm run tauri ...` ilma lisaseadistusteta.

### 1.3 Arhitektuuri otsus: OS-toimingud Rustis, mitte JS-pluginates

JS-pluginatega oleks vajanud iga akna-/failitoimingu jaoks eraldi ACL-luba. Selle asemel on
**kõik OS-toimingud rakenduse enda Rusti käskudena** (`invoke`), mida õiguste süsteem ei piira:

| Käsk | Mida teeb |
|------|-----------|
| `app_paths` | Dokumendid, töölaud, seadistusfaili tee |
| `read_config` / `write_default_config` | Seadistuse lugemine; vaikefail kirjutatakse ainult siis, kui seda veel ei ole |
| `note_exists` / `save_note` | Märkme olemasolu ja aatomiline salvestus (temp + rename); keeldub suhtelisest teest ja `..`-ist |
| `show_main_window` / `hide_main_window` / `set_always_on_top` | Aken |

JS-pluginat kasutatakse ainult **globaalse kiirklahvi** jaoks (selleks on dokumenteeritud õigused olemas:
`global-shortcut:allow-register`, `-unregister`, `-unregister-all`, `-is-registered`).

### 1.4 Loodud failid

| Fail | Sisu |
|------|------|
| `apps/desktop/package.json`, `tsconfig.json`, `vite.config.ts`, `index.html` | Vite + TS front-end |
| `apps/desktop/src/main.ts` | Kogu UI-loogika: seadistuse laadimine, salvestus, kiirklahvid, veateated |
| `apps/desktop/src/styles.css` | Tume teema (kontrastid ≥ 4.5:1 põhitekstil) |
| `apps/desktop/src-tauri/Cargo.toml`, `build.rs`, `tauri.conf.json` | Tauri 2 projekt |
| `apps/desktop/src-tauri/src/main.rs`, `src/lib.rs` | Rusti käsud + 5 ühiktesti |
| `apps/desktop/src-tauri/capabilities/default.json` | Õigused (ainult kiirklahv + `core:default`) |
| `apps/desktop/src-tauri/icons/*` | Ikoonid (Python/Pillow: 32/128/256/512 PNG + ICO) |
| `apps/desktop/src-tauri/.cargo/config.toml` | Lühike `target-dir` (tee pikkuse tõttu) |
| `packages/core/src/paths/resolve.ts` + test | `resolveNotesDir()` — kuhu märge läheb (Dokumendid/töölaud/absoluutne/vault) |
| `docs/uuring/tauri2-ehitus.md` | Kinnitatud Tauri 2 faktid (kiirklahvi formaat, õigused, config) |
| `docs/KASUTUS.md` | Kasutus- ja tõrkeotsingujuhend |

### 1.5 Core'i väike laiendus

`resolveNotesDir(config, base)` otsustab sihtkausta:
`default_to_desktop` → töölaud · absoluutne `notes_dir` → nii nagu on · `mode=obsidian` + `vault` → vault · muidu Dokumendid.
Funktsioon on puhas ja kaetud 8 testiga (Windowsi ja POSIX-i teed).

---

## 2. Kontrollid — mis päriselt jooksutati

### 2.1 Ehitamine

| Kontroll | Tulemus |
|----------|---------|
| `cargo build` (debug) | OK, 53 s (esimene kord), binaar **12,8 MB** |
| `npm run tauri -- build --debug --no-bundle` | OK — „Built application at C:\kt\memilla\debug\kiirmarge.exe" |
| `npm run build` (Vite) | OK — 28 moodulit, JS 26,5 kB (gzip 10 kB) |
| `npm run typecheck` (core + desktop) | exit 0, vigu 0 |

### 2.2 Testid

| Komplekt | Tulemus |
|----------|---------|
| Core (`node --test`) | **45/45** (37 E1-st + 8 teede kohta) |
| Rust (`cargo test`) | **5/5** — `safe_join` keelab `..`/teeeraldajad, `save_note` ei kirjuta olemasolevat üle, suhteline tee lükatakse tagasi |

### 2.3 Päris rakenduse testimine (UI Automation'i kaudu)

Rakendust käivitati päriselt ja kontrolliti UI Automation'iga (mitte ainult koodist):

| Stsenaarium | Tulemus |
|-------------|---------|
| Esmakäivitus | `%APPDATA%\Kiirmarge\config.toml` loodi automaatselt (786 B, kommentaaridega) |
| Aken | Pealkiri „Kiirmärge", UIA-puus 20 elementi (pealkiri, tekstiala, nupud, staatus) |
| Märkme salvestamine | Tekst sisestati tekstialasse, vajutati „Salvesta" → `C:\Users\lauri\Documents\Kiirmärkmed\2026-10-20-012014.md`, sisu täpselt `# Kiirmärge` + kuupäev + tekst; väli tühjenes |
| „Tühista" | Väli tühjenes, staatus „Mustand tühistatud.", ühtegi faili ei kirjutatud |
| Järgmine käivitus | Seadistust **ei kirjutatud üle** (mtime ei muutunud); aken jäi peidetuks |
| Hõivatud kiirklahv | Hõivasin `Ctrl+Alt+N` teise protsessiga → rakendus näitas akent ja teksti: *„Kiirklahvi „Ctrl+Alt+N" ei saanud registreerida: HotKey already registered… Muuda välja hotkeys.open failis C:\Users\lauri\AppData\Roaming\Kiirmarge\config.toml."* |

### 2.4 Mida EI õnnestunud masinaga kontrollida

Selles shellis ei saa süsteemset klahvisisestust teha (`SendKeys` → „Access is denied"), seega
**klahvivajutustega** ei testinud:

- kas `Ctrl+Alt+N` tõesti toob akna esile (registreerimine õnnestus — kinnituseks see, et vigu ei tekkinud
  ja et hõivatud kombinatsiooni korral tuli õige veateade);
- kas `Esc` peidab akna;
- kas `Ctrl+S` klaviatuurilt salvestab (nupu „Salvesta" tee on tõestatud; `hotkeyMatches` loogika on kaetud core'i testidega).

**Palun tee see 30-sekundiline kontroll ise:** käivita `C:\kt\memilla\debug\kiirmarge.exe`, vajuta
`Ctrl+Alt+N`, kirjuta midagi, vajuta `Ctrl+S`, seejärel `Esc`.

---

## 3. Teadaolevad piirangud

1. **Debug-binaar** (`--debug`) on ~12,8 MB ja aeglasem; lõpliku jaoks tuleb `npm run tauri build` (release).
2. **Installerit ei tehta** — `bundle.active = false` (E3 või hiljem).
3. **Üks eksemplar korraga** — seda ei ole veel piiratud (E3: single-instance).
4. **Salve ikoon ja autostart** — E3.
5. Testimise käigus tekkisid kõrvalmõjud: `C:\Users\lauri\Documents\Kiirmärkmed\2026-10-20-012014.md`
   (testmärge) ja `C:\Users\lauri\AppData\Roaming\Kiirmarge\config.toml.bak` (testkoopia). Mõlemad võib kustutada.

---

## 4. Järgmine samm (E3)

Plaani järgi: süsteemisalve ikoon, autostart, üks-eksemplar, veateadete viimistlus — 0,5–1 päev.
Enne seda võiks otsustada:
- kas teha **release-build + installer** (NSIS) juba enne E3-e, et saaks päris paigaldust proovida;
- kas luua **git-repo** (praegu puudub; `.gitignore` on valmis).