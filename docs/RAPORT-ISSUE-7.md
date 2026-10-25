# Issue #7 — märge korraga Markdowniks ja GitHubi Issue'ks: teostus

**Kuupäev:** 25.10.2026
**Issue:** [#7 — Märkme lisamine korraga nii GitHubi kui Obsidian'i](https://github.com/liikane/kiirmarge/issues/7)

---

## 1. Mis tehtud

| Osa | Detail |
|-----|--------|
| **Seaded** | Uus plokk: lüliti „Saada märge ka GitHubi Issue'na", hoidla (`omanik/nimi`), vaikimisi silt, märkeruudu vaikimisi olek, pääsuvõtme väli + „Salvesta võti" / „Kustuta võti" / „Testi ühendust" |
| **Märkmeaken** | Märkeruut „Saada ka GitHub Issue" + tüübi ripploend (Viga / Idee / Ettepanek / Juhend) — nähtav ainult siis, kui hoidla on seadetes korras |
| **Pealkiri ja kirjeldus** | Pealkiri = märkme esimene sisuline rida (ilma `#`, `- [ ]`, `>`, `*` märkideta, max 120 tähemärki); ülejäänud tekst = kirjeldus + jalus (`_Kiirmärge · <aeg> · <fail>_`). Liiga pikk esimene rida lõigatakse pealkirjas, täistekst jääb kirjeldusse |
| **Sildid** | `bug` / `idea` / `enhancement` / `documentation`; tüübi saab igal märkmel ripploendist muuta |
| **Pääsuvõti** | Hoitakse **Windowsi mandaadihoidlas** (`keyring`, `windows-native`) — `config.toml`-i ega märkmetesse ei kirjutata. JS näeb ainult olekut „on / pole" |
| **Võrk** | `ureq` + rustls; `POST /repos/{owner}/{repo}/issues`, `GET /repos/{owner}/{repo}` ühenduse testiks; 10 s connect / 20 s timeout |
| **Võrguühenduseta** | Korratav viga (võrk, 5xx, päringupiir) → kirje `github-queue.json`-i seadistuse kõrval; uuesti proovitakse käivitusel ja seadete salvestamisel. Mittekorratav viga (401/403/404/422) → kohe teade, järjekorda ei panda |
| **Tagasiviide** | Õnnestumisel lisatakse märkmefaili lõppu `GitHub: [#N](url)` ja tulemus kuvatakse aknas (kinnitusvaates või staatusereal) |
| **Vead** | HTTP-staatused tõlgitakse eesti keelde: 401 kehtetu võti · 403 õigus puudub / piir täis · 404 hoidlat ei leita · 422 valideerimine (nt silt puudub) · 5xx korratav |

## 2. Disainiotsused

1. **Token ei ole `config.toml`-is.** Issue nõudis Windowsi mandaadihoidlat; see on ka ainus koht,
   kus väärtus elab. Seadistusse kirjutatakse ainult `enabled`, `repo`, `label`, `send_by_default`.
2. **Märkmefail salvestatakse alati esimesena.** Kui GitHubi saatmine ebaõnnestub, on märge ikkagi
   olemas — see on Issue nõue („võrguühenduse puudumisel salvestatakse Markdown ikkagi").
3. **Tüübi valik on märkmeaknas, vaikimisi seadetest.** Nii saab kiiresti märkida, kas tegu on vea,
   idee või juhendiga, ilma seadeid avamata.
4. **Koodis on pääsuvõtme muutuja nimi `value`.** Repo kirjutuskaitse loeb kreedendile viitava nime
   (`token`, `secret`) kreedentsi literaaliks ja keeldub faili kirjutamast — tegu on vale-positiiviga
   (väärtus tuleb seadete väljalt, koodis pole ühtki võtit). Kasutaja kinnitas neutraalse nime
   kasutamise; kasutajaliideses ja dokumentatsioonis on see endiselt „GitHubi token".

## 3. Kontrollid — päriselt jooksutatud

| Kontroll | Tulemus |
|----------|---------|
| Core testid (`npm test`) | **109/109** (20 uut: mustandi koostamine, järjekord, saatmise loogika, seadistus) |
| Typecheck (core + desktop) | 0 viga |
| `cargo check` / `cargo build` | OK (uued sõltuvused: `ureq` 2.12, `keyring` 3.6) |
| `scripts/issue7-e2e.ps1` (päris aken + päris API) | vt allpool |

Skripti väljund:

```
OK: aken olemas
OK: märkeruut olemas — Saada ka GitHub Issue Ettepanek
OK: ilma võtmeta — GitHub: GitHubi pääsuvõti puudub — lisa see seadetes (väli „GitHubi token“).
OK: märkmefail salvestati — 2026-10-25-212054.md
OK: pääsuvõtme puudumine ei läinud järjekorda
OK: Token on salvestatud Windowsi mandaadihoidlasse.
OK: kirje on Windowsi mandaadihoidlas
OK: päris API vastas 401 — GitHubi pääsuvõti on kehtetu või aegunud — salvesta uus.
OK: võti kustutati mandaadihoidlast
OK: GitHubi järjekorras on 1 märget, kuid pääsuvõti puudub.
OK: seadistus sisaldab [github] sektsiooni
VALMIS
```

Kontrollitud päriselt: märkeruudu nähtavus, märkmefaili salvestus, veateade ilma võtmeta,
pääsuvõtme salvestamine ja kustutamine **Windowsi mandaadihoidlast** (`cmdkey /list` kinnitas
kirjet `Kiirmarge`), päris GitHubi API 401-vastuse tõlge, järjekorra lugemine käivitusel.

### Mida ei saanud kontrollida

**Issue loomise õnnestunud rada** (HTTP 201 + `GitHub: [#N](…)` tagasiviide) vajab kehtivat
pääsuvõtit, mida mul ei ole. Sama päringu ehitus ja veahaldus on kaetud 401-testiga; õnnestumise
rada on soovitav läbi proovida esimese päris märkmega:

1. ⚙ → salvesta fine-grained token (Issues: Read and write) → **Testi ühendust** → peab ütlema
   „OK: … Issues: loomise õigus on olemas".
2. Saada märge märkeruuduga → märkmefaili peab tekkima `GitHub: [#N](…)` ja Issue peab olema
   hoidlas õige sildiga.

## 4. Muudetud failid

| Fail | Muudatus |
|------|----------|
| `packages/core/src/config/{types,defaults,validate,load,serialize}.ts` | `[github]` sektsioon, `IssueLabel`, `repoError`, `ISSUE_LABELS` |
| `packages/core/src/github/compose.ts` | märkmest Issue'i mustand + tagasiviite rida |
| `packages/core/src/github/queue.ts` | järjekorra tüübid ja puhas loogika (limiit 20) |
| `packages/core/src/usecases/create-issue.ts` | saatmise kasutusjuht + järjekorrast saatmine + vea normaliseerimine |
| `packages/core/src/index.ts` | ekspordid |
| `packages/core/src/**/*.test.ts` | 20 uut testi |
| `apps/desktop/src-tauri/src/github.rs` | mandaadihoidla, GitHubi käsud, järjekorra fail |
| `apps/desktop/src-tauri/src/lib.rs`, `Cargo.toml` | moodul, käsud, sõltuvused |
| `apps/desktop/index.html`, `src/main.ts`, `src/styles.css` | seaded, märkeruut, voog, stiilid |
| `docs/KASUTUS.md`, `docs/config.example.toml`, `README.md` | dokumentatsioon |
| `scripts/issue7-e2e.ps1` | verifikatsioon |

## 5. Piirangud ja edasine

- **GitHub Projects'i staatused** (Issue mainitud tabel) ei ole automaatsed — Issue ise ütleb, et
  staatuse määramine vajab eraldi automaatikat. Praegu pannakse ainult silt.
- **Manused** (pildid) ei lähe Issue'ks — ainult tekst.
- **Järjekorda proovitakse** käivitusel ja seadete salvestamisel, mitte taustal eraldi taimeriga.
- **Üks hoidla korraga**; mitme hoidla jaoks tuleks `repo` muuta loendiks.
