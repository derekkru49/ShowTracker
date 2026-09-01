# ShowTracker

A polished, dependency-free streaming watchlist prototype. It includes responsive show cards, service and status filters, search, progress tracking, detail modals, adding shows, dark/light themes, and browser persistence.

## Run locally

From this directory, start any static server, for example:

```powershell
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Structure

- `index.html` — semantic app shell and dialogs
- `styles.css` — responsive design system and component styles
- `js/data.js` — seed catalog (easy to replace with an API)
- `js/app.js` — state, rendering, filtering, and persistence
- `assets/poster-grid.png` — original fictional show artwork

Data is stored in `localStorage` under `showtracker-shows`.

