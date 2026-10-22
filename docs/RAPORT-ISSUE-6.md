# Issue #6 — sõna- ja tähemärgiloendur: teostus

**Kuupäev:** 22.10.2026
**Issue:** [#6 — Sõnade ja tähemärkide loendur tekstikasti alla](https://github.com/liikane/kiirmarge/issues/6)
**Soov:** tekstikasti alla sõna- ja tähemärgiloendur (issue's kirjeldust polnud).

---

## 1. Mis tehtud

| Osa | Detail |
|-----|--------|
| **Core** | `packages/core/src/note/count.ts` — `countText()`: sõnad tühikute/reavahetuste järgi, tähemärgid Unicode'i koodipunktidena (emoji = 1 tähemärk) |
| **UI** | tekstiala all paremal rida kujul „12 sõna · 84 tähemärki"; uueneb igal sisestusel |
| **Sünkroonimine** | loendur uueneb ka programmiliste muudatuste järel: märkeruudu nupp ☑, Ctrl+Enter, salvestamine, tühistamine |
| **Vormistus** | ainsus/mitmus: „1 tähemärk" / „2 tähemärki" |

## 2. Kontrollid — päriselt jooksutatud

| Kontroll | Tulemus |
|----------|---------|
| Core testid (`npm test`) | **85/85** (7 uut: tühi tekst, üks/mitu sõna, reavahetused ja korduvad tühikud, ainult tühikud, täpitähed, emoji) |
| Typecheck (core + desktop) | 0 viga |
| Vite build | OK (35,0 kB JS, 3,0 kB CSS) |

> **Exe't ei ehitatud** — kasutaja soovil (tuleb veel parandusi). Seetõttu ei testitud loendurit päris aknas;
> loogika on kaetud core-testidega ja UI on õhuke.

## 3. Muudetud failid

| Fail | Muudatus |
|------|----------|
| `packages/core/src/note/count.ts` | uus: `countText()` |
| `packages/core/src/note/count.test.ts` | uus: 7 testi |
| `packages/core/src/index.ts` | ekspordib `countText`, `TextCount` |
| `apps/desktop/index.html` | loenduri rida tekstiala all |
| `apps/desktop/src/main.ts` | `updateCounter()` + uuendused kõigis muudatusteedes |
| `apps/desktop/src/styles.css` | `.note__counter` stiil |
| `docs/KASUTUS.md` | kasutusjuhend täiendatud |
