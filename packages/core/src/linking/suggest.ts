// Märkme seostamine vaulti sisuga (Issue #5, etapp 1: ilma AI-ta).
// Lingid pakutakse ainult vaulti OLEMASOLEVATELE kirjetele — midagi ei leiutata.

/** Vaulti kirje, millele märge võib viidata (märkme pealkiri või silt). */
export interface VaultEntry {
  readonly kind: "note" | "tag";
  /** Märkme failinimi ilma `.md`-ta või sildi nimi ilma `#`-ta. */
  readonly name: string;
  readonly aliases?: readonly string[];
}

export interface LinkSuggestion {
  readonly links: readonly string[];
  readonly tags: readonly string[];
  /** Lisandub frontmatterisse (nt projekt, klient) — AI-linker täidab. */
  readonly metadata?: Readonly<Record<string, string>>;
}

/** Port, mille taha tulevad hilisemad realisatsioonid (kohalik mudel, pilve-API). */
export interface Linker {
  suggest(text: string, entries: readonly VaultEntry[]): Promise<LinkSuggestion>;
}

const MIN_STEM = 4;

function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

/**
 * Eesti käänete lähendus: sõnad sobivad, kui ühine algus on vähemalt `MIN_STEM` märki
 * ja katab lühema sõna kuni 3 viimast tähte välja arvatud (nt „kliendile" ~ „klient",
 * „pakkumisele" ~ „pakkumine").
 */
function sameStem(a: string, b: string): boolean {
  const limit = Math.min(a.length, b.length);
  let common = 0;
  while (common < limit && a[common] === b[common]) common += 1;
  return common >= MIN_STEM && common >= limit - 3;
}

function entryMatches(entryWords: readonly string[], textWords: readonly string[]): boolean {
  return (
    entryWords.length > 0 &&
    entryWords.every((word) => textWords.some((candidate) => sameStem(word, candidate)))
  );
}

/** Märksõnavaste: kõik kirje sõnad (pealkiri või alias) peavad märkmes esinema. */
export function suggestByKeywords(text: string, entries: readonly VaultEntry[]): LinkSuggestion {
  const textWords = words(text);
  const links = new Set<string>();
  const tags = new Set<string>();
  for (const entry of entries) {
    const names = [entry.name, ...(entry.aliases ?? [])];
    if (!names.some((name) => entryMatches(words(name), textWords))) continue;
    (entry.kind === "note" ? links : tags).add(entry.name);
  }
  return { links: [...links], tags: [...tags] };
}

export const LINKS_HEADING = "## Seosed";

export function isEmptySuggestion(suggestion: LinkSuggestion): boolean {
  return (
    suggestion.links.length === 0 &&
    suggestion.tags.length === 0 &&
    Object.keys(suggestion.metadata ?? {}).length === 0
  );
}

function frontmatterOf(metadata: Readonly<Record<string, string>>): string {
  const lines = Object.entries(metadata)
    .filter(([key, value]) => /^[\w-]+$/.test(key) && value.trim() !== "")
    .map(([key, value]) => `${key}: ${JSON.stringify(value.trim())}`);
  return lines.length === 0 ? "" : `---\n${lines.join("\n")}\n---\n\n`;
}

/**
 * Lisab märkme lõppu ploki `## Seosed` (lingid + sildid) ja soovi korral frontmatteri.
 * Olemasolevat teksti ei muudeta; korduv kasutamine ei dubleeri plokki.
 */
export function applyLinkSuggestion(markdown: string, suggestion: LinkSuggestion): string {
  const front =
    suggestion.metadata !== undefined && !markdown.startsWith("---\n")
      ? frontmatterOf(suggestion.metadata)
      : "";
  let body = markdown;
  if (!markdown.includes(LINKS_HEADING)) {
    const parts: string[] = [];
    if (suggestion.links.length > 0) {
      parts.push(`Lingid: ${suggestion.links.map((name) => `[[${name}]]`).join(" ")}`);
    }
    if (suggestion.tags.length > 0) {
      parts.push(`Sildid: ${suggestion.tags.map((name) => `#${name}`).join(" ")}`);
    }
    if (parts.length > 0) {
      body = `${markdown.replace(/\s+$/, "")}\n\n${LINKS_HEADING}\n\n${parts.join("\n")}\n`;
    }
  }
  return front + body;
}
