// Seadistusfaili hoidla. Adapterid: Tauri failisüsteem, Obsidian, mälupõhine test.
export interface ConfigStore {
  /** Loeb seadistusfaili teksti; null, kui faili veel ei ole. */
  read(): Promise<string | null>;
  /** Kirjutab seadistusfaili. Kasutatakse ainult esmakäivitusel. */
  write(text: string): Promise<void>;
  /** Inimloetav asukoht veateadete jaoks, nt %APPDATA%\Kiirmarge\config.toml. */
  describeLocation(): string;
}