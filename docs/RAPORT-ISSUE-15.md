# Issue #15 — dokumentatsiooni tõlkimine inglise keelde

**Kuupäev:** 31.10.2026

## Tehtud

- `README.en.md` (tõlge `README.md`-st) ja `docs/USAGE.en.md` (tõlge `docs/KASUTUS.md`-st, sh päevamärge).
- Terminoloogia sõnastik on `USAGE.en.md` päises; eestikeelsed UI nimed (nt „Välju", `Kiirmärkmed`) jäävad algkujul.
- Viited: eestikeelsetes failides link ingliskeelsele ja vastupidi; viited lehtedele, mida ei tõlgitud, on märgitud „Estonian only".

## Piirang / järgmine samm

- Tõlgitud on põhidokumendid. `PLAAN.md`, `SEADISTUSE-ASUKOHT.md`, `RAPORT-*.md` on sisemised ja jäid tõlkimata.
- Vastuvõtukriteerium „ingliskeelne dokumentatsioon on üle vaadatud" vajab inimese ülevaatust — Issue jäi avatuks.
- Hoia EN/ET sünkroonis: muuda mõlemat samas PR-is.

## Blokeeritud: #4 (seade registrisse)

Selles masinas puudub Rust/cargo (`cargo` ei ole PATH-is ega `~\.cargo\bin`-is), seega Rusti muudatust
(registrisse kirjutamine, `winreg`) ei saa siin ehitada ega testida. Vajab Rust toolchain'i paigaldust (`rustup`).
