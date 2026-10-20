// Süsteemisalve ikoon (E3).
export interface TrayHandlers {
  open(): void;
  quit(): void;
}

export interface TrayService {
  create(handlers: TrayHandlers): Promise<void>;
  destroy(): Promise<void>;
}