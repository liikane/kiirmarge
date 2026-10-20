import { cloneConfig, DEFAULT_CONFIG, DEFAULT_CONFIG_TOML } from "../config/defaults.ts";
import { parseConfigText, type ConfigProblem } from "../config/load.ts";
import type { KiirmargeConfig } from "../config/types.ts";
import type { ConfigStore } from "../ports/config-store.ts";

export interface LoadedConfig {
  config: KiirmargeConfig;
  problems: ConfigProblem[];
  /** true, kui seadistus loodi just praegu (esmakäivitus). */
  created: boolean;
}

/**
 * Loeb seadistuse. Puuduva faili korral luuakse see kommentaaridega.
 * Olemasolevat faili ei kirjutata kunagi üle — ka vigaste väärtuste korral
 * kasutatakse vaikeväärtusi ja tagastatakse probleemide nimekiri.
 */
export async function loadConfig(store: ConfigStore): Promise<LoadedConfig> {
  const text = await store.read();
  if (text === null) {
    await store.write(DEFAULT_CONFIG_TOML);
    return { config: cloneConfig(DEFAULT_CONFIG), problems: [], created: true };
  }
  const parsed = parseConfigText(text);
  return { config: parsed.config, problems: parsed.problems, created: false };
}