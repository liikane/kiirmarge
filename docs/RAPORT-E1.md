# E1 — core ja seadistus: raport

**Kuupäev:** 14.10.2026
**Projekt:** Memilla (tööpealkiri `kiirmarge`)
**Etapp:** E1 — skelett + core + konfiguratsioon + kiirklahvid + ühiktestid
**Plaan:** `docs/PLAAN.md`

---

## 1. Lähteseis — mis oli tehtud 13.10 õhtul ja öösel

| Aeg | Mis tehti |
|-----|-----------|
| 13.10 22:58 | `PLAAN.md` loodi (`Default\kiirmarge\docs\PLAAN.md`, 8574 B). Sama fail on ka `Memilla\docs\PLAAN.md` — sisu on identne |
| 14.10 00:44–00:46 | Memilla projekt loodi: `package.json` (npm workspaces), `tsconfig.base.json`, `packages/core/package.json`, `packages/core/tsconfig.json`, `core/src/config/{types,defaults,validate}.ts`, `core/src/hotkey/parse.ts`, `.gitignore` |
| 14.10 00:46 | rustup paigaldatud (logi: `.zwork\background\2026-10-13T21-44-35-670Z-28bad2.log`) |

Ehk: **plaan + core'i algus (seadistuse tüübid, vaikeväärtused, valideerimine, kiirklahvide parsimine)**.
Puudusid: `index.ts`, kõik testid, `node_modules`, note-moodul, pordid, kasutusjuhud.

---

## 2. Mis täna tehtud (E1 lõpule viidud)

### 2.1 Uued failid (23)

| Fail | Mida sisaldab |
|------|---------------|
| `packages/core/src/config/load.ts` | config.toml lugemine (smol-toml), vaikeväärtustega ühendamine, vigade kogumine — ei viska kunagi erandit |
| `packages/core/src/note/filename.ts` | ajamallide vormindamine (YYYY MM DD HH mm ss), failinime ehitamine, nimekonflikti number |
| `packages/core/src/note/markdown.ts` | märkme Markdowni koostamine (fikseeritud formaat) |
| `packages/core/src/ports/*.ts` (7 faili) | `Clock`, `ConfigStore`, `NoteStore`, `HotkeyService`, `WindowService`, `TrayService` + ühine `index.ts` |
| `packages/core/src/usecases/load-config.ts` | seadistuse laadimine; puuduv fail luuakse, olemasolevat ei kirjutata üle |
| `packages/core/src/usecases/save-note.ts` | mustand -> fail; tühi mustand jäetakse salvestamata, nimekonflikt lahendatakse |
| `packages/core/src/usecases/discard-note.ts` | "Tühista" — teadlikult ei kirjuta midagi |
| `packages/core/src/index.ts` | kogu avalik API ühest kohast |
| `docs/config.example.toml` | seadistuse näidis (sama, mille rakendus esmakäivitusel loob) |
| 8 testifaili | vt punkt 3.2 |

### 2.2 Muudetud failid (2)

| Fail | Muudatus | Miks |
|------|----------|------|
| `core/src/config/defaults.ts` | lisasin `cloneConfig()` | ilma selleta oleks tagastatud seadistus vaikeväärtustega **sama objekt** — üks muudatus kusagil rikuks vaikeväärtused kogu protsessis |
| `core/src/hotkey/parse.ts` | `Esc` on nüüd lubatud üksikklahvina (+ veateate sõnastus) | vaikeväärtus `close = "Esc"` oleks muidu **ise** valideerimisel vigane — see oli päris viga, mitte maitse küsimus |

Lisaks: viide veel olematule uuringudokumendile (`docs/uuring/tauri2-ehitus.md`) on nüüd märgitud E2-sse.

---

## 3. Kontrollide tulemused

### 3.1 Baseline enne tööd

| Kontroll | Enne |
|----------|------|
| `npm run typecheck` | exit 0 |
| `npm test` | exit 0, teste **0** |

Eelnevaid vigu ei olnud — seega kõik allpool olevad tulemused on tänase töö tulemus.

### 3.2 Testid — 37/37 läbis

`node --test`, ilma lisasõltuvusteta (ainult `node:test` + `node:assert/strict`):

