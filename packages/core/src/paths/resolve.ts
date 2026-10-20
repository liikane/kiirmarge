// Märkmete sihtkausta lahendamine. Puhas funktsioon — teed tulevad adapterist
// (Windows: Documents/Desktop, hiljem Linux/macOS samad mõisted).

import type { KiirmargeConfig } from "../config/types.ts";

/** Alusteede komplekt, mille adapter annab. */
export interface BasePaths {
  /** Kasutaja dokumentide kaust. */
  documents: string;
  /** Töölaud. */
  desktop: string;
}

const SEPARATOR = /[\\/]/;

/** Kas tee on absoluutne (Windows: C:\ või \\server, POSIX: /). */
export function isAbsolutePath(path: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(path) || path.startsWith("\\\\") || path.startsWith("/");
}

/** Kataloogide liitmine, säilitades baasi eraldaja stiili. */
export function joinPath(base: string, relative: string): string {
  const separator = base.includes("\\") ? "\\" : "/";
  const trimmedBase = base.replace(/[\\/]+$/, "");
  const trimmedRelative = relative.replace(/^[\\/]+/, "").replace(/[\\/]+$/, "");
  if (trimmedRelative === "") return trimmedBase === "" ? separator : trimmedBase;
  if (trimmedBase === "") return trimmedRelative;
  return trimmedBase + separator + trimmedRelative;
}

/** Viimane teeosa: "C:\a\b" -> "b". */
export function baseName(path: string): string {
  const parts = path.split(SEPARATOR).filter((part) => part !== "");
  return parts.length === 0 ? "" : String(parts[parts.length - 1]);
}

/**
 * Millisesse kausta märge salvestatakse.
 *
 * 1. `default_to_desktop = true` -> töölaud, kausta nimena `notes_dir` viimane osa
 * 2. absoluutne `notes_dir` -> kasutatakse täpselt nii
 * 3. `mode = "obsidian"` ja `vault` seatud -> vault + notes_dir
 * 4. muidu -> Dokumendid + notes_dir
 */
export function resolveNotesDir(config: KiirmargeConfig, base: BasePaths): string {
  const storage = config.storage;
  if (storage.default_to_desktop) {
    return joinPath(base.desktop, baseName(storage.notes_dir));
  }
  if (isAbsolutePath(storage.notes_dir)) {
    return storage.notes_dir;
  }
  if (config.general.mode === "obsidian" && storage.vault.trim() !== "") {
    return joinPath(storage.vault, storage.notes_dir);
  }
  return joinPath(base.documents, storage.notes_dir);
}