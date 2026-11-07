# Gravity Artillery

*A conflict in the Dark Forest.* To spillere stiller inn vinkel og skyter samtidig mot hverandres
planet, og stjerner og usynlige svarte hull bøyer banene. Hver planet har tre
liv. Et skudd kan også slynges tilbake og ødelegge sin egen planet. Med
«Play vs computer» spiller du alene mot en AI (Easy, Normal eller Hard).

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

## Kreditering

Se bunnen av spillsiden for musikk, lyd og grafikk (alle CC0 eller fri bruk).
Utskytingslyden er generert med ElevenLabs.
