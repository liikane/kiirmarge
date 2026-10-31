// Kiirmärkme seadistuse tüübid. Need vastavad config.toml sektsioonidele.

export type Mode = "standalone" | "obsidian";
export type Theme = "dark" | "light" | "system";
export type LinkStyle = "auto" | "wiki" | "markdown";
/** Märkme siht: eraldi fail, liitfail või Obsidiani päevamärge. */
export type NoteMode = "per-note" | "single-file" | "daily-note";
/** Pärast salvestamist: aken jääb avatuks või kuvatakse 5 s kinnitus. */
export type AfterSave = "stay" | "confirm";
/** GitHubi Issue'i silt — ühtlasi märkme tüüp seadetes. */
export type IssueLabel = "bug" | "idea" | "enhancement" | "documentation";

/** [general] sektsioon */
export interface GeneralConfig {
  mode: Mode;
  theme: Theme;
  always_on_top: boolean;
  /** Käivitada rakendus Windowsi sisselogimisel. */
  autostart: boolean;
  /** "stay" = aken jääb pärast salvestamist avatuks; "confirm" = 5 s kinnitus ja peitmine. */
  after_save: AfterSave;
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
  /** "per-note" = eraldi fail; "single-file" = liitfail; "daily-note" = Obsidiani päevamärge. */
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

/**
 * [github] sektsioon. Token EI ole siin — see elab Windowsi mandaadihoidlas
 * (vt Rust-käsk `github_save_token`).
 */
export interface GithubConfig {
  /** Kas GitHubi Issue saatmine on rakenduses sisse lülitatud. */
  enabled: boolean;
  /** Hoidla kujul "omanik/nimi". */
  repo: string;
  /** Vaikimisi silt, mida Issue'le pannakse. */
  label: IssueLabel;
  /** Kas akna märkeruut „Saada ka GitHub Issue" on vaikimisi sees. */
  send_by_default: boolean;
}

/** Kogu rakenduse seadistus */
export interface KiirmargeConfig {
  general: GeneralConfig;
  storage: StorageConfig;
  hotkeys: HotkeysConfig;
  github: GithubConfig;
}
