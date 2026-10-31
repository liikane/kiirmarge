# Kiirmärge — User guide

> English translation of [`KASUTUS.md`](KASUTUS.md) (Estonian is the source of truth; keep both in sync).
> Glossary: *märge/märkmed* = note(s), *vault* = Obsidiani vault, *liitfail* = single combined file,
> *päevamärge* = daily note, *arendusring* = development cycle.

Kiirmärge is a portable Windows quick-note app: a global hotkey opens a small window and
**Enter** saves the note as a Markdown file. There is no installer — the app is a single exe and
its configuration lives next to it.

> This guide is for users. Development details (architecture, tests, build) are in chapter 8
> and in `docs/PLAAN.md` (Estonian).

---

## 1. What it is

| Question | Answer |
|----------|--------|
| What for? | Jot down a thought or task in seconds, without hunting for a window or using the mouse |
| Where does it save? | As Markdown in the chosen folder (Documents, Desktop, a custom folder, or an Obsidian vault) |
| What does it need? | Windows 10/11 + WebView2 (built into Windows 11) |
| Is there an installer? | No. One `.exe`, with `config.toml` next to it |
| Does it work without Obsidian? | Yes — standalone mode is the default |

## 2. Installation and launch

### 2.1 Requirements

| Item | Requirement |
|------|-------------|
| OS | Windows 10/11 (Windows 10 needs the WebView2 Runtime) |
| Disk | ~15 MB free for the exe and notes |

### 2.2 Without an installer (regular user)

