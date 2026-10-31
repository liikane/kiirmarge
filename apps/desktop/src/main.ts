import { invoke } from "@tauri-apps/api/core";
import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";

import {
  cloneConfig,
  composeIssueBackfill,
  continueChecklist,
  countText,
  createIssueFromNote,
  dequeue,
  discardNote,
  enqueue,
  formatDateTime,
  formatHotkey,
  hotkeyFieldError,
  hotkeyMatches,
  insertCheckbox,
  isAbsolutePath,
  isIssueLabel,
  issueFailureOf,
  loadConfig,
  newQueuedIssue,
  parseHotkey,
  parseObsidianVaults,
  repoError,
  resolveNotesDir,
  saveNote,
  sendQueuedIssue,
  serializeConfig,
  singleFileError,
  toAccelerator,
  type BasePaths,
  type Clock,
  type ConfigProblem,
  type ConfigStore,
  type Hotkey,
  type IssueClient,
  type IssueLabel,
  type KiirmargeConfig,
  type NoteStore,
  type ObsidianVault,
  type QueuedIssue,
} from "@kiirmarge/core";

/** Rusti poolt tulevad asukohad. */
interface AppPaths {
  documents: string;
  desktop: string;
  configFile: string;
}

function must<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Elementi ${selector} ei leidnud`);
  return element;
}

const draftInput = must<HTMLTextAreaElement>("#draft");
const counterLine = must<HTMLParagraphElement>("#counter");
const saveButton = must<HTMLButtonElement>("#save");
const cancelButton = must<HTMLButtonElement>("#cancel");
const saveHint = must<HTMLElement>("#hint-save");
const cancelHint = must<HTMLElement>("#hint-cancel");
const statusLine = must<HTMLParagraphElement>("#status");
const noticeLine = must<HTMLParagraphElement>("#notice");
const problemList = must<HTMLUListElement>("#problems");
const hotkeyHint = must<HTMLSpanElement>("#hotkey-hint");
const savedOverlay = must<HTMLElement>("#saved");
const savedText = must<HTMLElement>("#saved-text");
const savedGithub = must<HTMLElement>("#saved-github");

const settingsPanel = must<HTMLElement>("#settings");
const toggleSettingsButton = must<HTMLButtonElement>("#toggle-settings");
const pinButton = must<HTMLButtonElement>("#pin");
const notesDirInput = must<HTMLInputElement>("#notes-dir");
const notesDirLabel = must<HTMLElement>("#notes-dir-label");
const notesDirResolved = must<HTMLParagraphElement>("#notes-dir-resolved");
const locationSelect = must<HTMLSelectElement>("#location");
const locationRow = must<HTMLElement>("#location-row");
const pickDirButton = must<HTMLButtonElement>("#pick-dir");
const noteModeSelect = must<HTMLSelectElement>("#note-mode");
const dailyNoteModeOption = must<HTMLOptionElement>("#daily-note-mode");
const singleFileRow = must<HTMLElement>("#single-file-row");
const singleFileInput = must<HTMLInputElement>("#single-file");
const hotkeyOpenInput = must<HTMLInputElement>("#hotkey-open");
const hotkeySaveInput = must<HTMLInputElement>("#hotkey-save");
const hotkeyCloseInput = must<HTMLInputElement>("#hotkey-close");
const autostartCheckbox = must<HTMLInputElement>("#autostart");
const afterSaveSelect = must<HTMLSelectElement>("#after-save");
const saveSettingsButton = must<HTMLButtonElement>("#save-settings");
const checkboxButton = must<HTMLButtonElement>("#checkbox");
const modeSelect = must<HTMLSelectElement>("#mode");
const vaultRow = must<HTMLElement>("#vault-row");
const vaultSelect = must<HTMLSelectElement>("#vault");
const pickVaultButton = must<HTMLButtonElement>("#pick-vault");
const linkStyleSelect = must<HTMLSelectElement>("#link-style");
const githubSettingsRow = must<HTMLElement>("#github-settings");
const githubEnabledCheckbox = must<HTMLInputElement>("#github-enabled");
const githubRepoInput = must<HTMLInputElement>("#github-repo");
const githubLabelSelect = must<HTMLSelectElement>("#github-label");
const githubDefaultCheckbox = must<HTMLInputElement>("#github-default");
const githubTokenInput = must<HTMLInputElement>("#github-token");
const githubSaveTokenButton = must<HTMLButtonElement>("#github-save-token");
const githubClearTokenButton = must<HTMLButtonElement>("#github-clear-token");
const githubTokenStatus = must<HTMLElement>("#github-token-status");
const githubTestButton = must<HTMLButtonElement>("#github-test");
const githubTestStatus = must<HTMLElement>("#github-test-status");
const sendGithubRow = must<HTMLElement>("#github-send-row");
const sendGithubCheckbox = must<HTMLInputElement>("#send-github");
const sendGithubLabel = must<HTMLSelectElement>("#send-github-label");

const clock: Clock = { now: () => new Date() };

let config: KiirmargeConfig | null = null;
let vaults: ObsidianVault[] = [];
let noteStore: NoteStore | null = null;
let basePaths: BasePaths | null = null;
let notesDir = "";
let saveHotkey: Hotkey | null = null;
let closeHotkey: Hotkey | null = null;
let saving = false;
let savedTimer: number | null = null;
let githubTokenPresent = false;
let issueQueue: QueuedIssue[] = [];

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Tauri käsud viskavad `{ message, retryable }` — selleks loeme vea tekstina. */
function errorText(error: unknown): string {
  return issueFailureOf(error).message;
}

function setStatus(text: string, tone: "info" | "ok" | "error" = "info"): void {
  statusLine.textContent = text;
  statusLine.dataset.tone = tone;
}

/** Sõna- ja tähemärgiloendur tekstiala all. */
function updateCounter(): void {
  const { words, characters } = countText(draftInput.value);
  const characterWord = characters === 1 ? "tähemärk" : "tähemärki";
  counterLine.textContent = `${words} sõna · ${characters} ${characterWord}`;
}

/** Kinnituse peitmine ja taimeri tühistamine. */
function clearSaved(): void {
  if (savedTimer !== null) {
    window.clearTimeout(savedTimer);
    savedTimer = null;
  }
  savedOverlay.hidden = true;
  savedGithub.hidden = true;
  savedGithub.textContent = "";
}

/** 5 sekundi kinnitus „Salvestatud!“ koos salvestatud tekstiga; siis peidab akna. */
function showSaved(text: string): void {
  clearSaved();
  savedText.textContent = text;
  savedOverlay.hidden = false;
  savedTimer = window.setTimeout(() => {
    savedTimer = null;
    savedOverlay.hidden = true;
    draftInput.value = "";
    updateCounter();
    void invoke<void>("hide_main_window");
  }, 5000);
}

/** Nööpnõela olek: kas aken on alati esiplaanil. */
function renderPin(): void {
  const pinned = config?.general.always_on_top ?? false;
  pinButton.setAttribute("aria-pressed", pinned ? "true" : "false");
  pinButton.title = pinned
    ? "Vabasta ekraanilt (ei ole alati esiplaanil)"
    : "Kinnita ekraanile (alati esiplaanil)";
}

/** Lülitab „alati esiplaanil" režiimi ja salvestab selle seadistusse. */
async function togglePin(): Promise<void> {
  if (config === null) return;
  const next = !config.general.always_on_top;
  try {
    await invoke<void>("set_always_on_top", { value: next });
    config.general.always_on_top = next;
    renderPin();
    await invoke<void>("write_config", { text: serializeConfig(config) });
    setStatus(
      next ? "Aken on kinnitatud ekraanile (alati esiplaanil)." : "Aken on vabastatud.",
      "info",
    );
  } catch (error) {
    setStatus(`Kinnitamise muutmine ebaõnnestus: ${messageOf(error)}`, "error");
  }
}

/** GitHubi võrguadapter: pääsuvõti ja päringud elavad Rusti poolel. */
const issueClient: IssueClient = {
  create: (input) =>
    invoke<{ number: number; url: string }>("github_create_issue", {
      repo: input.repo,
      title: input.title,
      body: input.body,
      label: input.label,
    }),
};

async function refreshTokenStatus(): Promise<void> {
  try {
    githubTokenPresent = await invoke<boolean>("github_token_status");
  } catch {
    githubTokenPresent = false;
  }
  githubTokenStatus.textContent = githubTokenPresent
    ? "Token on salvestatud Windowsi mandaadihoidlasse."
    : "Token puudub — ilma selleta Issue'sid ei saadeta.";
  githubTokenStatus.dataset.tone = githubTokenPresent ? "ok" : "error";
}

/** Seadete GitHub-osa nähtavus ja väljade väärtused. */
function renderGithub(resetCheckbox = false): void {
  if (config === null) return;
  githubEnabledCheckbox.checked = config.github.enabled;
  githubRepoInput.value = config.github.repo;
  githubLabelSelect.value = config.github.label;
  githubDefaultCheckbox.checked = config.github.send_by_default;
  githubSettingsRow.hidden = !config.github.enabled;

  const problem = repoError(config.github.repo, true);
  const ready = config.github.enabled && config.github.repo.trim() !== "" && problem === null;
  sendGithubRow.hidden = !ready;
  if (!ready) {
    sendGithubCheckbox.checked = false;
    if (config.github.enabled) {
      addNotice(
        `GitHubi Issue saatmine on sees, kuid hoidla seade vajab parandamist: ${problem ?? "hoidla on täpsustamata"}.`,
      );
    }
    return;
  }
  sendGithubLabel.value = config.github.label;
  if (resetCheckbox) sendGithubCheckbox.checked = config.github.send_by_default;
}

async function saveGithubCredential(): Promise<void> {
  const entered = githubTokenInput.value.trim();
  if (entered === "") {
    githubTokenStatus.textContent = "Sisesta väärtus enne salvestamist.";
    githubTokenStatus.dataset.tone = "error";
    return;
  }
  try {
    await invoke<void>("github_save_token", { value: entered });
    githubTokenInput.value = "";
    githubTestStatus.textContent = "";
    await refreshTokenStatus();
  } catch (error) {
    githubTokenStatus.textContent = `Salvestamine ebaõnnestus: ${errorText(error)}`;
    githubTokenStatus.dataset.tone = "error";
  }
}

async function clearGithubCredential(): Promise<void> {
  try {
    await invoke<void>("github_clear_token");
    await refreshTokenStatus();
  } catch (error) {
    githubTokenStatus.textContent = `Kustutamine ebaõnnestus: ${errorText(error)}`;
    githubTokenStatus.dataset.tone = "error";
  }
}

async function testGithub(): Promise<void> {
  const repo = githubRepoInput.value.trim();
  const problem = repoError(repo);
  if (problem !== null) {
    githubTestStatus.textContent = problem;
    githubTestStatus.dataset.tone = "error";
    return;
  }
  githubTestStatus.textContent = "Kontrollin…";
  githubTestStatus.dataset.tone = "";
  try {
    const info = await invoke<{ fullName: string; private: boolean; canPush: boolean }>("github_test", {
      repo,
    });
    githubTestStatus.textContent = info.canPush
      ? `OK: ${info.fullName}${info.private ? " (privaatne)" : ""} — Issue'de loomise õigus on olemas.`
      : `Hoidla ${info.fullName} leiti, kuid pääsuvõtil puudub Issues: write õigus.`;
    githubTestStatus.dataset.tone = info.canPush ? "ok" : "error";
  } catch (error) {
    githubTestStatus.textContent = errorText(error);
    githubTestStatus.dataset.tone = "error";
  }
}

