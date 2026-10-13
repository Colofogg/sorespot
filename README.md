# SoreSpot

Mobile-first PWA: pick a body, spin it, tap sore spots, and get gentle stretch suggestions from a curated catalog.

**Gentle mobility tips only — not medical advice.**

## Features

- Male / Female body choice (saved in localStorage; change anytime from the body screen)
- Full-bleed wireframe body with Front, ¾, Side, and Back views (drag to spin, or tap the angle)
- Multi-select sore-spot regions mapped to the stretch catalog
- Stretch cards: name, why it helps, duration/reps, steps, cautions
- Installable Android-first PWA (vite-plugin-pwa)

## Run locally

```bash
npm install
npm run dev
```

Then open the address Vite prints. It ends in `/sorespot/` (usually http://localhost:5173/sorespot/).

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

## How to use

1. Open SoreSpot.
2. Tap **Male** or **Female** — whichever body looks more like yours. You can change this later by tapping **Change body**.
3. A wireframe person appears. Drag sideways on the body to turn it. It snaps to **Front**, **¾**, **Side**, or **Back**. You can also tap those words at the top.
4. Tap the places that hurt. That part of the wireframe lights up, and its name shows under the body. Tap the same place again to turn it off. You can pick more than one spot.
5. Tap **Find stretches**.
6. Each card shows the stretch name, why it helps, how long to hold it, the steps, and a caution. Stop if something hurts sharply. These are gentle ideas, not medical advice.

Dragging sideways turns the figure. A quick tap, without a drag, picks a spot. You do not have to land on a thin line — tap the limb you see.
