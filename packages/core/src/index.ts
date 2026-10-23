export { cloneConfig, DEFAULT_CONFIG, DEFAULT_CONFIG_TOML } from "./config/defaults.ts";
export { createDefaultConfigText, parseConfigText } from "./config/load.ts";
export { serializeConfig } from "./config/serialize.ts";
export type { ConfigProblem, ParsedConfig } from "./config/load.ts";
export type {
  AfterSave,
  GeneralConfig,
  HotkeysConfig,
  KiirmargeConfig,
  LinkStyle,
  Mode,
  NoteMode,
  StorageConfig,
  Theme,
} from "./config/types.ts";
export {
  AFTER_SAVE,
  datetimeFormatError,
  filenameFormatError,
  hotkeyFieldError,
  isLinkStyle,
  isMode,
  isNoteMode,
  isTheme,
  LINK_STYLES,
  MODES,
  NOTE_MODES,
  singleFileError,
  THEMES,
} from "./config/validate.ts";
export {
  canonicalKey,
  formatHotkey,
  hotkeyEquals,
  hotkeyError,
  hotkeyMatches,
  parseHotkey,
  toAccelerator,
} from "./hotkey/parse.ts";
export type { Hotkey, KeyEventLike } from "./hotkey/parse.ts";
export { buildFilename, formatDateTime, withCounter } from "./note/filename.ts";
export { composeNoteAppend, composeNoteMarkdown } from "./note/markdown.ts";
export { continueChecklist, insertCheckbox, isChecklistLine } from "./note/checklist.ts";
export type { TextEdit } from "./note/checklist.ts";
export { countText } from "./note/count.ts";
export type { TextCount } from "./note/count.ts";
export { markdownLink, resolveLinkStyle, wikiEmbed, wikiLink } from "./note/links.ts";
export { baseName, isAbsolutePath, joinPath, resolveNotesDir } from "./paths/resolve.ts";
export type { BasePaths } from "./paths/resolve.ts";
export { parseObsidianVaults } from "./paths/obsidian.ts";
export type { ObsidianVault } from "./paths/obsidian.ts";
export type { Clock } from "./ports/clock.ts";
export type { ConfigStore } from "./ports/config-store.ts";
export type { HotkeyRegistration, HotkeyService } from "./ports/hotkey-service.ts";
export type { NoteStore, SaveOptions } from "./ports/note-store.ts";
export type { TrayHandlers, TrayService } from "./ports/tray-service.ts";
export type { WindowService } from "./ports/window-service.ts";
export { discardNote } from "./usecases/discard-note.ts";
export type { DiscardResult } from "./usecases/discard-note.ts";
export { loadConfig } from "./usecases/load-config.ts";
export type { LoadedConfig } from "./usecases/load-config.ts";
export { saveNote } from "./usecases/save-note.ts";
export type { SaveNoteDeps, SaveNoteResult } from "./usecases/save-note.ts";