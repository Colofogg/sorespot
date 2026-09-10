# SoreSpot

Mobile-first PWA: pick a body, spin it, tap sore spots, and get gentle stretch suggestions from a curated catalog.

**Gentle mobility tips only — not medical advice.**

## Features

- Male / Female body choice (saved in localStorage; change anytime from the body screen)
- Full-bleed SVG silhouette with Front / Side / Back views (drag to spin, snaps to angle)
- Multi-select sore-spot regions mapped to the stretch catalog
- Stretch cards: name, why it helps, duration/reps, steps, cautions
- Installable Android-first PWA (vite-plugin-pwa)

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

Production build:

```bash
npm run build
npm run preview
```

## Add to Home Screen (Android Chrome)

1. Open the deployed (or locally previewed) site in Chrome on Android.
2. Tap the menu (⋮) → **Install app** or **Add to Home screen**.
3. Confirm. SoreSpot opens fullscreen like an app.

## Project layout

- `src/data/stretches.json` — stretch catalog (regions, stretches, `regionToStretchIds`)
- `src/components/` — Gender, Body map, Stretch list screens
- PWA manifest + service worker via `vite-plugin-pwa`

## Demo path

1. Choose **Male** or **Female**
2. Drag the body to **Side** or stay on **Front**
3. Tap **Soles / feet** (and optionally calves)
4. Tap **Find stretches** → calf/foot-related stretches from the catalog
