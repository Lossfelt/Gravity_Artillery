# Gravity Artillery

*A conflict in the Dark Forest.* To spillere stiller inn vinkel og kraft og skyter samtidig mot hverandres
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
| `src/game/aim.ts` | Sikting relativt til motstanderen (0 = rett frem, negativt = opp) og kraft |
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
- **Ingen React-rendering per frame.** Animasjonen kjører i egne
  `requestAnimationFrame`-løkker. React rendrer bare ved knappetrykk og når
  runden endrer tilstand. Dette var nødvendig for god ytelse på mobil.
- **Hele prosjektilsporet beholdes** og bygges opp gradvis i en `Path2D`.
- **Kulisser:** planetene roterer som glober (overflaten rulles sidelengs og
  presses sammen mot kanten), lyses opp fra de sterkeste stjernene og har en
  tynn atmosfære. Stjernene har en flimrende korona, og to lag med små stjerner
  driver sakte over bakgrunnen. Svarte hull skjuler stjernene som passerer bak
  dem. All langsom bevegelse står stille ved redusert bevegelse.
- **Treff har tyngde:** sjokkbølge, kort blink og skjermristing, og sakte film
  på treffet som avgjør kampen. Blink og risting slås av når systemet ber om
  redusert bevegelse (`prefers-reduced-motion`).
- **AI-en jukser ikke med motstanderens sikte.** Den ser bare stjernekartet.
  Siktefeilen krymper for hvert skudd på samme kart, omtrent som når et
  menneske justerer seg etter sporet. Målt over 60 kart treffer den i snitt
  etter ca. 8 skudd på Easy, 4 på Normal og 2-3 på Hard.

## Kreditering

Se bunnen av spillsiden for musikk, lyd og grafikk (alle CC0 eller fri bruk).
