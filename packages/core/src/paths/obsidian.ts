// Obsidiani vaultide tuvastus: `%APPDATA%\obsidian\obsidian.json` sisu parsimine.
// Faili sisu annab kest (Tauri käsk `read_obsidian_config`); see moodul on puhas ja testitav.

import { baseName } from "./resolve.ts";

/** Üks Obsidiani vault. */
export interface ObsidianVault {
  /** Obsidiani sisemine id (hash). */
  id: string;
  /** Vaulti juurkaust. */
  path: string;
  /** Kuvatav nimi (kausta viimane osa). */
  name: string;
  /** Kas vault oli Obsidianis viimati avatud. */
  open: boolean;
  /** Viimase avamise ajatempel (ms). */
  timestamp: number;
}

/**
 * Parsib obsidian.json sisu. Vigase või ootamatu sisu korral tagastab tühja loendi —
 * tuvastuse viga ei tohi rakendust maha jooksutada.
 * Järjekord: avatud vault enne, siis uuem ajatempel enne, siis nimi.
 */
export function parseObsidianVaults(text: string): ObsidianVault[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return [];
  }
  if (typeof raw !== "object" || raw === null) return [];

  const vaults = (raw as { vaults?: unknown }).vaults;
  if (typeof vaults !== "object" || vaults === null || Array.isArray(vaults)) return [];

  const result: ObsidianVault[] = [];
  for (const [id, value] of Object.entries(vaults as Record<string, unknown>)) {
    if (typeof value !== "object" || value === null) continue;
    const entry = value as { path?: unknown; open?: unknown; ts?: unknown };
    if (typeof entry.path !== "string" || entry.path.trim() === "") continue;
    result.push({
      id,
      path: entry.path,
      name: baseName(entry.path),
      open: entry.open === true,
      timestamp: typeof entry.ts === "number" ? entry.ts : 0,
    });
  }

  result.sort((a, b) => {
    if (a.open !== b.open) return a.open ? -1 : 1;
    if (a.timestamp !== b.timestamp) return b.timestamp - a.timestamp;
    return a.name.localeCompare(b.name);
  });
  return result;
}
