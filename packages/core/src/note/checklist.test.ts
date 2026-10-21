import assert from "node:assert/strict";
import { test } from "node:test";

import { continueChecklist, insertCheckbox, isChecklistLine } from "./checklist.ts";

test("tühjale tekstile lisab märkeruudu", () => {
  const edit = insertCheckbox("", 0, 0);
  assert.equal(edit.text, "- [ ] ");
  assert.equal(edit.start, 6);
  assert.equal(edit.end, 6);
});

test("olemasolevale reale lisab märkeruudu rea algusesse", () => {
  const edit = insertCheckbox("tere", 4, 4);
  assert.equal(edit.text, "- [ ] tere");
  assert.equal(edit.start, 6);
});

test("taane säilib", () => {
  const edit = insertCheckbox("  tere", 6, 6);
  assert.equal(edit.text, "  - [ ] tere");
  assert.equal(edit.start, 8);
});

test("juba olemasolev märkeruut jääb puutumata", () => {
  const value = "- [ ] tere";
  const edit = insertCheckbox(value, 3, 3);
  assert.deepEqual(edit, { text: value, start: 3, end: 3 });
});

test("mitme rea valik saab märkeruudud, tühjad ja olemasolevad jäävad", () => {
  const value = "esimene\nteine\n\n- [x] juba\nviimane";
  const end = value.indexOf("viimane") + 3;
  const edit = insertCheckbox(value, 0, end);
  assert.equal(edit.text, "- [ ] esimene\n- [ ] teine\n\n- [x] juba\n- [ ] viimane");
  assert.equal(edit.start, 0);
  assert.equal(edit.end, edit.text.length);
});

test("valik, mis lõpeb rea alguses, ei haara järgmist rida", () => {
  const value = "esimene\nteine";
  const edit = insertCheckbox(value, 0, 8);
  assert.equal(edit.text, "- [ ] esimene\nteine");
});

test("märkeruudu rea tuvastus", () => {
  assert.equal(isChecklistLine("- [ ] tere"), true);
  assert.equal(isChecklistLine("  - [x] tehtud"), true);
  assert.equal(isChecklistLine("- tere"), false);
  assert.equal(isChecklistLine("[-] tere"), false);
});

test("Ctrl+Enter jätkab märkeruutude loendit", () => {
  const value = "- [ ] esimene";
  const edit = continueChecklist(value, value.length);
  assert.equal(edit?.text, "- [ ] esimene\n- [ ] ");
  assert.equal(edit?.start, value.length + 7);
});

test("loendi jätkamine säilitab taande", () => {
  const value = "  - [ ] x";
  const edit = continueChecklist(value, value.length);
  assert.equal(edit?.text, "  - [ ] x\n  - [ ] ");
});

test("tehtud märkeruut jätkub uue tühja märkeruuduga", () => {
  const value = "- [x] tehtud";
  const edit = continueChecklist(value, value.length);
  assert.equal(edit?.text, "- [x] tehtud\n- [ ] ");
});

test("tavaline rida loendit ei jätka", () => {
  assert.equal(continueChecklist("lihtsalt tekst", 15), null);
  assert.equal(continueChecklist("- [ ] ", 0), null);
});
