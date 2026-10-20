import assert from "node:assert/strict";
import { test } from "node:test";

import { cloneConfig, DEFAULT_CONFIG } from "../config/defaults.ts";
import { composeNoteAppend, composeNoteMarkdown } from "./markdown.ts";

const MOMENT = new Date(2026, 6, 14, 20, 31, 5);

test("composeNoteMarkdown: fikseeritud formaat", () => {
  assert.equal(
    composeNoteMarkdown("Tere, maailm.", MOMENT, DEFAULT_CONFIG),
    "# Kiirmärge\n\n**2026-07-14 20:31**\n\nTere, maailm.\n",
  );
});

test("composeNoteMarkdown: reavahetused ühtlustatakse ja servad kärbitakse", () => {
  assert.equal(
    composeNoteMarkdown("  Rida 1\r\nRida 2\r\n\r\n", MOMENT, DEFAULT_CONFIG),
    "# Kiirmärge\n\n**2026-07-14 20:31**\n\nRida 1\nRida 2\n",
  );
});

test("composeNoteAppend: liitfaili osa", () => {
  assert.equal(composeNoteAppend("Tere", MOMENT, DEFAULT_CONFIG), "\n---\n\n## 2026-07-14 20:31\n\nTere\n");
});

test("composeNoteMarkdown: kuupäevavorming tuleb seadistusest", () => {
  const config = cloneConfig(DEFAULT_CONFIG);
  config.storage.datetime_format = "DD.MM.YYYY HH:mm:ss";
  assert.equal(composeNoteMarkdown("x", MOMENT, config), "# Kiirmärge\n\n**14.07.2026 20:31:05**\n\nx\n");
  assert.equal(DEFAULT_CONFIG.storage.datetime_format, "YYYY-MM-DD HH:mm");
});