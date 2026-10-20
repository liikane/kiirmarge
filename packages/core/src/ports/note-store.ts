// Märkme salvestuskoht. Adapter tagab aatomilise kirjutuse (temp + rename)
// ja selle, et olemasolevat faili kunagi üle ei kirjutata ega kustutata.

export interface SaveOptions {
  /** Lisada sisu olemasoleva faili lõppu (liitfaili režiim). */
  append?: boolean;
}

export interface NoteStore {
  /** Kas sihtfail on juba olemas (nimekonflikti / liitfaili esimese kirjutuse kontroll). */
  exists(relativePath: string): Promise<boolean>;
  /** Salvestab märkme ja tagastab täistee. */
  save(relativePath: string, content: string, options?: SaveOptions): Promise<string>;
}