// Globaalne kiirklahv — olemas ainult taustarakenduse adapteril (E2).
export interface HotkeyRegistration {
  ok: boolean;
  /** Veateade, kui registreerimine ei õnnestunud (nt kombinatsioon on hõivatud). */
  error?: string;
}

export interface HotkeyService {
  register(accelerator: string, handler: () => void): Promise<HotkeyRegistration>;
  unregisterAll(): Promise<void>;
}