function looksLikeQueuedIssue(value: unknown): value is QueuedIssue {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.repo === "string" &&
    typeof item.title === "string" &&
    typeof item.body === "string" &&
    typeof item.noteDir === "string" &&
    typeof item.noteFile === "string" &&
    isIssueLabel(item.label)
  );
}

async function loadQueue(): Promise<void> {
  try {
    const items = await invoke<unknown[]>("queue_load");
    issueQueue = Array.isArray(items) ? items.filter(looksLikeQueuedIssue) : [];
  } catch (error) {
    issueQueue = [];
    addNotice(`GitHubi järjekorra lugemine ebaõnnestus: ${messageOf(error)}`);
  }
}

async function persistQueue(): Promise<void> {
  try {
    await invoke<void>("queue_save", { items: issueQueue });
  } catch (error) {
    addNotice(`GitHubi järjekorra salvestamine ebaõnnestus: ${messageOf(error)}`);
  }
}

/** Tulemus nähtavasse kohta: kinnitusvaate all või staatusereal. */
function showGithubResult(message: string, tone: "ok" | "info" | "error"): void {
  if (!savedOverlay.hidden) {
    savedGithub.textContent = message;
    savedGithub.dataset.tone = tone;
    savedGithub.hidden = false;
    return;
  }
  setStatus(message, tone);
}

