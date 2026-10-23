import { parse } from "smol-toml";

import { formatHotkey, hotkeyEquals, parseHotkey, type Hotkey } from "../hotkey/parse.ts";
import { DEFAULT_CONFIG, DEFAULT_CONFIG_TOML, cloneConfig } from "./defaults.ts";
import type { HotkeysConfig, KiirmargeConfig } from "./types.ts";
import {
  AFTER_SAVE,
  datetimeFormatError,
  filenameFormatError,
  hotkeyFieldError,

  LINK_STYLES,
  MODES,
  NOTE_MODES,
  singleFileError,
  THEMES,
} from "./validate.ts";

/** Üks leid seadistuse lugemisel. */
export interface ConfigProblem {
  /** Väli kujul "general.mode" või "(kogu fail)". */
  field: string;
  /** Inimloetav selgitus. */
  message: string;
  /** Väärtus, mis tegelikult kasutusele võeti. */
  usedDefault?: unknown;
}

export interface ParsedConfig {
  config: KiirmargeConfig;
  problems: ConfigProblem[];
}

/** Esmakäivitusel loodava config.toml sisu. */
export function createDefaultConfigText(): string {
  return DEFAULT_CONFIG_TOML;
}

/** Lubatud võtmed sektsioonide kaupa — tundmatu võti antakse teada. */
const KNOWN_KEYS: Record<string, readonly string[]> = {
  general: ["mode", "theme", "always_on_top", "autostart", "after_save"],
  storage: [
    "vault",
    "notes_dir",
    "attachments_dir",
    "default_to_desktop",
    "link_style",
    "filename_format",
    "datetime_format",
    "note_mode",
    "single_file",
  ],
  hotkeys: ["open", "save", "close", "screenshot"],
};

interface Reader {
  problems: ConfigProblem[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sectionOf(raw: Record<string, unknown>, name: string): Record<string, unknown> {
  const value = raw[name];
  return isPlainObject(value) ? value : {};
}

function typeName(value: unknown): string {
  if (value === null) return "tühi väärtus";
  if (Array.isArray(value)) return "massiiv";
  switch (typeof value) {
    case "string":
      return "tekst";
    case "number":
      return "arv";
    case "boolean":
      return "tõeväärtus";
    case "object":
      return "tabel";
    default:
      return typeof value;
  }
}

function readString(
  source: Record<string, unknown>,
  key: string,
  field: string,
  fallback: string,
  reader: Reader,
  check?: (value: string) => string | null,
): string {
  const value = source[key];
  if (value === undefined) return fallback;
  if (typeof value !== "string") {
    reader.problems.push({
      field,
      message: `Oodatud oli tekst, leiti ${typeName(value)}. Kasutan vaikeväärtust.`,
      usedDefault: fallback,
    });
    return fallback;
  }
  const error = check ? check(value) : null;
  if (error !== null) {
    reader.problems.push({ field, message: `${error} Kasutan vaikeväärtust.`, usedDefault: fallback });
    return fallback;
  }
  return value;
}

function readBoolean(
  source: Record<string, unknown>,
  key: string,
  field: string,
  fallback: boolean,
  reader: Reader,
): boolean {
  const value = source[key];
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") {
    reader.problems.push({
      field,
      message: `Oodatud oli tõeväärtus (true/false), leiti ${typeName(value)}. Kasutan vaikeväärtust.`,
      usedDefault: fallback,
    });
    return fallback;
  }
  return value;
}

function readEnum<T extends string>(
  source: Record<string, unknown>,
  key: string,
  field: string,
  fallback: T,
  allowed: readonly T[],
  reader: Reader,
): T {
  const value = source[key];
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    const options = allowed.map((option) => `"${option}"`).join(", ");
    reader.problems.push({
      field,
      message: `Lubatud on ${options}; leiti ${typeName(value)}. Kasutan vaikeväärtust.`,
      usedDefault: fallback,
    });
    return fallback;
  }
  return value as T;
}

function reportUnknown(raw: Record<string, unknown>, reader: Reader): void {
  for (const [name, value] of Object.entries(raw)) {
    const known = KNOWN_KEYS[name];
    if (!known) {
      reader.problems.push({ field: name, message: "Tundmatu sektsioon — jäeti tähelepanuta." });
      continue;
    }
    if (!isPlainObject(value)) {
      reader.problems.push({
        field: name,
        message: `Sektsioon peab olema tabel, leiti ${typeName(value)} — jäeti tähelepanuta.`,
      });
      continue;
    }
    for (const key of Object.keys(value)) {
      if (!known.includes(key)) {
        reader.problems.push({ field: `${name}.${key}`, message: "Tundmatu väli — jäeti tähelepanuta." });
      }
    }
  }
}

function reportHotkeyConflicts(hotkeys: HotkeysConfig, reader: Reader): void {
  const entries: { name: string; value: string }[] = [
    { name: "open", value: hotkeys.open },
    { name: "save", value: hotkeys.save },
    { name: "close", value: hotkeys.close },
    { name: "screenshot", value: hotkeys.screenshot },
  ];
  const seen: { name: string; hotkey: Hotkey }[] = [];
  for (const entry of entries) {
    if (entry.value.trim() === "") continue;
    const parsed = parseHotkey(entry.value);
    if (parsed === null) continue; // vigasusest on juba eraldi teada antud
    const clash = seen.find((other) => hotkeyEquals(other.hotkey, parsed));
    if (clash) {
      reader.problems.push({
        field: `hotkeys.${entry.name}`,
        message: `Sama kombinatsioon on juba väljal hotkeys.${clash.name} (${formatHotkey(parsed)}).`,
      });
    } else {
      seen.push({ name: entry.name, hotkey: parsed });
    }
  }
}