| Testifail | Mida kontrollib |
|-----------|-----------------|
| `hotkey/parse.test.ts` | korrektsed ja vigased kombinatsioonid, teadete sisu, kanooniline kuju, `toAccelerator` (Tauri kuju), sündmuse vastavus |
| `note/filename.test.ts` | ajamallid, nullidega täitmine, nimekonflikti number |
| `note/markdown.test.ts` | märkme formaat tähemärgi täpsusega, CRLF-i ühtlustamine, kuupäevavorming seadistusest |
| `config/validate.test.ts` | mallide kontrollid + **vaikeväärtused läbivad omaenda kontrolli** |
| `config/load.test.ts` | vaikeväärtuste TOML -> täpselt vaikeväärtused; näidisfail on kooskõlas; katkine TOML; valed tüübid; osaline fail; tundmatud väljad; obsidian ilma vaultita; kattuvad kiirklahvid; jagatud viite puudumine |
| `usecases/load-config.test.ts` | puuduv fail luuakse, olemasolevat ei kirjutata üle, vigane fail jääb puutumata |
| `usecases/save-note.test.ts` | salvestus, tühi mustand, nimekonflikt, salvestusviga |
| `usecases/discard-note.test.ts` | tühistamine ei kirjuta midagi |

```
npm test   -> tests 37, pass 37, fail 0
npm run typecheck -> exit 0
npm install -> 6 paketti (smol-toml 1.9.1, typescript 7.0.2)
```

### 3.3 Paketi sisenemispunkti laadimistest

Lisaks testidele laadisin paketi päriselt (`import * as core from "@kiirmarge/core"`) ja käivitasin
läbi selle kogu ahela: seadistuse parsimine -> kiirklahvi teisendus -> märkme salvestamine.

```
eksporditud nimesid: 28
vaikeconfig parses ilma probleemideta: true
kiirklahv: Ctrl+Alt+N -> Tauri: ctrl+alt+n
saveNote ok: true | fail: 2026-07-14-203105.md
```

Ajutine skript: `.zwork/smoke.mjs` (see kaust on `.gitignore`-is).

### 3.4 Vahejuhtum (ausalt)

Üks minu automaatne tekstiasendus jättis `defaults.ts`-is regex-grupi viite `$1` lahtiseks, mille tõttu
`DEFAULT_CONFIG` kadus failist. **Typecheck tuvastas selle kohe** (`error TS2304: Cannot find name '$1'`),
taastasin faili ja jooksutasin kõik kontrollid uuesti. Praegu kaitsevad sama kohta kaks testi
("vaikeväärtuste TOML annab täpselt vaikeväärtused" ja "vaikeväärtused läbivad omaenda kontrolli").

---

## 4. Mida EI ole tehtud

- **E2 (Tauri kest)** — alustamata. `apps/` kausta ei ole olemas.
- **`docs/uuring/tauri2-ehitus.md`** — tuleb E2-s (seal kinnitatakse ka Tauri 2 kiirklahvi sõnastik;
  praegu on `toAccelerator()` kirjas minu parima teadmise järgi, mitte dokumentatsioonist kontrollitult).
- **git repo** — `.gitignore` on olemas, `git init` on tegemata.
- **Rakenduse nimi** — pakett on `kiirmarge` (tööpealkiri), projektikaust on `Memilla`.
  Plaanis olid nimed: Kiirmark, Memilla, Notelio, Jotela, Nolevia, Clipello, Captello. Otsus on sinu.

---

## 5. E2 eelduste seis (täna mõõdetud)

| Eeldus | Seis |
|--------|------|
| Rust (cargo/rustc) | **OK** — 1.99.0, host `x86_64-pc-windows-msvc` |
| MSVC C++ Build Tools (`link.exe`, `cl.exe`) | **PUUDUB** |
| Windows SDK | **PUUDUB** |
| WebView2 Runtime | **OK** — 155.0.4283.45 |
| Node / npm | **OK** — 24.20.0 / 11.19.0 |

**Järeldus:** E2 ei saa alata enne, kui on paigaldatud *Microsoft C++ Build Tools*
(Rusti linkimine vajab MSVC-d). Paigaldus nõuab administraatori õigusi ja ~2–6 GB.
Teine tee on plaani varuplaan: **Electron** — siis jääb `core` ja plugin puutumata ja muutub ainult kest.

---

## 6. Failid

**Projektijuur:** `...\projects\Memilla\`
**Core:** `packages\core\src\` (18 lähtefaili + 8 testifaili)
**Plaan:** `docs\PLAAN.md` · **Näidisconfig:** `docs\config.example.toml` · **See raport:** `docs\RAPORT-E1.md`