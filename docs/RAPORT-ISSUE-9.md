# Issue #9 — vaikekiirklahv Ctrl+Shift+1: teostus

**Kuupäev:** 23.10.2026
**Issue:** [#9 — Kiirklahv peaks olema Ctrl + Shift + 1](https://github.com/liikane/kiirmarge/issues/9)
**Põhjus:** `~` ilmub klaviatuuril ainult koos teise klahviga (nt tühik) ja `ˇ` ei olnud üldse tuvastatud — seega vaikekiirklahv tuli muuta.

---

## 1. Mis tehtud

| Osa | Detail |
|-----|--------|
| **Vaikekiirklahv** | `hotkeys.open` vaikeväärtus **`Ctrl+Shift+1`** (varem `Ctrl+Shift+~`) |
| **`ˇ` tugi** | `ˇ` loetakse nüüd samaks klahviks nagu `~`/`` ` ``/`backquote` (parser + test) |
| **Dokumentatsioon** | `README.md`, `docs/KASUTUS.md`, `docs/config.example.toml`, `docs/AI-PROMPT-GITHUB.md` uuendatud |
| **Kasutaja seadistus** | Töölaua `config.toml`-is oli `open = "Ctrl+Shift+1"` juba seatud (kasutaja muutis ise) — rakendus taaskäivitatud, et klahv registreeruks |

## 2. Kontrollid — päriselt jooksutatud

| Kontroll | Tulemus |
|----------|---------|
| Core testid (`npm test`) | **86/86** (uus test: `ˇ` → `~` → `ctrl+shift+backquote`) |
| Typecheck (core + desktop) | 0 viga |
| Päris rakendus (debug-binaar, sünteetiline klahv `Ctrl+Shift+1`) | aken oli enne peidetud; pärast klahvi **avanes** ✔ |

> Exe't ei ehitata enne, kui kõik parandused koos (kokkulepe 22.10).

## 3. Märkused

- Olemasolevaid seadistusi ei migreerita automaatselt: kes soovib, muudab `hotkeys.open` väärtuse seadetes või `config.toml`-is.
- Vana `~`-kombinatsioon jääb parseris toetatuks (mõnel klaviatuuril töötab), lihtsalt pole enam vaikeväärtus.

## 4. Muudetud failid

| Fail | Muudatus |
|------|----------|
| `packages/core/src/config/defaults.ts` | vaikeväärtus `Ctrl+Shift+1` |
| `packages/core/src/hotkey/parse.ts` | `ˇ` alias |
| `packages/core/src/hotkey/parse.test.ts` | uus test |
| `README.md`, `docs/KASUTUS.md`, `docs/config.example.toml`, `docs/AI-PROMPT-GITHUB.md` | vaikeväärtuse viited |
| `scripts/issue9-e2e.ps1` | verifikatsioon |
