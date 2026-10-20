// Linkide koostamine märkme ja manuste jaoks.
// Wiki-stiil ([[...]]) on Obsidiani oma; markdown-stiil töötab igal pool.

import type { KiirmargeConfig } from "../config/types.ts";

/** Standardne Markdown-link; tühikud teisendatakse URL-kujule. */
export function markdownLink(label: string, target: string): string {
  return `[${label}](${target.replaceAll(" ", "%20")})`;
}

/** Obsidiani wiki-link: [[siht]] või [[siht|nimi]]. */
export function wikiLink(target: string, label?: string): string {
  return label !== undefined && label !== "" ? `[[${target}|${label}]]` : `[[${target}]]`;
}

/** Obsidiani manuse-embed: ![[siht]] (nt pilt märkme sees). */
export function wikiEmbed(target: string): string {
  return `![[${target}]]`;
}

/**
 * Millist lingistiili antud seadistus kasutab.
 * `auto` = obsidian-režiimis wiki, muidu markdown.
 */
export function resolveLinkStyle(config: KiirmargeConfig): "wiki" | "markdown" {
  const style = config.storage.link_style;
  if (style === "auto") {
    return config.general.mode === "obsidian" ? "wiki" : "markdown";
  }
  return style;
}
