# Tauri 2 — kinnitatud faktid E2 jaoks

**Kuupäev:** 20.10.2026
**Miks see fail olemas on:** `packages/core/src/hotkey/parse.ts` juures oli viide, et Tauri kiirklahvi
sõnastik tuleb enne E2-d dokumentatsioonist üle kontrollida. See on see kontroll.

---

## 1. Windowsi eeldused (mõõdetud selles masinas)

| Eeldus | Seis 20.10.2026 |
|--------|-----------------|
| Rust | 1.99.0, host `x86_64-pc-windows-msvc` |
| MSVC Build Tools | Visual Studio Build Tools 2022, MSVC 14.44.35207 (`link.exe`, `cl.exe`) |
| Windows SDK | 10.0.26100.0 |
| WebView2 Runtime | 155.0.4283.45 |

Plugin `tauri-plugin-global-shortcut` nõuab Rusti ≥ **1.77.2** (allikas: Tauri plugina leht).

## 2. Kiirklahvi string — TÄHTIS

JS `register()` annab stringi Rusti parserile (`global_hotkey::hotkey::HotKey::from_str`).
Parsija reeglid (allikas: `global-hotkey` 0.6.3/0.9.0 lähtekood, `hotkey.rs`):

- String lõigatakse `+` järgi; **kõik modifikaatorid peavad olema enne põhiklavi**.
- Modifikaatorid (tõstutundetud): `alt`/`option`, `ctrl`/`control`, `shift`, `super`/`cmd`/`command`,
  `commandorcontrol`/`cmdorctrl` (Windowsil = control).
- Põhiklavi nimed (tõstutundetud), näiteid parseri tabelist:
  - tähed: **`N` ja `KEYN` on mõlemad lubatud**
  - numbrid: `5` või `DIGIT5`
  - `ESC`/`ESCAPE`, `SPACE`, `TAB`, `ENTER`, `BACKSPACE`, `DELETE`, `HOME`, `END`, `INSERT`,
    `PAGEUP`, `PAGEDOWN`, `UP`/`ARROWUP`, `DOWN`, `LEFT`, `RIGHT`, `F1`–`F24`
- Üksik klahv ilma modifikaatorita on parseri jaoks lubatud (nt `KEYX`).

**Järeldus meie koodi kohta:** `packages/core/src/hotkey/parse.ts` funktsioon `toAccelerator()`
annab `ctrl+alt+n`, `escape`, `super+space`, `ctrl+shift+pageup` — **kõik need on parseri jaoks korrektsed.**
Ühtegi muudatust core'is ei olnud vaja.

## 3. Õigused (capabilities)

JS-pluginaga registreerimine nõuab `capabilities/*.json`-is lubasid (allikas: plugina leht):

```json
"permissions": [
  "global-shortcut:allow-register",
  "global-shortcut:allow-unregister",
  "global-shortcut:allow-unregister-all",
  "global-shortcut:allow-is-registered"
]
```

Vaikimisi ei ole pluginast **ühtegi** õigust lubatud. Meie `capabilities/default.json` sisaldab neid
nelja + `core:default`.

**Meie oma Rusti käsud** (`invoke("save_note", ...)`) ei ole ACL-i all — need on rakenduse enda käsud,
mitte plugina omad. Seetõttu said kõik akna- ja failitoimingud tehtud Rusti pool, mitte JS-pluginatega:
nii jääb õiguste nimekiri minimaalseks.

## 4. `tauri.conf.json` (v2) — kasutatud võtmed

- `build`: `beforeDevCommand`, `devUrl`, `beforeBuildCommand`, `frontendDist` (tee on **src-tauri suhtes**)
- `app.windows[]`: `label`, `title`, `width`, `height`, `minWidth`, `minHeight`, `resizable`, `center`,
  `visible` (**`false`** — aken luuakse peidetuna ja näidatakse kiirklahviga), `alwaysOnTop`, `decorations`,
  `skipTaskbar`
- `bundle.active: false` — installerit E2-s ei tehta, piisab binaarist
- `identifier` ei tohi olla `com.tauri.dev` (build keeldub)

## 5. Käsud ja argumendid

- JS: `invoke("save_note", { dir, filename, content })` → Rust: `fn save_note(dir: String, filename: String, content: String)`
- `AppHandle` on käsu argumendina süstitav (ei tule JS-ist)
- `app.path().config_dir()` → Windowsil `%APPDATA%` (Roaming); seadistus läheb `%APPDATA%\Kiirmarge\config.toml`

## 6. Mida see dokument EI kinnita

- Täpne käitumine, kui kombinatsioon on OS-is juba hõivatud (meie kood kuvab sel juhul veateate ja
  näitab akna käsitsi avamiseks — seda ei ole päris hõivatud kombinatsiooniga testitud).
- Mitme ekraani / DPI käitumine.
- Installeri (NSIS/WiX) seadistused — need tulevad hiljem, `bundle.active` on praegu `false`.