/**
 * Märkme saatmine GitHubi. Iga tulemus on kasutajale nähtav: õnnestumine, järjekord
 * (võrk/piirang) või viga. Märkmefail on sel hetkel juba salvestatud.
 */
async function sendToGithub(text: string, filename: string, createdAt: Date): Promise<void> {
  if (config === null) return;
  const chosen = sendGithubLabel.value;
  const label: IssueLabel = isIssueLabel(chosen) ? chosen : config.github.label;
  const sendConfig = cloneConfig(config);
  sendConfig.github.label = label;
  const stamp = formatDateTime(createdAt, config.storage.datetime_format);

  const result = await createIssueFromNote(text, {
    config: sendConfig,
    filename,
    stamp,
    client: issueClient,
  });

  if (result.ok) {
    try {
      await invoke<string>("save_note", {
        dir: notesDir,
        filename,
        content: composeIssueBackfill(result.issue),
        append: true,
      });
    } catch (error) {
      addNotice(`Issue loodi, kuid märkmesse ei saanud viidet lisada: ${messageOf(error)}`);
    }
    showGithubResult(`GitHub: [#${result.issue.number}](${result.issue.url})`, "ok");
    return;
  }

  if (result.failure.retryable && result.draft !== null) {
    const item = newQueuedIssue(
      {
        repo: sendConfig.github.repo.trim(),
        title: result.draft.title,
        body: result.draft.body,
        label,
        noteDir: notesDir,
        noteFile: filename,
        createdAt: new Date().toISOString(),
      },
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    );
    issueQueue = enqueue(issueQueue, item);
    await persistQueue();
    showGithubResult(
      `GitHub: ${result.failure.message} Saatmine on järjekorras (${issueQueue.length}).`,
      "info",
    );
    return;
  }

  showGithubResult(`GitHub: ${result.failure.message}`, "error");
}

