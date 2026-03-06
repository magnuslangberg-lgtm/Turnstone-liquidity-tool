# Turnstone Liquidity Tool

Dette prosjektet var opprinnelig kun lastet inn i én fil (`data`).
Nå er det gjort om til en kjørbar, enkel web-app uten build-step.

## Kjør lokalt

```bash
python3 -m http.server 4173
```

Åpne deretter: http://localhost:4173

## Hva som er forbedret

- Oppsett med `index.html` + `app.jsx` slik at verktøyet faktisk kan kjøres i nettleser.
- Robust lasting av Recharts fra flere CDN-kilder (med fallback hvis én leverandør er blokkert).
- Robust bootstrap av React/ReactDOM/PropTypes/Babel fra flere CDN-kilder, med tydelig feilmelding på skjerm dersom alt blokkeres.
- Persistens i `localStorage` for innstillinger og redigerte kontantstrømmer.
- Kvartalsvis fordeling av kallinger i år 1 (Q1–Q4) for mer realistisk likviditets-/renteberegning i oppstartsfasen.
- Kallinger legges før utbetalinger i årsmodellen (mer konservativ likviditetsbelastning).
- Kortere standard horisont (7 år) med raskere realiseringsprofil i tråd med forventet fondsløp.
- Scenarioer styres nå med justerbar IRR (0–40%), og TVPI avledes automatisk som (1+IRR)^5.
- "Nullstill"-knapp for å gå tilbake til standardverdier.
- Robusthet for multiplikator-beregning når total innkalling er 0.
- Responsivt hovedgrid for bedre visning på smalere skjermer.

## Filer

- `app.jsx`: Hovedapplikasjonen.
- `index.html`: Inkluderer React/ReactDOM/Babel og laster Recharts med fler-kilde fallback via CDN.
- `data`: Original kildetekst beholdt urørt.