/**
 * Loeb config.toml teksti. Vigaste väärtuste korral kasutatakse vaikeväärtusi
 * ja iga asendus kirjeldatakse problems-loendis. Funktsioon ei viska erandit —
 * seadistuse viga ei tohi rakendust maha jooksutada.
 */
export function parseConfigText(text: string): ParsedConfig {
  const reader: Reader = { problems: [] };

  let parsedRaw: unknown;
  try {
    parsedRaw = parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    reader.problems.push({
      field: "(kogu fail)",
      message: `TOML-i lugemine ebaõnnestus: ${message} Kasutan vaikeväärtusi.`,
    });
    return { config: cloneConfig(DEFAULT_CONFIG), problems: reader.problems };
  }

  if (!isPlainObject(parsedRaw)) {
    reader.problems.push({
      field: "(kogu fail)",
      message: "Seadistuse juur peab olema TOML-tabel. Kasutan vaikeväärtusi.",
    });
    return { config: cloneConfig(DEFAULT_CONFIG), problems: reader.problems };
  }

  reportUnknown(parsedRaw, reader);

  const defaults = DEFAULT_CONFIG;
  const general = sectionOf(parsedRaw, "general");
  const storage = sectionOf(parsedRaw, "storage");
  const hotkeys = sectionOf(parsedRaw, "hotkeys");

  const mode = readEnum(general, "mode", "general.mode", defaults.general.mode, MODES, reader);
  const theme = readEnum(general, "theme", "general.theme", defaults.general.theme, THEMES, reader);
  const alwaysOnTop = readBoolean(
    general,
    "always_on_top",
    "general.always_on_top",
    defaults.general.always_on_top,
    reader,
  );
  const autostart = readBoolean(
    general,
    "autostart",
    "general.autostart",
    defaults.general.autostart,
    reader,
  );
  const afterSave = readEnum(
    general,
    "after_save",
    "general.after_save",
    defaults.general.after_save,
    AFTER_SAVE,
    reader,
  );

  const vault = readString(storage, "vault", "storage.vault", defaults.storage.vault, reader);
  const notesDir = readString(
    storage,
    "notes_dir",
    "storage.notes_dir",
    defaults.storage.notes_dir,
    reader,
    (value) => (value.trim() === "" ? "Tee ei tohi olla tühi." : null),
  );
  const attachmentsDir = readString(
    storage,
    "attachments_dir",
    "storage.attachments_dir",
    defaults.storage.attachments_dir,
    reader,
  );
  const defaultToDesktop = readBoolean(
    storage,
    "default_to_desktop",
    "storage.default_to_desktop",
    defaults.storage.default_to_desktop,
    reader,
  );
  const linkStyle = readEnum(
    storage,
    "link_style",
    "storage.link_style",
    defaults.storage.link_style,
    LINK_STYLES,
    reader,
  );
  const filenameFormat = readString(
    storage,
    "filename_format",
    "storage.filename_format",
    defaults.storage.filename_format,
    reader,
    filenameFormatError,
  );
  const datetimeFormat = readString(
    storage,
    "datetime_format",
    "storage.datetime_format",
    defaults.storage.datetime_format,
    reader,
    datetimeFormatError,
  );
  const noteMode = readEnum(
    storage,
    "note_mode",
    "storage.note_mode",
    defaults.storage.note_mode,
    NOTE_MODES,
    reader,
  );
  const singleFile = readString(
    storage,
    "single_file",
    "storage.single_file",
    defaults.storage.single_file,
    reader,
    singleFileError,
  );

  const hotkeysConfig: HotkeysConfig = {
    open: readString(hotkeys, "open", "hotkeys.open", defaults.hotkeys.open, reader, (value) =>
      hotkeyFieldError(value, false),
    ),
    save: readString(hotkeys, "save", "hotkeys.save", defaults.hotkeys.save, reader, (value) =>
      hotkeyFieldError(value, false, true),
    ),
    close: readString(hotkeys, "close", "hotkeys.close", defaults.hotkeys.close, reader, (value) =>
      hotkeyFieldError(value, false, true),
    ),
    screenshot: readString(
      hotkeys,
      "screenshot",
      "hotkeys.screenshot",
      defaults.hotkeys.screenshot,
      reader,
      (value) => hotkeyFieldError(value, true),
    ),
  };

  if (mode === "obsidian" && vault.trim() === "") {
    reader.problems.push({
      field: "storage.vault",
      message:
        'Režiim on "obsidian", kuid storage.vault on tühi — märkmeid ei saa enne salvestada, kui vault on seatud.',
    });
  }

  reportHotkeyConflicts(hotkeysConfig, reader);

  const config: KiirmargeConfig = {
    general: { mode, theme, always_on_top: alwaysOnTop, autostart, after_save: afterSave },
    storage: {
      vault,
      notes_dir: notesDir,
      attachments_dir: attachmentsDir,
      default_to_desktop: defaultToDesktop,
      link_style: linkStyle,
      filename_format: filenameFormat,
      datetime_format: datetimeFormat,
      note_mode: noteMode,
      single_file: singleFile,
    },
    hotkeys: hotkeysConfig,
  };

  return { config, problems: reader.problems };
}