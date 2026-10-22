# Issue #3 — ☑ nupp tekstiala kohale: teostus

**Kuupäev:** 22.10.2026
**Issue:** [#3 — Märkeruutude lisamise ikoon peaks olema teksti välja kohal, mitte selle allservas](https://github.com/liikane/kiirmarge/issues/3)
**Soov:** märkeruudu lisamise ikoon peab olema tekstiala **kohal**, mitte all (issue's oli pilt).

---

## 1. Mis tehtud

| Osa | Detail |
|-----|--------|
| **Paigutus** | ☑ nupp viidud tegevuste realt („Salvesta"/„Tühista" kõrvalt) tekstiala **kohale** eraldi tööriistaritta |
| **Käitumine** | muutumatu: lisab `- [ ] ` kursorile; mitme rea valikul igale reale; Ctrl+Enter jätkab loendit |
| **Stiil** | `.note__toolbar` rida, ikoonnupp samas stiilis nagu ⚙/📌 |

## 2. Kontrollid — päriselt jooksutatud

| Kontroll | Tulemus |
|----------|---------|
| Core testid (`npm test`) | **85/85** (muutumatu) |
| Typecheck (core + desktop) | 0 viga |
| Vite build | OK (35,6 kB JS) |
| Päris rakendus (UI Automation) | nupp Top=**358**, Bottom=**382**; tekstiala Top=**391** → nupp on tekstialast kõrgemal ✔; klõps lisas `- [ ] ` ✔ |

## 3. Muudetud failid

| Fail | Muudatus |
|------|----------|
| `apps/desktop/index.html` | ☑ nupp eraldi `note__toolbar` reas tekstiala kohal |
| `apps/desktop/src/styles.css` | `.note__toolbar` stiil |
| `docs/KASUTUS.md` | täpsustus: nupp asub tekstiala kohal |
| `scripts/issue3-e2e.ps1` | verifikatsioon (asukoht + toimimine) |
