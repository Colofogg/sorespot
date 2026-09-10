import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Gender, ViewAngle } from '../types'

interface Props {
  gender: Gender
  view: ViewAngle
  selected: Set<string>
  onToggle: (regionId: string) => void
  /** When true, suppress hotspot toggle (parent is treating gesture as rotate). */
  suppressTap?: boolean
  pressedId?: string | null
  onHotspotPointerDown?: (regionId: string, e: ReactPointerEvent) => void
}

type Hotspot = { id: string; d: string; label: string }

const HINT_KEY = 'sorespot-hotspot-hint-v12'

function hotspotsFor(view: ViewAngle, gender: Gender): Hotspot[] {
  const male = gender === 'male'
  // Athletic female: slightly narrower shoulders, natural waist→hip
  const sx = male ? 0 : 2
  const hx = male ? 0 : -3

  if (view === 'front') {
    return [
      { id: 'neck', label: 'Neck', d: `M${86 + sx} 66 L${114 - sx} 66 L${112 - sx} 94 L${88 + sx} 94 Z` },
      { id: 'traps', label: 'Traps', d: `M${66 + sx} 86 L${134 - sx} 86 L${148 - sx} 112 L${120 - sx} 118 L${100} 102 L${80 + sx} 118 L${52 + sx} 112 Z` },
      { id: 'shoulders', label: 'Shoulders', d: `M${44 + sx} 98 L${156 - sx} 98 L${160 - sx} 136 L${130 - sx} 140 L${100} 122 L${70 + sx} 140 L${40 + sx} 136 Z` },
      { id: 'chest', label: 'Chest', d: `M${68 + sx} 128 L${132 - sx} 128 L${130 - sx} 178 L${70 + sx} 178 Z` },
      { id: 'abs', label: 'Abs', d: `M${72 + sx} 176 L${128 - sx} 176 L${124 - sx} 236 L${76 + sx} 236 Z` },
      { id: 'hips-glutes-l', label: 'Left hip / glute', d: `M${62 + hx} 232 L${100} 232 L${100} 286 L${56 + hx} 280 Z` },
      { id: 'hips-glutes-r', label: 'Right hip / glute', d: `M${100} 232 L${138 - hx} 232 L${144 - hx} 280 L${100} 286 Z` },
      { id: 'quads-l', label: 'Left quads', d: 'M62 282 L98 286 L94 352 L66 348 Z' },
      { id: 'quads-r', label: 'Right quads', d: 'M102 286 L138 282 L134 348 L106 352 Z' },
      // Tall outer-thigh capsules with invisible padding (≥ ~28vb ≈ 44px)
      { id: 'it-band-l', label: 'Outer thigh (IT band)', d: 'M48 276 L72 274 L70 358 L46 356 Z' },
      { id: 'it-band-r', label: 'Outer thigh (IT band)', d: 'M128 274 L152 276 L154 356 L130 358 Z' },
      { id: 'knees-l', label: 'Left knee', d: 'M66 346 L96 350 L94 384 L68 380 Z' },
      { id: 'knees-r', label: 'Right knee', d: 'M104 350 L134 346 L132 380 L106 384 Z' },
      { id: 'calves-l', label: 'Left calf', d: 'M68 380 L96 384 L92 442 L70 438 Z' },
      { id: 'calves-r', label: 'Right calf', d: 'M104 384 L132 380 L130 438 L108 442 Z' },
      { id: 'ankles-l', label: 'Left ankle', d: 'M70 436 L94 440 L93 456 L71 452 Z' },
      { id: 'ankles-r', label: 'Right ankle', d: 'M106 440 L130 436 L129 452 L107 456 Z' },
      { id: 'soles-feet', label: 'Soles / feet', d: 'M62 452 L98 454 L100 476 L60 474 Z M102 454 L138 452 L140 474 L100 476 Z' },
      { id: 'elbows-forearms', label: 'Elbows / forearms', d: `M${26 + sx} 146 L${52 + sx} 138 L${46 + sx} 222 L${18 + sx} 228 Z M${148 - sx} 138 L${174 - sx} 146 L${182 - sx} 228 L${154 - sx} 222 Z` },
      { id: 'wrists-hands', label: 'Wrists / hands', d: `M${14 + sx} 224 L${44 + sx} 220 L${38 + sx} 258 L${8 + sx} 260 Z M${156 - sx} 220 L${186 - sx} 224 L${192 - sx} 260 L${162 - sx} 258 Z` },
    ]
  }

  if (view === 'three-quarter') {
    // Right-facing ¾ with clearer foreshortening — far (left) limbs thinner/offset
    return [
      { id: 'neck', label: 'Neck', d: 'M92 66 L118 70 L116 96 L94 94 Z' },
      { id: 'traps', label: 'Traps', d: 'M74 88 L136 96 L146 118 L122 124 L102 108 L82 118 L66 112 Z' },
      { id: 'shoulders', label: 'Shoulders', d: 'M52 100 L152 112 L156 140 L132 146 L102 126 L70 140 L48 134 Z' },
      { id: 'chest', label: 'Chest', d: 'M66 132 L122 136 L120 182 L68 178 Z' },
      { id: 'upper-back', label: 'Upper back', d: 'M118 128 L150 134 L146 178 L118 174 Z' },
      { id: 'abs', label: 'Abs', d: 'M70 178 L118 182 L116 238 L74 234 Z' },
      { id: 'lower-back', label: 'Lower back', d: 'M114 214 L144 222 L142 258 L112 254 Z' },
      { id: 'hips-glutes-l', label: 'Left hip / glute', d: 'M64 230 L100 236 L98 288 L60 280 Z' },
      { id: 'hips-glutes-r', label: 'Right hip / glute', d: 'M100 236 L146 244 L150 292 L100 288 Z' },
      { id: 'quads-l', label: 'Left quads', d: 'M62 282 L96 288 L92 354 L66 348 Z' },
      { id: 'quads-r', label: 'Right quads', d: 'M98 288 L138 292 L134 358 L102 354 Z' },
      { id: 'it-band-r', label: 'Outer thigh (IT band)', d: 'M128 286 L156 290 L158 364 L132 360 Z' },
      { id: 'it-band-l', label: 'Outer thigh (IT band)', d: 'M50 280 L70 278 L68 350 L48 348 Z' },
      { id: 'hamstrings-r', label: 'Right hamstring', d: 'M120 304 L142 308 L138 356 L118 352 Z' },
      { id: 'knees-l', label: 'Left knee', d: 'M66 346 L94 352 L92 386 L68 380 Z' },
      { id: 'knees-r', label: 'Right knee', d: 'M102 352 L136 356 L134 388 L104 384 Z' },
      { id: 'calves-l', label: 'Left calf', d: 'M68 380 L94 386 L90 444 L72 438 Z' },
      { id: 'calves-r', label: 'Right calf', d: 'M106 384 L134 388 L132 446 L108 442 Z' },
      { id: 'ankles-l', label: 'Left ankle', d: 'M72 436 L92 440 L91 456 L73 452 Z' },
      { id: 'ankles-r', label: 'Right ankle', d: 'M108 442 L132 446 L131 460 L109 456 Z' },
      { id: 'soles-feet', label: 'Soles / feet', d: 'M62 450 L96 454 L98 476 L60 472 Z M104 454 L138 456 L140 476 L102 474 Z' },
      { id: 'elbows-forearms', label: 'Elbows / forearms', d: 'M34 148 L58 142 L52 224 L28 228 Z M142 150 L168 158 L174 228 L150 222 Z' },
      { id: 'wrists-hands', label: 'Wrists / hands', d: 'M22 224 L50 220 L46 258 L18 260 Z M150 220 L176 226 L180 260 L154 254 Z' },
    ]
  }

  if (view === 'back') {
    return [
      { id: 'neck', label: 'Neck', d: `M${86 + sx} 66 L${114 - sx} 66 L${112 - sx} 94 L${88 + sx} 94 Z` },
      { id: 'traps', label: 'Traps', d: `M${64 + sx} 88 L${136 - sx} 88 L${150 - sx} 116 L${122 - sx} 122 L${100} 104 L${78 + sx} 122 L${50 + sx} 116 Z` },
      { id: 'shoulders', label: 'Shoulders', d: `M${44 + sx} 98 L${156 - sx} 98 L${160 - sx} 136 L${130 - sx} 140 L${100} 122 L${70 + sx} 140 L${40 + sx} 136 Z` },
      { id: 'upper-back', label: 'Upper back', d: `M${68 + sx} 124 L${132 - sx} 124 L${130 - sx} 174 L${70 + sx} 174 Z` },
      { id: 'mid-back', label: 'Mid back', d: `M${70 + sx} 172 L${130 - sx} 172 L${126 - sx} 218 L${74 + sx} 218 Z` },
      { id: 'lower-back', label: 'Lower back', d: `M${72 + sx} 216 L${128 - sx} 216 L${134 - hx} 258 L${66 + hx} 258 Z` },
      { id: 'hips-glutes-l', label: 'Left hip / glute', d: `M${58 + hx} 254 L${100} 256 L${100} 308 L${52 + hx} 300 Z` },
      { id: 'hips-glutes-r', label: 'Right hip / glute', d: `M${100} 256 L${142 - hx} 254 L${148 - hx} 300 L${100} 308 Z` },
      { id: 'hamstrings-l', label: 'Left hamstring', d: 'M60 304 L98 308 L94 364 L66 360 Z' },
      { id: 'hamstrings-r', label: 'Right hamstring', d: 'M102 308 L140 304 L134 360 L106 364 Z' },
      { id: 'it-band-l', label: 'Outer thigh (IT band)', d: 'M44 302 L70 300 L68 366 L42 364 Z' },
      { id: 'it-band-r', label: 'Outer thigh (IT band)', d: 'M130 300 L156 302 L158 364 L132 366 Z' },
      { id: 'knees-l', label: 'Left knee', d: 'M66 360 L96 364 L94 392 L68 388 Z' },
      { id: 'knees-r', label: 'Right knee', d: 'M104 364 L134 360 L132 388 L106 392 Z' },
      { id: 'calves-l', label: 'Left calf', d: 'M68 388 L96 392 L92 444 L70 440 Z' },
      { id: 'calves-r', label: 'Right calf', d: 'M104 392 L132 388 L130 440 L108 444 Z' },
      { id: 'ankles-l', label: 'Left ankle', d: 'M70 438 L94 442 L93 456 L71 452 Z' },
      { id: 'ankles-r', label: 'Right ankle', d: 'M106 442 L130 438 L129 452 L107 456 Z' },
      { id: 'soles-feet', label: 'Soles / feet', d: 'M62 452 L98 454 L100 476 L60 474 Z M102 454 L138 452 L140 474 L100 476 Z' },
      { id: 'elbows-forearms', label: 'Elbows / forearms', d: `M${26 + sx} 146 L${52 + sx} 138 L${46 + sx} 222 L${18 + sx} 228 Z M${148 - sx} 138 L${174 - sx} 146 L${182 - sx} 228 L${154 - sx} 222 Z` },
    ]
  }

  // Side: left-facing profile — right side near (matches Right quads / IT band)
  return [
    { id: 'neck', label: 'Neck', d: 'M82 62 L118 64 L116 92 L86 90 Z' },
    { id: 'traps', label: 'Traps', d: 'M90 86 L136 90 L140 118 L94 114 Z' },
    { id: 'shoulders', label: 'Shoulders', d: 'M78 90 L142 96 L146 138 L82 134 Z' },
    { id: 'chest', label: 'Chest', d: 'M54 118 L102 114 L106 176 L56 182 Z' },
    { id: 'upper-back', label: 'Upper back', d: 'M110 110 L158 122 L156 176 L112 168 Z' },
    { id: 'abs', label: 'Abs', d: 'M56 178 L108 172 L114 240 L64 248 Z' },
    { id: 'mid-back', label: 'Mid back', d: 'M112 168 L156 176 L154 230 L114 224 Z' },
    { id: 'lower-back', label: 'Lower back', d: 'M110 220 L158 234 L162 272 L108 264 Z' },
    { id: 'hips-glutes', label: 'Hips / glutes', d: 'M62 242 L168 262 L172 316 L58 302 Z' },
    { id: 'quads-r', label: 'Right quads', d: 'M50 296 L102 306 L96 372 L46 360 Z' },
    { id: 'hamstrings-r', label: 'Right hamstring', d: 'M110 304 L158 316 L154 372 L112 362 Z' },
    { id: 'it-band-r', label: 'Outer thigh (IT band)', d: 'M88 294 L140 306 L136 378 L84 366 Z' },
    { id: 'knees-r', label: 'Right knee', d: 'M50 358 L114 370 L112 402 L52 392 Z' },
    { id: 'calves-r', label: 'Right calf', d: 'M52 396 L118 408 L116 456 L62 446 Z' },
    { id: 'ankles-r', label: 'Right ankle', d: 'M58 444 L118 454 L116 468 L60 460 Z' },
    { id: 'soles-feet', label: 'Soles / feet', d: 'M34 458 L118 466 L128 482 L32 478 Z M130 456 L170 462 L176 480 L134 476 Z' },
    { id: 'elbows-forearms', label: 'Elbows / forearms', d: 'M64 140 L96 148 L100 230 L68 226 Z' },
    { id: 'wrists-hands', label: 'Wrists / hands', d: 'M66 222 L100 230 L104 262 L70 256 Z' },
  ]
}

