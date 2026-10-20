import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_CONFIG, DEFAULT_CONFIG_TOML } from "../config/defaults.ts";
import type { ConfigStore } from "../ports/config-store.ts";
import { loadConfig } from "./load-config.ts";

interface FakeConfigStore extends ConfigStore {
  writes: string[];
}

function fakeStore(text: string | null): FakeConfigStore {
  const writes: string[] = [];
  return {
    writes,
    async read() {
      return text;
    },
    async write(value: string) {
      writes.push(value);
    },
    describeLocation() {
      return "test/config.toml";
    },
  };
}

test("puuduv seadistus luuakse vaikeväärtustega", async () => {
  const store = fakeStore(null);
  const loaded = await loadConfig(store);
  assert.equal(loaded.created, true);
  assert.deepEqual(loaded.problems, []);
  assert.deepEqual(loaded.config, DEFAULT_CONFIG);
  assert.deepEqual(store.writes, [DEFAULT_CONFIG_TOML]);
});

test("olemasolevat seadistust ei kirjutata üle", async () => {
  const store = fakeStore("[general]\ntheme = \"light\"");
  const loaded = await loadConfig(store);
  assert.equal(loaded.created, false);
  assert.equal(loaded.config.general.theme, "light");
  assert.deepEqual(store.writes, []);
});

test("vigane seadistus: vaikeväärtused, probleemid ja fail jääb puutumata", async () => {
  const store = fakeStore("[general\n");
  const loaded = await loadConfig(store);
  assert.equal(loaded.created, false);
  assert.deepEqual(loaded.config, DEFAULT_CONFIG);
  assert.equal(loaded.problems.length, 1);
  assert.deepEqual(store.writes, []);
});