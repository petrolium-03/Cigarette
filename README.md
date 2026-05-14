# Cigarette Tracker

A zero-dependency, offline-first PWA designed to help you cut back on smoking.
Each cigarette is logged by tapping a "stub it out" button — you watch the
graphic ember die and a smoke puff fade. Set a daily limit you're trying to
stay under, see what you've saved by smoking less, and unlock milestone badges
that reward awareness and restraint.

## Features

- Stub-out button: tap when you smoke one and watch the cigarette get
  extinguished
- Daily **limit** (not a goal) with progress bar that turns red when you
  exceed it, and copy that always frames things as "X under your limit"
- Undo the last entry
- Day / week / month stats with a chart, including a streak counter for days
  you stayed under your limit
- Money saved by cutting back + cigarettes your lungs skipped, vs. your old
  baseline
- Tappable milestone badges (Honest Mirror, Steady Tortoise, Mythical Zero, …)
  that reward tracking, restraint, and quitting — never the act of smoking
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
