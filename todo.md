# TODO - Gravity Artillery

## Felttog (enspiller)
En kjede av 8 systemer mot datamaskinen. Enkeltkamp blir igjen som eget valg i startmenyen.

### Steg 1: grunnmur
- [X] Startmeny med Enkeltkamp og Felttog, begge med valg av Easy/Normal/Hard
- [X] 8 systemer. Motstanderen blir gradvis sterkere innenfor valgt nivå (siktefeilen krymper)
- [X] Kartene blir gradvis tøffere: flere kropper og større sjanse for svarte hull
- [X] Livene dine følger med fra system til system (maks 5). Motstanderen har 1 → 3 liv utover i felttoget
- [X] Autolagring i localStorage, så felttoget kan fortsettes senere
- [X] Statistikk per vanskelighetsgrad: felttog fullført, lengst kommet, treffprosent, antall skudd, seiersrekke

### Steg 2: kartvalg
- [X] Velg hvert nytt kart i felttoget blant to miniatyrer: ved systemstart og etter hvert treff
- [X] Hvert kort viser vanskelighet (Open / Winding / Treacherous, ut fra treffvinduene for spiller 1)
- [X] Ved systemstart etter en seier gir det vanskeligste kartet +1 liv (ingenting med fulle liv)

### Steg 3: spesialprosjektiler (få av hver)
- [X] Belønning ved systemstart blir +1 liv eller et spesialprosjektil (med fulle liv: prosjektil)
- [X] Søkende skudd: svinger mot fiendeplaneten innenfor 250 px (erstattet «tungt skudd», som nesten ikke hjalp)
- [X] Splitter: tre skudd med ±3° spredning
- [X] Faseskudd: ikke påvirket av stjernenes tyngdekraft, bare svarte hull (skudd går allerede gjennom stjerner)

### Steg 4: sjefer og ferdiglagde kart
- [X] Sjefer i system 4 og 8 som er mindre mål: månebase (radius 16) og kampstasjon (radius 13), mot planetens 25
- [X] Ferdiglagde kart lagret som data, tre per sjef. Sjefskampen åpner med valg mellom to av dem
- [X] Visuell markering av spesialskudd: søkende er gyllent og låser seg på målet, fase er stiplet og flimrer, splitter har mindre hoder
- [X] Ingen spesialskudd ved start, bare som belønning
- [ ] Mulige ekstra sjefsregler: flere liv, to skudd per runde, planet i bane, eller at sjefen bruker spesialskudd

## Backlog: spillvarianter (når vi er fornøyd med spillet som det er)
- [ ] Flere elementer: kraft tilbake, flere stjerner samtidig, nye romobjekter og flere typer prosjektiler, slik at man må variere både vinkel og kraft. Kraft ble fjernet fordi målinger viste at vinkelen alene løste nesten alle kart, så kartene må gjøre kraft nødvendig.
- [ ] Solsystemer: hver spiller er et solsystem med tre bebodde planeter i bane rundt en stjerne. Planetene beveger seg og må tas med i beregningen, og hver planet er ett liv.

## Fullført
- [X] Rydd opp i prosjektet, unødvendige filer, funksjoner, etc
- [X] Stjerner og svarte hull plasseres med myk vekting mot midten
- [X] Flytte input-feltene til sidene av canvas
- [X] Fikse "hopping" av elementene på skjermen
- [X] Svarte hull er usynlige
- [X] Fjerne planeter, kun stjerner
- [X] Ulike stjerner har ulik tyngde (blå, hvit, rød)
- [X] Randomisere plassering av planeter
- [X] Bedre bakgrunnsbilde
- [X] Bare knapper, ikke slider. Ha en +1 og +5 knapp i hver retning
- [X] Gjøre planeter og grav-bodies litt penere
- [X] Lagt til glød på stjernene
- [X] Lagt til gravitational lensing der svarte hull er
- [X] Runden stopper ikke når én spiller treffes, men når begge prosjektilene har truffet eller er ute av skjermen, slik at uavgjort er mulig
- [X] Prosjektilbanen blir ikke forkortet
- [X] Vurder å gjøre fragmentene enda mer hakkete
- [X] Musikk og lyd
- [X] Eksplosjon når planeten blir truffet
- [X] ExplosionParticles har ingen feilaktig gravitasjonseffekt
- [X] Gjør at spillet ser bra ut på mobil også
- [X] Prosjektilene beveger seg litt for fort på mobil
- [X] Hver spiller har tre liv
- [X] Legg til kreditering for planeter og stjerner
- [X] Når alle tre liv er borte kommer det en game over beskjed
- [X] Vent ett sekund med å vise game over skjermen
- [X] Kula starter fra der pekeren er, ikke fronten av planeten
- [X] Legg til en knapp for å starte soundtrack, evt at det starter i det man trykke første knapp
- [X] Landscape-modus er fortsatt ikke OK på alle mobiler
- [X] Trenger et ikon for nettsiden
