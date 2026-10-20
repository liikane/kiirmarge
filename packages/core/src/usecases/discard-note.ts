export interface DiscardResult {
  discarded: true;
}

/**
 * "Tühista" — mustand visatakse ära. Teadlikult ei kirjuta midagi ega jäta
 * ajutisi faile. Omaette kasutusjuht selleks, et adapterid ei hakkaks ise
 * failisüsteemi puutuma.
 */
export function discardNote(): DiscardResult {
  return { discarded: true };
}