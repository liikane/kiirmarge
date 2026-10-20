import assert from "node:assert/strict";
import { test } from "node:test";

import { cloneConfig, DEFAULT_CONFIG } from "../config/defaults.ts";
import { markdownLink, resolveLinkStyle, wikiEmbed, wikiLink } from "./links.ts";

test("markdown-link teisendab tühikud", () => {
  assert.equal(markdownLink("Pilt", "manused/pilt 1.png"), "[Pilt](manused/pilt%201.png)");
  assert.equal(markdownLink("Märge", "2026-10-20-012014.md"), "[Märge](2026-10-20-012014.md)");
});

test("wiki-link ilma nime ja nimega", () => {
  assert.equal(wikiLink("Kiirmärkmed/x.md"), "[[Kiirmärkmed/x.md]]");
  assert.equal(wikiLink("x.md", "Nimi"), "[[x.md|Nimi]]");
  assert.equal(wikiLink("x.md", ""), "[[x.md]]");
});

test("wiki-embed", () => {
  assert.equal(wikiEmbed("manused/pilt.png"), "![[manused/pilt.png]]");
});

test("lingistiil auto järgib režiimi", () => {
  const standalone = cloneConfig(DEFAULT_CONFIG);
  assert.equal(resolveLinkStyle(standalone), "markdown");

  const obsidian = cloneConfig(DEFAULT_CONFIG);
  obsidian.general.mode = "obsidian";
  obsidian.storage.vault = "C:\\Obs\\Lauri_2026";
  assert.equal(resolveLinkStyle(obsidian), "wiki");
});

test("käsitsi valitud lingistiil kaalub režiimi üle", () => {
  const wiki = cloneConfig(DEFAULT_CONFIG);
  wiki.storage.link_style = "wiki";
  assert.equal(resolveLinkStyle(wiki), "wiki");

  const markdown = cloneConfig(DEFAULT_CONFIG);
  markdown.general.mode = "obsidian";
  markdown.storage.link_style = "markdown";
  assert.equal(resolveLinkStyle(markdown), "markdown");
});
