# Kiirmärge

> English translation of [`README.md`](README.md) (Estonian is the source of truth). Full user guide:
> [`docs/USAGE.en.md`](docs/USAGE.en.md).

A portable quick-note app for Windows: a global hotkey opens a small window, **Enter** saves the
note as a Markdown file. No installer needed — the app is a single exe, and its configuration lives next to it.

> The name `kiirmarge` is a working title (Memilla is also under consideration). The project folder is called `Memilla`.

## Current state

- **Global hotkey** (default `Ctrl+Shift+1`) opens the window; **Esc** hides it.
- **Tray icon** with a menu "Open Kiirmärge" / "Exit"; the close button (X) hides the window and does not quit the app.
- **Single instance** — a second launch brings the existing window to the front.
- **In-app settings** (⚙): notes folder, one-file/combined-file mode, hotkeys, autostart.
- **Save location** in settings: Documents / Desktop / custom folder. The Desktop path is asked from
  Windows (known folder), so it works even if the desktop is redirected to OneDrive.
- **Key hints on buttons**: "Save" and "Cancel" show the active key (`Enter`/`Esc`) and it updates with the settings.
- **Obsidian daily note**: in Obsidian mode a note can be appended to today's `YYYY-MM-DD.md` as a task `- [ ] …`.
- **GitHub Issue (optional)**: the checkbox "Also send as GitHub Issue" — the note is saved to a file and
  additionally sent as an Issue to the chosen repository (label bug/idea/enhancement/documentation).
  The token is stored in the Windows Credential Manager; if sending fails offline, it is queued and goes out later.
- **Portable configuration**: `config.toml` next to the exe; if the folder is read-only, then
  `%APPDATA%\Kiirmarge\config.toml`.
- Notes: Markdown, by default `# Kiirmärge` + timestamp + text (or everything in one combined file).

## Requirements

| Item | Requirement |
|------|-------------|
| OS | Windows 10/11 (WebView2 is included in Windows 11; Windows 10 needs the WebView2 Runtime) |
| Node | 24+ (npm 11) |
| Rust | 1.77.2+ |
| MSVC | Visual Studio Build Tools 2022 + Windows SDK (`link.exe` is required) |

Install MSVC: `winget install Microsoft.VisualStudio.2022.BuildTools` (components
`VC.Tools.x86.x64` + `Windows11SDK.*`).

## Quick start

```powershell
npm install

# development (Vite + Tauri, window opens)
npm run tauri --workspace @kiirmarge/desktop -- dev

# standalone binary (front-end is bundled in)
npm run tauri --workspace @kiirmarge/desktop -- build --debug --no-bundle
```

## Tests

```powershell
npm test                # core (node --test)
npm run typecheck       # core + desktop (tsc --noEmit)
cd apps/desktop/src-tauri; cargo test   # Rust: file paths, combined file
```

## Keys

| Key | What it does |
|-----|--------------|
| `Ctrl+Shift+1` | show the window (global, configurable in settings) |
| `Enter` | save the note |
| `Ctrl+Enter` | line break in the text |
| `Esc` | hide the window (in the settings panel it closes the panel) |

## Where files go

| File | Location |
|------|----------|
| Configuration | `config.toml` next to the exe (portable) or `%APPDATA%\Kiirmarge\config.toml` |
| Notes | the folder chosen in settings (`storage.notes_dir`); one file per note, a combined file, or a daily note |

## Structure

```
packages/core/          pure TypeScript, platform independent
apps/desktop/           Tauri 2 shell (UI in src/main.ts, Rust commands in src-tauri/src/lib.rs)
docs/                   plan, reports, user guide
```

Principle: **business logic lives in `packages/core` and is tested**; Rust only does OS operations
(files, window, tray icon, dialog). Core must not import Tauri APIs.

## Documents

| File | Contents |
|------|----------|
| `docs/USAGE.en.md` | user guide (installation, examples, settings, troubleshooting) |
| `docs/KASUTUS.md` | the same guide in Estonian |
| `docs/PLAAN.md`, `docs/SEADISTUSE-ASUKOHT.md`, `docs/RAPORT-*.md` | plan, design decisions and reports (Estonian only) |

## License

**Undecided.** Before making the repository public, choose a license (e.g. MIT) or keep the repo private.
