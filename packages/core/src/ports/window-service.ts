// Kiirmärkme aken (E2).
export interface WindowService {
  show(): Promise<void>;
  hide(): Promise<void>;
  toggle(): Promise<void>;
  setAlwaysOnTop(value: boolean): Promise<void>;
}