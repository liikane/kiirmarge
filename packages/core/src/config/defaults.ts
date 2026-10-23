import { serializeConfig } from "./serialize.ts";
import type { KiirmargeConfig } from "./types.ts";

/** Turvalised vaikeväärtused, mida kasutatakse ka vigaste seadistuste korral. */
export const DEFAULT_CONFIG: KiirmargeConfig = {
  general: {
    mode: "standalone",
    theme: "dark",
    always_on_top: true,
    autostart: false,
    after_save: "stay",
  },
  storage: {
    vault: "",
    notes_dir: "Kiirmärkmed",
    attachments_dir: "Kiirmärkmed/manused",
    default_to_desktop: false,
    link_style: "auto",
    filename_format: "YYYY-MM-DD-HHmmss.md",
    datetime_format: "YYYY-MM-DD HH:mm",
    note_mode: "per-note",
    single_file: "Kiirmärkmed.md",
  },
  hotkeys: {
    open: "Ctrl+Shift+1",
    save: "Enter",
    close: "Esc",
    screenshot: "",
  },
};

/**
 * Esmakäivitusel loodava config.toml sisu (kommentaaridega).
 * Peab parsima sama tulemuse, mis DEFAULT_CONFIG — seda kontrollib ühiktest.
 */
export const DEFAULT_CONFIG_TOML = serializeConfig(DEFAULT_CONFIG);

/** Koopia vaikeväärtustest — tagastatav objekt ei tohi olla jagatud viide. */
export function cloneConfig(config: KiirmargeConfig): KiirmargeConfig {
  return {
    general: { ...config.general },
    storage: { ...config.storage },
    hotkeys: { ...config.hotkeys },
  };
}