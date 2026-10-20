import assert from "node:assert/strict";
import { test } from "node:test";

import { discardNote } from "./discard-note.ts";

test("tühistamine ei kirjuta midagi", () => {
  assert.deepEqual(discardNote(), { discarded: true });
});