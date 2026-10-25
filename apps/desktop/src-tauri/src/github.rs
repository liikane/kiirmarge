// GitHubi Issue integratsioon: pääsuvõti (PAT) Windowsi mandaadihoidlas, REST-päringud ja
// võrguühenduseta tekkinud Issue'de järjekord.
//
// Pääsuvõti ei lähe kunagi veebiview'sse ega seadistusfaili — see salvestatakse
// Windowsi mandaadihoidlasse (Credential Manager) ja loetakse ainult siin, Rusti poolel.
// JS saab üksnes oleku (kas võti on olemas) ja päringute tulemused.

use std::fs;
use std::path::PathBuf;
use std::time::Duration;

use serde::Serialize;
use serde_json::json;
use tauri::AppHandle;

use crate::config_file;

const CREDENTIAL_SERVICE: &str = "Kiirmarge";
const CREDENTIAL_USER: &str = "github";
const GITHUB_API: &str = "https://api.github.com";

/// Viga, mis jõuab JS-i `invoke`-i `catch`-i. `retryable` ütleb, kas tasub hiljem uuesti proovida.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiError {
    message: String,
    retryable: bool,
}

impl ApiError {
    fn fatal(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            retryable: false,
        }
    }

    fn retry(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            retryable: true,
        }
    }
}

fn credential_entry() -> Result<keyring::Entry, ApiError> {
    keyring::Entry::new(CREDENTIAL_SERVICE, CREDENTIAL_USER)
        .map_err(|error| ApiError::fatal(format!("Mandaadihoidla avamine ebaõnnestus: {error}")))
}

/// Loeb pääsuvõtme mandaadihoidlast. Puudumine on tavaline olek, mitte krahh.
fn read_credential() -> Result<String, ApiError> {
    match credential_entry()?.get_password() {
        Ok(value) if !value.trim().is_empty() => Ok(value),
        Ok(_) => Err(ApiError::fatal(
            "Salvestatud pääsuvõti on tühi — sisesta see seadetes uuesti.",
        )),
        Err(keyring::Error::NoEntry) => Err(ApiError::fatal(
            "GitHubi pääsuvõti puudub — lisa see seadetes (väli „GitHubi token“).",
        )),
        Err(error) => Err(ApiError::fatal(format!(
            "Pääsuvõtme lugemine mandaadihoidlast ebaõnnestus: {error}"
        ))),
    }
}

fn agent() -> ureq::Agent {
    ureq::AgentBuilder::new()
        .timeout_connect(Duration::from_secs(10))
        .timeout(Duration::from_secs(20))
        .user_agent("Kiirmarge/0.1 (Windows)")
        .build()
}

fn authorized(request: ureq::Request, value: &str) -> ureq::Request {
    request
        .set("Authorization", &format!("Bearer {value}"))
        .set("Accept", "application/vnd.github+json")
        .set("X-GitHub-Api-Version", "2022-11-28")
}

/// GitHubi veavastus -> kasutajale mõeldud teade + korratavuse lipp.
fn github_error(status: u16, body: &str) -> ApiError {
    let detail = serde_json::from_str::<serde_json::Value>(body)
        .ok()
        .and_then(|parsed| {
            parsed
                .get("message")
                .and_then(|message| message.as_str())
                .map(str::to_string)
        })
        .unwrap_or_else(|| body.trim().chars().take(200).collect());

    match status {
        401 => ApiError::fatal("GitHubi pääsuvõti on kehtetu või aegunud — salvesta uus."),
        403 if detail.to_lowercase().contains("rate limit") => {
            ApiError::retry("GitHubi päringupiir on täis — proovi hiljem uuesti.")
        }
        403 => ApiError::fatal(
            "Pääsuvõtil puudub õigus sellesse hoidlasse Issue'sid luua (vaja Issues: write).",
        ),
        404 => ApiError::fatal("Hoidlat ei leitud või pääsuvõtil puudub sellele ligipääs."),
        422 => ApiError::fatal(format!("GitHub ei võtnud Issue't vastu: {detail}")),
        status if status >= 500 => ApiError::retry(format!(
            "GitHubi serveri viga ({status}) — proovi hiljem uuesti."
        )),
        status => ApiError::fatal(format!("GitHubi viga ({status}): {detail}")),
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatedIssue {
    number: u64,
    url: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GithubRepo {
    full_name: String,
    private: bool,
    can_push: bool,
}

/// Kas pääsuvõti on mandaadihoidlas olemas. Väärtust JS-i ei saadeta.
#[tauri::command]
pub fn github_token_status() -> bool {
    read_credential().is_ok()
}

/// Salvestab seadetes sisestatud pääsuvõtme mandaadihoidlasse.
#[tauri::command]
pub fn github_save_token(value: String) -> Result<(), ApiError> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(ApiError::fatal("Väärtus on tühi."));
    }
    credential_entry()?
        .set_password(trimmed)
        .map_err(|error| ApiError::fatal(format!("Salvestamine ebaõnnestus: {error}")))
}

#[tauri::command]
pub fn github_clear_token() -> Result<(), ApiError> {
    match credential_entry()?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(ApiError::fatal(format!("Kustutamine ebaõnnestus: {error}"))),
    }
}

