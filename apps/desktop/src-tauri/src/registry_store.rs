//! Seadistuse hoidmine Windowsi registris (valikuline; vaikimisi on seadistus failis).
//!
//! `HKCU\Software\Kiirmarge`:
//! - `ConfigStorage` = `registry` → seadistus on registris; puudub või muu väärtus → fail.
//! - `Config` = `config.toml` sisu.

use winreg::enums::{HKEY_CURRENT_USER, KEY_READ, KEY_WRITE};
use winreg::RegKey;

const KEY_PATH: &str = r"Software\Kiirmarge";
const STORAGE_VALUE: &str = "ConfigStorage";
const CONFIG_VALUE: &str = "Config";
const REGISTRY: &str = "registry";

fn open_read() -> Option<RegKey> {
    RegKey::predef(HKEY_CURRENT_USER)
        .open_subkey_with_flags(KEY_PATH, KEY_READ)
        .ok()
}

fn open_write() -> Result<RegKey, String> {
    RegKey::predef(HKEY_CURRENT_USER)
        .create_subkey_with_flags(KEY_PATH, KEY_READ | KEY_WRITE)
        .map(|(key, _)| key)
        .map_err(|error| format!("Registrivõtme avamine ebaõnnestus: {error}"))
}

/// Kas seadistus on valitud hoidma registris.
pub(crate) fn is_enabled() -> bool {
    open_read()
        .and_then(|key| key.get_value::<String, _>(STORAGE_VALUE).ok())
        .is_some_and(|value| value == REGISTRY)
}

pub(crate) fn read() -> Result<Option<String>, String> {
    let Some(key) = open_read() else {
        return Ok(None);
    };
    match key.get_value::<String, _>(CONFIG_VALUE) {
        Ok(text) => Ok(Some(text)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(format!("Seadistuse lugemine registrist ebaõnnestus: {error}")),
    }
}

pub(crate) fn write(text: &str) -> Result<(), String> {
    open_write()?
        .set_value(CONFIG_VALUE, &text)
        .map_err(|error| format!("Seadistuse kirjutamine registrisse ebaõnnestus: {error}"))
}

/// Lülitab valiku sisse. Sisse lülitades kirjutatakse praegune seadistus registrisse enne,
/// kui valik jõustub — nii ei jää rakendus tühja seadistusega.
pub(crate) fn enable(current_text: Option<&str>) -> Result<(), String> {
    if let Some(text) = current_text {
        write(text)?;
    }
    open_write()?
        .set_value(STORAGE_VALUE, &REGISTRY)
        .map_err(|error| format!("Registrisse kirjutamine ebaõnnestus: {error}"))
}

/// Lülitab valiku välja ja eemaldab seadistuse registrist (rakendus ei jäta jälgi).
pub(crate) fn disable() -> Result<(), String> {
    let Some(key) = open_read().map(|_| open_write()).transpose()? else {
        return Ok(());
    };
    for name in [STORAGE_VALUE, CONFIG_VALUE] {
        if let Err(error) = key.delete_value(name) {
            if error.kind() != std::io::ErrorKind::NotFound {
                return Err(format!("Registrikirje kustutamine ebaõnnestus: {error}"));
            }
        }
    }
    Ok(())
}
