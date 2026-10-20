import assert from "node:assert/strict";
import { test } from "node:test";

import { cloneConfig, DEFAULT_CONFIG } from "../config/defaults.ts";
import type { Clock } from "../ports/clock.ts";
import type { NoteStore, SaveOptions } from "../ports/note-store.ts";
import { saveNote } from "./save-note.ts";

const MOMENT = new Date(2026, 6, 14, 20, 31, 5);

function fixedClock(): Clock {
  return { now: () => new Date(MOMENT) };
}

interface FakeNoteStore extends NoteStore {
  contents: Map<string, string>;
  writes: { path: string; content: string; append: boolean }[];
  existsCalls: number;
}

function fakeNoteStore(options: { existing?: string[]; failWith?: string } = {}): FakeNoteStore {
  const contents = new Map<string, string>();
  for (const name of options.existing ?? []) contents.set(name, "varasem\n");
  const writes: { path: string; content: string; append: boolean }[] = [];
  const store: FakeNoteStore = {
    contents,
    writes,
    existsCalls: 0,
    async exists(relativePath) {
      store.existsCalls += 1;
      return contents.has(relativePath);
    },
    async save(relativePath, content, saveOptions?: SaveOptions) {
      if (options.failWith !== undefined) throw new Error(options.failWith);
      const append = saveOptions?.append === true && contents.has(relativePath);
      writes.push({ path: relativePath, content, append });
      contents.set(relativePath, append ? (contents.get(relativePath) ?? "") + content : content);
      return "C:/märkmed/" + relativePath;
    },
  };
  return store;
}

test("per-note: salvestab märkme ajatempliga failinimesse", async () => {
  const noteStore = fakeNoteStore();
  const result = await saveNote("  Tere, maailm.  ", { clock: fixedClock(), noteStore, config: DEFAULT_CONFIG });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.filename, "2026-07-14-203105.md");
  assert.equal(result.path, "C:/märkmed/2026-07-14-203105.md");
  assert.equal(result.content, "# Kiirmärge\n\n**2026-07-14 20:31**\n\nTere, maailm.\n");
  assert.equal(noteStore.writes.length, 1);
  assert.equal(noteStore.writes[0]?.append, false);
  assert.equal(noteStore.existsCalls, 1);
});

test("per-note: tühi mustand jäetakse salvestamata", async () => {
  const noteStore = fakeNoteStore();
  const result = await saveNote("   \n\t ", { clock: fixedClock(), noteStore, config: DEFAULT_CONFIG });
  assert.equal(result.ok, false);
  assert.equal(noteStore.writes.length, 0);
  assert.equal(noteStore.existsCalls, 0);
});

test("per-note: nimekonflikt lisab järjekorranumbri", async () => {
  const noteStore = fakeNoteStore({ existing: ["2026-07-14-203105.md", "2026-07-14-203105-2.md"] });
  const result = await saveNote("teine", { clock: fixedClock(), noteStore, config: DEFAULT_CONFIG });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.filename, "2026-07-14-203105-3.md");
  assert.equal(noteStore.writes.length, 1);
});

test("per-note: salvestusviga antakse edasi arusaadava teatega", async () => {
  const noteStore = fakeNoteStore({ failWith: "ketas on täis" });
  const result = await saveNote("tere", { clock: fixedClock(), noteStore, config: DEFAULT_CONFIG });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /Salvestamine ebaõnnestus/);
  assert.match(result.error, /ketas on täis/);
});

test("single-file: esimene märge loob faili pealkirjaga", async () => {
  const config = cloneConfig(DEFAULT_CONFIG);
  config.storage.note_mode = "single-file";
  config.storage.single_file = "Kiirmärkmed.md";
  const noteStore = fakeNoteStore();

  const result = await saveNote("Esimene", { clock: fixedClock(), noteStore, config });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.filename, "Kiirmärkmed.md");
  assert.equal(
    noteStore.contents.get("Kiirmärkmed.md"),
    "# Kiirmärkmed\n\n---\n\n## 2026-07-14 20:31\n\nEsimene\n",
  );
  assert.equal(noteStore.writes[0]?.append, false);
});

test("single-file: teine märge lisatakse lõppu, pealkirja ei korrata", async () => {
  const config = cloneConfig(DEFAULT_CONFIG);
  config.storage.note_mode = "single-file";
  const noteStore = fakeNoteStore({ existing: ["Kiirmärkmed.md"] });

  const result = await saveNote("Teine", { clock: fixedClock(), noteStore, config });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.content, "\n---\n\n## 2026-07-14 20:31\n\nTeine\n");
  assert.equal(noteStore.writes[0]?.append, true);
  assert.equal(noteStore.contents.get("Kiirmärkmed.md"), "varasem\n\n---\n\n## 2026-07-14 20:31\n\nTeine\n");
});