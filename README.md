# SoreSpot

A phone app for finding gentle stretches. Pick the body that looks like yours, turn it, tap where it hurts, and read a short stretch card.

**These are gentle ideas for everyday stiffness, not medical advice.** Stop if something hurts sharply.

## What you can do

- Choose **Male** or **Female**. The app remembers. Tap **Change body** if you want the other one.
- Turn the photo: **Front**, **¾**, **Side**, and **Back**. Drag sideways on the picture, or tap those words at the top.
- Tap the places that hurt. The spot lights up on the photo and its name shows underneath. Tap it again to turn it off. You can pick more than one.
- Tap **Find stretches** to see cards with the name, why it helps, how long to hold it, the steps, and a caution.

A quick tap picks a spot. A sideways drag turns the body. You do not have to be exact — the tappable area is a little bigger than the body part.

## On your phone

1. Open the SoreSpot link in Chrome.
2. Tap the menu (⋮) → **Install app** or **Add to Home screen**.
3. Open SoreSpot from your home screen. It fills the screen like other apps.

## Run it on a computer

```bash
npm install
npm run dev
```

Open the address Vite prints. It ends in `/sorespot/` (usually http://localhost:5173/sorespot/).

To check the production build:

```bash
npm run build
npm run preview
```

## What's in the project

- `public/bodies/` — the body photos (Front, ¾, Side, Back, for male and female)
- `src/data/stretches.json` — the stretch list. Region names in the app match this file.
- `src/components/` — the three screens: choose a body, tap sore spots, read stretches
