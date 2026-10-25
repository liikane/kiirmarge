# Issue #8 — nuppude klahvispikker: teostus

**Kuupäev:** 25.10.2026
**Issue:** [#8 — Nuppudele tuleb lisada klahvikombinatsiooni tähised](https://github.com/liikane/kiirmarge/issues/8)

---

## 1. Mis tehtud

| Osa | Detail |
|-----|--------|
| **Nupud** | „Salvesta" ja „Tühista" kannavad nüüd klahvispikrit (`Enter`, `Esc`) — väike `<kbd>`-kiip nupu sees, nagu Issue'i mock-up'il |
| **Allikas** | Spikker tuleb samast kohast, kus tegelik klahvikäsitlus: `parseHotkey` + `formatHotkey` (`hotkeys.save` / `hotkeys.close`) |
| **Dünaamika** | Seadete salvestamisel kutsutakse `renderHotkeyHints()` uuesti — muudetud klahv muudab kohe ka spikrit |
| **Tühje väärtusi** | Kui kiirklahv puudub, jääb kiip nähtamatuks (`.btn__key:empty { display: none }`) |
| **Tekstiala vihje** | Placeholder uueneb samuti: „Kirjuta märge… (Enter salvestab, Ctrl+Enter uus rida)"; kui salvestusklahv on ise `Ctrl+Enter`, jääb reavahetuse vihje ära |
| **Ligipääsetavus** | `aria-keyshortcuts` nupul (`Control+S`, `Escape`), kiip `aria-hidden="true"`, nupul `aria-label` — ekraanilugeja ei loe spikrit nimest topelt |
| **Ühilduvus** | Nuppude ligipääsetav nimi jäi `Salvesta` / `Tühista` — varasemad UI Automationi skriptid (nt `issue11-e2e.ps1`) töötavad muutmata kujul |

## 2. Kontrollid — päriselt jooksutatud

| Kontroll | Tulemus |
|----------|---------|
| Core testid (`npm test`) | **89/89** (2 uut testi tulevad Issue'st #10, vt `RAPORT-ISSUE-10.md`) |
| Typecheck (core + desktop) | 0 viga |
| Vite build | OK (38,8 kB JS) |
| Päris rakendus (`scripts/issue8-e2e.ps1`, UI Automation) | nupud nimedega „Salvesta"/„Tühista" leitud ✔ · vihjed `Enter`/`Esc` ✔ · ekraanipilt ✔ · seadistuses `Ctrl+S`/`Alt+X` → vihjed muutusid ✔ |

Skripti väljund:

```
OK: aken olemas
OK: nupu nimi on endiselt "Salvesta" (varasemad skriptid töötavad edasi)
OK: Salvesta vihje — Salvesta märge (Enter)
OK: Tühista vihje — Tühista mustand (Esc)
OK: ekraanipilt — .zwork\issue8-buttons.png
OK: muudetud salvestusklahv — Salvesta märge (Ctrl+S)
OK: muudetud sulgemisklahv — Tühista mustand (Alt+X)
VALMIS
```

> Kontroll tehti eraldi identifikaatoriga testbinaaril (`eu.leksiko.kiirmarge-e2e`), sest samal ajal
> töötas kasutaja rakendus `C:\Users\lauri\Desktop\Kiirmärge.exe`. Pärast kontrolli ehitati
> `C:\kt\memilla\debug\kiirmarge.exe` uuesti tootmisidentifikaatoriga.

## 3. Muudetud failid

| Fail | Muudatus |
|------|----------|
| `apps/desktop/index.html` | `#save` / `#cancel` said `<kbd id="hint-save">` / `<kbd id="hint-cancel">`, `aria-label`, `aria-keyshortcuts` |
| `apps/desktop/src/styles.css` | `.btn__key` kiibi stiil; `.btn` inline-flex joondus |
| `apps/desktop/src/main.ts` | `hotkeyLabel()`, `ariaShortcutOf()`, `renderHotkeyHints()`; väljakutsed käivitusel ja seadete salvestamisel |
| `scripts/issue8-e2e.ps1` | verifikatsioon päris akna vastu |
