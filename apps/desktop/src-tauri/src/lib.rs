use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

mod github;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppPaths {
    documents: String,
    desktop: String,
    config_file: String,
}

fn path_string(path: &Path) -> String {
    path.display().to_string()
}

/// Kas kausta saab kirjutada — portatiivse režiimi eeldus.
fn is_writable(dir: &Path) -> bool {
    let probe = dir.join(".kiirmarge-kirjutustest");
    match fs::write(&probe, b"") {
        Ok(()) => {
            let _ = fs::remove_file(&probe);
            true
        }
        Err(_) => false,
    }
}

/// Portatiivne seadistus: `config.toml` exe kõrval, kui sinna saab kirjutada.
/// Nii ei jää rakendusest pärast kausta kustutamist midagi maha.
fn portable_config_file() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    let dir = exe.parent()?;
    let candidate = dir.join("config.toml");
    if candidate.is_file() {
        return Some(candidate);
    }
    if is_writable(dir) {
        return Some(candidate);
    }
    None
}

/// Varuplaan: `%APPDATA%\Kiirmarge\config.toml`, kui exe kaust on kirjutuskaitstud
/// (nt Program Files või võrguasukoht).
fn config_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let roaming = app
        .path()
        .config_dir()
        .map_err(|error| format!("Seadistuskausta ei leidnud: {error}"))?;
    Ok(roaming.join("Kiirmarge"))
}

pub(crate) fn config_file(app: &AppHandle) -> Result<PathBuf, String> {
    if let Some(path) = portable_config_file() {
        return Ok(path);
    }
    Ok(config_dir(app)?.join("config.toml"))
}

#[tauri::command]
fn app_paths(app: AppHandle) -> Result<AppPaths, String> {
    let documents = app
        .path()
        .document_dir()
        .map_err(|error| format!("Dokumentide kausta ei leidnud: {error}"))?;
    let desktop = app
        .path()
        .desktop_dir()
        .map_err(|error| format!("Töölaua kausta ei leidnud: {error}"))?;
    Ok(AppPaths {
        documents: path_string(&documents),
        desktop: path_string(&desktop),
        config_file: path_string(&config_file(&app)?),
    })
}

