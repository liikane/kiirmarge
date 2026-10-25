import assert from "node:assert/strict";
import { test } from "node:test";

import { cloneConfig, DEFAULT_CONFIG } from "../config/defaults.ts";
import { baseName, isAbsolutePath, joinPath, resolveNotesDir } from "./resolve.ts";

const BASE = { documents: "C:\\Users\\lauri\\Documents", desktop: "C:\\Users\\lauri\\Desktop" };

test("isAbsolutePath", () => {
  assert.equal(isAbsolutePath("C:\\Kiirmärkmed"), true);
  assert.equal(isAbsolutePath("C:/Kiirmärkmed"), true);
  assert.equal(isAbsolutePath("\\\\server\\share"), true);
  assert.equal(isAbsolutePath("/home/lauri"), true);
  assert.equal(isAbsolutePath("Kiirmärkmed"), false);
  assert.equal(isAbsolutePath("Kiirmärkmed\\alam"), false);
});

test("joinPath: Windows ja POSIX", () => {
  assert.equal(joinPath("C:\\a", "b"), "C:\\a\\b");
  assert.equal(joinPath("C:\\a\\", "\\b\\"), "C:\\a\\b");
  assert.equal(joinPath("/home/lauri", "märkmed"), "/home/lauri/märkmed");
  assert.equal(joinPath("C:\\a", ""), "C:\\a");
});

test("baseName", () => {
  assert.equal(baseName("C:\\Users\\lauri\\Kiirmärkmed"), "Kiirmärkmed");
  assert.equal(baseName("Kiirmärkmed/manused"), "manused");
  assert.equal(baseName(""), "");
});

test("tavaline režiim: Dokumendid + notes_dir", () => {
  assert.equal(resolveNotesDir(DEFAULT_CONFIG, BASE), "C:\\Users\\lauri\\Documents\\Kiirmärkmed");
});

test("absoluutne notes_dir võidab aluskausta", () => {
  const config = cloneConfig(DEFAULT_CONFIG);
  config.storage.notes_dir = "D:\\Märkmed";
  assert.equal(resolveNotesDir(config, BASE), "D:\\Märkmed");
});

test("töölaud", () => {
  const config = cloneConfig(DEFAULT_CONFIG);
  config.storage.default_to_desktop = true;
  assert.equal(resolveNotesDir(config, BASE), "C:\\Users\\lauri\\Desktop\\Kiirmärkmed");
});

test("obsidian: vault + notes_dir", () => {
  const config = cloneConfig(DEFAULT_CONFIG);
  config.general.mode = "obsidian";
  config.storage.vault = "C:\\Obs\\Lauri_2026";
  assert.equal(resolveNotesDir(config, BASE), "C:\\Obs\\Lauri_2026\\Kiirmärkmed");
});

test("obsidian ilma vaultita langeb tagasi Dokumentidesse", () => {
  const config = cloneConfig(DEFAULT_CONFIG);
  config.general.mode = "obsidian";
  config.storage.vault = "";
  assert.equal(resolveNotesDir(config, BASE), "C:\\Users\\lauri\\Documents\\Kiirmärkmed");
});

test("obsidian: vault võidab töölaua-eelistuse", () => {
  const config = cloneConfig(DEFAULT_CONFIG);
  config.general.mode = "obsidian";
  config.storage.vault = "C:\\Obs\\Lauri_2026";
  config.storage.default_to_desktop = true;
  assert.equal(resolveNotesDir(config, BASE), "C:\\Obs\\Lauri_2026\\Kiirmärkmed");
});

test("obsidian ilma vaultita + töölaud: märkmed lähevad töölauale", () => {
  const config = cloneConfig(DEFAULT_CONFIG);
  config.general.mode = "obsidian";
  config.storage.vault = "";
  config.storage.default_to_desktop = true;
  assert.equal(resolveNotesDir(config, BASE), "C:\\Users\\lauri\\Desktop\\Kiirmärkmed");
});