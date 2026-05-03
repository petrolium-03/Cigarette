# Cigarette Tracker

A zero-dependency, offline-first PWA to track cigarettes you smoke with one tap.
Set a daily goal, watch savings vs. your baseline accrue, earn silly character
badges along the way.

## Features

- One big button to log a cigarette
- Undo the last entry
- Day / week / month stats with a chart
- Daily goal with progress bar
- Cost saved + cigarettes avoided vs. a configurable baseline
- Funny character milestone badges (Smoldering Sloth, Mythical Zero, …)
- Installable PWA, works fully offline, all data stored locally in your browser

## Run locally

No build step. Serve the directory with any static server:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

To deploy: push these files to GitHub Pages (or any static host) — that's it.

## Files

| File | Purpose |
|---|---|
| `index.html`, `styles.css` | App shell and styles |
| `app.js` | DOM wiring, rendering, service-worker registration |
| `state.js` | `localStorage` read/write |
| `stats.js` | Pure stat functions |
| `badges.js` | Badge catalog and predicates |
| `chart.js` | Tiny canvas bar chart |
| `manifest.webmanifest`, `sw.js` | PWA manifest + offline cache |
| `icons/` | App icons |

## Storage

Everything lives in `localStorage` under the key `cigtracker.v1`. Reset from
**Settings → Reset all data**.
