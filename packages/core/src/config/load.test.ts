import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { DEFAULT_CONFIG, DEFAULT_CONFIG_TOML } from "./defaults.ts";
import { parseConfigText } from "./load.ts";

test("vaikeväärtuste TOML annab täpselt vaikeväärtused", () => {
  const parsed = parseConfigText(DEFAULT_CONFIG_TOML);
  assert.deepEqual(parsed.problems, []);
  assert.deepEqual(parsed.config, DEFAULT_CONFIG);
});

test("näidisfail docs/config.example.toml on vaikeväärtustega kooskõlas", () => {
  const path = new URL("../../../../docs/config.example.toml", import.meta.url);
  const text = readFileSync(path, "utf8");
  const parsed = parseConfigText(text);
  assert.deepEqual(parsed.problems, []);
  assert.deepEqual(parsed.config, DEFAULT_CONFIG);
});

test("after_save: lubatud väärtus ja vigane väärtus", () => {
  const confirm = parseConfigText('[general]\nafter_save = "confirm"');
  assert.equal(confirm.config.general.after_save, "confirm");
  assert.deepEqual(confirm.problems, []);

  const bad = parseConfigText('[general]\nafter_save = "hiljem"');
  assert.equal(bad.config.general.after_save, "stay");
  assert.equal(bad.problems.length, 1);
  assert.equal(bad.problems[0]?.field, "general.after_save");
});

test("katkine TOML: vaikeväärtused ja selge teade", () => {
  const parsed = parseConfigText("[general\nmode = \"dark\"");
  assert.deepEqual(parsed.config, DEFAULT_CONFIG);
  assert.equal(parsed.problems.length, 1);
  assert.equal(parsed.problems[0]?.field, "(kogu fail)");
  assert.match(parsed.problems[0]?.message ?? "", /TOML-i lugemine ebaõnnestus/);
});

test("valed tüübid ja lubamatud väärtused asendatakse vaikeväärtustega", () => {
  const text = [
    "[general]",
    "mode = \"vaikimisi\"",
    "always_on_top = \"jah\"",
    "[storage]",
    "notes_dir = 42",
    "[hotkeys]",
    "open = \"Ctrl+Alt+Q+R\"",
  ].join("\n");
  const parsed = parseConfigText(text);
  assert.deepEqual(parsed.config, DEFAULT_CONFIG);
  assert.deepEqual(
    parsed.problems.map((problem) => problem.field),
    ["general.mode", "general.always_on_top", "storage.notes_dir", "hotkeys.open"],
  );
});

test("osaline seadistus: puutumatud väljad tulevad vaikeväärtustest", () => {
  const parsed = parseConfigText("[hotkeys]\nopen = \"Ctrl+Shift+K\"\n\n[storage]\nnotes_dir = \"Märkmed\"");
  assert.deepEqual(parsed.problems, []);
  assert.equal(parsed.config.hotkeys.open, "Ctrl+Shift+K");
  assert.equal(parsed.config.hotkeys.save, DEFAULT_CONFIG.hotkeys.save);
  assert.equal(parsed.config.storage.notes_dir, "Märkmed");
  assert.equal(parsed.config.storage.filename_format, DEFAULT_CONFIG.storage.filename_format);
});

test("tundmatu sektsioon ja väli antakse teada, kuid ei viska viga", () => {
  const parsed = parseConfigText("[general]\nmode = \"standalone\"\ntheme_color = \"lilla\"\n\n[muu]\nx = 1");
  assert.deepEqual(
    parsed.problems.map((problem) => problem.field),
    ["general.theme_color", "muu"],
  );
  assert.equal(parsed.config.general.mode, "standalone");
});

test("obsidian-režiim ilma vaultita hoiatab", () => {
  const parsed = parseConfigText("[general]\nmode = \"obsidian\"");
  assert.equal(parsed.config.general.mode, "obsidian");
  assert.equal(parsed.problems.length, 1);
  assert.equal(parsed.problems[0]?.field, "storage.vault");
  assert.match(parsed.problems[0]?.message ?? "", /vault on tühi/);
});

