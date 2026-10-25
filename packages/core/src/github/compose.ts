// Märkmest GitHubi Issue'i mustandi koostamine. Puhas funktsioon — võrku ei puutu.
// Reegel Issue'st: pealkiri = märkme esimene rida, ülejäänud tekst = kirjeldus.

/** Issue'i mustand: pealkiri ja Markdown-kirjeldus. */
export interface IssueDraft {
  title: string;
  body: string;
}

export interface IssueDraftOptions {
  /** Märkme failinimi — läheb kirjelduse jalusele, et Issue'st saaks faili üles leida. */
  filename: string;
  /** Inimloetav ajatempel (nt "2026-10-25 21:05"). */
  stamp: string;
}

/** GitHubi pealkirja pehme piir; pikem pealkiri lõigatakse ja täistekst jääb kirjeldusse. */
export const TITLE_MAX = 120;

/** Eemaldab rea algusest Markdown-märgid (#, -, *, +, [ ], >). */
function stripMarkers(line: string): string {
  return line
    .trim()
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\[[ xX]\]\s*/, "")
    .replace(/^>\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Märkme tekst -> Issue'i mustand.
 *
 * - Pealkiri: esimene sisuline rida ilma Markdown-märkideta; kui see on pikem kui
 *   `TITLE_MAX`, lõigatakse pealkiri ja täisrida jääb kirjelduse algusesse.
 * - Kirjeldus: ülejäänud tekst + jalus (allikas ja failinimi).
 * - Tühi tekst -> `null` (midagi ei saadeta).
 */
export function composeIssueDraft(text: string, options: IssueDraftOptions): IssueDraft | null {
  const lines = text.trim().split(/\r?\n/);
  const firstIndex = lines.findIndex((line) => line.trim() !== "");
  if (firstIndex < 0) return null;

  const firstLine = lines[firstIndex] ?? "";
  const full = stripMarkers(firstLine);
  if (full === "") return null;

  const truncated = full.length > TITLE_MAX;
  const title = truncated ? `${full.slice(0, TITLE_MAX - 1).trimEnd()}…` : full;

  const rest = lines
    .slice(firstIndex + 1)
    .join("\n")
    .trim();
  const paragraphs = [truncated ? full : "", rest].filter((part) => part !== "").join("\n\n");
  const footer = `_Kiirmärge · ${options.stamp} · \`${options.filename}\`_`;

  return {
    title,
    body: paragraphs === "" ? footer : `${paragraphs}\n\n---\n${footer}`,
  };
}

/** Rea, mis lisatakse märkme faili lõppu pärast Issue loomist. */
export function composeIssueBackfill(issue: { number: number; url: string }): string {
  return `\n\nGitHub: [#${issue.number}](${issue.url})\n`;
}
