# Kiirmärge: GitHub Projectsi töökorraldus

> Avalik seadistuse kirjeldus. Tegelik planeerimistahvel peab olema **Private**.
> Ära kopeeri siia privaatseid arendusplaane, turunduseelarveid ega kliendiandmeid.

## Eesmärk

Üks privaatne GitHub Projects V2 projekt hoidla `liikane/kiirmarge` juures.
Projekti nimi: **Kiirmärge – Arendus ja haldus**.

Valdkonnad:
- **Roadmap** – arendusetapid, versioonid, väljalasked
- **Juhend** – paigaldus-, kasutus- ja arendusjuhendid
- **Vead** – vead, testimine, parandused
- **Ettepanekud** – uued funktsioonid ja täiustused
- **Turundus** – tutvustus, veebileht, levitamine

## Töövoo staatused

1. Brainstorming
2. Todo
3. Paused / Blocked
4. In Progress
5. Done

## Soovitatavad Projectsi väljad

| Väli | Tüüp | Väärtused või märkus |
|---|---|---|
| Status | Single select | Nimetatud viis staatust |
| Category | Single select | Roadmap, Juhend, Vead, Ettepanekud, Turundus |
| Priority | Single select | Critical, High, Medium, Low |
| Impact | Single select | High, Medium, Low |
| Release | Single select | Backlog, Next release; konkreetne versioon kinnitamisel |
| Version | Text | Versioon, kui on teada |
| Environment | Single select | Windows 11, Windows 10, Other |
| Start date | Date | Algus |
| Target date | Date | Tähtaeg |
| Planned hours | Number | Planeeritud tunnid |
| **Estimated hours (auto)** | **Number** | Automaatselt arvutatud umbkaudne ajakulu |
| Blocked reason | Text | Takistus |
| Arendusring | Iteration | GitHubi väljatüüp **Iteration**; eesti keeles **arendusring** |

Ära loo fiktiivseid versiooninumbreid ega tähtaegu. `Milestone` on hoidla Issue omadus, mitte suvaline numbriväli.

## Vaated

- **Board** – Kanban, grupeerimine Status järgi
- **Roadmap** – ajatelg Start date / Target date järgi
- **Table** – kõik ülesanded, sorteerimine ja filtrid
- **Bugs** – Category = Vead, Priority kahanevas järjekorras
- **Documentation** – Category = Juhend
- **Marketing** – Category = Turundus
- **Backlog** – Brainstorming ja Todo
- **Next Release** – Release = Next release
- **Blocked** – Status = Paused / Blocked
- **My Tasks** – vastutajaks määratud kasutaja

## Soovitatavad automaatikad

- Uus Issue: automaatne lisamine projekti, kui vastab hoidla filtritele
- Uue üksuse esialgne olek: Todo
- Suletud Issue või ühendatud PR: Done
- Lõpetatud vanad ülesanded: Auto-archive
- Avalikud veateated, arendusettepanekud, juhendid ja turundusettepanekud:
  `.github/ISSUE_TEMPLATE/` all asuvad vormid

GitHub Free'is võib Auto-add töövoogude arv olla piiratud. Kasuta üht üldist filtrit, kui vajalik.

## Ligikaudne automaatne ajakulu

Failid:
- `scripts/sync-project-time.mjs`
- `.github/workflows/approximate-time.yml`

GitHub Actions käivitub kord ööpäevas ja vajadusel käsitsi (workflow_dispatch).
Skript arvutab **avaliku hoidla Issue-kirjete** ajakulu ligikaudsete tegevuskaalude abil:

- Issue avamine: **0,25 tundi**
- Inimese lisatud kommentaar: **0,25 tundi**
- Commit, mis sisaldab viidet `#IssueNumber`: **0,5 tundi**
- PR, mille pealkiri või kirjeldus viitab Issue numbrile: **0,5 tundi**
- Piirang: ühe Issue kohta maksimaalselt **4 tundi päevas**

See on **tegevuspõhine hinnang**, mitte tegelikult mõõdetud aktiivne tööaeg.
Commit ilma Issue numbrita ei ole kindla ülesandega seostatav. Privaatseid
Draft issue kirjeid ega väljaspool GitHubi tehtud tööd see arvestus ei mõõda.
Suurema projekti puhul vajab 1000 commiti/PR-i piirang täiendamist.

### Aktiveerimiseks vajalik

1. Projekt peab olema loodud ja selle nähtavus peab olema **Private**.
2. Loo projekti Number-väli **`Estimated hours (auto)`** (nimi peab täpselt vastama).
3. Määra hoidla Actions variable **`KIIRMARGE_PROJECT_NUMBER`** projekti numbriga.
4. Määra hoidla Actions secret **`KIIRMARGE_PROJECT_TOKEN`**. Sellel peab olema GitHub Projectsi kirjutamisõigus (classic PAT korral `project`; avaliku hoidla lugemiseks piisav ligipääs).
5. Käivita Actions > Kiirmärke ligikaudne ajakulu > Run workflow ja kontrolli logisid.

Tokenit **ei tohi** lisada hoidlasse ega dokumentatsiooni. Kuni vajalikud
õigused, projekti number ja väli puuduvad, lõpetab skript töötamise midagi muutmata.

## Privaatsuse reegel

Hoidla `liikane/kiirmarge` on avalik. Selle Issue-kirjed ja vormidesse
sisestatud sisu on samuti avalik. Konfidentsiaalne planeerimine toimub
**privaatse Projectsi Draft issue** kirjetes või eraldi privaatses hoidlas.
Ajakulu automaatika ei kopeeri privaatset sisu avalikku hoidlasse.