/** Athletic silhouettes — wider limbs for tap targets; female = athletic-neutral. */
function silhouettePath(view: ViewAngle, gender: Gender): string {
  const male = gender === 'male'
  if (view === 'side') {
    // Left-facing profile (right side near). Face-on filled path — never blank.
    // TODO(v1.3): mirrored right-facing Side (left side near) — queued polish, do not block ship.
    return male
      ? 'M102 20 C92 18 80 22 74 30 C68 36 64 42 66 48 L70 54 L74 60 L82 66 L88 74 L82 86 L72 104 L64 128 L58 156 L56 186 L58 216 L64 244 L72 268 L66 286 L58 310 L54 340 L52 372 L54 404 L58 432 L52 452 L40 462 L36 472 L48 478 L110 480 L118 468 L116 448 L114 420 L116 388 L122 356 L130 328 L142 308 L156 318 L164 348 L168 384 L166 420 L164 448 L170 464 L178 476 L148 480 L140 466 L138 440 L140 404 L144 368 L150 340 L158 318 L168 300 L174 278 L172 252 L166 224 L160 192 L158 160 L152 130 L140 104 L126 86 L118 74 L122 62 C128 52 130 38 124 28 C118 20 110 18 102 20 Z M78 118 C70 130 66 150 66 172 C66 198 70 224 76 246 L90 248 C94 224 96 198 96 172 C96 148 92 130 88 120 Z'
      : 'M100 18 C90 16 78 20 72 28 C66 34 62 40 64 46 L68 52 L72 58 L80 64 L86 72 L80 84 L70 102 L62 126 L56 154 L54 184 L56 214 L64 242 L74 266 L68 284 L60 308 L56 338 L54 370 L56 402 L60 430 L54 450 L42 460 L38 470 L50 478 L108 480 L116 468 L114 448 L112 420 L114 388 L120 356 L128 328 L140 308 L154 318 L162 348 L166 384 L164 420 L162 448 L168 464 L176 476 L146 480 L138 466 L136 440 L138 404 L142 368 L148 340 L156 318 L166 298 L172 276 L170 250 L164 222 L158 190 L156 158 L150 128 L138 102 L124 84 L116 72 L120 60 C126 50 128 36 122 26 C116 18 108 16 100 18 Z M76 116 C68 128 64 148 64 170 C64 196 68 222 74 244 L88 246 C92 222 94 196 94 170 C94 146 90 128 86 118 Z'
  }
  if (view === 'three-quarter') {
    // Clear ¾ foreshortening: near (right) side fuller, far (left) compressed
    return male
      ? 'M104 24 C122 24 130 48 118 58 L134 72 L160 114 L168 162 L156 214 L152 250 L164 294 L158 368 L152 428 L160 474 L118 476 L112 428 L108 368 L106 310 L104 368 L100 428 L96 474 L54 472 L62 428 L56 368 L52 294 L62 250 L54 214 L40 162 L48 114 L72 72 L90 58 C80 48 86 24 104 24 Z'
      : 'M104 22 C120 22 126 46 116 56 L130 70 L154 110 L160 156 L148 208 L146 244 L158 288 L152 368 L146 428 L154 474 L120 476 L114 428 L110 368 L108 310 L106 368 L102 428 L98 474 L62 472 L68 428 L62 368 L56 288 L66 244 L64 208 L52 156 L60 110 L82 70 L96 56 C88 46 88 22 104 22 Z'
  }
  // front/back — athletic proportions, visible arm/leg volume
  if (male) {
    return 'M100 24 C118 24 124 48 114 58 L134 72 L160 112 L168 164 L156 214 L148 248 L156 292 L152 368 L148 428 L156 476 L114 478 L108 428 L106 368 L104 308 L100 368 L96 428 L90 478 L44 476 L52 428 L48 368 L44 292 L52 248 L44 214 L32 164 L40 112 L66 72 L86 58 C76 48 82 24 100 24 Z'
  }
  // Female athletic-neutral: narrower shoulders, clear waist, natural hip — not heavy, not fashion-skinny
  return 'M100 22 C116 22 122 46 112 56 L128 70 L152 108 L158 156 L146 206 L140 240 L152 286 L148 368 L144 428 L152 476 L116 478 L110 428 L108 368 L104 308 L100 368 L96 428 L90 476 L50 474 L56 428 L52 368 L48 286 L60 240 L54 206 L42 156 L48 108 L72 70 L88 56 C80 46 84 22 100 22 Z'
}