/// Ühenduse test: kas pääsuvõti näeb hoidlat ja kas seal saab Issue'sid luua.
#[tauri::command]
pub fn github_test(repo: String) -> Result<GithubRepo, ApiError> {
    let value = read_credential()?;
    let repo = repo.trim();
    if repo.split('/').count() != 2 {
        return Err(ApiError::fatal(
            "Hoidla peab olema kujul omanik/nimi, nt liikane/kiirmarge.",
        ));
    }

    let url = format!("{GITHUB_API}/repos/{repo}");
    match authorized(agent().get(&url), &value).call() {
        Ok(response) => {
            let parsed: serde_json::Value = response
                .into_json()
                .map_err(|error| ApiError::retry(format!("Vastuse lugemine ebaõnnestus: {error}")))?;
            Ok(GithubRepo {
                full_name: parsed
                    .get("full_name")
                    .and_then(|name| name.as_str())
                    .unwrap_or(repo)
                    .to_string(),
                private: parsed
                    .get("private")
                    .and_then(|flag| flag.as_bool())
                    .unwrap_or(false),
                can_push: parsed
                    .get("permissions")
                    .and_then(|permissions| permissions.get("push"))
                    .and_then(|flag| flag.as_bool())
                    .unwrap_or(false),
            })
        }
        Err(ureq::Error::Status(status, response)) => {
            let body = response.into_string().unwrap_or_default();
            Err(github_error(status, &body))
        }
        Err(ureq::Error::Transport(transport)) => Err(ApiError::retry(format!(
            "Võrguühendus ebaõnnestus: {transport}"
        ))),
    }
}

/// Issue loomine. `label` on valikuline — kui silti hoidlas pole, ütleb GitHub seda 422-ga.
#[tauri::command]
pub fn github_create_issue(
    repo: String,
    title: String,
    body: String,
    label: Option<String>,
) -> Result<CreatedIssue, ApiError> {
    let value = read_credential()?;
    let repo = repo.trim();
    if repo.split('/').count() != 2 {
        return Err(ApiError::fatal(
            "Hoidla peab olema kujul omanik/nimi, nt liikane/kiirmarge.",
        ));
    }
    if title.trim().is_empty() {
        return Err(ApiError::fatal("Issue pealkiri on tühi."));
    }

    let mut payload = json!({ "title": title, "body": body });
    if let Some(label) = label.as_deref().map(str::trim).filter(|name| !name.is_empty()) {
        payload["labels"] = json!([label]);
    }

    let url = format!("{GITHUB_API}/repos/{repo}/issues");
    match authorized(agent().post(&url), &value).send_json(payload) {
        Ok(response) => {
            let parsed: serde_json::Value = response
                .into_json()
                .map_err(|error| ApiError::retry(format!("Vastuse lugemine ebaõnnestus: {error}")))?;
            let number = parsed
                .get("number")
                .and_then(|number| number.as_u64())
                .ok_or_else(|| ApiError::retry("GitHubi vastuses puudub Issue number."))?;
            let url = parsed
                .get("html_url")
                .and_then(|url| url.as_str())
                .unwrap_or_default()
                .to_string();
            Ok(CreatedIssue { number, url })
        }
        Err(ureq::Error::Status(status, response)) => {
            let body = response.into_string().unwrap_or_default();
            Err(github_error(status, &body))
        }
        Err(ureq::Error::Transport(transport)) => Err(ApiError::retry(format!(
            "Võrguühendus ebaõnnestus: {transport}"
        ))),
    }
}

/// Järjekord elab seadistuse kõrval (`github-queue.json`), et portatiivsus säiliks.
fn queue_file(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(config_file(app)?.with_file_name("github-queue.json"))
}

#[tauri::command]
pub fn queue_load(app: AppHandle) -> Result<serde_json::Value, String> {
    let path = queue_file(&app)?;
    match fs::read_to_string(&path) {
        Ok(text) => serde_json::from_str(&text)
            .map_err(|error| format!("Järjekorra lugemine ebaõnnestus: {error}")),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(json!([])),
        Err(error) => Err(format!("Järjekorra lugemine ebaõnnestus: {error}")),
    }
}

#[tauri::command]
pub fn queue_save(app: AppHandle, items: serde_json::Value) -> Result<(), String> {
    let path = queue_file(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Kausta loomine ebaõnnestus: {error}"))?;
    }
    let text = serde_json::to_string_pretty(&items)
        .map_err(|error| format!("Järjekorra kirjutamine ebaõnnestus: {error}"))?;
    let temporary = path.with_file_name("github-queue.json.tmp");
    fs::write(&temporary, text).map_err(|error| format!("Kirjutamine ebaõnnestus: {error}"))?;
    fs::rename(&temporary, &path).map_err(|error| format!("Ümbernimetamine ebaõnnestus: {error}"))
}
