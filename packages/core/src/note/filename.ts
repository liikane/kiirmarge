// Failinime ja kuupäeva-kellaaja vormindamine.
// Toetatud ajamallid: YYYY, MM, DD, HH, mm, ss (kontroll: config/validate.ts).
// Kasutatakse KOHALIKKU aega — märkme ajatempel peab vastama kasutaja kellale.

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

/** Asendab mallis ajamallid konkreetse hetke väärtustega. */
export function formatDateTime(date: Date, format: string): string {
  return format
    .replace(/YYYY/g, pad(date.getFullYear(), 4))
    .replace(/MM/g, pad(date.getMonth() + 1, 2))
    .replace(/DD/g, pad(date.getDate(), 2))
    .replace(/HH/g, pad(date.getHours(), 2))
    .replace(/mm/g, pad(date.getMinutes(), 2))
    .replace(/ss/g, pad(date.getSeconds(), 2));
}

/**
 * Ehitab failinime mallist. Mall peab olema eelnevalt valideeritud
 * (filenameFormatError) — see funktsioon malli ise ei kontrolli.
 */
export function buildFilename(format: string, date: Date): string {
  return formatDateTime(date, format);
}

/** Lisab nimekonflikti korral järjekorranumbri: nimi.md -> nimi-2.md */
export function withCounter(filename: string, counter: number): string {
  if (counter <= 1) return filename;
  const match = /^(.*)\.md$/i.exec(filename);
  if (match && match[1] !== undefined) return `${match[1]}-${counter}.md`;
  return `${filename}-${counter}`;
}