#[tauri::command]
fn read_config(app: AppHandle) -> Result<Option<String>, String> {
    let path = config_file(&app)?;
    match fs::read_to_string(&path) {
        Ok(text) => Ok(Some(text)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(format!("Seadistuse lugemine ebaõnnestus: {error}")),
    }
}

#[tauri::command]
fn write_default_config(app: AppHandle, text: String) -> Result<(), String> {
    let path = config_file(&app)?;
    if path.exists() {
        return Err("Seadistusfail on juba olemas — seda ei kirjutata üle.".to_string());
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Kausta loomine ebaõnnestus: {error}"))?;
    }
    let temporary = path.with_file_name("config.toml.tmp");
    fs::write(&temporary, text).map_err(|error| format!("Kirjutamine ebaõnnestus: {error}"))?;
    fs::rename(&temporary, &path)
        .map_err(|error| format!("Ümbernimetamine ebaõnnestus: {error}"))
}

/// Ainult turvalised failinimed: ilma teeeraldajateta ja ilma `..`.
fn safe_join(directory: &Path, filename: &str) -> Result<PathBuf, String> {
    let invalid = filename.is_empty()
        || filename.contains("..")
        || filename.chars().any(|symbol| {
            matches!(
                symbol,
                '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|'
            )
        });
    if invalid {
        return Err(format!("Failinimi ei ole lubatud: {filename}"));
    }
    Ok(directory.join(filename))
}

#[tauri::command]
fn note_exists(dir: String, filename: String) -> Result<bool, String> {
    let path = safe_join(Path::new(&dir), &filename)?;
    Ok(path.exists())
}

#[tauri::command]
fn save_note(
    dir: String,
    filename: String,
    content: String,
    append: Option<bool>,
) -> Result<String, String> {
    let directory = PathBuf::from(&dir);
    if !directory.is_absolute() {
        return Err(format!("Kaust peab olema absoluutne: {dir}"));
    }
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Kausta loomine ebaõnnestus: {error}"))?;
    let path = safe_join(&directory, &filename)?;
    let append = append.unwrap_or(false);

    let final_content = if append {
        match fs::read_to_string(&path) {
            Ok(previous) => {
                let addition = if previous.trim().is_empty() {
                    content.trim_start_matches('\n')
                } else {
                    content.as_str()
                };
                previous + addition
            }
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => content,
            Err(error) => {
                return Err(format!("Olemasoleva faili lugemine ebaõnnestus: {error}"));
            }
        }
    } else {
        if path.exists() {
            return Err(format!("Fail on juba olemas: {}", path_string(&path)));
        }
        content
    };

    let temporary = directory.join(format!("{filename}.tmp"));
    fs::write(&temporary, final_content)
        .map_err(|error| format!("Kirjutamine ebaõnnestus: {error}"))?;
    fs::rename(&temporary, &path)
        .map_err(|error| format!("Ümbernimetamine ebaõnnestus: {error}"))?;
    Ok(path_string(&path))
}

/// Seadete salvestamine rakendusest (kirjutab config.toml uuesti, kommentaaridega).
#[tauri::command]
fn write_config(app: AppHandle, text: String) -> Result<(), String> {
    let path = config_file(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Kausta loomine ebaõnnestus: {error}"))?;
    }
    let temporary = path.with_file_name("config.toml.tmp");
    fs::write(&temporary, text).map_err(|error| format!("Kirjutamine ebaõnnestus: {error}"))?;
    fs::rename(&temporary, &path)
        .map_err(|error| format!("Ümbernimetamine ebaõnnestus: {error}"))
}

/// Obsidiani seadistusfaili sisu (vaultide nimekiri). `None`, kui Obsidian pole paigaldatud.
#[tauri::command]
fn read_obsidian_config(app: AppHandle) -> Result<Option<String>, String> {
    let roaming = app
        .path()
        .config_dir()
        .map_err(|error| format!("Kasutajaprofiili kausta ei leidnud: {error}"))?;
    let path = roaming.join("obsidian").join("obsidian.json");
    match fs::read_to_string(&path) {
        Ok(text) => Ok(Some(text)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(format!("Obsidiani seadistuse lugemine ebaõnnestus: {error}")),
    }
}

/// Kaustavalija (native dialoog). Kasutatakse märkmete kausta ja vaulti valimiseks.
#[tauri::command]
async fn pick_folder(
    app: AppHandle,
    current: Option<String>,
    title: Option<String>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let title = title.unwrap_or_else(|| "Vali kaust".to_string());
    let mut builder = app.dialog().file().set_title(title);
    if let Some(dir) = current {
        if !dir.trim().is_empty() {
            builder = builder.set_directory(&dir);
        }
    }
    Ok(builder
        .blocking_pick_folder()
        .and_then(|path| path.into_path().ok())
        .map(|path| path_string(&path)))
}

fn main_window(app: &AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window("main")
        .ok_or_else(|| "Põhiakent ei leidnud".to_string())
}

#[tauri::command]
fn show_main_window(app: AppHandle) -> Result<(), String> {
    let window = main_window(&app)?;
    // Minimeeritud aken tuleb enne kuvamist taastada — muidu jääb see taskbarile.
    window.unminimize().map_err(|error| error.to_string())?;
    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())
}

#[tauri::command]
fn hide_main_window(app: AppHandle) -> Result<(), String> {
    main_window(&app)?.hide().map_err(|error| error.to_string())
}

#[tauri::command]
fn set_always_on_top(app: AppHandle, value: bool) -> Result<(), String> {
    main_window(&app)?
        .set_always_on_top(value)
        .map_err(|error| error.to_string())
}

fn show_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        // Salveikoonilt või teisest eksemplarist avades peab ka minimeeritud aken taastuma.
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// Süsteemisalve ikoon koos menüüga „Ava" ja „Välju".
fn build_tray(app: &AppHandle) -> Result<(), String> {
    let open = MenuItem::with_id(app, "open", "Ava kiirmärge", true, None::<&str>)
        .map_err(|error| error.to_string())?;
    let quit = MenuItem::with_id(app, "quit", "Välju", true, None::<&str>)
        .map_err(|error| error.to_string())?;
    let menu = Menu::with_items(app, &[&open, &quit]).map_err(|error| error.to_string())?;

    let mut builder = TrayIconBuilder::with_id("main")
        .tooltip("Kiirmärge")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_window(tray.app_handle());
            }
        });

    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }

    builder.build(app).map_err(|error| error.to_string())?;
    Ok(())
}

