import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canonicalKey,
  formatHotkey,
  hotkeyEquals,
  hotkeyError,
  hotkeyMatches,
  parseHotkey,
  toAccelerator,
} from "./parse.ts";

test("hotkeyError: korrektsed kombinatsioonid", () => {
  const ok = [
    "Ctrl+Alt+N",
    "ctrl+alt+n",
    "Ctrl + Alt + N",
    "F9",
    "Esc",
    "Ctrl+Shift+F12",
    "Meta+Space",
    "Win+N",
    "Ctrl+Shift+~",
  ];
  for (const input of ok) {
    assert.equal(hotkeyError(input), null, input);
  }
});

test("hotkeyError: vigased kombinatsioonid", () => {
  const bad = ["", "   ", "Ctrl", "Alt+Shift", "Ctrl+Ctrl+N", "N", "Ctrl+Alt+N+M", "Foo+N", "F25"];
  for (const input of bad) {
    assert.notEqual(hotkeyError(input), null, input);
  }
});

test("hotkeyError: teated on konkreetsed", () => {
  assert.match(String(hotkeyError("Ctrl+Ctrl+N")), /kordub/);
  assert.match(String(hotkeyError("Ctrl+Alt")), /Puudub põhiklavi/);
  assert.match(String(hotkeyError("N")), /ainult aknasiseselt/);
  assert.match(String(hotkeyError("Foo")), /Tundmatu klahv/);
});

test("parseHotkey ja formatHotkey: kanooniline kuju", () => {
  const hk = parseHotkey("ctrl + alt + n");
  assert.deepEqual(hk, { ctrl: true, alt: true, shift: false, meta: false, key: "N" });
  if (hk === null) return;
  assert.equal(formatHotkey(hk), "Ctrl+Alt+N");
  const meta = parseHotkey("win+space");
  if (meta === null) return;
  assert.equal(formatHotkey(meta), "Meta+Space");
  const bare = parseHotkey("N");
  assert.equal(bare?.key, "N");
  assert.notEqual(hotkeyError("N"), null, "globaalseks kiirklahviks on üksikklahv keelatud");
  assert.equal(parseHotkey(""), null);
});

test("hotkeyError: allowBare lubab üksikklahvi (aknasisesed klahvid)", () => {
  assert.equal(hotkeyError("Enter", { allowBare: true }), null);
  assert.notEqual(hotkeyError("Enter"), null);
  assert.equal(hotkeyError("Ctrl+Enter", { allowBare: true }), null);
});

test("tilde: parse, format, accelerator", () => {
  const tilde = parseHotkey("Ctrl+Shift+~");
  assert.notEqual(tilde, null);
  if (tilde === null) return;
  assert.equal(formatHotkey(tilde), "Ctrl+Shift+~");
  assert.equal(toAccelerator(tilde), "ctrl+shift+backquote");
  assert.equal(hotkeyMatches(tilde, { ctrlKey: true, altKey: false, shiftKey: true, metaKey: false, key: "~" }), true);
  assert.equal(canonicalKey("`"), "~");
  assert.equal(canonicalKey("backquote"), "~");
});

test("caron-kuju ˇ loetakse samaks klahviks nagu ~", () => {
  const caron = parseHotkey("Ctrl+Shift+ˇ");
  assert.notEqual(caron, null);
  if (caron === null) return;
  assert.equal(formatHotkey(caron), "Ctrl+Shift+~");
  assert.equal(toAccelerator(caron), "ctrl+shift+backquote");
  assert.equal(canonicalKey("ˇ"), "~");
});



test("hotkeyMatches: üksikklahv Enter (Enter salvestab, Ctrl+Enter uus rida)", () => {
  const enter = parseHotkey("Enter");
  assert.notEqual(enter, null);
  if (enter === null) return;
  assert.equal(
    hotkeyMatches(enter, { ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, key: "Enter" }),
    true,
  );
  assert.equal(
    hotkeyMatches(enter, { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false, key: "Enter" }),
    false,
  );
  assert.equal(hotkeyError("Enter", { allowBare: true }), null);
});
test("canonicalKey", () => {
  assert.equal(canonicalKey("esc"), "Esc");
  assert.equal(canonicalKey("F9"), "F9");
  assert.equal(canonicalKey("f24"), "F24");
  assert.equal(canonicalKey("f25"), null);
  assert.equal(canonicalKey("a"), "A");
  assert.equal(canonicalKey("5"), "5");
  assert.equal(canonicalKey("õ"), null);
  assert.equal(canonicalKey("enter"), "Enter");
});

test("hotkeyEquals", () => {
  const a = parseHotkey("Ctrl+Alt+N");
  const b = parseHotkey("ctrl+alt+n");
  const c = parseHotkey("Ctrl+Alt+M");
  if (a === null || b === null || c === null) return;
  assert.equal(hotkeyEquals(a, b), true);
  assert.equal(hotkeyEquals(a, c), false);
});

test("hotkeyMatches: veebisündmus", () => {
  const save = parseHotkey("Ctrl+S");
  if (save === null) return;
  assert.equal(hotkeyMatches(save, { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false, key: "s" }), true);
  assert.equal(hotkeyMatches(save, { ctrlKey: true, altKey: true, shiftKey: false, metaKey: false, key: "s" }), false);
  assert.equal(hotkeyMatches(save, { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false, key: "x" }), false);
  const open = parseHotkey("Meta+Space");
  if (open === null) return;
  assert.equal(hotkeyMatches(open, { ctrlKey: false, altKey: false, shiftKey: false, metaKey: true, key: " " }), true);
});

test("toAccelerator: Tauri kuju", () => {
  const cases: [string, string][] = [
    ["Ctrl+Alt+N", "ctrl+alt+n"],
    ["F9", "f9"],
    ["Esc", "escape"],
    ["Meta+Space", "super+space"],
    ["Ctrl+Shift+PageUp", "ctrl+shift+pageup"],
  ];
  for (const [input, expected] of cases) {
    const hk = parseHotkey(input);
    if (hk === null) return;
    assert.equal(toAccelerator(hk), expected, input);
  }
});