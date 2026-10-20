# Kuhu seadistus kirjutatakse — portatiivne režiim

**Kuupäev:** 20.10.2026
**Otsus:** `config.toml` elab **exe kõrval**, kui sinna saab kirjutada. Kui ei saa
(Program Files, võrguasukoht, kirjutuskaitstud kaust), kasutatakse varuplaanina
`%APPDATA%\Kiirmarge\config.toml`.

---

## 1. Miks see otsus

Lõpptoote nõue on **installerita** rakendus. Sellest tuleneb:

- rakendus peab olema **üks kaust** (exe + seadistus) — kustutamine = puhas eemaldamine;
- seadistus ei tohi jääda kasutajaprofiili (`%APPDATA%`) jääkidena, sest siis ei ole rakendus
  "portatiivne" ja arvutit vahetades tuleb seadistus uuesti teha;
- samas ei tohi rakendus katki minna, kui ta satub kausta, kuhu kirjutada ei saa.

## 2. Kaalutud variandid

| Variant | Plussid | Miinused |
|---------|---------|----------|
| **A. Ainult `%APPDATA%\Kiirmarge`** (endine) | alati kirjutatav, kasutajapõhine | jätab profiili jäägid; kaasa võtmine ebamugav; "installitud" tunne |
| **B. Ainult exe kõrval** | täiesti portatiivne, üks kaust | ei tööta kirjutuskaitstud kaustas (Program Files, võrk) |
| **C. Exe kõrval, varuplaaniks `%APPDATA%`** ← **valitud** | portatiivne tavajuhul; ei kuku kirjutuskaitstud kaustas | kaks võimalikku asukohta — lahendus: rakendus näitab teed |

## 3. Kuidas koodis töötab

`apps/desktop/src-tauri/src/lib.rs`:

1. `portable_config_file()` — vaatab exe kausta:
   - kui `config.toml` on **juba olemas**, kasutatakse seda (kasutaja on portatiivse režiimi valinud);
   - kui kausta **saab kirjutada** (proovifail `.kiirmarge-kirjutustest` luuakse ja kustutatakse kohe),
     kasutatakse `config.toml` exe kõrval;
   - muidu `None`.
2. `config_file()` — kui portatiivne ei sobi, siis `%APPDATA%\Kiirmarge\config.toml`.
3. `app_paths` tagastab tegeliku tee JS-ile, seega rakendus **näitab seda ise**
   (esmakäivituse teade ja veateated sisaldavad täisteed).

## 4. Tagajärjed kasutajale

| Olukord | Mis juhtub |
|---------|-----------|
| Rakendus tavalises kaustas (nt `C:\Apps\Kiirmarge\`) | `config.toml` tekib sinna; kausta kopeerimine viib seadistuse kaasa |
| Rakendus `Program Files`-is või võrgukettal | seadistus läheb `%APPDATA%\Kiirmarge\` |
| Uuendamine | asenda ainult `kiirmarge.exe`; `config.toml` jääb alles |
| Eemaldamine | kustuta kaust (kui autostart on sees, eemalda see enne või lülita rakenduses välja) |
| Autostart | ainus jälg väljaspool kausta — üks registry-kirje (`HKCU`/`HKLM`\...\Run) |

## 5. Kontrollitud (20.10.2026)

| Test | Tulemus |
|------|---------|
| Exe värskes kaustas (`%TEMP%\KiirmargePortable`) | `config.toml` tekkis exe kõrvale; rakendus kuvas tee `...\KiirmargePortable\config.toml` |
| Exe kirjutuskaitstud kaustas (ACL deny W) | sinna config'it ei tekkinud; rakendus töötas `%APPDATA%`-s oleva seadistusega |
| Proovifail | ei jäänud kausta maha |

## 6. Lahtised otsused

1. **Märkmed.** Praegu on need ajutiselt otse töölaual (koodis `AJUTINE`). Lõpptootes peaks
   `storage.notes_dir` taas seadistusest tulema. Portatiivse variandi jaoks oleks loomulik
   vaikeväärtus `.\Kiirmärkmed` (exe kõrval) — siis on ka märkmed kaasas.
2. **Täisportatiivsus.** Kui märkmedki pannakse exe kõrvale, on tegu "täisportatiivse" rakendusega:
   kaust = kogu rakendus. Vaja otsustada, kas see on soovitud vaikeväärtus või valik seadistuses.
3. **Release-build.** Lõpptoote jaoks tasub teha `tauri build` (release): väiksem exe, kiirem käivitus,
   ja siis ei sõltu rakendus arenduskaustast `C:\kt\memilla`.