function muscleGuides(view: ViewAngle, gender: Gender): string[] {
  const male = gender === 'male'
  if (view === 'front') {
    return male
      ? [
          'M100 128 L100 236',
          'M74 142 Q100 154 126 142',
          'M76 178 Q100 188 124 178',
          'M78 210 Q100 218 122 210',
          'M78 258 Q100 270 122 258',
          'M80 308 Q90 322 86 348',
          'M120 308 Q110 322 114 348',
          'M56 160 Q48 190 44 220',
          'M144 160 Q152 190 156 220',
        ]
      : [
          'M100 130 L100 232',
          'M76 144 Q100 156 124 144',
          'M78 180 Q100 188 122 180',
          'M80 212 Q100 220 120 212',
          'M80 256 Q100 266 120 256',
          'M82 310 Q92 324 88 348',
          'M118 310 Q108 324 112 348',
          'M58 158 Q52 186 48 216',
          'M142 158 Q148 186 152 216',
        ]
  }
  if (view === 'back') {
    return [
      'M100 124 L100 256',
      'M76 142 Q100 156 124 142',
      'M78 178 Q100 190 122 178',
      'M74 220 Q100 232 126 220',
      'M76 268 Q100 284 124 268',
      'M82 318 Q92 332 88 358',
      'M118 318 Q108 332 112 358',
    ]
  }
  if (view === 'three-quarter') {
    return [
      'M106 132 L106 238',
      'M78 148 Q106 158 124 150',
      'M82 182 Q106 192 122 184',
      'M84 258 Q106 270 128 262',
      'M88 312 Q98 326 94 350',
      'M124 316 Q116 330 120 352',
      'M148 160 Q156 190 160 220',
    ]
  }
  return [
    'M92 120 L96 240',
    'M70 140 Q88 150 100 142',
    'M128 140 Q142 180 140 220',
    'M78 270 Q100 286 130 278',
    'M70 320 Q86 340 82 370',
    'M120 318 Q136 340 132 372',
    'M72 400 Q90 418 100 448',
  ]
}

