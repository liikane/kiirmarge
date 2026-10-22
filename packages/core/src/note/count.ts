// Teksti loendamine: sõnad ja tähemärgid.

/** Teksti maht. */
export interface TextCount {
  /** Sõnade arv (tühikute ja reavahetuste järgi). */
  words: number;
  /** Tähemärkide arv Unicode'i koodipunktidena (emoji = 1). */
  characters: number;
}

/** Loeb sõnad ja tähemärgid; tühi tekst annab 0 ja 0. */
export function countText(value: string): TextCount {
  const trimmed = value.trim();
  const words = trimmed === "" ? 0 : trimmed.split(/\s+/u).length;
  const characters = Array.from(value).length;
  return { words, characters };
}
