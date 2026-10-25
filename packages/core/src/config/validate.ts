// Seadistuse väljade valideerimine. Iga funktsioon tagastab veateate või null.

import { hotkeyError } from "../hotkey/parse.ts";
import type { AfterSave, LinkStyle, Mode, NoteMode, Theme } from "./types.ts";

export const THEMES: readonly Theme[] = ["dark", "light", "system"];
export const MODES: readonly Mode[] = ["standalone", "obsidian"];
export const LINK_STYLES: readonly LinkStyle[] = ["auto", "wiki", "markdown"];
export const NOTE_MODES: readonly NoteMode[] = ["per-note", "single-file", "daily-note"];
export const AFTER_SAVE: readonly AfterSave[] = ["stay", "confirm"];

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

export function isMode(value: unknown): value is Mode {
  return typeof value === "string" && (MODES as readonly string[]).includes(value);
}

export function isLinkStyle(value: unknown): value is LinkStyle {
  return typeof value === "string" && (LINK_STYLES as readonly string[]).includes(value);
}

/** Ajamallid, mida failinime- ja kuupäevavormingus toetatakse. */
const TOKEN_TEST_RE = /YYYY|MM|DD|HH|mm|ss/;
const ILLEGAL_FILENAME_RE = /[\\/:*?"<>|]/;

export function isNoteMode(value: unknown): value is NoteMode {
  return typeof value === "string" && (NOTE_MODES as readonly string[]).includes(value);
}

export function isAfterSave(value: unknown): value is AfterSave {
  return typeof value === "string" && (AFTER_SAVE as readonly string[]).includes(value);
}

/** Liitfaili nime kontroll: ainult failinimi, ilma tee ja keelatud märkideta. */
export function singleFileError(value: string): string | null {
  if (value.trim() === "") return "Failinimi on tühi.";
  if (/[\\/:*?"<>|]/.test(value)) {
    return 'Failinimes ei tohi olla märke \\ / : * ? " < > |.';
  }
  if (value.includes("..")) return "Failinimes ei tohi olla „..“.";
  if (!value.toLowerCase().endsWith(".md")) return "Failinimi peab lõppema .md-ga.";
  return null;
}

/** Failinime malli kontroll: mall peab olema turvaline ja sisaldama ajamalli. */
export function filenameFormatError(format: string): string | null {
  if (format.trim() === "") return "Failinimi on tühi.";
  if (ILLEGAL_FILENAME_RE.test(format)) {
    return 'Failinimes ei tohi olla märke \\ / : * ? " < > |.';
  }
  if (!TOKEN_TEST_RE.test(format)) {
    return "Failinimes peab olema vähemalt üks ajamall (YYYY, MM, DD, HH, mm, ss).";
  }
  if (!format.endsWith(".md")) return "Failinimi peab lõppema .md-ga.";
  return null;
}

/** Kuupäeva-kellaaja vormingu kontroll (kasutatakse märkme päises). */
export function datetimeFormatError(format: string): string | null {
  if (format.trim() === "") return "Kuupäeva vorming on tühi.";
  if (/[\r\n]/.test(format)) return "Kuupäeva vorming ei tohi sisaldada reavahetusi.";
  if (!TOKEN_TEST_RE.test(format)) {
    return "Vormingus peab olema vähemalt üks ajamall (YYYY, MM, DD, HH, mm, ss).";
  }
  return null;
}

/**
 * Kiirklahvi välja kontroll.
 * @param allowEmpty tühi väärtus on lubatud (nt pilt ekraanilt väljas)
 * @param allowBare  üksik klahv ilma muuteklahvita on lubatud (aknasisesed klahvid)
 */
export function hotkeyFieldError(value: string, allowEmpty = false, allowBare = false): string | null {
  if (value.trim() === "") {
    return allowEmpty ? null : "Kiirklahv on tühi.";
  }
  return hotkeyError(value, { allowBare });
}
