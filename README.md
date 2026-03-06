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
- Persistens i `localStorage` for innstillinger og redigerte kontantstrømmer.
- "Nullstill"-knapp for å gå tilbake til standardverdier.
- Robusthet for multiplikator-beregning når total innkalling er 0.
- Responsivt hovedgrid for bedre visning på smalere skjermer.

## Filer

- `app.jsx`: Hovedapplikasjonen.
- `index.html`: Inkluderer React, ReactDOM, Recharts og Babel via CDN.
- `data`: Original kildetekst beholdt urørt.
