# Kiirmärge — kasutusjuhend

**Kuupäev:** 25.10.2026 · **Seis:** tehtud #1–#3, #6, #8–#11; avatud #4, #5, #7, #12–#15

Kiirmärge on portatiivne Windowsi kiirmärkme rakendus: globaalne kiirklahv avab väikese akna,
**Enter** salvestab märkme Markdown-failina. Installerit ei ole — rakendus on üks exe ja seadistus
elab selle kõrval.

> English version: [`USAGE.en.md`](USAGE.en.md) — hoia mõlemad sünkroonis.
>
> See juhend on mõeldud kasutajale. Arendusdetailid (arhitektuur, testid, ehitus) on peatükis 8
> ja `docs/PLAAN.md`-s.

---

## 1. Mis see on

| Küsimus | Vastus |
|---------|--------|
| Milleks? | Mõtte või ülesande kirjapanek sekunditega, ilma akna otsimise ja hiirega klikkimiseta |
| Kuhu salvestab? | Markdown-failina valitud kausta (Dokumendid, Töölaud, kohandatud kaust või Obsidiani vault) |
| Mida vajab? | Windows 10/11 + WebView2 (Windows 11-s on olemas) |
| Kas installerit on? | Ei. Üks `.exe`, seadistus `config.toml` selle kõrval |
| Kas töötab ilma Obsidianita? | Jah — eraldiseisev režiim on vaikimisi |

## 2. Paigaldus ja käivitamine

### 2.1 Nõuded