/** Käivitamisel: saada uuesti see, mis eelmisel korral võrku ei jõudnud. */
async function retryQueue(): Promise<void> {
  if (config === null || !config.github.enabled || issueQueue.length === 0) return;
  if (!githubTokenPresent) {
    addNotice(`GitHubi järjekorras on ${issueQueue.length} märget, kuid pääsuvõti puudub.`);
    return;
  }

  let sent = 0;
  for (const item of [...issueQueue]) {
    const result = await sendQueuedIssue(item, issueClient);
    if (!result.ok) {
      addNotice(`GitHubi järjekord: ${result.failure.message}`);
      break;
    }
    try {
      await invoke<string>("save_note", {
        dir: item.noteDir,
        filename: item.noteFile,
        content: composeIssueBackfill(result.issue),
        append: true,
      });
    } catch (error) {
      addNotice(`Issue #${result.issue.number} loodi, kuid märkmesse ei saanud viidet lisada: ${messageOf(error)}`);
    }
    issueQueue = dequeue(issueQueue, item.id);
    await persistQueue();
    sent += 1;
  }
  if (sent > 0) addNotice(`GitHubi järjekorrast saadeti ${sent} Issue't.`);
}

/** Püsivad probleemid (seadistus, autostart) — ei kao salvestusteate tõttu. */
const notices: string[] = [];

function addNotice(text: string): void {
  if (notices.includes(text)) return;
  notices.push(text);
  noticeLine.textContent = notices.join(" · ");
  noticeLine.hidden = false;
}

function renderProblems(problems: ConfigProblem[], configFile: string): void {
  if (problems.length === 0) {
    problemList.hidden = true;
    problemList.replaceChildren();
    return;
  }
  const heading = document.createElement("li");
  heading.textContent = `Seadistuses ${configFile} on ${problems.length} probleemi; kasutusel on vaikeväärtused:`;
  const items = problems.map((problem) => {
    const item = document.createElement("li");
    item.textContent = `${problem.field} — ${problem.message}`;
    return item;
  });
  problemList.replaceChildren(heading, ...items);
  problemList.hidden = false;
  addNotice(`Seadistuses ${configFile} on ${problems.length} probleemi — kasutusel on vaikeväärtused.`);
}

/** Core annab kanoonilise kuju ("Ctrl+Alt+N"); plugin ootab väiketähti ("ctrl+alt+n"). */
function acceleratorOf(input: string): string {
  const hotkey = parseHotkey(input);
  return hotkey === null ? input : toAccelerator(hotkey);
}

/** Kiirklahvi kuvamise kuju: core kanooniline tekst (nt "Ctrl+Shift+1", "Enter"). */
function hotkeyLabel(input: string): string {
  const hotkey = parseHotkey(input);
  return hotkey === null ? input.trim() : formatHotkey(hotkey);
}

/** `aria-keyshortcuts` väärtus — WAI-ARIA nõuab Control/Escape, mitte Ctrl/Esc. */
function ariaShortcutOf(input: string): string {
  const hotkey = parseHotkey(input);
  if (hotkey === null) return "";
  const parts: string[] = [];
  if (hotkey.ctrl) parts.push("Control");
  if (hotkey.alt) parts.push("Alt");
  if (hotkey.shift) parts.push("Shift");
  if (hotkey.meta) parts.push("Meta");
  parts.push(hotkey.key === "Esc" ? "Escape" : hotkey.key);
  return parts.join("+");
}

/**
 * Nuppude klahvispikker ja tekstiala vihje. Kutsutakse nii käivitusel kui ka
 * seadete salvestamisel — spikker ei saa seadistusest erineda.
 */
function renderHotkeyHints(save: string, close: string): void {
  const saveLabel = hotkeyLabel(save);
  const closeLabel = hotkeyLabel(close);
  saveHint.textContent = saveLabel;
  cancelHint.textContent = closeLabel;
  saveButton.setAttribute("aria-keyshortcuts", ariaShortcutOf(save));
  cancelButton.setAttribute("aria-keyshortcuts", ariaShortcutOf(close));
  saveButton.title = `Salvesta märge (${saveLabel})`;
  cancelButton.title = `Tühista mustand (${closeLabel})`;

  const newline = saveLabel === "Ctrl+Enter" ? "" : ", Ctrl+Enter uus rida";
  draftInput.placeholder = `Kirjuta märge… (${saveLabel} salvestab${newline})`;
}

async function openWindow(): Promise<void> {
  clearSaved();
  await invoke<void>("show_main_window");
  draftInput.focus();
}

