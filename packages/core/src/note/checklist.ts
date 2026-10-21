// Markdowni märkeruutude (Obsidiani ülesannete nimekirja) lisamine.
// Puhas tekstiloogika — UI rakendab tulemuse tekstialale.

/** Tekstimuudatus: uus sisu ja uus valik (caret). */
export interface TextEdit {
  text: string;
  start: number;
  end: number;
}

/** Ülesande märkeruudu prefiks Markdownis. */
export const CHECKBOX_PREFIX = "- [ ] ";

/** Rea alguse indeks (tähemärk pärast eelmist reavahetust). */
function lineStart(value: string, index: number): number {
  const found = value.lastIndexOf("\n", Math.max(0, index - 1));
  return found === -1 ? 0 : found + 1;
}

/** Rea lõpu indeks (ilma reavahetuseta). */
function lineEnd(value: string, index: number): number {
  const found = value.indexOf("\n", index);
  return found === -1 ? value.length : found;
}

/** Kas rida on juba Markdowni märkeruut (`- [ ]` või `- [x]`). */
export function isChecklistLine(line: string): boolean {
  return /^\s*- \[[ xX]\] /.test(line);
}

function indentOf(line: string): string {
  return /^[ \t]*/.exec(line)?.[0] ?? "";
}

/**
 * Lisab valikule (või praegusele reale) Markdowni märkeruudud.
 *
 * - Kursor ühel real: lisab `- [ ] ` rea algusesse (taanet säilitades).
 * - Mitme rea valik: iga mitte-tühi rida saab oma märkeruudu; juba olemasolevad jäävad puutumata.
 * - Kui rida on juba märkeruut, ei muudeta midagi.
 */
export function insertCheckbox(value: string, start: number, end: number): TextEdit {
  const from = Math.min(start, end);
  const to = Math.max(start, end);

  if (from === to) {
    const start_ = lineStart(value, from);
    const line = value.slice(start_, lineEnd(value, from));
    if (isChecklistLine(line)) {
      return { text: value, start: from, end: to };
    }
    const insertAt = start_ + indentOf(line).length;
    const text = value.slice(0, insertAt) + CHECKBOX_PREFIX + value.slice(insertAt);
    const caret = insertAt + CHECKBOX_PREFIX.length;
    return { text, start: caret, end: caret };
  }

  const blockStart = lineStart(value, from);
  // Kui valik lõpeb täpselt rea alguses, ei haara seda rida.
  const blockEnd = value[to - 1] === "\n" ? to : lineEnd(value, to);
  const lines = value.slice(blockStart, blockEnd).split("\n");
  let changed = false;
  const updated = lines.map((line) => {
    if (line.trim() === "" || isChecklistLine(line)) return line;
    changed = true;
    const indent = indentOf(line);
    return indent + CHECKBOX_PREFIX + line.slice(indent.length);
  });
  if (!changed) {
    return { text: value, start: from, end: to };
  }
  const block = updated.join("\n");
  const text = value.slice(0, blockStart) + block + value.slice(blockEnd);
  return { text, start: blockStart, end: blockStart + block.length };
}

/**
 * Jätkab märkeruutude loendit: kui kursor on märkeruudu real, lisab reavahetuse
 * ja uue tühja märkeruudu (taane säilib). Muul juhul tagastab `null`.
 */
export function continueChecklist(value: string, caret: number): TextEdit | null {
  const start = lineStart(value, caret);
  const line = value.slice(start, lineEnd(value, caret));
  const match = /^(\s*)- \[[ xX]\] /.exec(line);
  if (match === null) return null;
  // Kursor enne märkeruutu (rea alguses) — loendit ei jätka.
  if (caret < start + match[0].length) return null;
  const prefix = `\n${match[1]}${CHECKBOX_PREFIX}`;
  const text = value.slice(0, caret) + prefix + value.slice(caret);
  const position = caret + prefix.length;
  return { text, start: position, end: position };
}