/// Seab OS-i autostardi vastavaks seadistusele ja tagastab tegeliku oleku.
#[tauri::command]
fn sync_autostart(app: AppHandle, enabled: bool) -> Result<bool, String> {
    let manager = app.autolaunch();
    if enabled {
        manager
            .enable()
            .map_err(|error| format!("Autostardi sisselülitamine ebaõnnestus: {error}"))?;
    } else {
        manager
            .disable()
            .map_err(|error| format!("Autostardi väljalülitamine ebaõnnestus: {error}"))?;
    }
    manager
        .is_enabled()
        .map_err(|error| format!("Autostardi oleku lugemine ebaõnnestus: {error}"))
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Üks eksemplar: teine käivitus näitab olemasoleva akna ja lõpetab töö.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_window(app);
        }))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            app.handle().plugin(tauri_plugin_autostart::init(
                MacosLauncher::LaunchAgent,
                None::<Vec<&str>>,
            ))?;
            if let Err(error) = build_tray(app.handle()) {
                eprintln!("Salve ikooni loomine ebaõnnestus: {error}");
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            // Sulgenupp (X) peidab akna — rakendus jääb salve ikoonile.
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            app_paths,
            read_config,
            write_default_config,
            note_exists,
            save_note,
            write_config,
            read_obsidian_config,
            pick_folder,
            show_main_window,
            hide_main_window,
            set_always_on_top,
            sync_autostart,
            github::github_token_status,
            github::github_save_token,
            github::github_clear_token,
            github::github_test,
            github::github_create_issue,
            github::queue_load,
            github::queue_save
        ])
        .run(tauri::generate_context!())
        .expect("rakenduse käivitamine ebaõnnestus");
}
#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn test_dir(name: &str) -> PathBuf {
        let dir = env::temp_dir().join(format!("kiirmarge-test-{name}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).expect("testkausta loomine");
        dir
    }

    #[test]
    fn safe_join_lubab_tavalist_failinime() {
        let path = safe_join(Path::new("C:\\test"), "2026-10-20-012014.md").expect("peaks lubama");
        assert_eq!(path, Path::new("C:\\test\\2026-10-20-012014.md"));
    }

    #[test]
    fn safe_join_keelab_tee_eraldajad_ja_ulemkausta() {
        let dir = Path::new("C:\\test");
        assert!(safe_join(dir, "..\\kurjast.md").is_err());
        assert!(safe_join(dir, "../kurjast.md").is_err());
        assert!(safe_join(dir, "alam\\fail.md").is_err());
        assert!(safe_join(dir, "C:kurjast.md").is_err());
        assert!(safe_join(dir, "").is_err());
    }

    #[test]
    fn save_note_kirjutab_faili_ja_ei_luba_kordamist() {
        let dir = test_dir("save");
        let directory = dir.display().to_string();
        let path = save_note(
            directory.clone(),
            "2026-10-20-012014.md".to_string(),
            "# Kiirmärge\n\nsisu\n".to_string(),
            None,
        )
        .expect("salvestus peaks õnnestuma");

        assert_eq!(fs::read_to_string(&path).expect("lugemine"), "# Kiirmärge\n\nsisu\n");
        assert!(note_exists(directory.clone(), "2026-10-20-012014.md".to_string()).expect("kontroll"));

        let second = save_note(
            directory.clone(),
            "2026-10-20-012014.md".to_string(),
            "teine\n".to_string(),
            None,
        );
        assert!(second.is_err(), "olemasolevat faili ei tohi üle kirjutada");

        let third = save_note(
            directory,
            "2026-10-20-012015.md".to_string(),
            "kolmas\n".to_string(),
            None,
        );
        assert!(third.is_ok());

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn save_note_keeldub_suhtelisest_teest() {
        let result = save_note("Kiirmärkmed".to_string(), "a.md".to_string(), "x".to_string(), None);
        assert!(result.is_err());
    }

    #[test]
    fn save_note_lisab_liitfaili_loppu() {
        let dir = test_dir("append");
        let directory = dir.display().to_string();
        let first = save_note(
            directory.clone(),
            "Kiirmärkmed.md".to_string(),
            "# Kiirmärkmed\n\n---\n\n## 2026-10-20 02:31\n\nEsimene\n".to_string(),
            None,
        )
        .expect("esimene kirjutus");
        assert!(first.ends_with("Kiirmärkmed.md"));

        save_note(
            directory.clone(),
            "Kiirmärkmed.md".to_string(),
            "\n---\n\n## 2026-10-20 02:32\n\nTeine\n".to_string(),
            Some(true),
        )
        .expect("lisamine");

        let content = fs::read_to_string(dir.join("Kiirmärkmed.md")).expect("lugemine");
        assert!(content.contains("Esimene"));
        assert!(content.contains("Teine"));
        assert_eq!(content.matches("# Kiirmärkmed").count(), 1, "pealkirja ei tohi korrata");

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn note_exists_vastab_ka_olematule() {
        let dir = test_dir("exists");
        assert!(!note_exists(dir.display().to_string(), "puudub.md".to_string()).expect("kontroll"));
        let _ = fs::remove_dir_all(&dir);
    }
}
