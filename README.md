# FieldBook — Corn Trials

A phone app for recording corn variety trial data in the field. Replaces the paper
logbook. Works offline; installs to the home screen.

**Open it:** https://osmkhan.github.io/fieldbook-web/

## Installing on an Android phone

1. Open the link above in Chrome.
2. Tap the **⋮** menu → **Add to Home screen** (or accept the "Install app" prompt).
3. Open it from the home-screen icon. After the first open it works with no signal.

## How it works

Data collection is organised around a **session**: you pick the two or three traits
you're recording on this trip, then walk the plots with only those on screen. Picking
a single trait gives you one pass across every plot; picking several gives you
everything at one plot before moving on — the choice decides, nothing is hardcoded.

- **Per-plant traits** (plant height, ear height, ear length, ear diameter, kernel
  rows, ears per plant) keep every individual plant reading alongside the mean, so
  sample size and spread survive into the export.
- **Repeat measurements** are kept per date, so measuring height through the season
  builds a growth curve instead of overwriting the previous number.
- **NA** is recorded distinctly from not-yet-measured.
- Traits due at the current growth stage are suggested from days after planting.

## Where the data lives

Entirely on the phone, in the browser's IndexedDB. Nothing is uploaded anywhere and
there is no account. Export to CSV or Excel from the trial screen to get it off the
device — do that before clearing browser data or changing phones.

## Running it locally

```bash
npm install
npm run dev
```

Build: `npm run build` (output in `dist/`, deployed to the `gh-pages` branch).

## Stack

React + Vite, Tailwind, Dexie (IndexedDB), Zustand, Leaflet, Recharts, SheetJS,
vite-plugin-pwa.
