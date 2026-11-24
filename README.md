# Gravity Artillery

*A conflict in the Dark Forest.* To spillere stiller inn vinkel og skyter samtidig mot hverandres
planet, og stjerner og usynlige svarte hull bøyer banene. Hver planet har tre
liv. Et skudd kan også slynges tilbake og ødelegge sin egen planet. Alene
kan du spille et felttog gjennom åtte systemer eller en enkeltkamp mot en AI
(Easy, Normal eller Hard).

## Kom i gang

Krever Node 24 (se `.nvmrc`).

```bash
npm ci
npm run dev      # dev-server, også tilgjengelig på lokalnettet (--host)
npm test         # Vitest
npm run lint     # ESLint
npm run build    # typesjekk og produksjonsbygg til dist/
```

## Struktur

| Sted | Innhold |
|---|---|
| `src/game/gameReducer.ts` | Spillflyten som en ren tilstandsmaskin: oppsett, skyting, runde slutt, neste runde |
| `src/game/aim.ts` | Sikting relativt til motstanderen (0 = rett frem, negativt = opp) |
| `src/game/ai.ts` + `src/hooks/useAiOpponent.ts` | AI-motstander: simulerer skudd for å finne beste sikte, og legger på siktefeil etter vanskelighetsgrad |
| `src/game/campaign.ts` + `src/hooks/useCampaign.ts` | Felttoget: hvor tøft hvert system er, liv som følger med, og lagring |
| `src/game/mapScouting.ts` + `src/hooks/useMapScouting.ts` | Kartvalget i felttoget: hvor vanskelig et kart er å treffe, og to kart å velge mellom |
| `src/game/presetMaps.ts` + `src/utils/bossPlanets.ts` | Sjefene (måne og romstasjon, tegnet i kode) og de ferdiglagde kartene til sjefskampene |
| `src/game/stats.ts` + `src/hooks/useStats.ts` | Statistikk mot datamaskinen, per vanskelighetsgrad |
| `src/hooks/useSimulation.ts` | Fysikkløkka. Prosjektiler, partikler og fragmenter ligger i en ref, ikke i React-state |
| `src/hooks/useCanvasRenderer.ts` | Tegneløkka, som leser simuleringen direkte hver frame |
| `src/utils/stepSimulation.ts` | Ett fysikksteg for prosjektiler, partikler og fragmenter |
| `src/utils/createStaticLayer.ts` | Bakgrunn og gravitasjonslinsing, tegnet én gang per runde |

## Designvalg

- **Fast tidssteg.** Fysikken går i steg på 1/60 s uavhengig av framerate
  (`src/utils/fixedTimestep.ts`), så samme skudd gir samme bane på alle enheter.
- **Seedet stjernekart.** Kartet lages fra et seed (`src/utils/random.ts`), så
  det kan gjenskapes.
- **Stjerner og svarte hull trekkes mot midten.** Hver koordinat er snittet av
  to tilfeldige tall, så kroppene havner oftest midt på brettet, men kan
  fortsatt ligge ved kanten. Målt over 120 kart ga det flere ulike veier til
  målet (4,7 mot 3,8) og nesten dobbelt så mange kropper nær linjen mellom
  planetene, uten at hvert treffvindu ble smalere. En fast boks i midten ga
  litt mer av det samme, men tomme kanter og mer like kart.
- **Ingen React-rendering per frame.** Animasjonen kjører i egne
  `requestAnimationFrame`-løkker. React rendrer bare ved knappetrykk og når
  runden endrer tilstand. Dette var nødvendig for god ytelse på mobil.
- **Hele prosjektilsporet beholdes** og bygges opp gradvis i en `Path2D`.
- **Maks flytid på 10 s.** Et skudd som fortsatt flyr da, brenner ut, så en
  lang bane rundt en stjerne ikke kan holde runden i gang. Målt over 27 300
  skudd lander 99 % innen 5 s og bare 0,1 % flyr lenger enn 10 s. AI-en
  simulerer med samme grense.
