# Issue #4 — seadistuse hoiukoht: fail või Windowsi register

**Kuupäev:** 31.10.2026

## Otsus

Seadetes valik „Seadistuse hoiukoht": **Fail samas kaustas** (vaikimisi, nagu Issue nõuab) või **Windowsi register**.
Valik ise ei saa olla `config.toml`-is (muna-kana), seepärast on lüliti registris:
`HKCU\Software\Kiirmarge\ConfigStorage = registry`; `Config` hoiab TOML-teksti.

## Tehtud

- `src-tauri/src/registry_store.rs` (`winreg`), `lib.rs`: `read_config` / `write_config` / `write_default_config` valivad hoidla;
  uued käsud `get_config_storage`, `set_config_storage` (kolib seadistuse; „fail" kustutab registrikirjed).
- UI: valik `#config-storage` + salvestamisel migreerimine; „Seadistuse asukoht" näitab registrit.
- GitHubi järjekord (`github-queue.json`) jääb alati faili.
- Dokumentatsioon: KASUTUS, USAGE.en, SEADISTUSE-ASUKOHT.

## Kontroll

- Rust toolchain paigaldatud (winget rustup); `cargo test` 6/6 läbis, `npm run typecheck` puhas.
- Registri käsitsi ringteekond (UI) jäi kontrollimata — vajab töötavat Tauri akent.
