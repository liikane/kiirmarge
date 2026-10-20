import type { KiirmargeConfig } from "../config/types.ts";
import { formatDateTime } from "./filename.ts";

/**
 * Koostab märkme Markdowni. Formaat on fikseeritud (lukustatud ühiktestiga):
 *
 *   # Kiirmärge
 *
 *   **2026-10-14 20:31**
 *
 *   <kasutaja tekst>
 *
 * Fail lõpeb ühe reavahetusega. Manuste lingid tulevad E5-s; wiki- ja
 * standardlinkide vahe (link_style) lahendatakse seal.
 */
/**
 * Üks osa liitfaili jaoks: eraldaja + ajatempel + tekst.
 * Algab tühja reaga, et osad ei liituks eelmise omaga.
 */
export function composeNoteAppend(text: string, createdAt: Date, config: KiirmargeConfig): string {
  const stamp = formatDateTime(createdAt, config.storage.datetime_format);
  const body = text.replace(/\r\n?/g, "\n").trim();
  return `\n---\n\n## ${stamp}\n\n${body}\n`;
}

export function composeNoteMarkdown(text: string, createdAt: Date, config: KiirmargeConfig): string {
  const stamp = formatDateTime(createdAt, config.storage.datetime_format);
  const body = text.replace(/\r\n?/g, "\n").trim();
  return `# Kiirmärge\n\n**${stamp}**\n\n${body}\n`;
}