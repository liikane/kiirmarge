import assert from "node:assert/strict";
import { test } from "node:test";

import { buildFilename, formatDateTime, withCounter } from "./filename.ts";

const MOMENT = new Date(2026, 6, 14, 20, 31, 5);

test("formatDateTime: ajamallid ja nullid", () => {
  assert.equal(formatDateTime(MOMENT, "YYYY-MM-DD-HHmmss"), "2026-07-14-203105");
  assert.equal(formatDateTime(MOMENT, "DD.MM.YYYY HH:mm:ss"), "14.07.2026 20:31:05");
  assert.equal(formatDateTime(new Date(2026, 0, 5, 9, 7, 3), "YYYY-MM-DD-HHmmss"), "2026-01-05-090703");
});

test("formatDateTime: mall ilma ajamallideta jääb puutumata", () => {
  assert.equal(formatDateTime(MOMENT, "märge"), "märge");
});

test("buildFilename", () => {
  assert.equal(buildFilename("YYYY-MM-DD-HHmmss.md", MOMENT), "2026-07-14-203105.md");
});

test("withCounter lisab numbri enne laiendit", () => {
  assert.equal(withCounter("2026-07-14-203105.md", 1), "2026-07-14-203105.md");
  assert.equal(withCounter("2026-07-14-203105.md", 2), "2026-07-14-203105-2.md");
  assert.equal(withCounter("2026-07-14-203105.md", 12), "2026-07-14-203105-12.md");
  assert.equal(withCounter("ilma-laiendita", 2), "ilma-laiendita-2");
});