# Issue #11 — salvestamise järgne valik: teostus

**Kuupäev:** 23.10.2026
**Issue:** [#11 — Seadetes peab olema võimalus valida, kas salvestamisel Enter klahviga jääb aken samasse kohta alles või kuvatakse 5 sekundit dialoog „Salvestatud!" ja salvestatud tekst](https://github.com/liikane/kiirmarge/issues/11)

---

## 1. Mis tehtud

| Osa | Detail |
|-----|--------|
| **Seade** | `general.after_save` = `"stay"` (vaikimisi, aken jääb avatuks) või `"confirm"` (5 s kinnitus) |
| **Seadete UI** | „Pärast salvestamist": „Aken jääb avatuks" / „Kuva 5 s „Salvestatud!" ja peida aken" |
| **Kinnitusvaade** | pärast salvestamist kaetakse aken kihiga: **„Salvestatud!"** + salvestatud tekst; 5 sekundi järel aken peitub ja on jälle saadaval salve ikooni või kiirklahvi kaudu |
| **Esc** | kinnitusvaate ajal peidab akna kohe (ei jää ootama) |
| **Taasavamine** | kiirklahv/salveikoon lähtestab kinnitusvaate ja annab puhta mustandi |

## 2. Kontrollid — päriselt jooksutatud

| Kontroll | Tulemus |
|----------|---------|
| Core testid (`npm test`) | **87/87** (uus test: `after_save` lubatud/ vigane väärtus) |
| Typecheck (core + desktop) | 0 viga |
| Vite build | OK (36,4 kB JS) |
| Päris rakendus (UI Automation, debug-binaar) | kinnitus „Salvestatud!" kuvati ✔ · tekst kinnitusvaates ✔ · märge salvestus ✔ · 5 s järel aken peitus ✔ · kiirklahv avas uuesti ✔ · kinnitusvaade lähtestatud ✔ |

> Exe't ei ehitata enne, kui kõik parandused koos (kokkulepe 22.10).

## 3. Muudetud failid

| Fail | Muudatus |
|------|----------|
| `packages/core/src/config/types.ts` | `AfterSave` + `general.after_save` |
| `packages/core/src/config/defaults.ts` | vaikeväärtus `stay` |
| `packages/core/src/config/validate.ts` | `AFTER_SAVE`, `isAfterSave()` |
| `packages/core/src/config/load.ts` | välja lugemine + tundmatu võtme nimekiri |
| `packages/core/src/config/serialize.ts` | välja kirjutamine kommentaariga |
| `packages/core/src/config/load.test.ts` | uus test |
| `packages/core/src/index.ts` | ekspordid |
| `apps/desktop/index.html` | seadete rida + kinnitusvaade |
| `apps/desktop/src/main.ts` | `showSaved()` / `clearSaved()`, salvestusloogika, Esc-käsitlus |
| `apps/desktop/src/styles.css` | `.saved` kinnitusvaate stiil |
| `docs/config.example.toml`, `docs/KASUTUS.md` | dokumentatsioon |
| `scripts/issue11-e2e.ps1` | verifikatsioon |
