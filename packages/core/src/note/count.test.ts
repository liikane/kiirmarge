import assert from "node:assert/strict";
import { test } from "node:test";

import { countText } from "./count.ts";

test("tühi tekst annab nullid", () => {
  assert.deepEqual(countText(""), { words: 0, characters: 0 });
});

test("üks sõna", () => {
  assert.deepEqual(countText("tere"), { words: 1, characters: 4 });
});

test("mitu sõna", () => {
  assert.deepEqual(countText("tere maailm"), { words: 2, characters: 11 });
});

test("reavahetused ja korduvad tühikud", () => {
  assert.deepEqual(countText("esimene\n\n  teine   kolmas"), { words: 3, characters: 25 });
});

test("ainult tühikud — sõnu pole, tähemärgid loetakse", () => {
  assert.deepEqual(countText("   \n  "), { words: 0, characters: 6 });
});

test("täpitähed loetakse ühe tähemärgina", () => {
  assert.deepEqual(countText("õun ää"), { words: 2, characters: 6 });
});

test("emoji loetakse ühe koodipunktina", () => {
  assert.deepEqual(countText("🙂"), { words: 1, characters: 1 });
});