async function handleSave(): Promise<void> {
  if (saving || config === null || noteStore === null) return;
  saving = true;
  const draft = draftInput.value.trim();
  try {
    const result = await saveNote(draftInput.value, { clock, noteStore, config });
    if (!result.ok) {
      setStatus(result.error, "error");
      return;
    }
    draftInput.value = "";
    updateCounter();
    const githubRequested = !sendGithubRow.hidden && sendGithubCheckbox.checked;
    if (config.general.after_save === "confirm") {
      showSaved(draft);
    } else {
      setStatus(`Salvestatud: ${result.path}`, "ok");
    }
    if (githubRequested) void sendToGithub(draft, result.filename, result.createdAt);
  } catch (error) {
    setStatus(`Salvestamine ebaõnnestus: ${messageOf(error)}`, "error");
  } finally {
    saving = false;
  }
}

function handleCancel(): void {
  discardNote();
  draftInput.value = "";
  updateCounter();
  setStatus("Mustand tühistatud.", "info");
}

async function handleClose(): Promise<void> {
  await invoke<void>("hide_main_window");
}

/** Vaultide ripploend: tuvastatud vaultid + praegune väärtus, kui seda nimekirjas pole. */
function renderVaultOptions(current: string): void {
  const options: HTMLOptionElement[] = vaults.map((vault) => {
    const option = document.createElement("option");
    option.value = vault.path;
    option.textContent = `${vault.name} — ${vault.path}`;
    return option;
  });
  if (current.trim() !== "" && !vaults.some((vault) => vault.path === current)) {
    const option = document.createElement("option");
    option.value = current;
    option.textContent = `Praegune: ${current}`;
    options.unshift(option);
  }
  if (options.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "(Obsidiani vaulti ei leitud — vali kaust käsitsi)";
    options.push(option);
  }
  vaultSelect.replaceChildren(...options);
  vaultSelect.value = current.trim();
}

/** Salvestuskoha valik seadetes — tuletatakse seadistusest, eraldi välja ei lisata. */
type Location = "documents" | "desktop" | "custom";

/** Viimati valitud salvestuskoht (vajalik tee ümberarvutamiseks valiku muutmisel). */
let locationState: Location = "documents";

function currentLocation(storage: KiirmargeConfig["storage"]): Location {
  if (storage.default_to_desktop) return "desktop";
  return isAbsolutePath(storage.notes_dir) ? "custom" : "documents";
}

function notesDirLabelText(location: Location, obsidian: boolean): string {
  if (obsidian) return "Märkmete kaust (vaulti suhtes)";
  if (location === "desktop") return "Alamkausta nimi töölaual";
  if (location === "custom") return "Märkmete kaust (täistee)";
  return "Märkmete kaust (Dokumentide suhtes)";
}

/**
 * Tee, mis valitud seadetega tegelikult kasutusele tuleb. Kasutab sama
 * `resolveNotesDir`-i, mis salvestamisel — seega vihje ei saa tegelikust erineda.
 */
function resolvedDirFor(location: Location, notesDir: string): string {
  if (basePaths === null || config === null) return "";
  const preview = cloneConfig(config);
  preview.general.mode = modeSelect.value === "obsidian" ? "obsidian" : "standalone";
  preview.storage.vault = vaultSelect.value.trim();
  preview.storage.default_to_desktop = location === "desktop";
  preview.storage.notes_dir = notesDir;
  return resolveNotesDir(preview, basePaths);
}

/** Salvestuskohast sõltuvate väljade nähtavus, silt ja lahendatud tee. */
function updateLocationUi(): void {
  const obsidian = modeSelect.value === "obsidian";
  const location = locationSelect.value as Location;
  locationRow.hidden = obsidian;
  vaultRow.hidden = !obsidian;
  // Töölaua puhul on „Märkmete kaust" alamkausta nimi, mitte valitav tee.
  pickDirButton.hidden = obsidian || location === "desktop";
  notesDirLabel.textContent = notesDirLabelText(location, obsidian);
  notesDirInput.placeholder = obsidian
    ? "nt Kiirmärkmed (vaulti suhtes)"
    : location === "custom"
      ? "nt C:\\Users\\…\\Märkmed"
      : "nt Kiirmärkmed";

  if (config === null || basePaths === null) {
    notesDirResolved.textContent = "";
    return;
  }
  const typed = notesDirInput.value.trim();
  notesDirResolved.textContent =
    typed === "" ? "Märkmed: kaust on täpsustamata" : `Märkmed: ${resolvedDirFor(location, typed)}`;
}

function renderSettings(current: KiirmargeConfig): void {
  modeSelect.value = current.general.mode;
  renderVaultOptions(current.storage.vault);
  linkStyleSelect.value = current.storage.link_style;
  locationSelect.value = currentLocation(current.storage);
  locationState = locationSelect.value as Location;
  notesDirInput.value = current.storage.notes_dir;
  updateLocationUi();
  noteModeSelect.value = current.storage.note_mode;
  singleFileInput.value = current.storage.single_file;
  hotkeyOpenInput.value = current.hotkeys.open;
  hotkeySaveInput.value = current.hotkeys.save;
  hotkeyCloseInput.value = current.hotkeys.close;
  autostartCheckbox.checked = current.general.autostart;
  afterSaveSelect.value = current.general.after_save;
  singleFileRow.hidden = current.storage.note_mode !== "single-file";
  renderGithub();
}