/** Soft form volumes for stronger 3D (clipped to body). */
function volumeOverlays(view: ViewAngle): { d: string; opacity: number }[] {
  if (view === 'side') {
    return [
      { d: 'M70 110 Q88 180 76 250 Q96 270 118 250 Q130 180 120 110 Z', opacity: 0.11 },
      { d: 'M96 36 Q118 48 116 70 Q104 78 94 66 Z', opacity: 0.1 },
      { d: 'M130 270 Q158 300 152 350 Q138 360 128 330 Z', opacity: 0.15 },
      { d: 'M62 300 Q78 340 74 380 Q64 390 58 350 Z', opacity: 0.1 },
    ]
  }
  if (view === 'three-quarter') {
    return [
      { d: 'M70 130 Q100 160 130 140 Q140 200 128 250 Q100 270 72 250 Z', opacity: 0.1 },
      { d: 'M130 280 Q155 310 150 360 Q135 370 128 340 Z', opacity: 0.16 },
      { d: 'M55 150 Q45 200 50 240 Q65 230 70 180 Z', opacity: 0.14 },
    ]
  }
  if (view === 'back') {
    return [
      { d: 'M72 130 Q100 150 128 130 Q132 200 124 250 Q100 270 76 250 Z', opacity: 0.1 },
      { d: 'M60 260 Q100 290 140 260 Q138 320 100 340 Q62 320 60 260 Z', opacity: 0.12 },
    ]
  }
  return [
    { d: 'M72 130 Q100 150 128 130 Q132 200 124 250 Q100 270 76 250 Z', opacity: 0.1 },
    { d: 'M78 280 Q100 300 122 280 Q120 340 100 360 Q80 340 78 280 Z', opacity: 0.08 },
    { d: 'M48 140 Q40 190 44 230 Q58 210 62 160 Z', opacity: 0.12 },
    { d: 'M152 140 Q160 190 156 230 Q142 210 138 160 Z', opacity: 0.12 },
  ]
}

