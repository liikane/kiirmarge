# Seaded rakenduses — raport

**Kuupäev:** 20.10.2026
**Sisu:** märkmete kausta valik, üks-fail / mitu-faili režiim, autostart lüliti — kõik otse märkmeaknas

---

## 1. Mis lisandus

| Seade | Kuidas töötab |
|-------|---------------|
| **Märkmete kaust** | tekstiväli + nupp „Vali…", mis avab Windowsi kaustavalija; salvestub `storage.notes_dir`-i (absoluutse teena) |
| **Salvestamise viis** | „Üks fail iga märkme kohta" (nagu enne) või „Kõik märkmed ühes failis" |
| **Liitfaili nimi** | kuvatakse ainult liitfaili režiimis; vaikimisi `Kiirmärkmed.md` |
| **Autostart** | märkeruut „Käivita arvuti käivitamisel" → `general.autostart` + registry-kirje |

Kõik need on **otse märkmeaknas** (hammasratas ⚙ paremas ülanurgas) — eraldi dialoogi ei tehtud,
nagu soovisid.

## 2. Tehniline lahendus

**Core (TS):**

- `storage.note_mode` (`per-note` | `single-file`) ja `storage.single_file` — uued seadistusväljad
  (tüübid, vaikeväärtused, valideerimine, näidisfail, testid).
- `serializeConfig(config)` — seadistuse kirjutamine `config.toml`-iks kommentaaridega.
  Ringkäik on testitud: `parseConfigText(serializeConfig(config))` annab sama seadistuse.
  `DEFAULT_CONFIG_TOML` genereeritakse nüüd samast funktsioonist (ei ole enam käsitsi hoitav duplikaat).
- `composeNoteAppend()` — ühe märkme osa liitfaili jaoks (`---` + `## aeg` + tekst).
- `saveNote` kasutusjuht oskab mõlemat režiimi; liitfaili esimesel kirjutusel lisatakse pealkiri
  `# Kiirmärkmed`, hiljem ainult uus osa.

**Rust:**

- `save_note(..., append)` — liitfaili lisamine toimub aatomiliselt (temp + rename); esimese
  kirjutuse korral jäetakse algne tühi rida ära.
- `write_config(text)` — seadete salvestamine (temp + rename).
- `pick_folder(current)` — native kaustavalija (`tauri-plugin-dialog`).

## 3. Kontrollid

| Kontroll | Tulemus |
|----------|---------|
| Core testid | **54/54** (lisandus 8: serialize ringkäik, liitfaili osa, režiimivalik, failinime kontroll) |
| Rust testid | **6/6** (lisandus liitfaili lisamise test) |
| Typecheck | 0 viga |
| Ehitus | OK |

### Päris rakenduse test (UI Automation, uus exe töölaual)

| Stsenaarium | Tulemus |
|-------------|---------|
| Hammasratta nupp | avab seadete paneeli; väljad on olemas ja õigete väärtustega |
| Kausta muutmine | „Märkmete kaust" → `C:\Users\lauri\Desktop` → „Salvesta seaded" → `config.toml` sai `notes_dir = "C:\\Users\\lauri\\Desktop"`; märge läks töölauale |
| Režiimivahetus | „Kõik märkmed ühes failis" → salvestus → `note_mode = "single-file"`; kaks märget läksid **ühte** faili `Kiirmärkmed.md` ühe pealkirja ja kahe `## aeg` osaga |
| Autostart sisse | märkeruut → salvesta → `HKLM\...\Run` kirje `Kiirmärge = C:\Users\lauri\Desktop\Kiirmärge.exe` |
| Autostart välja | märkeruut → salvesta → kirje eemaldati |
| Kaustavalija | „Vali…" avab native dialoogi „Vali märkmete kaust" (klass `#32770`); rakendus jäi tööle |

## 4. Mida ei testitud

- Kaustavalijas **kausta valimist** (dialoog avanes ja sulgus, aga valiku tegemine jäi käsitsi teha).
- **Kiirklahvide muutmist** rakenduses — need on endiselt ainult `config.toml`-is (UI-sse ei pandud).

## 5. Teadaolevad piirangud

1. **Liitfaili režiim** loeb enne lisamist kogu faili — kui fail kasvab väga suureks (kümned MB),
   muutub salvestus aeglasemaks. Praktikas ei ole see kiirmärkmete juures probleem.
2. Seaded rakenduvad **„Salvesta seaded" peale**, mitte iga klahvivajutuse peale.
3. Kui märkmete kaust on kustutatud või kettal puudub, loob rakendus selle salvestamisel automaatselt.

## 6. Seis töölaual (pärast testimist)

- `C:\Users\lauri\Desktop\config.toml` — `notes_dir = C:\Users\lauri\Desktop`,
  `note_mode = "single-file"`, `single_file = "Kiirmärkmed.md"`, `autostart = false`
- `Kiirmärge.exe` — värskeim versioon
- `Kiirmärkmed.md` — testimise käigus tekkinud liitfail (2 testmärget)
---

## 7. Kiirklahvid seadetes + Enter-loogika (lisatud hiljem samal päeval)

| Muudatus | Detail |
|----------|--------|
| Kiirklahvid seadetes | kolm välja: **ava aken** (globaalne), **salvesta**, **sulge**; salvestamisel valideeritakse ja globaalne klahv registreeritakse uuesti (vea korral hoiatus) |
| Uus vaikimisi avamisklahv | **Ctrl+Shift+~** (`~`/`` ` ``/`backquote` loetakse sama klahviks; pluginile saadetakse `ctrl+shift+backquote`) |
| Enter salvestab | `hotkeys.save = "Enter"`; **Ctrl+Enter** lisab reavahetuse (käsitlus `main.ts`-is) |
| Üksikklahv aknasiseselt | `hotkeyError(value, { allowBare })` — globaalne klahv nõuab endiselt muuteklahvi, aknasisesed (Enter/Esc) mitte |
| Seadetes Esc | sulgeb seadete paneeli (ei peida akent) |

**Testid:** core **57/57** (lisandusid: `~` parsimine/format/accelerator, `allowBare`, Enter-vastavus),
Rust **6/6**, typecheck 0 viga. Päris rakenduses: seadete väljad näitasid õigeid väärtusi,
`Ctrl+Shift+~` registreerus veata, UI kaudu `Ctrl+Shift+K`-le ja tagasi muutmine kirjutas config'i õigesti.

**Ei testitud:** Enter/Ctrl+Enter klahvivajutust päris aknas (selles shellis ei saa klahve sünteesida).
Loogika on kaetud core-testiga (`hotkeyMatches` Enteriga) ja kood on lihtne — palun proovi ise.