async function pickNotesDir(): Promise<void> {
  try {
    const folder = await invoke<string | null>("pick_folder", { current: notesDirInput.value });
    if (folder !== null && folder.trim() !== "") {
      notesDirInput.value = folder;
      // Kaustavalija annab täisteekonna — see on „Kohandatud kaust".
      if (isAbsolutePath(folder)) {
        locationSelect.value = "custom";
        locationState = "custom";
      }
      updateLocationUi();
    }
  } catch (error) {
    setStatus(`Kausta valimine ebaõnnestus: ${messageOf(error)}`, "error");
  }
}

async function pickVault(): Promise<void> {
  try {
    const folder = await invoke<string | null>("pick_folder", {
      current: vaultSelect.value,
      title: "Vali Obsidiani vault",
    });
    if (folder !== null && folder.trim() !== "") renderVaultOptions(folder);
  } catch (error) {
    setStatus(`Vaulti valimine ebaõnnestus: ${messageOf(error)}`, "error");
  }
}

async function saveSettings(): Promise<void> {
  if (config === null || basePaths === null) return;

  const next = cloneConfig(config);
  const mode = modeSelect.value === "obsidian" ? "obsidian" : "standalone";
  next.general.mode = mode;
  next.storage.vault = vaultSelect.value.trim();
  next.storage.link_style =
    linkStyleSelect.value === "wiki"
      ? "wiki"
      : linkStyleSelect.value === "markdown"
        ? "markdown"
        : "auto";
  next.storage.notes_dir = notesDirInput.value.trim();
  const location = locationSelect.value as Location;
  next.storage.default_to_desktop = location === "desktop";
  next.storage.note_mode =
    noteModeSelect.value === "daily-note"
      ? "daily-note"
      : noteModeSelect.value === "single-file"
        ? "single-file"
        : "per-note";
  next.storage.single_file = singleFileInput.value.trim();
  next.general.autostart = autostartCheckbox.checked;
  next.general.after_save = afterSaveSelect.value === "confirm" ? "confirm" : "stay";
  next.hotkeys.open = hotkeyOpenInput.value.trim();
  next.hotkeys.save = hotkeySaveInput.value.trim();
  next.hotkeys.close = hotkeyCloseInput.value.trim();
  next.github.enabled = githubEnabledCheckbox.checked;
  next.github.repo = githubRepoInput.value.trim();
  next.github.label = isIssueLabel(githubLabelSelect.value)
    ? githubLabelSelect.value
    : config.github.label;
  next.github.send_by_default = githubDefaultCheckbox.checked;

  if (next.storage.notes_dir === "") {
    setStatus("Märkmete kaust ei tohi olla tühi.", "error");
    return;
  }
  if (mode === "standalone") {
    if (location === "custom" && !isAbsolutePath(next.storage.notes_dir)) {
      setStatus(
        `„Kohandatud kaust“ vajab täisteekonda (nt C:\\Users\\…\\Märkmed) — vali „Vali…“ või kleebi tee.`,
        "error",
      );
      return;
    }
    if (location !== "custom" && isAbsolutePath(next.storage.notes_dir)) {
      setStatus(
        location === "desktop"
          ? `„Töölaud“ kasutab ainult alamkausta nime — täisteekonna jaoks vali „Kohandatud kaust“.`
          : `„Dokumendid“ eeldab suhtelist kausta (nt Kiirmärkmed). Täisteekonna jaoks vali „Kohandatud kaust“.`,
        "error",
      );
      return;
    }
  }
  if (mode === "obsidian") {
    if (next.storage.vault === "") {
      setStatus("Obsidiani režiimis vali vault.", "error");
      return;
    }
    if (isAbsolutePath(next.storage.notes_dir)) {
      setStatus(
        "Obsidiani režiimis peab märkmete kaust olema vaulti suhtes (nt Kiirmärkmed) — absoluutne tee lülitaks vaulti välja.",
        "error",
      );
      return;
    }
  }
  if (next.storage.note_mode === "daily-note" && mode !== "obsidian") {
    setStatus("Päevamärkme režiim töötab ainult Obsidiani vaultis.", "error");
    return;
  }
  if (next.storage.note_mode === "single-file") {
    const problem = singleFileError(next.storage.single_file);
    if (problem !== null) {
      setStatus(problem, "error");
      return;
    }
  }
  const openProblem = hotkeyFieldError(next.hotkeys.open, false, false);
  if (openProblem !== null) {
    setStatus(`Globaalne kiirklahv: ${openProblem}`, "error");
    return;
  }
  const saveProblem = hotkeyFieldError(next.hotkeys.save, false, true);
  if (saveProblem !== null) {
    setStatus(`Salvestamise klahv: ${saveProblem}`, "error");
    return;
  }
  const closeProblem = hotkeyFieldError(next.hotkeys.close, false, true);
  if (closeProblem !== null) {
    setStatus(`Sulgemise klahv: ${closeProblem}`, "error");
    return;
  }
  if (next.github.enabled) {
    const repoProblem = repoError(next.github.repo);
    if (repoProblem !== null) {
      setStatus(`GitHub: ${repoProblem}`, "error");
      return;
    }
  }

  // Seadetes sisestatud pääsuvõti läheb kohe mandaadihoidlasse, mitte config.toml-i.
  const entered = githubTokenInput.value.trim();
  if (entered !== "") {
    try {
      await invoke<void>("github_save_token", { value: entered });
      githubTokenInput.value = "";
      await refreshTokenStatus();
    } catch (error) {
      setStatus(`Pääsuvõtme salvestamine ebaõnnestus: ${errorText(error)}`, "error");
      return;
    }
  }

  const hotkeyChanged = next.hotkeys.open !== config.hotkeys.open;

  try {
    await invoke<void>("write_config", { text: serializeConfig(next) });
    config = next;
    notesDir = resolveNotesDir(next, basePaths);
    saveHotkey = parseHotkey(next.hotkeys.save);
    closeHotkey = parseHotkey(next.hotkeys.close);
    hotkeyHint.textContent = next.hotkeys.open;
    renderHotkeyHints(next.hotkeys.save, next.hotkeys.close);
    updateLocationUi();
    renderGithub();
    void retryQueue();

    await invoke<void>("set_always_on_top", { value: next.general.always_on_top });
    const actualAutostart = await invoke<boolean>("sync_autostart", {
      enabled: next.general.autostart,
    });
    if (actualAutostart !== next.general.autostart) {
      addNotice(
        `Autostart on Windowsis ${actualAutostart ? "sees" : "väljas"}, kuigi seadistus ütleb ` +
          `${next.general.autostart ? "sees" : "väljas"}. Kontrolli õigusi.`,
      );
    }

    if (hotkeyChanged) {
      try {
        await unregisterAll();
        await register(acceleratorOf(next.hotkeys.open), () => {
          void openWindow();
        });
      } catch (error) {
        addNotice(
          `Uut kiirklahvi „${next.hotkeys.open}" ei saanud registreerida: ${messageOf(error)}`,
        );
      }
    }

    setStatus(`Seaded salvestatud. Märkmed: ${notesDir}`, "ok");
  } catch (error) {
    setStatus(`Seadete salvestamine ebaõnnestus: ${messageOf(error)}`, "error");
  }
}

