# Issue #13 (ja #12) — Obsidiani päevamärge: ühendamine ja kontroll

**Kuupäev:** 31.10.2026
**Issues:** #13 (kommentaar: „Seda ilmselt juba tehakse, tuleb kontrollida"), #12 (suletud)

## Leid

- #13 on sisuliselt #12 duplikaat. #12 on suletud ja projektitahvlil „Done", **kuid** teostus
  (commit `14b9814`, haru `origin/liikane-obsidian-daily-note-capture`) ei olnud `main`-is ega
  ühegi PR-i all. `main`-is `daily-note` režiimi polnud.

## Tehtud

- Haru ühendatud (merge); konfliktid `apps/desktop/src/main.ts` (seadete UI: salvestuskoha valik
  + `daily-note` valik) ja `docs/KASUTUS.md` (uus juhendistruktuur) lahendatud mõlema poole muudatusi säilitades.
- `docs/KASUTUS.md`: päevamärge lisatud jaotisesse 4.2, seadete tabelisse ja `config.toml` tabelisse.
- Kontrollitud: `npm run typecheck`, `npm test`.

## Järgmised sammud (plaan)

1. #4 — seadete asukoht (register vs. fail), vaikimisi sama kaust.
2. #15 — dokumentatsiooni tõlkimine inglise keelde.
3. #7, #8, #10, #14 — teostus on `main`-is (vt RAPORT-ISSUE-*.md), Issue'd on veel avatud: sulgeda pärast kinnitust.
4. #5 — AI seosed Obsidianis (uuring enne).
