// Kiirklahvide parsimine ja kontroll.
// Kanooniline kuju: muuteklahvid + üks põhiklavi (nt "Ctrl+Alt+N", "F9", "Esc").

/** Kiirklahvi kirjeldus (kanooniline kuju). */
export interface Hotkey {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  /** Kanooniline klahvi nimi: "N", "F9", "Esc", "Space", "Up", ... */
  key: string;
}

/** Veebisündmuse (keydown) olulised väljad — core jääb DOM-ist sõltumatuks. */
export interface KeyEventLike {
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  key: string;
}

const MODIFIER_ALIASES: Record<string, "ctrl" | "alt" | "shift" | "meta"> = {
  ctrl: "ctrl",
  control: "ctrl",
  alt: "alt",
  shift: "shift",
  meta: "meta",
  win: "meta",
  windows: "meta",
  super: "meta",
  cmd: "meta",
  command: "meta",
};

const NAMED_KEYS: Record<string, string> = {
  esc: "Esc",
  escape: "Esc",
  space: "Space",
  spacebar: "Space",
  tab: "Tab",
  enter: "Enter",
  return: "Enter",
  backspace: "Backspace",
  delete: "Delete",
  del: "Delete",
  insert: "Insert",
  ins: "Insert",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
  up: "Up",
  arrowup: "Up",
  down: "Down",
  arrowdown: "Down",
  left: "Left",
  arrowleft: "Left",
  right: "Right",
  arrowright: "Right",
};

/** Teisendab ühe klahvinime kanooniliseks; tagastab null, kui tundmatu. */
export function canonicalKey(part: string): string | null {
  const lower = part.toLowerCase();
  if (lower === "~" || lower === "`" || lower === "backquote" || lower === "tilde" || lower === "ˇ") return "~";
  const named = NAMED_KEYS[lower];
  if (named) return named;
  if (/^f([1-9]|1[0-9]|2[0-4])$/.test(lower)) return lower.toUpperCase();
  if (/^[a-z]$/.test(lower)) return lower.toUpperCase();
  if (/^[0-9]$/.test(lower)) return lower;
  return null;
}

export interface HotkeyOptions {
  /** Lubada üksik klahv ilma muuteklahvita (aknasisesed klahvid, nt Enter). */
  allowBare?: boolean;
}

/** Tagastab veateate (eesti keeles) või null, kui kombinatsioon on korrektne. */
export function hotkeyError(input: string, options: HotkeyOptions = {}): string | null {
  const trimmed = input.trim();
  if (!trimmed) return "Kiirklahv on tühi.";
  const parts = trimmed
    .split("+")
    .map((p) => p.trim())
    .filter((p) => p !== "");
  if (parts.length === 0) return "Kiirklahv on tühi.";

  const state = { ctrl: false, alt: false, shift: false, meta: false };
  let keyFound = false;
  let key = "";
  for (const part of parts) {
    const modifier = MODIFIER_ALIASES[part.toLowerCase()];
    if (modifier) {
      if (state[modifier]) return `Muuteklahv kordub: ${part}.`;
      state[modifier] = true;
      continue;
    }
    const canonical = canonicalKey(part);
    if (canonical === null) return `Tundmatu klahv: ${part}.`;
    if (keyFound) return "Lubatud on ainult üks põhiklavi.";
    key = canonical;
    keyFound = true;
  }
  if (!keyFound) return "Puudub põhiklavi (ainult muuteklahvid).";
  const hasModifier = state.ctrl || state.alt || state.shift || state.meta;
  if (!hasModifier && !options.allowBare && key !== "Esc" && !/^F\d+$/.test(key)) {
    return "Üksik klahv sobib ainult aknasiseselt; globaalseks kiirklahviks lisa muuteklahv (nt Ctrl+Alt+N).";
  }
  return null;
}

/**
 * Parsib kiirklahvi süntaksi tasemel (ei rakenda poliitikat, kas muuteklahv on nõutud —
 * seda kontrollib `hotkeyError`).
 */
export function parseHotkey(input: string): Hotkey | null {
  const parts = input
    .trim()
    .split("+")
    .map((p) => p.trim())
    .filter((p) => p !== "");
  if (parts.length === 0) return null;

  const hk: Hotkey = { ctrl: false, alt: false, shift: false, meta: false, key: "" };
  let keyFound = false;
  for (const part of parts) {
    const modifier = MODIFIER_ALIASES[part.toLowerCase()];
    if (modifier) {
      if (hk[modifier]) return null;
      hk[modifier] = true;
      continue;
    }
    const canonical = canonicalKey(part);
    if (canonical === null) return null;
    if (keyFound) return null;
    hk.key = canonical;
    keyFound = true;
  }
  return keyFound ? hk : null;
}

/** Kanooniline tekstikuju, nt "Ctrl+Alt+N". */
export function formatHotkey(hk: Hotkey): string {
  const parts: string[] = [];
  if (hk.ctrl) parts.push("Ctrl");
  if (hk.alt) parts.push("Alt");
  if (hk.shift) parts.push("Shift");
  if (hk.meta) parts.push("Meta");
  parts.push(hk.key);
  return parts.join("+");
}

export function hotkeyEquals(a: Hotkey, b: Hotkey): boolean {
  return (
    a.ctrl === b.ctrl &&
    a.alt === b.alt &&
    a.shift === b.shift &&
    a.meta === b.meta &&
    a.key === b.key
  );
}

/** Kas veebisündmus vastab kiirklahvile (aknasisesed kiirklahvid). */
export function hotkeyMatches(hk: Hotkey, event: KeyEventLike): boolean {
  if (
    event.ctrlKey !== hk.ctrl ||
    event.altKey !== hk.alt ||
    event.shiftKey !== hk.shift ||
    event.metaKey !== hk.meta
  ) {
    return false;
  }
  const key = event.key === " " ? "Space" : canonicalKey(event.key);
  return key !== null && key === hk.key;
}

function acceleratorKey(key: string): string {
  const named: Record<string, string> = {
    Esc: "escape",
    Space: "space",
    Tab: "tab",
    Enter: "enter",
    Backspace: "backspace",
    Delete: "delete",
    Insert: "insert",
    Home: "home",
    End: "end",
    PageUp: "pageup",
    PageDown: "pagedown",
    Up: "up",
    Down: "down",
    Left: "left",
    Right: "right",
  };
  const found = named[key];
  if (found) return found;
  if (key === "~") return "backquote";
  if (/^F\d+$/.test(key)) return key.toLowerCase();
  if (/^[A-Z]$/.test(key)) return key.toLowerCase();
  return key;
}

/**
 * Tauri global-shortcut plugina ootatav kuju (nt "ctrl+alt+n").
 * NB: täpne sõnastik kinnitatakse Tauri 2 dokumentatsiooni järgi (E2 etapis: docs/uuring/tauri2-ehitus.md).
 */
export function toAccelerator(hk: Hotkey): string {
  const parts: string[] = [];
  if (hk.ctrl) parts.push("ctrl");
  if (hk.alt) parts.push("alt");
  if (hk.shift) parts.push("shift");
  if (hk.meta) parts.push("super");
  parts.push(acceleratorKey(hk.key));
  return parts.join("+");
}
