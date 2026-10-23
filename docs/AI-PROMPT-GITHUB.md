# Ülesanne: avalda see projekt GitHubis

> Kopeeri kogu see fail teisele AI-le tervikuna. Ta saab sellest kogu vajaliku konteksti.

---

Sul on Windowsis kohalik projekt:

```
C:\Users\lauri\AppData\Roaming\AutoClaw-oversea-official\accounts\2ac0db3cba19576fdfb3834daf80229f226f359c138ed54749efc97f0c6051c7\projects\Memilla
```

Tegemist on **valmis töölauarakendusega „Kiirmärge"** — portatiivne kiirmärkme rakendus
(Tauri 2 + puhas TypeScript core, installerit ei ole). Projekt on **testitud ja töötab**;
sinu ülesanne on see **GitHubi viia**, mitte koodi ümber teha.

## Seis, mida sa pead teadma

| Asi | Väärtus |
|-----|---------|
| Testid | `npm test` → **57/57**, `cargo test` (kaustas `apps/desktop/src-tauri`) → **6/6**, `npm run typecheck` → 0 viga |
| Failid | 78 faili, ~0,7 MB (ilma `node_modules`, `target`, `dist`) |
| README | olemas (`README.md`) — ärge kirjutage üle, võite täiendada |
| `.gitignore` | olemas: `node_modules/`, `dist/`, `apps/desktop/src-tauri/target/`, `gen/`, `.cargo/`, `.zwork/`, `*.log`, `*.tmp` |
| `.gitattributes` | olemas (LF reavahetused) |
| Saladused | kontrollitud — repos ei ole paroole, võtmeid ega `.env` faile |
| Git repo | **ei ole veel loodud** (`git init` on tegemata) |
| Git identiteet | **puudub** (`git config user.name` ja `user.email` on tühjad) |

## Mida tee

1. **Kontrolli, et kõik on roheline** (ära muuda koodi):
   ```powershell
   cd <projektitee>
   npm install
   npm test
   npm run typecheck
   cd apps\desktop\src-tauri
   cargo test
   ```
   Kui mõni test ei lähe läbi, **ära pushi** — teata sellest ja peatu.

2. **Küsi kasutajalt kolm asja** (ilma nendeta ära pushi):
   - repo nimi (soovitus: `kiirmarge` või `memilla`),
   - nähtavus (privaatne või avalik),
   - litsents (README ütleb „otsustamata"; kui avalik, soovita MIT).

3. **Küsi git-identiteet** (kohalik, selle repo jaoks):
   ```powershell
   git config user.name "Eesnimi Perekonnanimi"
   git config user.email "kasutaja@example.com"
   ```

4. **Loo repo ja tee esimene commit:**
   ```powershell
   cd <projektitee>
   git init -b main
   git add -A
   git status --short          # kontrolli, et pole node_modules/target/.zwork
   git commit -m "Kiirmärge: portatiivne kiirmärkme rakendus (Tauri 2 + TS core)"
   ```

5. **Ühenda GitHubiga** (vali üks):
   - kui `gh` CLI on olemas ja sisse logitud: `gh repo create <nimi> --private --source . --push`
   - muidu: loo repo GitHubis käsitsi, siis
     ```powershell
     git remote add origin https://github.com/<kasutaja>/<repo>.git
     git push -u origin main
     ```

6. **Kontrolli pärast pushi:**
   - repos on `README.md`, `package.json`, `packages/`, `apps/`, `docs/`;
   - **ei ole** `node_modules`, `dist`, `target`, `.cargo`, `.zwork`;
   - README kuvatakse GitHubis korrektselt (tabelid, koodiplokid).

## Mida MITTE teha

- **Ära** lisa `apps/desktop/src-tauri/.cargo/config.toml`-i reposse — see sisaldab masinapõhist
  absoluutset teed (`C:/kt/memilla`), mis on vajalik ainult selle masina pika tee tõttu.
  README kirjeldab seda eripära.
- **Ära** lisa CI workflow'd, mida sa ei ole päriselt jooksutanud (Windowsi Tauri build vajab MSVC-d
  ja WebView2-te; kui lisad, peab see olema testitud `windows-latest` runneril).
- **Ära** muuda `packages/core` loogikat ega teste ülesande käigus.
- **Ära** force-pushi ega kirjuta ajalugu üle.
- **Ära** lisa litsentsi ilma kasutaja kinnitust.

## Taust (kui tekib küsimusi)

- Arhitektuur: `packages/core` = puhas TS (seadistus, märkme formaat, kiirklahvid, teed, kasutusjuhud),
  `apps/desktop` = Tauri kest (TS UI + Rusti käsud failide/akna/dialoogi jaoks). Core ei importi Tauri API-sid.
- Seadistus on portatiivne: `config.toml` exe kõrval, varuplaan `%APPDATA%\Kiirmarge\config.toml`.
- Kiirklahvid: vaikimisi `Ctrl+Shift+1` (globaalne), `Enter` (salvesta), `Ctrl+Enter` (uus rida), `Esc` (peida).
- Etapid ja otsused: `docs/PLAAN.md`, raportid `docs/RAPORT-*.md`, kasutusjuhend `docs/KASUTUS.md`.

## Väljund

Esita lõpuks lühike raport: repo URL, commit hash, mis läks üles, mida kontrollisid ja mis jäi tegemata.