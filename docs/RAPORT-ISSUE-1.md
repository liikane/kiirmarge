# Issue #1 — Pin to Desktop (alati esiplaanil): teostus

**Kuupäev:** 22.10.2026
**Issue:** [#1 — Võiks olla ikooniga valitav Pin to Desktop režiim](https://github.com/liikane/kiirmarge/issues/1)
**Soov:** „Võiks olla ikooniga valitav Pin to Desktop režiim. Ikoonile klikates kleebitakse programm ekraanile, et oleks nähtav kogu aeg."
**Täpsustus (22.10):** „alati teiste akende peal".

---

## 1. Mis tehtud

| Osa | Detail |
|-----|--------|
| **Nupp** | päises **📌** (hammasratta ⚙ kõrval); `aria-pressed` näitab olekut |
| **Käitumine** | klõps lülitab `set_always_on_top`; olek salvestub kohe `config.toml`-i väljale `general.always_on_top` |
| **Visuaal** | kinnitatud olekus kollane ääris ja tekst (`--focus`), vihje muutub („Kinnita…" / „Vabasta…") |
| **Taastamine** | käivitamisel rakendatakse seadistuse väärtus nii aknale kui nupu olekule |

## 2. Kontrollid — päriselt jooksutatud

| Kontroll | Tulemus |
|----------|---------|
| Core testid (`npm test`) | **85/85** (muutumatu) |
| Typecheck (core + desktop) | 0 viga |
| Vite build | OK (35,6 kB JS) |
| Päris rakendus (UI Automation + Win32 `WS_EX_TOPMOST`) | alguses **True** → klõps → **False** (config `always_on_top = false`) → klõps → **True** → taaskäivitusel **False** (olek püsib) |

> Exe't ei ehitata enne, kui kõik parandused koos (kokkulepe 22.10) — testiti debug-binaariga temp-kaustas.

## 3. Märkused

- Väljal `general.always_on_top` oli seni ainult seadistusfail; nüüd on see ka ikooniga valitav.
- Nupp on UIA-s Toggle-muster (`aria-pressed`), seetõttu kasutab test `TogglePattern`-i.

## 4. Muudetud failid

| Fail | Muudatus |
|------|----------|
| `apps/desktop/index.html` | 📌 nupp päises |
| `apps/desktop/src/main.ts` | `renderPin()`, `togglePin()` (seadistusse salvestamine) |
| `apps/desktop/src/styles.css` | kinnitatud oleku stiil |
| `docs/KASUTUS.md` | kasutusjuhend täiendatud |
| `scripts/issue1-e2e.ps1` | verifikatsioon |
