# Issue #10 — märkmete vaikekaust Windowsi muutujatega: teostus

**Kuupäev:** 25.10.2026
**Issue:** [#10 — Märkmete vaikimisi kausta määramisel võiks kasutada Win muutujaid, et programm salvestaks kohe nt töölauale](https://github.com/liikane/kiirmarge/issues/10)

---

## 1. Probleem ja lahendus

Issue sõnastab kaks soovi: (a) märkmed peaksid vaikimisi minema **töölauale** igas arvutis,
(b) töölaua asukoht tuleb **Windowsilt küsida**, sest see võib arvutiti erineda (nt OneDrive'i
ümbersuunamine). Punkt (b) tähendab, et `%USERPROFILE%\Desktop`-laadne tekstilahendus ei sobi —
see läheb just nimelt siis katki, kui töölaud on mujale suunatud.

Seepärast:

| Osa | Lahendus |
|-----|----------|
| **Töölaud** | `storage.default_to_desktop = true` → teekond tuleb Tauri `desktop_dir()`-st (Windowsi known folder `FOLDERID_Desktop`), mis järgib ka ümbersuunamist. See loogika oli `packages/core`-is juba olemas ja testitud — **puudus oli seadete lüliti** |
| **Seadete UI** | Uus väli **„Salvestuskoht"**: `Dokumendid` / `Töölaud` / `Kohandatud kaust`. Valik tuletatakse seadistusest, eraldi välja `config.toml`-i ei lisatud (vanad seadistused töötavad edasi) |
| **Nähtav tulemus** | Välja all kuvatakse **lahendatud tee** („Märkmed: C:\Users\…\Desktop\Kiirmärkmed"), mis arvutatakse sama `resolveNotesDir`-iga, mida salvestamine kasutab — vihje ei saa tegelikust erineda |
| **Töölaua alamkaust** | Töölaud ei külva faile laiali: märkmed lähevad `Töölaud\<notes_dir viimane osa>`, nt `Desktop\Kiirmärkmed` |
| **Valideerimine** | „Kohandatud kaust" nõuab täisteekonda; „Dokumendid"/„Töölaud" nõuavad suhtelist nime. Kaustavalija annab täisteekonna → valik lülitub automaatselt „Kohandatud kaustaks" |
| **Üleminek valikute vahel** | „Kohandatud kaust" pakub seni kehtinud täisteekonda, „Dokumendid"/„Töölaud" asendavad absoluutse tee nimega `Kiirmärkmed` — märkmed ei liigu hetkega kuhugi ootamatusse kohta |
| **Paigutus** | Lahendatud tee seisab vahetult „Salvestuskoht" välja all; seadete paneel avaneb avatud olekus tekstiala arvelt, muidu jäi nähtavale ainult paar rida |

### Kõrvalparandus: Obsidiani vault on määrav

Varem kontrolliti `default_to_desktop`-i **enne** Obsidiani vaulti. Kui kasutaja oleks valinud
töölaua ja seejärel lülitanud Obsidiani režiimi, oleksid märkmed läinud töölauale, kuigi seadetes
on vault. Nüüd on järjekord: **vault (kui seatud ja `notes_dir` on suhteline) → töölaud →
absoluutne tee → Dokumendid**. Kaks uut testi katavad mõlemad harud.

## 2. Kontrollid — päriselt jooksutatud

| Kontroll | Tulemus |
|----------|---------|
| Core testid (`npm test`) | **89/89** (2 uut: „obsidian: vault võidab töölaua-eelistuse", „obsidian ilma vaultita + töölaud") |
| Typecheck (core + desktop) | 0 viga |
| Vite build | OK (38,8 kB JS) |
| Päris rakendus (`scripts/issue10-e2e.ps1`, UI Automation) | absoluutne tee → „Kohandatud kaust" ✔ · Dokumendid → `C:\Users\lauri\Documents\Kiirmärkmed` ✔ · Töölaud → `C:\Users\lauri\Desktop\Kiirmärkmed` ✔ · salvestus kirjutas `default_to_desktop = true`, `notes_dir` jäi suhteliseks ✔ · kinnitus „Seaded salvestatud. Märkmed: …\Desktop\Kiirmärkmed" ✔ · tagasi „Kohandatud kaust" pakkus sama teed ✔ |

Skripti väljund:

```
OK: aken olemas
OK: seaded avatud
OK: absoluutne tee -> Kohandatud kaust
OK: Märkmed: C:\Users\lauri\AppData\Local\Temp\KiirmargeIssue10-…\CustomNotes
OK: Märkmed: C:\Users\lauri\Documents\Kiirmärkmed
OK: Märkmed: C:\Users\lauri\Desktop\Kiirmärkmed
OK: seadistusse kirjutati default_to_desktop = true
OK: notes_dir jäi suhteliseks ("Kiirmärkmed")
OK: Seaded salvestatud. Märkmed: C:\Users\lauri\Desktop\Kiirmärkmed
OK: kohandatud kaust pakkus seni kehtinud teed (Märkmed: C:\Users\lauri\Desktop\Kiirmärkmed)
VALMIS
```

> Nagu #8 puhul: kontroll tehti eraldi identifikaatoriga testbinaaril, et kasutaja töötavat
> eksemplari mitte puutuda; lõpuks ehitati tootmisbinaar uuesti.

## 3. Muudetud failid

| Fail | Muudatus |
|------|----------|
| `packages/core/src/paths/resolve.ts` | järjekord: vault → töölaud → absoluutne tee → Dokumendid; vault eeldab suhtelist `notes_dir`-i |
| `packages/core/src/paths/resolve.test.ts` | 2 uut testi |
| `apps/desktop/index.html` | väli „Salvestuskoht", `#notes-dir-label`, `#notes-dir-resolved` |
| `apps/desktop/src/main.ts` | `Location`-tuletus, `resolvedDirFor()`, `updateLocationUi()`, valideerimine, kaustavalija seos |
| `apps/desktop/src/styles.css` | `.settings__hint--path`; seadete paneel saab avatud olekus tekstiala arvelt ruumi (`:has()`) |
| `scripts/issue10-e2e.ps1` | verifikatsioon päris akna vastu |
| `docs/KASUTUS.md`, `docs/config.example.toml`, `README.md` | dokumentatsioon |
