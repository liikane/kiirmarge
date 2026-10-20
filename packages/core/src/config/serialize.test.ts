import assert from "node:assert/strict";
import { test } from "node:test";

import { cloneConfig, DEFAULT_CONFIG } from "./defaults.ts";
import { parseConfigText } from "./load.ts";
import { serializeConfig } from "./serialize.ts";

test("serializeConfig -> parseConfigText ringkäik annab sama seadistuse", () => {
  const parsed = parseConfigText(serializeConfig(DEFAULT_CONFIG));
  assert.deepEqual(parsed.problems, []);
  assert.deepEqual(parsed.config, DEFAULT_CONFIG);
});

test("serializeConfig: erimärgid tees ja kiirklahvis ei riku faili", () => {
  const config = cloneConfig(DEFAULT_CONFIG);
  config.storage.notes_dir = 'C:\\Märkmed\\"eriline"';
  config.storage.note_mode = "single-file";
  config.storage.single_file = "Kõik märkmed.md";
  config.hotkeys.open = "Ctrl+Alt+K";

  const parsed = parseConfigText(serializeConfig(config));
  assert.deepEqual(parsed.problems, []);
  assert.equal(parsed.config.storage.notes_dir, 'C:\\Märkmed\\"eriline"');
  assert.equal(parsed.config.storage.note_mode, "single-file");
  assert.equal(parsed.config.storage.single_file, "Kõik märkmed.md");
  assert.equal(parsed.config.hotkeys.open, "Ctrl+Alt+K");
});