async function bootstrap(): Promise<void> {
  const paths = await invoke<AppPaths>("app_paths");

  try {
    const obsidianText = await invoke<string | null>("read_obsidian_config");
    vaults = obsidianText === null ? [] : parseObsidianVaults(obsidianText);
  } catch {
    // Tuvastuse viga ei ole blokeeriv — vaulti saab seadetes käsitsi valida.
    vaults = [];
  }

  const configStore: ConfigStore = {
    read: () => invoke<string | null>("read_config"),
    write: (text) => invoke<void>("write_default_config", { text }),
    describeLocation: () => paths.configFile,
  };

  const loaded = await loadConfig(configStore);
  config = loaded.config;
  renderProblems(loaded.problems, paths.configFile);

  basePaths = { documents: paths.documents, desktop: paths.desktop };
  notesDir = resolveNotesDir(loaded.config, basePaths);

  noteStore = {
    exists: (filename) => invoke<boolean>("note_exists", { dir: notesDir, filename }),
    save: (filename, content, options) =>
      invoke<string>("save_note", {
        dir: notesDir,
        filename,
        content,
        append: options?.append ?? false,
      }),
  };

  saveHotkey = parseHotkey(loaded.config.hotkeys.save);
  closeHotkey = parseHotkey(loaded.config.hotkeys.close);
  hotkeyHint.textContent = loaded.config.hotkeys.open;
  renderSettings(loaded.config);
  renderPin();
  renderHotkeyHints(loaded.config.hotkeys.save, loaded.config.hotkeys.close);
  await refreshTokenStatus();
  await loadQueue();
  renderGithub(true);
  void retryQueue();

  await invoke<void>("set_always_on_top", { value: loaded.config.general.always_on_top });

  try {
    const actualAutostart = await invoke<boolean>("sync_autostart", {
      enabled: loaded.config.general.autostart,
    });
    if (actualAutostart !== loaded.config.general.autostart) {
      addNotice(
        `Autostart on Windowsis ${actualAutostart ? "sees" : "väljas"}, kuigi seadistus ütleb ` +
          `${loaded.config.general.autostart ? "sees" : "väljas"}. Kontrolli õigusi.`,
      );
    }
  } catch (error) {
    addNotice(`Autostardi seadistamine ebaõnnestus: ${messageOf(error)}`);
  }

  let registrationProblem = "";
  try {
    await unregisterAll();
    await register(acceleratorOf(loaded.config.hotkeys.open), () => {
      void openWindow();
    });
  } catch (error) {
    registrationProblem =
      `Kiirklahvi „${loaded.config.hotkeys.open}" ei saanud registreerida: ${messageOf(error)}. ` +
      `Muuda välja hotkeys.open failis ${paths.configFile}.`;
  }

  if (loaded.created) {
    await openWindow();
    setStatus(`Loodi seadistus ${paths.configFile}. Märkmed: ${notesDir}`, "info");
  }

  if (registrationProblem !== "") {
    addNotice(registrationProblem);
    await openWindow();
  }
}