- **Skudd kan fly 200 px over og under spillområdet** og komme tilbake.
  Ut gjennom sidene stopper de som før. Mens skuddet er utenfor, viser en
  pil på kanten hvor det er på x-aksen; pilen krymper og blekner jo lenger ut
  det er. Målt over 160 felttogkart kom 9 % av skuddene tilbake, og
  treffvinduene ble i snitt 25 % bredere (3,4° → 4,3°). Mer margin ga nesten
  ikke mer (300 px: 10 %, 4,3°). Kartvurderingen og AI-en bruker samme regel.
- **Kulisser:** planetene roterer som glober (overflaten rulles sidelengs og
  presses sammen mot kanten), lyses opp fra de sterkeste stjernene og har en
  tynn atmosfære. Stjernene har en flimrende korona, og to lag med små stjerner
  driver sakte over bakgrunnen. Svarte hull skjuler stjernene som passerer bak
  dem. All langsom bevegelse står stille ved redusert bevegelse.
- **Felles grensesnittstil** i `src/index.css` (`.panel`, `.btn`, `.readout`,
  `.meter`). Hvert panel setter `--accent` til spillerens planetfarge. Ikoner
  og hjerter er tegnet som vektorer (SVG og `Path2D`) i stedet for emoji, som
  ser forskjellige ut fra telefon til telefon. Fonten er Exo 2 (OFL), lagt inn
  via `@fontsource-variable/exo-2` og bygget inn i appen, så ingen fonter
  hentes fra Google.
- **Oppsett etter både bredde og høyde** (`src/utils/layout.ts`). En telefon på
  tvers er ofte bredere enn 768 px, men lav, så lav liggende skjerm (under
  500 px) gir kompakte paneler på sidene uten tittel.
- **Lyd med Web Audio** (`src/audio/`). Hver lyd panoreres dit den skjer på
  skjermen. Utskytingen er et klipp laget med ElevenLabs: et dypt, mykt
  «fwoom», valgt blant fem kandidater. Et syntetisert sus spilles til klippet
  er lastet. En dyp brumming (sagtann gjennom lavpassfilter) stiger når et
  skudd passerer nær en stjerne eller et svart hull. Treffet som avgjør kampen
  spilles langsommere og dypere. Lydene pauses når fanen er skjult.
- **Treff har tyngde:** sjokkbølge, kort blink og skjermristing, og sakte film
  på treffet som avgjør kampen. Blink og risting slås av når systemet ber om
  redusert bevegelse (`prefers-reduced-motion`).
- **Bare vinkel, ingen kraft.** Spillet hadde en tid kraft fra 50 til 150 %.
  En simulering av 150 kart viste at nesten alle kart kunne treffes med de
  fleste kraftnivåer bare ved å justere vinkelen, så kraft ga en ekstra knapp,
  men ikke et reelt valg. Alle skudd går derfor med samme fart.
- **AI-en jukser ikke med motstanderens sikte.** Den ser bare stjernekartet,
  prøver alle hele grader og sikter midt i det bredeste treffvinduet.
  Siktefeilen krymper for hvert skudd på samme kart, omtrent som når et
  menneske justerer seg etter sporet. Målt over 60 kart treffer den i snitt
  etter ca. 8 skudd på Easy, 4 på Normal og 2-3 på Hard.

- **Felttog over 8 systemer.** Livene dine følger med fra system til system
  (maks 5), mens motstanderen starter hvert system med 1, 2 eller 3 liv.
  Kartene får flere kropper (4 → 7) og større sjanse for svarte hull
  (6 → 25 %). AI-en skjerpes innenfor valgt nivå med en skala på siktefeilen
  (2,0 → 0,5) som virker både på startfeilen og på hvor sakte den krymper. Å
  skalere bare startfeilen ga nesten ingen forskjell: målt over 40 kart per
  system gikk Normal bare fra 4,4 til 3,5 skudd før treff. Med begge, målt på
  de samme 40 kartene, går Normal fra 7,0 til 2,4 (Easy 11,6 → 4,4, Hard
  3,8 → 1,6). Felttoget og statistikken lagres i
  `localStorage`, og liv lagres så snart de mistes, så det hjelper ikke å
  lukke siden midt i en kamp.
