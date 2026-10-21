# Issue #2 — Markdowni märkeruudud: teostus

**Kuupäev:** 21.10.2026
**Issue:** [#2 — Markdown automaatne lisamine täiendada](https://github.com/liikane/kiirmarge/issues/2)
**Soov:** „Võiks olla mingisugune nupp, millele vajutades saab märkeruudud Obsidiani jaoks."

---

## 1. Mis tehtud

| Osa | Detail |
|-----|--------|
| **Nupp** | märkmeakna all **☑** (hõljuvihje „Lisa märkeruut (Obsidian)") |
| **Üks rida** | lisab `- [ ] ` rea algusesse, taane säilib; kui rida on juba märkeruut, ei dubleeri |
| **Mitme rea valik** | iga mitte-tühi rida saab märkeruudu; olemasolevad märkeruudud ja tühjad read jäävad puutumata |
| **Loendi jätkamine** | **Ctrl+Enter** märkeruudu real lisab uue `- [ ] ` (taane säilib); tavalisel real käitub nagu varem |
| **Core** | `packages/core/src/note/checklist.ts` — `insertCheckbox()`, `continueChecklist()`, `isChecklistLine()` |

**Miks core'is:** sama loogika tuleb hiljem kasuks Obsidiani pluginas (E7) ja on UI-st sõltumatult testitav.
UI (`main.ts`) jääb õhukeseks: rakendab ainult core'ist tulnud tekstimuudatuse.

## 2. Kontrollid — päriselt jooksutatud

| Kontroll | Tulemus |
|----------|---------|
| Core testid (`npm test`) | **78/78** (11 uut: üks rida, taane, olemasolev märkeruut, mitme rea valik, rea-alguse piir, `- [x]`, loendi jätkamine) |
| Typecheck (core + desktop) | 0 viga |
| Vite build | OK (34,7 kB JS) |
| Päris rakendus (UI Automation, `scripts/issue2-e2e.ps1`) | nupp „Lisa märkeruut" leiti; klõps → tekstialas `- [ ] `; salvestus → failis `- [ ] tere` |
| Sünteetiline **Ctrl+Enter** päris aknas (`scripts/issue2-keys.ps1`) | loend jätkus: `- [ ] tere` → `- [ ] tere` + uus `- [ ] ` |

## 3. Käitumine ja piirangud

- **Enter salvestab endiselt** (nii on `hotkeys.save` seatud) — mitme ülesande kirjutamiseks kasuta **Ctrl+Enter**, mis jätkab loendit.
- Nupp töötab nii standalone- kui Obsidiani režiimis (`- [ ]` on standardne Markdown, Obsidian kuvab selle märkeruuduna).
- Valiku korral ei lisata märkeruutu tühjadele ridadele.

## 4. Muudetud failid

| Fail | Muudatus |
|------|----------|
| `packages/core/src/note/checklist.ts` | uus: märkeruutude lisamine ja loendi jätkamine |
| `packages/core/src/note/checklist.test.ts` | uus: 11 testi |
| `packages/core/src/index.ts` | ekspordib `insertCheckbox`, `continueChecklist`, `isChecklistLine`, `TextEdit` |
| `apps/desktop/index.html` | nupp **☑** tegevuste reas |
| `apps/desktop/src/main.ts` | nupu käsitleja + Ctrl+Enteri loendi jätkamine |
| `docs/KASUTUS.md` | kasutusjuhend täiendatud |
| `scripts/issue2-e2e.ps1`, `scripts/issue2-keys.ps1` | verifikatsioon |
