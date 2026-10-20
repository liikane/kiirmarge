import assert from "node:assert/strict";
import { test } from "node:test";

import { parseObsidianVaults } from "./obsidian.ts";

function sample(): string {
  return JSON.stringify({
    vaults: {
      bbb: { path: "C:\\Obs\\B", ts: 200 },
      aaa: { path: "C:\\Obs\\A", ts: 100, open: true },
    },
    cli: true,
  });
}

test("loeb vaultid ja paneb avatud vaulti ette", () => {
  const vaults = parseObsidianVaults(sample());
  assert.equal(vaults.length, 2);
  assert.deepEqual(
    vaults.map((vault) => vault.path),
    ["C:\\Obs\\A", "C:\\Obs\\B"],
  );
  assert.equal(vaults[0]?.name, "A");
  assert.equal(vaults[0]?.open, true);
  assert.equal(vaults[0]?.id, "aaa");
  assert.equal(vaults[1]?.open, false);
  assert.equal(vaults[1]?.timestamp, 200);
});

test("uuem ajatempel tuleb enne, kui avatud vaulti pole", () => {
  const text = JSON.stringify({
    vaults: {
      vana: { path: "C:\\Obs\\Vana", ts: 100 },
      uus: { path: "C:\\Obs\\Uus", ts: 300 },
    },
  });
  assert.deepEqual(
    parseObsidianVaults(text).map((vault) => vault.name),
    ["Uus", "Vana"],
  );
});

test("vigane JSON annab tühja loendi", () => {
  assert.deepEqual(parseObsidianVaults("{ see ei ole json"), []);
});

test("puuduv või vale tüübiga vaults annab tühja loendi", () => {
  assert.deepEqual(parseObsidianVaults('{"cli":true}'), []);
  assert.deepEqual(parseObsidianVaults('{"vaults":[]}'), []);
  assert.deepEqual(parseObsidianVaults('{"vaults":"x"}'), []);
  assert.deepEqual(parseObsidianVaults("null"), []);
});

test("vahele jäävad kirjed ilma teeta või tühja teega", () => {
  const text = JSON.stringify({
    vaults: {
      ilma: { ts: 1 },
      tuhi: { path: "   " },
      ok: { path: "C:\\Obs\\Ok" },
    },
  });
  const vaults = parseObsidianVaults(text);
  assert.equal(vaults.length, 1);
  assert.equal(vaults[0]?.path, "C:\\Obs\\Ok");
  assert.equal(vaults[0]?.timestamp, 0);
});
