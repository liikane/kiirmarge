# E3 — salve ikoon, autostart, üks eksemplar: raport

**Kuupäev:** 20.10.2026
**Etapp:** E3 (plaani järgi: süsteemisalve ikoon, autostart, üks-eksemplar, veateadete viimistlus)
**Eelmine:** `docs/RAPORT-E2.md`

> Release-build'i ja installerit **ei tehtud** — kõik E3 funktsioonid on testitavad debug-binaariga.
> Installer läheb vaja alles siis, kui on vaja testida päris paigaldust (Start-menüü, desinstallija).

---

## 1. Mis lisandus

| Funktsioon | Kuidas tehtud |
|------------|---------------|
| **Salve ikoon** | `TrayIconBuilder` (tauri `tray-icon` feature): tööriistavihje „Kiirmärge — Ctrl+Alt+N", menüü „Ava kiirmärge" / „Välju"; vasak klõps toob akna esile (`show_menu_on_left_click(false)`) |
| **Üks eksemplar** | `tauri-plugin-single-instance`: teine käivitus ei ava uut akent, vaid toob olemasoleva esile ja lõpetab ise töö |
| **Autostart** | `tauri-plugin-autostart`; olek tuleb seadistusest (`general.autostart`), sünkroonitakse igal käivitusel; kui OS-i tegelik olek erineb seadistusest, näitab aken hoiatust |
| **Sulgenupp (X)** | `WindowEvent::CloseRequested` → `prevent_close()` + `hide()` — rakendus jääb salve ikoonile, lõpetamine käib menüüst „Välju" |
| **Veateadete viimistlus** | Eraldi püsi-teadete ala (`#notice`): seadistuse probleemid ja kiirklahvi/autostardi vead ei kao enam salvestusteate taha |

### Seadistuse muudatus

`[general]` sai uue välja:

```toml
autostart = false          # true = käivita Windowsi sisselogimisel
```

See on kaetud: tüüp (`types.ts`), vaikeväärtus + kommentaar (`defaults.ts`, `docs/config.example.toml`),
valideerimine/teadete loend (`load.ts`) ja testid. **Vanad seadistusfailid töötavad edasi** — puuduva
välja korral kasutatakse vaikeväärtust `false`.

---

## 2. Kontrollid — päriselt jooksutatud

| Kontroll | Tulemus |
|----------|---------|
| Core testid (`node --test`) | **46/46** (lisandus autostarti test) |
| Rust testid (`cargo test`) | **5/5** |
| Typecheck (core + desktop) | 0 viga |
| `npm run tauri -- build --debug --no-bundle` | OK — binaar 13,6 MB |
| Käivitus olemasoleva seadistusega | aken jääb **peidetuks** (Win32: `visible=False`) |
| Teine käivitus | teine protsess lõpetas, protsesse kokku **1**, olemasolev aken muutus nähtavaks |
| Sulgenupp (X) | aken `visible=False`, **protsess jäi elus** |
| Salve ikoon | ülevoolualas nimega „Kiirmärge — Ctrl+Alt+N"; klõps → aken `visible=True` |
| Autostart sisse | `HKLM\...\Run` → `Kiirmärge = C:\kt\memilla\debug\kiirmarge.exe` |
| Autostart välja | kirje eemaldati (`PUUDUB`) |

### Aus märkus mõõtmise kohta

Algul mõõtsin akna nähtavust `Process.MainWindowHandle` + `IsWindowVisible` abil ja sain vale tulemuse —
Tauri protsessil on mitu abiakent („Tao Thread Event Target", WebView2 „…-siw") ja `MainWindowHandle`
osutas neist ühele. Õige meetod on akna otsimine **pealkirja „Kiirmärge" järgi** `EnumWindows`-iga.
Kõik ülalolevad tulemused on mõõdetud nii.

---

## 3. Mida ei õnnestunud automatiseerida

- **Salve ikooni paremklõpsumenüü** („Ava kiirmärge" / „Välju") — selle shelli kaudu ei saa
  paremklõpsu sünteesida (klahvisisestus on blokeeritud). Menüü on koodis olemas ja vasak klõps
  töötab; kontrolli ise: paremklõps ikoonil → peaks avanema menüü kahe punktiga.
- **Globaalne kiirklahv, Esc ja Ctrl+S klaviatuurilt** — samal põhjusel (E2 raportis kirjas).

---

## 4. Teadaolev eripära: autostart ja administraatori õigused

Katses käivitati rakendus **administraatori** shellist ja autostardi kirje läks **HKLM**-i
(üle masina). Tavalisel topeltklõpsul läheb see **HKCU**-sse (ainult see kasutaja).
Kui rakendus on kunagi admin-õigustega käivitatud ja autostart sisse lülitatud, võib HKLM-i kirje
jäääda ka siis, kui hiljem tavakasutajana välja lülitada — sel juhul tuleb see käsitsi eemaldada.
Testi lõpus eemaldasin HKLM-i kirje ja seadistuses on `autostart = false`.

---

## 5. Seis ja järgmine samm

**MVP + E3 on valmis**: kiirklahv, salve ikoon, üks eksemplar, autostart, seadistus, salvestus.
Plaani järgi järgmisena **E4** (Obsidiani režiim: vaultide tuvastus, vaulti/kausta valik, wiki-lingid).

Enne E4-tasub otsustada:
- kas E4 on üldse vajalik enne, kui rakendust igapäevaselt kasutama hakkad (standalone-režiim töötab);
- kas teha release-build + installer (installerit läheb vaja päris paigalduse testiks).
---

## 6. Kettaruum — ja mida sellega tehti

Testimise järel oli C: kettal vaba ainult **1,02 GB**. Põhjus: debug-ehituse vahemälu
(`C:\kt\memilla`) võttis **7,62 GB**, millest enamiku tekitasid mobiili jaoks mõeldud
`staticlib`/`cdylib` väljundid (667 MB `.lib`, 264 MB `.rlib`) ja täielik debug-info.

Tegutsesin nii (küsimus jäi vastamata — otsustasin ise, sest 1 GB vaba ruumi on ohtlik):

1. `[lib] crate-type = ["rlib"]` — `staticlib`/`cdylib` lähevad vaja alles mobiili (E10) juures.
2. `[profile.dev] debug = "line-tables-only"`.
3. `cargo clean` + uus ehitus.

| Näitaja | Enne | Pärast |
|---------|------|--------|
| target-kaust | 7,62 GB | **1,58 GB** (koos testidega 1,8 GB) |
| vaba ruumi C: | 1,02 GB | **5,84 GB** |
| binaar | 13,6 MB | 11,6 MB |

Kontrollid pärast muudatusi: `cargo test` **5/5**, core **46/46**, käivitus peidetult ✓,
teine eksemplar toob akna esile ✓.

> Kui E10 (mobiil) kunagi tuleb, tuleb `crate-type`-i `staticlib` ja `cdylib` tagasi lisada.