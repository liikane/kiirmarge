import assert from "node:assert/strict";
import { test } from "node:test";

import { applyLinkSuggestion, isEmptySuggestion, suggestByKeywords } from "./suggest.ts";
import type { VaultEntry } from "./suggest.ts";

const entries: VaultEntry[] = [
  { kind: "note", name: "Klient Tamm" },
  { kind: "note", name: "Kiirmärge" },
  { kind: "tag", name: "pakkumine" },
  { kind: "note", name: "Arve", aliases: ["Invoice"] },
];

test("leiab olemasolevad kirjed käänetega", () => {
  const result = suggestByKeywords("Helista kliendile Tamm ja saada pakkumisele vastus", entries);
  assert.deepEqual(result.links, ["Klient Tamm"]);
  assert.deepEqual(result.tags, ["pakkumine"]);
});

test("ei leiuta linke, mida vaultis pole", () => {
  const result = suggestByKeywords("Ostan piima", entries);
  assert.equal(isEmptySuggestion(result), true);
});

test("alias loeb vasteks", () => {
  assert.deepEqual(suggestByKeywords("invoice tuleb saata", entries).links, ["Arve"]);
});

test("lisab Seosed-ploki ja ei dubleeri", () => {
  const suggestion = suggestByKeywords("klient Tamm pakkumine", entries);
  const once = applyLinkSuggestion("- [ ] Helista", suggestion);
  assert.equal(
    once,
    "- [ ] Helista\n\n## Seosed\n\nLingid: [[Klient Tamm]]\nSildid: #pakkumine\n",
  );
  assert.equal(applyLinkSuggestion(once, suggestion), once);
});

test("ilma vasteteta tekst jääb muutmata", () => {
  assert.equal(applyLinkSuggestion("tekst", { links: [], tags: [] }), "tekst");
});

test("metaandmed lähevad frontmatterisse, olemasolevat ei kirjutata üle", () => {
  const suggestion = { links: [], tags: [], metadata: { klient: "Tamm", projekt: "" } };
  assert.equal(applyLinkSuggestion("tekst", suggestion), '---\nklient: "Tamm"\n---\n\ntekst');
  assert.equal(applyLinkSuggestion("---\na: 1\n---\ntekst", suggestion), "---\na: 1\n---\ntekst");
});
