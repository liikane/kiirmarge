import type { KiirmargeConfig } from "../config/types.ts";
import { buildFilename, withCounter } from "../note/filename.ts";
import { composeNoteAppend, composeNoteMarkdown } from "../note/markdown.ts";
import type { Clock } from "../ports/clock.ts";
import type { NoteStore } from "../ports/note-store.ts";

export interface SaveNoteDeps {
  clock: Clock;
  noteStore: NoteStore;
  config: KiirmargeConfig;
}

export type SaveNoteResult =
  | { ok: true; filename: string; path: string; content: string; createdAt: Date }
  | { ok: false; error: string };

const MAX_NAME_ATTEMPTS = 100;

/**
 * Mustand -> fail.
 *
 * - `note_mode = "per-note"`: iga märge omaette faili, nimekonflikti korral `-2`, `-3`, ...
 * - `note_mode = "single-file"`: kõik märkmed lähevad ühte faili, iga märge lisatakse lõppu.
 *
 * Tühi mustand jäetakse salvestamata. NB: olemasolukontroll ei ole päris
 * võidujooksukindel — päris adapter peab kirjutama aatomiliselt.
 */
export async function saveNote(draft: string, deps: SaveNoteDeps): Promise<SaveNoteResult> {
  const text = draft.trim();
  if (text === "") {
    return { ok: false, error: "Märge on tühi — midagi ei salvestatud." };
  }

  const createdAt = deps.clock.now();

  try {
    if (deps.config.storage.note_mode === "single-file") {
      const filename = deps.config.storage.single_file;
      const exists = await deps.noteStore.exists(filename);
      const section = composeNoteAppend(text, createdAt, deps.config);
      const content = exists ? section : `# Kiirmärkmed\n${section}`;
      const path = await deps.noteStore.save(filename, content, { append: exists });
      return { ok: true, filename, path, content, createdAt };
    }

    const base = buildFilename(deps.config.storage.filename_format, createdAt);
    const content = composeNoteMarkdown(text, createdAt, deps.config);
    for (let attempt = 1; attempt <= MAX_NAME_ATTEMPTS; attempt += 1) {
      const filename = withCounter(base, attempt);
      if (await deps.noteStore.exists(filename)) continue;
      const path = await deps.noteStore.save(filename, content);
      return { ok: true, filename, path, content, createdAt };
    }
    return {
      ok: false,
      error: `Failinimele ${base} ei leidnud vaba nime (${MAX_NAME_ATTEMPTS} katset).`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Salvestamine ebaõnnestus: ${message}` };
  }
}