- **Kartvalg i felttoget.** Hvert nytt kart velges blant to: ved systemstart og
  etter hvert treff. Etter en seier har det vanskeligste kartet en dusør (+1 liv
  eller et spesialskudd), som først betales når du ødelegger fiendens planet på
  det kartet, også om du blir truffet samtidig. Treffer bare fienden, byttes
  kartet og dusøren er tapt; bommer begge, står den fortsatt på spill. Den
  lagres som ventende til den er avgjort, så den ikke kan hentes på nytt via
  menyen. Samme
  kart hele systemet ble forkastet, fordi den som treffer først da bare kan
  gjenta vinkelen. Vanskeligheten måles for spiller 1 ved å fly skuddene: et
  grovsøk i halve grader og forfining til tideler rundt treffene. Treffvinduene
  er stort sett bare 1–2° brede, så hele grader var for grovt. Bredden alene
  skilte lite (median 3–4°), mens hvor langt fra rett frem nærmeste treff
  ligger varierte fra ca. 1° til 12°. Scoren er derfor avstand + 10 / bredde,
  og grensene (6 og 11) deler 240 kart omtrent i tredjedeler. Av fire
  kandidater vises det letteste og det vanskeligste, og bare kart der også
  AI-en kan treffe på hele grader. Scoren er en modell og ikke testet på
  spillere.
- **Spesialskudd i felttoget.** Du starter uten, og det vanskeligste kartet
  etter en seier gir +1 liv eller et skudd (alltid skudd
  med fulle liv, maks 3 av hver). Målt over 180 felttogskart, med sikte i
  femtedels grader:
  - *Splitter* (tre skudd 3° fra hverandre): treffvindu ca. 14° mot 5° for et
    vanlig skudd.
  - *Fase* (bare svarte hull trekker): treffer rett frem på 78 % av kartene i
    system 1, men bare 13 % i system 8, der det er flere svarte hull. Det
    avslører også hvor de usynlige svarte hullene er.
  - *Søkende* (svinger mot fiendeplaneten med fast kraft innenfor 250 px):
    vindu ca. 8,6°. Det erstattet et planlagt tungt skudd med mindre
    tyngdekraft, fordi selv 10 % tyngdekraft bare flyttet nærmeste treff fra
    2,2° til ca. 1,3° og knapt gjorde vinduet bredere.
- **Sjefer er mindre mål.** System 4 voktes av en månebase (radius 16) og
  system 8 av en kampstasjon (radius 13), mot planetens 25. Målt over 60 kart
  krymper treffvinduet fra 3,7° til 2,2° mot månen, og fra 2,9° til ca. 1,1°
  mot stasjonen. Sjefene er tegnet i kode: månen som en kratertekstur som
  roteres som en globus, og stasjonen som en ring sett ovenfra som snurrer.
  Begge blir data-URL-er, så de lastes og sprenges som vanlige planetbilder.
- **Ferdiglagde kart** til sjefskampene, tre per sjef, lagret som lister med
  kropper. De bruker kartnumre fra 2^32 og oppover, så ett tall i spillmodellen
  dekker både tilfeldige og ferdiglagde kart. Sjefskampen åpner med valg mellom
  to tilfeldige av de tre. Senere runder bruker tilfeldige kart, siden et kart
  man har truffet før kan treffes igjen med samme vinkel. En test sjekker at
  alle kartene er rettferdige mot sin sjef.
- **Ingenting går videre før resultatet vises.** Etter det avgjørende treffet
  går det 2 sekunder før resultatet vises. «Next» er sperret så lenge, ellers
  kunne en ny kamp starte med fulle liv uten at resultatet ble registrert.

## Kreditering

Se bunnen av spillsiden for musikk, lyd og grafikk (alle CC0 eller fri bruk).
Utskytingslyden er generert med ElevenLabs.
