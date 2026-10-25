import type { KiirmargeConfig } from "./types.ts";

function quote(value: string): string {
  // JSON.stringify annab TOML-i jaoks sobiva jutumärkidega stringi (\n, \t, \\, \").
  return JSON.stringify(value);
}

/**
 * Seadistuse kirjutamine config.toml-iks (kommentaaridega).
 * Ringkäik peab kehtima: `parseConfigText(serializeConfig(config))` annab sama seadistuse.
 */
export function serializeConfig(config: KiirmargeConfig): string {
  const { general, storage, hotkeys } = config;
  return [
    "# Kiirmärkme seadistus",
    "# Muuda väärtusi vabalt — rakendus loeb seda igal käivitusel.",
    "# Kui muudad seadeid rakenduses, kirjutatakse see fail uuesti (kommentaarid säilivad).",
    "",
    "[general]",
    `mode = ${quote(general.mode)}        # "standalone" | "obsidian"`,
    `theme = ${quote(general.theme)}             # "dark" | "light" | "system"`,
    `always_on_top = ${general.always_on_top}`,
    `autostart = ${general.autostart}          # true = käivita Windowsi sisselogimisel`,
    `after_save = ${quote(general.after_save)}     # "stay" = aken jääb avatuks | "confirm" = 5 s kinnitus`,
    "",
    "[storage]",
    `vault = ${quote(storage.vault)}                 # obsidian-režiimis vaulti juurkaust`,
    `notes_dir = ${quote(storage.notes_dir)}`,
    `attachments_dir = ${quote(storage.attachments_dir)}`,
    `default_to_desktop = ${storage.default_to_desktop}`,
    `link_style = ${quote(storage.link_style)}        # "auto" | "wiki" (![[..]]) | "markdown"`,
    `filename_format = ${quote(storage.filename_format)}`,
    `datetime_format = ${quote(storage.datetime_format)}`,
    `note_mode = ${quote(storage.note_mode)}     # "per-note" = eraldi fail, "single-file" = liitfail, "daily-note" = Obsidiani päevamärge`,
    `single_file = ${quote(storage.single_file)}  # liitfaili nimi, kui note_mode = "single-file"`,
    "",
    "[hotkeys]",
    `open = ${quote(hotkeys.open)}`,
    `save = ${quote(hotkeys.save)}`,
    `close = ${quote(hotkeys.close)}`,
    `screenshot = ${quote(hotkeys.screenshot)}            # tühi = välja lülitatud`,
    "",
  ].join("\n");
}