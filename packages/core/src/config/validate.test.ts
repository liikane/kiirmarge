import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_CONFIG } from "./defaults.ts";
import {
  datetimeFormatError,
  filenameFormatError,
  hotkeyFieldError,
  isLinkStyle,
  isMode,
  isNoteMode,
  isTheme,
  singleFileError,
} from "./validate.ts";

test("filenameFormatError", () => {
  assert.equal(filenameFormatError("YYYY-MM-DD-HHmmss.md"), null);
  assert.notEqual(filenameFormatError(""), null);
  assert.notEqual(filenameFormatError("märge.md"), null);
  assert.notEqual(filenameFormatError("2026/07/14.md"), null);
  assert.notEqual(filenameFormatError("YYYY-MM-DD-HHmmss.txt"), null);
});

test("datetimeFormatError", () => {
  assert.equal(datetimeFormatError("YYYY-MM-DD HH:mm"), null);
  assert.notEqual(datetimeFormatError(""), null);
  assert.notEqual(datetimeFormatError("kuupäev"), null);
  assert.notEqual(datetimeFormatError("YYYY\nMM"), null);
});

test("singleFileError", () => {
  assert.equal(singleFileError("Kiirmärkmed.md"), null);
  assert.notEqual(singleFileError(""), null);
  assert.notEqual(singleFileError("märkmed.txt"), null);
  assert.notEqual(singleFileError("alam/märkmed.md"), null);
  assert.notEqual(singleFileError("..\\märkmed.md"), null);
  assert.equal(isNoteMode("single-file"), true);
  assert.equal(isNoteMode("daily-note"), true);
  assert.equal(isNoteMode("kokku"), false);
});

test("hotkeyFieldError: valikuline tühi väli", () => {
  assert.equal(hotkeyFieldError("", true), null);
  assert.notEqual(hotkeyFieldError("", false), null);
  assert.equal(hotkeyFieldError("Ctrl+Alt+N"), null);
  assert.notEqual(hotkeyFieldError("Ctrl"), null);
});

test("vaikeväärtused läbivad omaenda kontrolli", () => {
  assert.equal(filenameFormatError(DEFAULT_CONFIG.storage.filename_format), null);
  assert.equal(datetimeFormatError(DEFAULT_CONFIG.storage.datetime_format), null);
  assert.equal(hotkeyFieldError(DEFAULT_CONFIG.hotkeys.open, false), null);
  assert.equal(hotkeyFieldError(DEFAULT_CONFIG.hotkeys.save, false, true), null);
  assert.equal(hotkeyFieldError(DEFAULT_CONFIG.hotkeys.close, false, true), null);
  assert.equal(hotkeyFieldError("Enter", false, true), null);
  assert.notEqual(hotkeyFieldError("Enter", false, false), null, "globaalne kiirklahv nõuab muuteklahvi");
  assert.equal(hotkeyFieldError(DEFAULT_CONFIG.hotkeys.screenshot, true), null);
  assert.equal(isMode(DEFAULT_CONFIG.general.mode), true);
  assert.equal(isTheme(DEFAULT_CONFIG.general.theme), true);
  assert.equal(isLinkStyle(DEFAULT_CONFIG.storage.link_style), true);
});