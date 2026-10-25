# Issue #14 — kasutusjuhendi algstruktuur: teostus

**Kuupäev:** 25.10.2026
**Issue:** [#14 — Alustada kasutusjuhendi koostamist](https://github.com/liikane/kiirmarge/issues/14)

---

## 1. Lähtekoht

`docs/KASUTUS.md` oli olemas, aga oli kasvanud etappide kaupa: sees oli nii kasutajale mõeldud
juhiseid kui ka ehitamis- ja arhitektuurimärkmeid, pealkiri viitas vanale seisule („E2 seis",
20.10.2026) ja mõned faktid olid aegunud (nt märkmete kaust oli kirjas konkreetse masina teena).

Issue palus **algstruktuuri**, paigalduse/käivitamise sammud, vähemalt ühe praktilise näite ja
juhendi repo dokumentatsiooni alla. Seepärast kirjutati `docs/KASUTUS.md` tervikuna ümber, mitte
teist paralleelset faili kõrvale.

## 2. Juhendi struktuur

| Peatükk | Sisu |
|---------|------|
| 1. Mis see on | lühike olemus ja vastused korduma kippuvatele küsimustele |
| 2. Paigaldus ja käivitamine | nõuded · **ilma installerita** (exe kopeerimine, topeltklõps, autostart) · arendajale (`npm run tauri …`, `target-dir` selgitus) |
| 3. Esimene käivitamine | seadistuse loomine, salve ikoon, esimene märge |
| 4. Igapäevakasutus | klahvid · salvestusviisid · märkeruudud ja loendur · kinnitusvaade |
| 5. **Praktilised näited** | 3 stsenaariumi: mõte töölauale · ülesanne Obsidiani vaulti · liitfail + „Salvestatud!" kinnitus |
| 6. Seaded | rakenduses (⚙) · `config.toml` väljad · kuhu failid lähevad · märkme formaat |
| 7. Tõrkeotsing | 8 sümptomit koos põhjuse ja lahendusega |
| 8. Arendajale | failide kaart, testikäsud, build |
| 9. Seotud dokumendid | viited ülejäänud dokumentidele |

## 3. Vastuvõtukriteeriumid

| Kriteerium | Seis |
|------------|------|
| Loodud kasutusjuhendi algstruktuur | ✔ 9 peatükki, sisukord tabelitena, edasi täiendatav |
| Kirjeldatud paigaldus või käivitamise põhisammud | ✔ peatükk 2 (nii kasutaja kui arendaja rajad) |
| Lisatud vähemalt üks praktiline kasutusnäide | ✔ kolm näidet (peatükk 5), igaüks samm-sammult |
| Juhend on salvestatud reposti dokumentatsiooni alla | ✔ `docs/KASUTUS.md`; `README.md` viitab sellele |

## 4. Mis juhendis muutus võrreldes varasemaga

- Pealkiri ja seis ajakohastatud (25.10.2026); välja toodud, millised Issue'd on tehtud ja mis on avatud.
- Lisandus **„Salvestuskoht"** (Dokumendid / Töölaud / Kohandatud kaust) ja selgitus, miks töölaua tee
  tuleb Windowsilt, mitte `%USERPROFILE%\Desktop`-ist.
- Lisandus **klahvispikker** nuppudel ja märkus, et see järgib seadetes muudetud klahve.
- Eemaldatud masinapöhine väide („märkmed: `C:\Users\lauri\Desktop`") — nüüd kirjeldatakse valikut ja
  seda, et täpne tee on seadetes näha.
- Ehitamisjuhised ja `LNK1104` selgitus alles, aga koondatud peatükki 8 (arendajale) ja tõrkeotsingusse.
- Lisandusid praktilised näited, mida varem ei olnud.

## 5. Kontrollid

| Kontroll | Tulemus |
|----------|---------|
| Viidatud failid olemas | `docs/SEADISTUSE-ASUKOHT.md`, `docs/PLAAN.md`, `docs/config.example.toml`, `docs/RAPORT-ISSUE-*.md` — kõik olemas |
| Juhendis kirjas olevad arvud | `npm test` 89/89, `cargo test` 6/6, typecheck 0 — samal päeval jooksutatud, vt `RAPORT-ISSUE-8.md` ja `RAPORT-ISSUE-10.md` |
| Juhendis kirjas olevad seadete nimed | kontrollitud päris akna vastu UI Automationiga (`scripts/issue10-e2e.ps1`): „Režiim", „Salvestuskoht", „Salvesta seaded", nupud „Salvesta"/„Tühista" |
| Koodimuudatused | **mitte ühtegi** — ainult dokumentatsioon |

> Juhend **ei** kirjelda veel avatud funktsionaalsust (#12/#13 Daily Note, #7 GitHubi Issue,
> #5 AI-seosed) — need peatükid lisanduvad Issue'de valmimisel.

## 6. Muudetud failid

| Fail | Muudatus |
|------|----------|
| `docs/KASUTUS.md` | terviklik ümberkirjutus: struktuur, paigaldus, näited, seaded, tõrkeotsing |
| `README.md` | dokumenditabel viitab juhendile kui täisjuhendile |
| `docs/RAPORT-ISSUE-14.md` | see raport |

## 7. Järgmised sammud juhendi juures

1. **#12 / #13** (Obsidiani Daily Note) — uus peatükk „Päevamärge" koos näitega, kuidas märge muutub
   Obsidianis ülesandeks.
2. **#7** (GitHubi Issue) — peatükk tokeni seadistamisest ja sellest, mis juhtub võrguühenduseta.
3. **#15** (inglise keel) — tõlge selle struktuuri pealt, mitte vana teksti pealt.
