# Uuring: märkme AI-seostamine Obsidianis (Issue #5)

**Kuupäev:** 31.10.2026 · **Staatus:** variandid ja soovitus, otsus ootab

## Nõue (Issue #5)

Märge salvestub kohe nagu praegu. Hiljem tuvastab AI, millise projekti, kliendi või teemaga see seostub, ja lisab
Markdown-faili sobivad `[[lingid]]`, sildid ja metaandmed. Valikuline (vaikimisi väljas).

## Põhimõtted

1. **Salvestamine ei sõltu AI-st** — märge on alati kohe kettal; seostamine on eraldi, hilisem samm.
2. **Privaatsus** — märkmed võivad sisaldada kliendiandmeid; pilve saatmine peab olema selge, teadlik valik.
3. **Muuda minimaalselt** — AI lisab ainult märgitud ploki (nt YAML frontmatter + `## Seosed`), ei kirjuta olemasolevat teksti ümber.
4. **Linke ainult olemasolevatele** — AI valib vaulti tegelikest märkmetest/siltidest, ei leiuta uusi.

## Variandid

| # | Variant | Plussid | Miinused |
|---|---------|---------|----------|
| A | **Kohalik mudel** (Ollama / LM Studio, nt 3–8B mudel) | andmed ei lahku arvutist; tasuta; offline | vajab paigaldust ja RAM-i; väiksem kvaliteet |
| B | **Pilve-API** (GitHub Models, OpenAI, Anthropic) | parim kvaliteet; paigaldust pole | token + kulu; märkmed lähevad võrku; vajab internetti |
| C | **Reeglipõhine / otsing ilma LLM-ita** (vaulti pealkirjade, siltide ja märksõnade vaste, nt BM25) | kiire, privaatne, ennustatav, null sõltuvust | ei mõista tähendust ega eesti käändeid hästi |
| D | **Obsidiani plugin / väline agent** (nt Copilot/Claude Code vaultis) tööd teeb kiirmärge vaid märgistab | Kiirmärge jääb lihtsaks; kasutab olemasolevat AI-tööriista | kasutaja peab agenti käivitama; pole täisautomaatne |
| E | **Hübriid** (soovitus): C pakub kandidaadid, A või B valib/vormistab | väike prompt, vähem tokeneid, parem tulemus | rohkem koodi |

## Soovitus

**Etapiviisiliselt: C → A/B pistikuna.**

1. **Etapp 1 (väike, ilma AI-ta):** seadetes „Seosta märge vaulti". Kiirmärge indekseerib vaulti failinimed + silte ja lisab
   märkme lõppu ettepaneku `Seosed: [[…]]` märksõnavaste põhjal. Annab kohe väärtuse ja loob liidese.
2. **Etapp 2:** liides `Linker` (core portide stiilis) — realisatsioonid: `KeywordLinker`, `OllamaLinker` (kohalik, vaikimisi),
   `ApiLinker` (pilv, teadliku nõusolekuga; token Windowsi mandaadihoidlas nagu GitHubi omal).
3. **Töötlemine taustal:** salvestamine → järjekord (nagu `github-queue.json`) → linkimine hiljem; veaolukorras märge jääb muutmata.

## Avatud otsused (vajavad sinult)

1. Kas AI võib märkmeid pilve saata (B) või ainult kohalik (A) / reeglipõhine (C)?
2. Kas lisada ainult lingid ja sildid, või ka metaandmed (projekt, klient, kuupäev) frontmatterisse?
3. Kas vaikimisi automaatselt või ainult käsitsi („Seosta" nupp)?

## Märkus eesti keele kohta

Reeglipõhine vaste vajab lemmatiseerimist/lõiketugevust (nt „kliendile" → „klient"); LLM tuleb sellega paremini toime.