const PULSE_IDS_FRONT = ['shoulders', 'quads-r', 'it-band-l']

export function BodySilhouette({
  gender,
  view,
  selected,
  onToggle,
  suppressTap = false,
  pressedId = null,
  onHotspotPointerDown,
}: Props) {
  const spots = hotspotsFor(view, gender)
  const guides = muscleGuides(view, gender)
  const volumes = volumeOverlays(view)
  const uid = `${gender}-${view}`
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(HINT_KEY)) return
      setPulse(true)
      const t = window.setTimeout(() => {
        setPulse(false)
        try {
          localStorage.setItem(HINT_KEY, '1')
        } catch {
          /* ignore */
        }
      }, 2400)
      return () => window.clearTimeout(t)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <svg
      className="body-svg"
      viewBox="0 0 200 490"
      role="img"
      aria-label={`${gender} body, ${view} view. Tap regions that hurt.`}
    >
      <defs>
        {/* World-locked key light from upper-left */}
        <linearGradient id={`skin-${uid}`} x1="12%" y1="4%" x2="92%" y2="96%">
          <stop offset="0%" stopColor="#e4f2ed" />
          <stop offset="35%" stopColor="#c5ddd5" />
          <stop offset="70%" stopColor="#9ec4b8" />
          <stop offset="100%" stopColor="#6f9e93" />
        </linearGradient>
        {/* Cylindrical limb/torso shading */}
        <linearGradient id={`cyl-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.28" />
          <stop offset="22%" stopColor="#000" stopOpacity="0.06" />
          <stop offset="48%" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="72%" stopColor="#000" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.32" />
        </linearGradient>
        {/* Top-down AO */}
        <radialGradient id={`ao-${uid}`} cx="48%" cy="12%" r="78%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="55%" stopColor="#000" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
        </radialGradient>
        {/* Soft rim / specular from light side */}
        <linearGradient id={`rim-${uid}`} x1="0%" y1="20%" x2="70%" y2="80%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="40%" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
        <filter id={`soft-${uid}`} x="-4%" y="-4%" width="108%" height="108%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#1a2e2e" floodOpacity="0.18" />
        </filter>
        <clipPath id={`body-clip-${uid}`}>
          <path d={silhouettePath(view, gender)} />
        </clipPath>
      </defs>

      <ellipse className="body-shadow" cx="100" cy="478" rx="48" ry="7" />

      <g filter={`url(#soft-${uid})`}>
        <path
          className="body-outline"
          d={silhouettePath(view, gender)}
          fill={`url(#skin-${uid})`}
        />
        <g clipPath={`url(#body-clip-${uid})`}>
          <rect x="0" y="0" width="200" height="490" fill={`url(#cyl-${uid})`} opacity="0.65" />
          <rect x="0" y="0" width="200" height="490" fill={`url(#rim-${uid})`} opacity="0.85" />
          <rect x="0" y="0" width="200" height="490" fill={`url(#ao-${uid})`} />
          {volumes.map((v, i) => (
            <path key={i} d={v.d} fill="#1a2e2e" opacity={v.opacity} />
          ))}
          {guides.map((d, i) => (
            <path key={i} className="muscle-guide" d={d} />
          ))}
        </g>
      </g>

      {spots.map((spot) => {
        const isOn = selected.has(spot.id)
        const isPressed = pressedId === spot.id
        const isPulse =
          pulse &&
          view === 'front' &&
          PULSE_IDS_FRONT.includes(spot.id)
        return (
          <path
            key={`${view}-${spot.id}`}
            className={`hotspot${isOn ? ' selected' : ''}${isPressed ? ' pressed' : ''}${spot.id.includes('it-band') ? ' itband' : ''}${isPulse ? ' pulse' : ''}`}
            d={spot.d}
            role="button"
            tabIndex={0}
            aria-pressed={isOn}
            aria-label={`${spot.label}${isOn ? ', selected' : ''}`}
            data-region={spot.id}
            onPointerDown={(e) => {
              onHotspotPointerDown?.(spot.id, e)
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (suppressTap) return
              onToggle(spot.id)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onToggle(spot.id)
              }
            }}
          >
            <title>{spot.label}</title>
          </path>
        )
      })}
    </svg>
  )
}

