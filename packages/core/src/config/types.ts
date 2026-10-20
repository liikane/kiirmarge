// Kiirmärkme seadistuse tüübid. Need vastavad config.toml sektsioonidele.

export type Mode = "standalone" | "obsidian";
export type Theme = "dark" | "light" | "system";
export type LinkStyle = "auto" | "wiki" | "markdown";
/** Kas iga märge läheb omaette faili või kõik ühte liitfaili. */
export type NoteMode = "per-note" | "single-file";

/** [general] sektsioon */
export interface GeneralConfig {
  mode: Mode;
  theme: Theme;
  always_on_top: boolean;
  /** Käivitada rakendus Windowsi sisselogimisel. */
  autostart: boolean;
}

/** [storage] sektsioon */
export interface StorageConfig {
  vault: string;
  notes_dir: string;
  attachments_dir: string;
  default_to_desktop: boolean;
  link_style: LinkStyle;
  filename_format: string;
  datetime_format: string;
  /** "per-note" = iga märge eraldi faili; "single-file" = kõik ühte faili. */
  note_mode: NoteMode;
  /** Liitfaili nimi (kasutatakse, kui note_mode = "single-file"). */
  single_file: string;
}

/** [hotkeys] sektsioon */
export interface HotkeysConfig {
  open: string;
  save: string;
  close: string;
  screenshot: string;
}

/** Kogu rakenduse seadistus */
export interface KiirmargeConfig {
  general: GeneralConfig;
  storage: StorageConfig;
  hotkeys: HotkeysConfig;
}