| Asi | Nõue |
|-----|------|
| OS | Windows 10/11 (Windows 10 vajab WebView2 Runtime'i) |
| Ketas | ~15 MB vaba ruumi exe ja märkmete jaoks |

### 2.2 Ilma installerita (tavakasutaja)

1. Kopeeri `kiirmarge.exe` endale sobivasse kausta (nt `C:\Tools\Kiirmarge\` või töölaud).
   Kaust peab olema **kirjutatav**, kui tahad portatiivset seadistust; muidu kasutab rakendus
   `%APPDATA%\Kiirmarge\config.toml`.
2. Käivita exe **topeltklõpsuga** või Win+R-iga (täistee → Enter). Konsooliakent ei avane.
3. Esmakäivitusel luuakse `config.toml` exe kõrvale ja aken näidatakse automaatselt.
4. Soovi korral: ⚙ → **Käivita arvuti käivitamisel** → „Salvesta seaded". Siis käivitub rakendus
   Windowsi sisselogimisel (kirjutab ühe registry-kirje).

Sulgenupp (X) **ei lõpeta** rakendust — aken peidetakse ja rakendus jääb salve ikoonile.
Lõpetamiseks: paremklõps salve ikoonil → **Välju**.

### 2.3 Arendajale (lähtekoodist)

```powershell
npm install

# arendus (Vite + Tauri, aken avaneb)
npm run tauri --workspace @kiirmarge/desktop -- dev

# eraldiseisev binaar (front-end pakitakse sisse)
npm run tauri --workspace @kiirmarge/desktop -- build --debug --no-bundle
# -> C:\kt\memilla\debug\kiirmarge.exe
```

**Miks `C:\kt\memilla`?** Projekt asub väga pikas kaustatees ja Windowsi 260-tähemärgi piir lööb
linkimise ajal maha (viga **LNK1104**). Seetõttu on `apps/desktop/src-tauri/.cargo/config.toml`-is
`target-dir = "C:/kt/memilla"`. Kui kolid lühemasse teesse, võid selle rea eemaldada.

`cargo build` üksi annab binaari, mis ootab arendusserverit `http://localhost:1420` — selleks
kasuta `tauri ... dev`. Release-ehituse jaoks jäta `--debug` ära (väljund `C:\kt\memilla\release\`).

## 3. Esimene käivitamine

1. Rakendus käivitub **peidetud aknana**, registreerib globaalse kiirklahvi **Ctrl+Shift+1** ja lisab
   **salve ikooni** (Windows 11 peidab uue ikooni esialgu ülevoolualasse — „Show hidden icons").
2. Esmakäivitusel luuakse seadistus ja aken näidatakse kohe.
3. Kirjuta tekst ja vajuta **Enter** — märge on failis. Aken jääb avatuks (vaikimisi), nii et saad
   kohe järgmise mõtte kirja panna.

## 4. Igapäevakasutus

### 4.1 Klahvid

| Klahv | Mida teeb |
|-------|-----------|
| `Ctrl+Shift+1` | näita akent (globaalne, muudetav seadetes) |
| `Enter` | salvesta märge |
| `Ctrl+Enter` | reavahetus tekstis (märkeruudu real jätkab loendit) |
| `Esc` | peida aken (seadete paneelil sulgeb paneeli) |

Nuppudel „Salvesta" ja „Tühista" on **klahvispikker** (`Enter`, `Esc`) — see uueneb automaatselt, kui
muudad seadetes salvestamise või sulgemise klahvi.

### 4.2 Salvestamise viisid

| Viis | Tulemus |
|------|---------|
| **Üks fail iga märkme kohta** (vaikimisi) | `2026-10-25-091500.md` — iga märge omaette failis; kui sama sekund kordub, lisandub `-2` |
| **Kõik märkmed ühes failis** | kõik läheb ühte `Kiirmärkmed.md`-sse, iga märge eraldatud `---`-ga; pealkirja ei korrata |
| **Obsidiani päevamärge** (`daily-note`; ainult režiimis „Obsidiani vault“) | tänane `YYYY-MM-DD.md` vaulti märkmete kaustas; iga mõte lisatakse lõppu ülesandena `- [ ] <märkus>`. Fail luuakse, kui seda pole. Nii saab mõtte hiljem tegevuseks muuta või tehtuks märkida |

### 4.3 Märkeruudud ja loendur

- Nupp **☑** (päises 📌 ja ⚙ kõrval) lisab kursorile Markdowni märkeruudu `- [ ] `.
- `Ctrl+Enter` märkeruudu real jätkab loendit uue `- [ ] `-ga.
- Tekstiala all on **sõna- ja tähemärgiloendur**, mis uueneb kirjutamise ajal.

### 4.4 Pärast salvestamist

Seadetes saab valida kahte käitumist:

| Valik | Käitumine |
|-------|-----------|
| **Aken jääb avatuks** (vaikimisi) | märge salvestatakse, aken jääb samasse kohta ja on kohe järgmise märkme jaoks valmis |
| **Kuva 5 s „Salvestatud!" ja peida aken** | aken kaetakse kinnituse ja salvestatud tekstiga, 5 sekundi järel peitub ja on jälle saadaval salve ikooni või kiirklahvi kaudu |

Kinnitusvaate ajal peidab **Esc** akna kohe.

## 5. Praktilised näited

### Näide 1 — mõte töölauale (ilma Obsidianita)

1. ⚙ → **Salvestuskoht: Töölaud** → „Salvesta seaded". Välja all kuvatakse
   „Märkmed: `C:\Users\<sina>\Desktop\Kiirmärkmed`" — tee tuleb Windowsilt, seega töötab see ka
   siis, kui töölaud on OneDrive'i suunatud või teise nimega.
2. `Ctrl+Shift+1` → kirjuta „Helistada Lauri, küsi pakkumise kohta" → **Enter**.
3. Töölaual on kaust `Kiirmärkmed` ja selles `2026-10-25-091500.md`.

### Näide 2 — ülesanne Obsidiani vaulti

1. ⚙ → **Režiim: Obsidiani vault** → vali vault → **Märkmete kaust** (vaulti suhtes, nt `Kiirmärkmed`)
   → „Salvesta seaded".
2. Ava kiirmärge, vajuta **☑** (tekib `- [ ] `), kirjuta „Kirjutada Issue #12 teostus" → **Enter**.
3. Fail on vaulti kaustas `Kiirmärkmed/…md` ja rida on Obsidianis päris ülesanne, mille saab
   valmis märkida.

### Näide 3 — kõik märkmed ühte faili, kinnitusvaatega

1. ⚙ → **Salvestamise viis: Kõik märkmed ühes failis** → **Liitfaili nimi: `Kiirmärkmed.md`**
   → **Pärast salvestamist: Kuva 5 s „Salvestatud!"** → „Salvesta seaded".
2. Kirjuta märge → **Enter** → näed teksti „Salvestatud!" all; 5 sekundi pärast on aken peidetud.
3. Kõik märkmed kogunevad samasse faili kronoloogiliselt — hea, kui tahad päeva jooksul ühte
   voogu kirjutada.

### Näide 4 — märge läheb korraga faili ja GitHubi Issue'ks

1. ⚙ → **Saada märge ka GitHubi Issue'na** → **hoidla** `liikane/kiirmarge` → **vaikimisi silt**
   (nt „Ettepanek“) → kleebi **GitHubi token** ja vajuta **Salvesta võti** → **Testi ühendust**
   (peab ütlema „OK: … Issues: loomise õigus on olemas“) → „Salvesta seaded“.
2. Ava kiirmärge, kirjuta nt „Parandada kiirklahv pärast unerežiimi“ ja vali märkeruudu kõrval
   tüübiks „Viga“.
3. **Enter** — märkmefail salvestatakse kohe (nagu alati); kui Issue saab loodud, lisandub faili
   lõppu rida `GitHub: [#12](…)` ja aken näitab Issue linki.
4. Kui võrku pole või GitHub vastab 5xx/piiranguga, jääb saatmine **järjekorda** (`github-queue.json`
   seadistuse kõrval) ja proovitakse uuesti järgmisel käivitusel või seadete salvestamisel.

## 6. Seaded

### 6.1 Rakenduses (⚙)

| Seade | Mida teeb |
|-------|-----------|
| Režiim | `Eraldiseisev` (Dokumendid/töölaud) või `Obsidiani vault` |
| Obsidiani vault | vaulti valik (loetelu tuvastatakse Obsidiani seadistusest, saab ka käsitsi valida) |
| **Salvestuskoht** | `Dokumendid` · `Töölaud` · `Kohandatud kaust`; all kuvatakse lahendatud tee |
| Märkmete kaust | Dokumendid/Töölaud: suhteline nimi; Kohandatud: täistee („Vali…") |
| Salvestamise viis | üks fail märkme kohta, kõik ühes failis või Obsidiani päevamärge |
| Liitfaili nimi | liitfaili nimi (nt `Kiirmärkmed.md`) |
| Lingistiil | automaatne / wiki `[[…]]` / Markdown `[…](…)` |
| Kiirklahv akna avamiseks | globaalne kiirklahv (vaikimisi `Ctrl+Shift+1`) |
| Salvestamise klahv | vaikimisi `Enter` (`Ctrl+Enter` jääb alati reavahetuseks) |
| Sulgemise klahv | vaikimisi `Esc` |
| Käivita arvuti käivitamisel | autostart |
| Pärast salvestamist | aken jääb avatuks või 5 s kinnitus |
| Saada märge ka GitHubi Issue'na | lülitab GitHubi välja ja märkeruudu märkmeaknas sisse |
| GitHubi hoidla | `omanik/nimi`, nt `liikane/kiirmarge` |
| Vaikimisi silt | `bug` / `idea` / `enhancement` / `documentation` |
| GitHubi token | salvestatakse **Windowsi mandaadihoidlasse**, mitte `config.toml`-i |

### 6.2 Käsitsi (`config.toml`)

Fail asub **exe kõrval**; kui sinna ei saa kirjutada, siis `%APPDATA%\Kiirmarge\config.toml`.
Muuda väärtusi ja käivita rakendus uuesti (või muuda seadeid rakenduses — siis kirjutatakse fail
uuesti, kommentaarid säilivad).

| Väli | Tähendus |
|------|----------|
| `general.mode` | `standalone` või `obsidian` (+ `storage.vault`) |
| `general.after_save` | `stay` = aken jääb avatuks; `confirm` = 5 s kinnitus |
| `general.always_on_top` | kas aken on alati esiplaanil |
| `general.autostart` | `true` = käivita Windowsi sisselogimisel |
| `storage.notes_dir` | suhteline nimi (Dokumendid/töölaud/vault) või täistee |
| `storage.default_to_desktop` | `true` = märkmed töölauale alamkausta; **eraldiseisvas režiimis** (Obsidiani vault on määrav) |
| `storage.note_mode` | `per-note` = iga märge eraldi faili; `single-file` = kõik ühte; `daily-note` = tänane Obsidiani päevamärge ülesandena |
| `storage.single_file` | liitfaili nimi, kui `note_mode = "single-file"` |
| `storage.filename_format` | failinime mall, vaikimisi `YYYY-MM-DD-HHmmss.md` |
| `hotkeys.open` | globaalne kiirklahv (peab olema muuteklahviga) |
| `hotkeys.save` / `hotkeys.close` | aknasisesed klahvid (`Enter` / `Esc`); üksikklahv lubatud |

Näidis: `docs/config.example.toml`.

Vigase väärtuse korral **rakendus ei kuku**: kasutatakse vaikeväärtust ja aken näitab probleemide
nimekirja.

### 6.3 Kuhu failid lähevad

| Fail | Asukoht |
|------|---------|
| Seadistus | exe kõrval `config.toml` (portatiivne) või `%APPDATA%\Kiirmarge\config.toml` — vt `docs/SEADISTUSE-ASUKOHT.md` |
| Märkmed | seadetes valitud koht (`storage.notes_dir`, `storage.default_to_desktop`); täpne tee on seadetes näha |
| Liitfail | `storage.single_file` valitud kaustas |

Märkme sisu:

```markdown
# Kiirmärge

**2026-10-25 09:15**

<sinu tekst>
```

### 6.4 GitHubi token ja õigused

Issue'de loomiseks on vaja GitHubi pääsuvõtit (PAT). Piisab ühest hoidlast ja ühest õigusest:

1. GitHubis **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
   → „Generate new token".
2. **Repository access**: ainult see hoidla (nt `liikane/kiirmarge`).
3. **Permissions → Repository permissions → Issues: Read and write**.
4. Kopeeri token (seda näidatakse ainult korra) → rakenduses ⚙ → väli **GitHubi token**
   → **Salvesta võti**.
5. **Testi ühendust** ütleb, kas hoidla on nähtav ja kas Issue'de loomise õigus on olemas.

Token hoitakse **Windowsi mandaadihoidlas** (kirje `Kiirmarge`), mitte `config.toml`-is ega
märkmetes. **Kustuta võti** eemaldab selle sealt.

## 7. Tõrkeotsing

| Sümptom | Põhjus ja lahendus |
|---------|--------------------|
| „Kiirklahvi … ei saanud registreerida" | kombinatsioon on OS-is hõivatud → muuda `hotkeys.open`; aken näidatakse automaatselt |
| Aken ei avane kiirklahviga | mõni teine programm kasutab sama kombinatsiooni; või käivita rakendus uuesti |
| „Töölaud" ei vii faile töölauale | kontrolli seadetes kuvatavat „Märkmed: …" teed; kui töölaud on OneDrive'i suunatud, kasutab rakendus Windowsi tegelikku töölauda |
| „Kohandatud kaust" ei salvestu | väli vajab täisteekonda (`C:\…`) — kasuta „Vali…" |
| Minimeeritud aken ei tule esile | vana binaar (enne 20.10.2026) ei taastanud minimeeritud akent — ehita/uuenda exe |
| `cargo build` viskab linkimisvea | MSVC Build Tools puudub → `winget install Microsoft.VisualStudio.2022.BuildTools` (VC.Tools + Windows SDK) |
| `LNK1104: cannot open file ...target\debug\build\...` | tee liiga pikk → `apps/desktop/src-tauri/.cargo/config.toml` (`target-dir = "C:/kt/memilla"`) |
| Märge ei salvestu | vaata akna all olevat veateadet; tee peab olema absoluutne ja kirjutatav |
| „GitHubi pääsuvõti puudub" | võti pole salvestatud → ⚙ → väli „GitHubi token" → **Salvesta võti** |
| „GitHubi pääsuvõti on kehtetu või aegunud" | token on tühistatud või muudetud → loo uus ja salvesta |
| „Hoidlat ei leitud või … puudub ligipääs" | hoidla nimi vale või tokenil pole selle repo jaoks õigust |
| „… puudub õigus … Issues: write" | lisa tokenile õigus **Issues: Read and write** |
| „GitHub ei võtnud Issue't vastu" (422) | nt silt puudub hoidlas → loo silt (`bug`, `idea`, …) või vali olemasolev |
| „GitHubi päringupiir on täis" | oota piirangu lõpuni; märge on järjekorras ja läheb ise edasi |

## 8. Arendajale

| Fail | Sisu |
|------|------|
| `packages/core` | puhas TS: seadistus, märkme formaat, kiirklahvid, teed, kasutusjuhud + testid |
| `apps/desktop/src/main.ts` | UI loogika: seadistuse laadimine, salvestus, kiirklahvid, seadete paneel |
| `apps/desktop/src-tauri/src/lib.rs` | Rusti käsud (config, märkmed, aken, salve ikoon, dialoog), üks eksemplar, autostart |
| `apps/desktop/src-tauri/capabilities/default.json` | õigused (globaalne kiirklahv) |

Kontrollid:

```powershell
npm test                # core: 109 testi
npm run typecheck       # core + desktop
cd apps/desktop/src-tauri; cargo test   # 6 testi
```

## 9. Seotud dokumendid

| Fail | Sisu |
|------|------|
| `README.md` | lühitutvustus ja kiirestart |
| `docs/PLAAN.md` | arhitektuuri- ja arendusplaan (E1–E10) |
| `docs/SEADISTUSE-ASUKOHT.md` | miks seadistus on exe kõrval |
| `docs/RAPORT-ISSUE-*.md` | üksikute Issue'de teostus ja kontrollid |
| `docs/config.example.toml` | seadistuse näidis kommentaaridega |
