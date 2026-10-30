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


## Operoni mõõdetud tööaja sünkroonimine

**Eesmärk:** Operoni TrackTime/FlowTime lõpetatud tööseansside kestus
kuvatakse GitHub Projects V2 väljal **Actual hours**.
Hinnanguline tööaeg jääb eraldi väljale **Estimated hours (auto)**.

Skript: **scripts/sync-operon-actual-time.mjs**.

- Operon salvestab lõpetatud seansi pikkuse ülesande Markdowni väljale **duration** (sekundites).
- Sünkroonija loeb ainult operonId, duration, links ja githubIssue välju.
- Sama GitHub Issue juurde seotud eri ülesannete mõõdetud ajad liidetakse; korduvaid operonId-sid ei loeta topelt.
- Käimasolevat taimerit arvesse ei võeta; sünkroonitakse üksnes lõpetatud seansside kestus.
- GitHubi saadetakse ainult Issue number ja tundide summa, mitte Obsidiani märkmete sisu.
- Kui ühel ülesandel on mitu erinevat Issue seost, seda ülesannet arvestusse ei lisata.
- Ainult avaliku hoidla Issue-projektiüksused; privaatseid Draft issue kirjeid see sünkroonija ei muuda.

### Operoni ülesande sidumine

Ava Operonis vastav ülesanne ning lisa selle **Links** väljale näiteks
https://github.com/liikane/kiirmarge/issues/7. Alternatiivina saab
kohandatud tekstiväljal **githubIssue** kasutada väärtust 7.
Ühe ajamõõtmise ülesande kohta on üks Issue seos.

**Ära muuda käsitsi** operonId, duration ega trackers väärtusi.
Käivita Operonis TrackTime, tee töö ja peata taimer; uus kestus
salvestatakse siis ülesandele.

### Käivitamine

PowerShelli näide arvutis, kus asub Obsidiani vault:

~~~powershell
$env:OPERON_VAULT = 'C:\Users\lauri\Portable\!Obs\Lauri_2026'
$env:OPERON_TIME_DIRS = 'Operon/Tasks'
node scripts/sync-operon-actual-time.mjs
~~~

Vaikimisi on see kuivkäivitus ehk GitHubi andmeid ei muudeta.

Kirjutamise aktiveerimiseks:
1. Kinnita, et GitHub Project on Private. Leia selle number ja lisa projekti Number-väli **Actual hours**.
2. Määra KIIRMARGE_PROJECT_NUMBER keskkonnamuutuja või Lauridelli kohalikus sünkroonimiskaustas fail project-number.txt, milles on ainult projektinumber.
3. Autendi GitHub CLI (gh auth login -s project või gh auth refresh -s project), mis küsib kasutaja kinnitust. Alternatiivina anna KIIRMARGE_PROJECT_TOKEN turvalise keskkonnamuutujana, mitte avaliku faili sees.
4. Käivita skript lipuga --apply ning kinnita, et õige Issue Actual hours väärtus muutub.

**Lauridellis** paiknevad käiviti ja skripti koopia kaustas
C:\Users\lauri\Portable\Kiirmarge\OperonSync; logi on sync.log.
Windows Task Scheduleris on ülesanne **Kiirmarge Operon Actual Time**
tunnise intervalliga, kui kasutaja on sisse loginud.
Kui projektinumber või Projectsi autentimine puudub, töötab üksnes kuivkäivitus.

Operoni CLI pole vajalik, sest Operoni Markdown on mõõdetud aja
tõeallikas. Teistes arvutites mõõdetud aeg peab sünkroonima Obsidiani
Markdowni kaudu Lauridelli, et seda üle kanda.