1. Copy `kiirmarge.exe` to a folder of your choice (e.g. `C:\Tools\Kiirmarge\` or the desktop).
   The folder must be **writable** for portable configuration; otherwise the app uses
   `%APPDATA%\Kiirmarge\config.toml`.
2. Start the exe by **double-clicking** it or via Win+R (full path → Enter). No console window opens.
3. On first launch `config.toml` is created next to the exe and the window is shown automatically.
4. Optional: ⚙ → **Start when the computer starts** → "Save settings". The app then starts at
   Windows sign-in (this writes one registry entry).

The close button (X) **does not quit** the app — the window is hidden and the app stays in the tray.
To quit: right-click the tray icon → **Exit** ("Välju").

### 2.3 For developers (from source)

```powershell
npm install

# development (Vite + Tauri, window opens)
npm run tauri --workspace @kiirmarge/desktop -- dev

# standalone binary (front-end is bundled in)
npm run tauri --workspace @kiirmarge/desktop -- build --debug --no-bundle
# -> C:\kt\memilla\debug\kiirmarge.exe
```

**Why `C:\kt\memilla`?** The project sits in a very long folder path and Windows' 260-character
limit breaks linking (error **LNK1104**). That is why `apps/desktop/src-tauri/.cargo/config.toml`
contains `target-dir = "C:/kt/memilla"`. If you move to a shorter path you may remove that line.

`cargo build` alone produces a binary that waits for the dev server `http://localhost:1420` — use
`tauri ... dev` for that. For a release build omit `--debug` (output in `C:\kt\memilla\release\`).

## 3. First launch

1. The app starts with a **hidden window**, registers the global hotkey **Ctrl+Shift+1** and adds a
   **tray icon** (Windows 11 initially hides new icons in the overflow area — "Show hidden icons").
2. On first launch the configuration is created and the window is shown right away.
3. Type text and press **Enter** — the note is in the file. The window stays open (by default), so
   you can jot down the next thought immediately.

## 4. Everyday use

### 4.1 Keys

| Key | What it does |
|-----|--------------|
| `Ctrl+Shift+1` | show the window (global, configurable in settings) |
| `Enter` | save the note |
| `Ctrl+Enter` | line break in the text (on a checkbox line it continues the list) |
| `Esc` | hide the window (in the settings panel it closes the panel) |

The "Save" and "Cancel" buttons show a **key hint** (`Enter`, `Esc`) that updates automatically
when you change the save or close key in settings.

### 4.2 Ways of saving

| Mode | Result |
|------|--------|
| **One file per note** (default) | `2026-10-25-091500.md` — each note in its own file; if the same second repeats, `-2` is appended |
| **All notes in one file** | everything goes into a single `Kiirmärkmed.md`, notes separated by `---`; the title is not repeated |
| **Obsidian daily note** (`daily-note`; only in "Obsidian vault" mode) | today's `YYYY-MM-DD.md` in the vault's notes folder; each thought is appended as a task `- [ ] <note>`. The file is created if missing. You can later turn the thought into action or tick it off |

### 4.3 Checkboxes and counter

- The **☑** button (in the header next to 📌 and ⚙) inserts a Markdown checkbox `- [ ] ` at the cursor.
- `Ctrl+Enter` on a checkbox line continues the list with a new `- [ ] `.
- Below the text area there is a **word and character counter** that updates as you type.

### 4.4 After saving

Settings let you choose between two behaviours:

| Option | Behaviour |
|--------|-----------|
| **Window stays open** (default) | the note is saved, the window stays in place and is immediately ready for the next note |
| **Show "Saved!" for 5 s and hide the window** | the window is covered by a confirmation with the saved text, hides after 5 seconds and is available again via the tray icon or hotkey |

During the confirmation view, **Esc** hides the window immediately.

## 5. Practical examples

### Example 1 — a thought to the desktop (without Obsidian)

1. ⚙ → **Save location: Desktop** → "Save settings". Under the field you will see
   "Notes: `C:\Users\<you>\Desktop\Kiirmärkmed`" — the path comes from Windows, so it works even
   if the desktop is redirected to OneDrive or renamed.
2. `Ctrl+Shift+1` → type "Call Lauri, ask about the offer" → **Enter**.
3. The desktop now has a `Kiirmärkmed` folder containing `2026-10-25-091500.md`.

### Example 2 — a task into an Obsidian vault

1. ⚙ → **Mode: Obsidian vault** → choose the vault → **Notes folder** (relative to the vault, e.g.
   `Kiirmärkmed`) → "Save settings".
2. Open Kiirmärge, press **☑** (inserts `- [ ] `), type "Write up Issue #12 implementation" → **Enter**.
3. The file is in the vault under `Kiirmärkmed/…md` and the line is a real task in Obsidian that
   you can tick off.

### Example 3 — all notes in one file, with confirmation view

1. ⚙ → **Save mode: All notes in one file** → **Combined file name: `Kiirmärkmed.md`**
   → **After saving: Show "Saved!" for 5 s** → "Save settings".
2. Type a note → **Enter** → you see "Saved!" with the text; after 5 seconds the window is hidden.
3. All notes accumulate chronologically in the same file — handy for writing a single stream
   throughout the day.

### Example 4 — a note goes to a file and a GitHub Issue at once

1. ⚙ → **Also send the note as a GitHub Issue** → **repository** `liikane/kiirmarge` →
   **default label** (e.g. "Suggestion") → paste a **GitHub token** and press **Save key** →
   **Test connection** (must say "OK: … Issues: permission to create exists") → "Save settings".
2. Open Kiirmärge, type e.g. "Fix hotkey after sleep mode" and choose the type "Bug" next to the checkbox.
3. **Enter** — the note file is saved immediately (as always); once the Issue is created, a line
   `GitHub: [#12](…)` is appended to the file and the window shows the Issue link.
4. If there is no network, or GitHub answers 5xx/rate-limit, sending stays **queued**
   (`github-queue.json` next to the configuration) and is retried at the next launch or when
   settings are saved.

## 6. Settings

### 6.1 In the app (⚙)

| Setting | What it does |
|---------|--------------|
| Mode | `Standalone` (Documents/Desktop) or `Obsidian vault` |
| Obsidian vault | choose a vault (the list is detected from Obsidian's configuration; manual choice also works) |
| **Save location** | `Documents` · `Desktop` · `Custom folder`; the resolved path is shown below |
| Notes folder | Documents/Desktop: relative name; Custom: full path ("Choose…") |
| Save mode | one file per note, all in one file, or Obsidian daily note |
| Combined file name | name of the combined file (e.g. `Kiirmärkmed.md`) |
| Link style | automatic / wiki `[[…]]` / Markdown `[…](…)` |
| Hotkey to open the window | global hotkey (default `Ctrl+Shift+1`) |
| Save key | default `Enter` (`Ctrl+Enter` always stays a line break) |
| Close key | default `Esc` |
| Start when the computer starts | autostart |
| Configuration storage | `File in the same folder` (default) or `Windows registry` (`HKCU\Software\Kiirmarge`); the configuration is migrated when you switch |
| After saving | window stays open or 5 s confirmation |
| Also send the note as a GitHub Issue | turns GitHub on and shows the checkbox in the note window |
| GitHub repository | `owner/name`, e.g. `liikane/kiirmarge` |
| Default label | `bug` / `idea` / `enhancement` / `documentation` |
| GitHub token | stored in the **Windows Credential Manager**, not in `config.toml` |

### 6.2 Manually (`config.toml`)

The file is **next to the exe**; if it cannot be written there, then `%APPDATA%\Kiirmarge\config.toml`.
Edit values and restart the app (or change settings in the app — the file is then rewritten and
comments are preserved).

| Field | Meaning |
|-------|---------|
| `general.mode` | `standalone` or `obsidian` (+ `storage.vault`) |
| `general.after_save` | `stay` = window stays open; `confirm` = 5 s confirmation |
| `general.always_on_top` | whether the window is always on top |
| `general.autostart` | `true` = start at Windows sign-in |
| `storage.notes_dir` | relative name (Documents/Desktop/vault) or full path |
| `storage.default_to_desktop` | `true` = notes go to a desktop subfolder; **in standalone mode** (in Obsidian mode the vault decides) |
| `storage.note_mode` | `per-note` = each note in its own file; `single-file` = all in one; `daily-note` = today's Obsidian daily note as a task |
| `storage.single_file` | combined file name when `note_mode = "single-file"` |
| `storage.filename_format` | filename template, default `YYYY-MM-DD-HHmmss.md` |
| `hotkeys.open` | global hotkey (must include a modifier key) |
| `hotkeys.save` / `hotkeys.close` | in-window keys (`Enter` / `Esc`); a single key is allowed |

Example: `docs/config.example.toml`.

With an invalid value **the app does not crash**: the default is used and the window shows a list
of problems.

### 6.3 Where files go

| File | Location |
|------|----------|
| Configuration | `config.toml` next to the exe (portable) or `%APPDATA%\Kiirmarge\config.toml` — see `docs/SEADISTUSE-ASUKOHT.md` (Estonian) |
| Notes | the place chosen in settings (`storage.notes_dir`, `storage.default_to_desktop`); the exact path is shown in settings |
| Combined file | in the folder selected by `storage.single_file` |

Note content:

```markdown
# Kiirmärge

**2026-10-25 09:15**

<your text>
```

### 6.4 GitHub token and permissions

Creating Issues requires a GitHub access token (PAT). One repository and one permission are enough:

1. On GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
   → "Generate new token".
2. **Repository access**: only this repository (e.g. `liikane/kiirmarge`).
3. **Permissions → Repository permissions → Issues: Read and write**.
4. Copy the token (it is shown only once) → in the app ⚙ → **GitHub token** field
   → **Save key**.
5. **Test connection** tells you whether the repository is visible and whether permission to create
   Issues exists.

The token is stored in the **Windows Credential Manager** (entry `Kiirmarge`), not in `config.toml`
or in notes. **Delete key** removes it from there.

## 7. Troubleshooting

| Symptom | Cause and fix |
|---------|---------------|
| "Could not register hotkey …" | the combination is taken by the OS → change `hotkeys.open`; the window is shown automatically |
| Window does not open with the hotkey | another program uses the same combination; or restart the app |
| "Desktop" does not put files on the desktop | check the "Notes: …" path shown in settings; if the desktop is redirected to OneDrive, the app uses Windows' real desktop |
| "Custom folder" does not save | the field needs a full path (`C:\…`) — use "Choose…" |
| Minimized window does not come to the front | old binary (before 20.10.2026) did not restore a minimized window — rebuild/update the exe |
| `cargo build` gives a linker error | MSVC Build Tools missing → `winget install Microsoft.VisualStudio.2022.BuildTools` (VC.Tools + Windows SDK) |
| `LNK1104: cannot open file ...target\debug\build\...` | path too long → `apps/desktop/src-tauri/.cargo/config.toml` (`target-dir = "C:/kt/memilla"`) |
| Note is not saved | see the error message under the window; the path must be absolute and writable |
| "GitHub token missing" | no key saved → ⚙ → "GitHub token" field → **Save key** |
| "GitHub token is invalid or expired" | the token was revoked or changed → create a new one and save it |
| "Repository not found or no access" | wrong repository name, or the token has no permission for this repo |
| "… missing permission … Issues: write" | give the token **Issues: Read and write** |
| "GitHub did not accept the Issue" (422) | e.g. the label does not exist in the repository → create it (`bug`, `idea`, …) or choose an existing one |
| "GitHub rate limit reached" | wait for the limit to pass; the note is queued and will go out by itself |

## 8. For developers

| File | Contents |
|------|----------|
| `packages/core` | pure TS: configuration, note format, hotkeys, paths, use cases + tests |
| `apps/desktop/src/main.ts` | UI logic: loading configuration, saving, hotkeys, settings panel |
| `apps/desktop/src-tauri/src/lib.rs` | Rust commands (config, notes, window, tray icon, dialog), single instance, autostart |
| `apps/desktop/src-tauri/capabilities/default.json` | permissions (global hotkey) |

Checks:

```powershell
npm test                # core tests
npm run typecheck       # core + desktop
cd apps/desktop/src-tauri; cargo test   # Rust tests
```

## 9. Related documents

| File | Contents |
|------|----------|
| `README.en.md` | short introduction and quick start |
| `docs/PLAAN.md` | architecture and development plan (E1–E10), Estonian only |
| `docs/SEADISTUSE-ASUKOHT.md` | why the configuration lives next to the exe, Estonian only |
| `docs/RAPORT-ISSUE-*.md` | implementation and checks of individual Issues, Estonian only |
| `docs/config.example.toml` | example configuration with comments |
