import assert from "node:assert/strict";
import { test } from "node:test";

import { composeIssueBackfill, composeIssueDraft, TITLE_MAX } from "./compose.ts";

const OPTIONS = { filename: "2026-10-25-210500.md", stamp: "2026-10-25 21:05" };

test("pealkiri tuleb esimesest reast, ülejäänud läheb kirjeldusse", () => {
  const draft = composeIssueDraft("Kirjutada Issue #12 teostus\n\nTeine rida\nKolmas rida", OPTIONS);
  assert.ok(draft);
  assert.equal(draft.title, "Kirjutada Issue #12 teostus");
  assert.match(draft.body, /Teine rida\nKolmas rida/);
  assert.match(draft.body, /_Kiirmärge · 2026-10-25 21:05 · `2026-10-25-210500\.md`_/);
});

test("märkeruudu ja pealkirja märgid eemaldatakse pealkirjast", () => {
  assert.equal(composeIssueDraft("- [ ] osta piima", OPTIONS)?.title, "osta piima");
  assert.equal(composeIssueDraft("## Pealkiri\n\ntekst", OPTIONS)?.title, "Pealkiri");
  assert.equal(composeIssueDraft("> tsitaat", OPTIONS)?.title, "tsitaat");
  assert.equal(composeIssueDraft("* loend", OPTIONS)?.title, "loend");
});

test("tühi või tühikutest koosnev tekst ei anna mustandit", () => {
  assert.equal(composeIssueDraft("", OPTIONS), null);
  assert.equal(composeIssueDraft("   \n\t\n ", OPTIONS), null);
});

test("liiga pikk esimene rida lõigatakse pealkirjas, täistekst jääb kirjeldusse", () => {
  const long = "a".repeat(TITLE_MAX + 20);
  const draft = composeIssueDraft(long, OPTIONS);
  assert.ok(draft);
  assert.equal(draft.title.length, TITLE_MAX);
  assert.ok(draft.title.endsWith("…"));
  assert.ok(draft.body.startsWith(long), "täisrida peab kirjelduses alles jääma");
});

test("ilma lisatekstita jääb kirjeldusse ainult jalus", () => {
  const draft = composeIssueDraft("Ainult pealkiri", OPTIONS);
  assert.ok(draft);
  assert.equal(draft.body, "_Kiirmärge · 2026-10-25 21:05 · `2026-10-25-210500.md`_");
});

test("tagasiviide märkmesse on Markdown-link Issue numbri ja URL-iga", () => {
  const line = composeIssueBackfill({ number: 12, url: "https://github.com/o/r/issues/12" });
  assert.equal(line, "\n\nGitHub: [#12](https://github.com/o/r/issues/12)\n");
});