/** Mini shaded figure for gender form cards — same art language as body map. */
export function MiniFigure({ gender }: { gender: Gender }) {
  const male = gender === 'male'
  const d = male
    ? 'M60 14 C72 14 76 28 70 34 L82 42 L96 66 L100 96 L94 124 L90 142 L96 166 L94 208 L92 240 L96 268 L70 270 L66 240 L64 208 L62 176 L60 208 L58 240 L54 270 L24 268 L28 240 L26 208 L24 166 L30 142 L24 124 L18 96 L22 66 L38 42 L50 34 C44 28 48 14 60 14 Z'
    : 'M60 12 C70 12 74 26 68 32 L78 40 L90 64 L94 92 L88 120 L84 138 L92 162 L90 208 L88 240 L92 268 L70 270 L66 240 L64 208 L62 176 L60 208 L58 240 L54 270 L28 268 L32 240 L30 208 L28 162 L36 138 L32 120 L26 92 L30 64 L42 40 L52 32 C46 26 50 12 60 12 Z'
  const uid = `mini-${gender}`
  return (
    <svg className="gender-preview" viewBox="0 0 120 280" aria-hidden="true">
      <defs>
        <linearGradient id={`mskin-${uid}`} x1="15%" y1="5%" x2="90%" y2="95%">
          <stop offset="0%" stopColor="#e4f2ed" />
          <stop offset="40%" stopColor="#b7d4cc" />
          <stop offset="100%" stopColor="#6f9e93" />
        </linearGradient>
        <linearGradient id={`mcyl-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.26" />
        </linearGradient>
        <clipPath id={`mclip-${uid}`}>
          <path d={d} />
        </clipPath>
      </defs>
      <ellipse cx="60" cy="272" rx="28" ry="4" fill="rgba(26,46,46,0.18)" />
      <path d={d} fill={`url(#mskin-${uid})`} stroke="rgba(45,90,90,0.2)" strokeWidth="1" strokeLinejoin="round" />
      <g clipPath={`url(#mclip-${uid})`}>
        <rect x="0" y="0" width="120" height="280" fill={`url(#mcyl-${uid})`} opacity="0.55" />
        <path
          d={male ? 'M60 70 L60 145 M48 85 Q60 92 72 85 M50 110 Q60 116 70 110' : 'M60 68 L60 140 M50 84 Q60 90 70 84 M52 108 Q60 114 68 108'}
          fill="none"
          stroke="rgba(26,46,46,0.16)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