saveButton.addEventListener("click", () => {
  void handleSave();
});

cancelButton.addEventListener("click", () => {
  handleCancel();
});

/** Rakendab core'ist tulnud tekstimuudatuse tekstialale. */
function applyTextEdit(edit: { text: string; start: number; end: number }): void {
  draftInput.value = edit.text;
  updateCounter();
  draftInput.setSelectionRange(edit.start, edit.end);
  draftInput.focus();
}

checkboxButton.addEventListener("click", () => {
  const start = draftInput.selectionStart ?? draftInput.value.length;
  const end = draftInput.selectionEnd ?? start;
  applyTextEdit(insertCheckbox(draftInput.value, start, end));
});

/** Ctrl+Enter lisab reavahetuse; märkeruudu real jätkab loendit. */
function insertNewline(): void {
  const start = draftInput.selectionStart ?? draftInput.value.length;
  const end = draftInput.selectionEnd ?? start;
  if (start === end) {
    const continued = continueChecklist(draftInput.value, start);
    if (continued !== null) {
      applyTextEdit(continued);
      return;
    }
  }
  const value = draftInput.value;
  draftInput.value = `${value.slice(0, start)}\n${value.slice(end)}`;
  updateCounter();
  const caret = start + 1;
  draftInput.setSelectionRange(caret, caret);
}

document.addEventListener("keydown", (event) => {
  // Kinnitusvaate ajal: Esc peidab akna kohe, muud klahvid ei tee midagi.
  if (!savedOverlay.hidden) {
    if (event.key === "Escape") {
      event.preventDefault();
      clearSaved();
      draftInput.value = "";
      updateCounter();
      void invoke<void>("hide_main_window");
    }
    return;
  }

  const target = event.target as HTMLElement | null;
  const inSettings = target !== null && target.closest("#settings") !== null;

  if (inSettings) {
    if (event.key === "Escape") {
      event.preventDefault();
      settingsPanel.hidden = true;
      draftInput.focus();
    }
    return;
  }

  if (saveHotkey !== null && hotkeyMatches(saveHotkey, event)) {
    event.preventDefault();
    void handleSave();
    return;
  }

  if (target === draftInput && event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    insertNewline();
    return;
  }

  if (closeHotkey !== null && hotkeyMatches(closeHotkey, event)) {
    event.preventDefault();
    void handleClose();
  }
});

toggleSettingsButton.addEventListener("click", () => {
  settingsPanel.hidden = !settingsPanel.hidden;
  if (!settingsPanel.hidden && config !== null) renderSettings(config);
});

noteModeSelect.addEventListener("change", () => {
  singleFileRow.hidden = noteModeSelect.value !== "single-file";
});

modeSelect.addEventListener("change", () => {
  if (modeSelect.value === "obsidian" && isAbsolutePath(notesDirInput.value.trim())) {
    notesDirInput.value = "Kiirmärkmed";
  }
  updateLocationUi();
});

locationSelect.addEventListener("change", () => {
  const next = locationSelect.value as Location;
  const typed = notesDirInput.value.trim();
  if (next === "custom") {
    // Näita seni kehtinud täisteekonda — valiku hetkel ei liigu märkmed kuhugi.
    if (!isAbsolutePath(typed)) notesDirInput.value = resolvedDirFor(locationState, typed);
  } else if (isAbsolutePath(typed)) {
    notesDirInput.value = "Kiirmärkmed";
  }
  locationState = next;
  updateLocationUi();
});

notesDirInput.addEventListener("input", updateLocationUi);
vaultSelect.addEventListener("change", updateLocationUi);

pickVaultButton.addEventListener("click", () => {
  void pickVault();
});

pickDirButton.addEventListener("click", () => {
  void pickNotesDir();
});

saveSettingsButton.addEventListener("click", () => {
  void saveSettings();
});

githubEnabledCheckbox.addEventListener("change", () => {
  githubSettingsRow.hidden = !githubEnabledCheckbox.checked;
});

githubSaveTokenButton.addEventListener("click", () => {
  void saveGithubCredential();
});

githubClearTokenButton.addEventListener("click", () => {
  void clearGithubCredential();
});

githubTestButton.addEventListener("click", () => {
  void testGithub();
});

pinButton.addEventListener("click", () => {
  void togglePin();
});

draftInput.addEventListener("input", updateCounter);
updateCounter();

window.addEventListener("focus", () => {
  draftInput.focus();
});

void bootstrap().catch((error: unknown) => {
  setStatus(`Käivitamine ebaõnnestus: ${messageOf(error)}`, "error");
  void invoke("show_main_window");
});