test("kattuvad kiirklahvid antakse teada", () => {
  const parsed = parseConfigText("[hotkeys]\nopen = \"Ctrl+S\"\nsave = \"Ctrl+S\"");
  assert.equal(parsed.config.hotkeys.open, "Ctrl+S");
  assert.equal(parsed.problems.length, 1);
  assert.equal(parsed.problems[0]?.field, "hotkeys.save");
  assert.match(parsed.problems[0]?.message ?? "", /hotkeys\.open/);
});

test("autostart loetakse ja vale tüüp asendatakse", () => {
  const enabled = parseConfigText("[general]\nautostart = true");
  assert.deepEqual(enabled.problems, []);
  assert.equal(enabled.config.general.autostart, true);

  const wrong = parseConfigText('[general]\nautostart = "jah"');
  assert.equal(wrong.config.general.autostart, false);
  assert.equal(wrong.problems[0]?.field, "general.autostart");
});
test("note_mode ja single_file loetakse", () => {
  const parsed = parseConfigText('[storage]\nnote_mode = "single-file"\nsingle_file = "Märkmed.md"');
  assert.deepEqual(parsed.problems, []);
  assert.equal(parsed.config.storage.note_mode, "single-file");
  assert.equal(parsed.config.storage.single_file, "Märkmed.md");
});

test("vigane note_mode ja single_file asendatakse vaikeväärtustega", () => {
  const parsed = parseConfigText('[storage]\nnote_mode = "kokku"\nsingle_file = "alam/märkmed.md"');
  assert.equal(parsed.config.storage.note_mode, "per-note");
  assert.equal(parsed.config.storage.single_file, "Kiirmärkmed.md");
  assert.deepEqual(
    parsed.problems.map((problem) => problem.field),
    ["storage.note_mode", "storage.single_file"],
  );
});

test("tühi fail annab vaikeväärtused ilma probleemideta", () => {
  const parsed = parseConfigText("");
  assert.deepEqual(parsed.problems, []);
  assert.deepEqual(parsed.config, DEFAULT_CONFIG);
});

test("tagastatud objekt ei ole vaikeväärtustega jagatud viide", () => {
  const first = parseConfigText("");
  first.config.general.theme = "light";
  const second = parseConfigText("");
  assert.equal(second.config.general.theme, DEFAULT_CONFIG.general.theme);
  assert.equal(DEFAULT_CONFIG.general.theme, "dark");
});

test("github: vaikimisi väljas, lubatud silt ja vigane silt", () => {
  const off = parseConfigText("[github]\nenabled = false");
  assert.deepEqual(off.problems, []);
  assert.equal(off.config.github.enabled, false);
  assert.equal(off.config.github.label, "enhancement");

  const on = parseConfigText(
    '[github]\nenabled = true\nrepo = "liikane/kiirmarge"\nlabel = "bug"\nsend_by_default = true',
  );
  assert.deepEqual(on.problems, []);
  assert.deepEqual(on.config.github, {
    enabled: true,
    repo: "liikane/kiirmarge",
    label: "bug",
    send_by_default: true,
  });

  const bad = parseConfigText('[github]\nlabel = "kiire"');
  assert.equal(bad.config.github.label, "enhancement");
  assert.equal(bad.problems[0]?.field, "github.label");
});

test("github: sisse lülitatud ja vigane hoidla annab probleemi", () => {
  const parsed = parseConfigText('[github]\nenabled = true\nrepo = "ilma-kaldkriipsuta"');
  assert.equal(parsed.problems.length, 1);
  assert.equal(parsed.problems[0]?.field, "github.repo");
  assert.match(parsed.problems[0]?.message ?? "", /omanik\/nimi/);
});