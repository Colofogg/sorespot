import type { Gender, ViewAngle } from '../types'

interface Props {
  gender: Gender
  view: ViewAngle
  selected: Set<string>
  onToggle: (regionId: string) => void
}

type Hotspot = { id: string; d: string; label: string }

function hotspotsFor(view: ViewAngle, gender: Gender): Hotspot[] {
  const male = gender === 'male'
  // Athletic female: slightly narrower shoulders, natural waist→hip (not heavy)
  const sx = male ? 0 : 3
  const hx = male ? 0 : -2 // mild hip widen vs waist, not exaggerated

  if (view === 'front') {
    return [
      { id: 'neck', label: 'Neck', d: `M${90 + sx} 70 L${110 - sx} 70 L${108 - sx} 92 L${92 + sx} 92 Z` },
      { id: 'traps', label: 'Traps', d: `M${72 + sx} 88 L${128 - sx} 88 L${140 - sx} 108 L${118 - sx} 112 L${100} 100 L${82 + sx} 112 L${60 + sx} 108 Z` },
      { id: 'shoulders', label: 'Shoulders', d: `M${52 + sx} 100 L${148 - sx} 100 L${152 - sx} 128 L${128 - sx} 132 L${100} 118 L${72 + sx} 132 L${48 + sx} 128 Z` },
      { id: 'chest', label: 'Chest', d: `M${72 + sx} 125 L${128 - sx} 125 L${126 - sx} 172 L${74 + sx} 172 Z` },
      { id: 'abs', label: 'Abs', d: `M${76 + sx} 170 L${124 - sx} 170 L${120 - sx} 228 L${80 + sx} 228 Z` },
      { id: 'hips-glutes-l', label: 'Left hip / glute', d: `M${68 + hx} 224 L${100} 224 L${100} 272 L${62 + hx} 268 Z` },
      { id: 'hips-glutes-r', label: 'Right hip / glute', d: `M${100} 224 L${132 - hx} 224 L${138 - hx} 268 L${100} 272 Z` },
      { id: 'quads-l', label: 'Left quads', d: 'M66 270 L98 272 L96 348 L70 346 Z' },
      { id: 'quads-r', label: 'Right quads', d: 'M102 272 L134 270 L130 346 L104 348 Z' },
      { id: 'it-band-l', label: 'Outer thigh (IT band)', d: 'M58 278 L70 276 L68 350 L54 348 Z' },
      { id: 'it-band-r', label: 'Outer thigh (IT band)', d: 'M130 276 L142 278 L146 348 L132 350 Z' },
      { id: 'knees-l', label: 'Left knee', d: 'M70 344 L96 346 L94 378 L72 376 Z' },
      { id: 'knees-r', label: 'Right knee', d: 'M104 346 L130 344 L128 376 L106 378 Z' },
      { id: 'calves-l', label: 'Left calf', d: 'M72 376 L94 378 L92 438 L74 436 Z' },
      { id: 'calves-r', label: 'Right calf', d: 'M106 378 L128 376 L126 436 L108 438 Z' },
      { id: 'ankles-l', label: 'Left ankle', d: 'M74 434 L92 436 L91 452 L75 450 Z' },
      { id: 'ankles-r', label: 'Right ankle', d: 'M108 436 L126 434 L125 450 L109 452 Z' },
      { id: 'soles-feet', label: 'Soles / feet', d: 'M68 450 L98 452 L100 472 L66 470 Z M102 452 L132 450 L134 470 L100 472 Z' },
      { id: 'elbows-forearms', label: 'Elbows / forearms', d: `M${34 + sx} 148 L${54 + sx} 142 L${46 + sx} 218 L${26 + sx} 222 Z M${146 - sx} 142 L${166 - sx} 148 L${174 - sx} 222 L${154 - sx} 218 Z` },
      { id: 'wrists-hands', label: 'Wrists / hands', d: `M${22 + sx} 218 L${46 + sx} 216 L${40 + sx} 252 L${16 + sx} 254 Z M${154 - sx} 216 L${178 - sx} 218 L${184 - sx} 254 L${160 - sx} 252 Z` },
    ]
  }

  if (view === 'three-quarter') {
    // Right-facing ¾: outer (right) IT band more visible
    return [
      { id: 'neck', label: 'Neck', d: 'M94 70 L114 72 L112 94 L96 92 Z' },
      { id: 'traps', label: 'Traps', d: 'M78 90 L130 94 L138 112 L118 116 L100 104 L84 112 L70 108 Z' },
      { id: 'shoulders', label: 'Shoulders', d: 'M60 102 L145 108 L148 132 L128 136 L100 122 L72 132 L56 128 Z' },
      { id: 'chest', label: 'Chest', d: 'M70 128 L118 130 L116 175 L72 172 Z' },
      { id: 'upper-back', label: 'Upper back', d: 'M116 125 L142 128 L138 170 L116 168 Z' },
      { id: 'abs', label: 'Abs', d: 'M74 172 L114 174 L112 228 L78 226 Z' },
      { id: 'lower-back', label: 'Lower back', d: 'M112 210 L136 214 L134 250 L110 248 Z' },
      { id: 'hips-glutes-l', label: 'Left hip / glute', d: 'M70 224 L100 228 L98 272 L66 268 Z' },
      { id: 'hips-glutes-r', label: 'Right hip / glute', d: 'M100 228 L138 232 L140 274 L100 272 Z' },
      { id: 'quads-l', label: 'Left quads', d: 'M68 270 L96 274 L94 348 L70 344 Z' },
      { id: 'quads-r', label: 'Right quads', d: 'M98 274 L130 276 L128 350 L100 348 Z' },
      { id: 'it-band-r', label: 'Outer thigh (IT band)', d: 'M128 278 L146 280 L148 352 L132 350 Z' },
      { id: 'it-band-l', label: 'Outer thigh (IT band)', d: 'M60 276 L70 274 L68 346 L56 344 Z' },
      { id: 'hamstrings-r', label: 'Right hamstring', d: 'M122 300 L136 302 L134 348 L120 346 Z' },
      { id: 'knees-l', label: 'Left knee', d: 'M70 342 L94 346 L92 378 L72 374 Z' },
      { id: 'knees-r', label: 'Right knee', d: 'M100 346 L128 348 L126 378 L102 376 Z' },
      { id: 'calves-l', label: 'Left calf', d: 'M72 374 L92 376 L90 436 L74 434 Z' },
      { id: 'calves-r', label: 'Right calf', d: 'M104 376 L126 378 L124 438 L106 436 Z' },
      { id: 'ankles-l', label: 'Left ankle', d: 'M74 432 L90 434 L89 450 L75 448 Z' },
      { id: 'ankles-r', label: 'Right ankle', d: 'M106 436 L124 438 L123 452 L107 450 Z' },
      { id: 'soles-feet', label: 'Soles / feet', d: 'M68 448 L96 450 L98 470 L66 468 Z M102 450 L130 452 L132 470 L100 468 Z' },
      { id: 'elbows-forearms', label: 'Elbows / forearms', d: 'M42 150 L60 146 L54 218 L34 220 Z M140 148 L158 152 L164 220 L146 216 Z' },
      { id: 'wrists-hands', label: 'Wrists / hands', d: 'M30 216 L52 214 L48 250 L24 252 Z M146 214 L168 218 L172 252 L150 248 Z' },
    ]
  }

  if (view === 'back') {
    return [
      { id: 'neck', label: 'Neck', d: `M${90 + sx} 70 L${110 - sx} 70 L${108 - sx} 92 L${92 + sx} 92 Z` },
      { id: 'traps', label: 'Traps', d: `M${70 + sx} 90 L${130 - sx} 90 L${142 - sx} 112 L${118 - sx} 116 L${100} 102 L${82 + sx} 116 L${58 + sx} 112 Z` },
      { id: 'shoulders', label: 'Shoulders', d: `M${52 + sx} 100 L${148 - sx} 100 L${152 - sx} 128 L${128 - sx} 132 L${100} 118 L${72 + sx} 132 L${48 + sx} 128 Z` },
      { id: 'upper-back', label: 'Upper back', d: `M${72 + sx} 120 L${128 - sx} 120 L${126 - sx} 168 L${74 + sx} 168 Z` },
      { id: 'mid-back', label: 'Mid back', d: `M${74 + sx} 166 L${126 - sx} 166 L${122 - sx} 212 L${78 + sx} 212 Z` },
      { id: 'lower-back', label: 'Lower back', d: `M${76 + sx} 210 L${124 - sx} 210 L${128 - hx} 250 L${72 + hx} 250 Z` },
      { id: 'hips-glutes-l', label: 'Left hip / glute', d: `M${64 + hx} 246 L${100} 248 L${100} 298 L${58 + hx} 292 Z` },
      { id: 'hips-glutes-r', label: 'Right hip / glute', d: `M${100} 248 L${136 - hx} 246 L${142 - hx} 292 L${100} 298 Z` },
      { id: 'hamstrings-l', label: 'Left hamstring', d: 'M66 296 L98 298 L96 358 L70 356 Z' },
      { id: 'hamstrings-r', label: 'Right hamstring', d: 'M102 298 L134 296 L130 356 L104 358 Z' },
      { id: 'it-band-l', label: 'Outer thigh (IT band)', d: 'M54 300 L68 298 L66 360 L52 358 Z' },
      { id: 'it-band-r', label: 'Outer thigh (IT band)', d: 'M132 298 L146 300 L148 358 L134 360 Z' },
      { id: 'knees-l', label: 'Left knee', d: 'M70 354 L96 356 L94 384 L72 382 Z' },
      { id: 'knees-r', label: 'Right knee', d: 'M104 356 L130 354 L128 382 L106 384 Z' },
      { id: 'calves-l', label: 'Left calf', d: 'M72 380 L94 382 L92 438 L74 436 Z' },
      { id: 'calves-r', label: 'Right calf', d: 'M106 382 L128 380 L126 436 L108 438 Z' },
      { id: 'ankles-l', label: 'Left ankle', d: 'M74 434 L92 436 L91 452 L75 450 Z' },
      { id: 'ankles-r', label: 'Right ankle', d: 'M108 436 L126 434 L125 450 L109 452 Z' },
      { id: 'soles-feet', label: 'Soles / feet', d: 'M68 450 L98 452 L100 472 L66 470 Z M102 452 L132 450 L134 470 L100 472 Z' },
      { id: 'elbows-forearms', label: 'Elbows / forearms', d: `M${34 + sx} 148 L${54 + sx} 142 L${46 + sx} 218 L${26 + sx} 222 Z M${146 - sx} 142 L${166 - sx} 148 L${174 - sx} 222 L${154 - sx} 218 Z` },
    ]
  }

  // side (right profile) — IT band on outer (visible) thigh
  return [
    { id: 'neck', label: 'Neck', d: 'M90 68 L112 70 L110 96 L92 94 Z' },
    { id: 'traps', label: 'Traps', d: 'M88 92 L122 90 L126 112 L96 114 Z' },
    { id: 'shoulders', label: 'Shoulders', d: 'M80 95 L122 92 L126 130 L86 134 Z' },
    { id: 'chest', label: 'Chest', d: 'M72 124 L104 120 L106 172 L70 176 Z' },
    { id: 'upper-back', label: 'Upper back', d: 'M104 115 L130 118 L128 168 L106 166 Z' },
    { id: 'abs', label: 'Abs', d: 'M70 174 L104 170 L106 226 L74 230 Z' },
    { id: 'mid-back', label: 'Mid back', d: 'M104 166 L128 168 L126 216 L106 214 Z' },
    { id: 'lower-back', label: 'Lower back', d: 'M100 212 L126 216 L128 250 L98 248 Z' },
    { id: 'hips-glutes', label: 'Hips / glutes', d: 'M72 228 L128 246 L132 292 L68 286 Z' },
    { id: 'quads', label: 'Quads', d: 'M74 286 L104 290 L100 360 L72 354 Z' },
    { id: 'hamstrings', label: 'Hamstrings', d: 'M104 290 L128 294 L124 360 L102 354 Z' },
    { id: 'it-band', label: 'Outer thigh (IT band)', d: 'M118 292 L136 296 L132 362 L116 358 Z' },
    { id: 'knees', label: 'Knees', d: 'M74 352 L112 356 L110 386 L76 382 Z' },
    { id: 'calves', label: 'Calves', d: 'M76 384 L110 388 L108 442 L80 438 Z' },
    { id: 'ankles', label: 'Ankles', d: 'M80 438 L108 442 L106 456 L82 452 Z' },
    { id: 'soles-feet', label: 'Soles / feet', d: 'M72 452 L114 454 L120 472 L68 470 Z' },
    { id: 'elbows-forearms', label: 'Elbows / forearms', d: 'M96 144 L118 148 L124 216 L100 214 Z' },
    { id: 'wrists-hands', label: 'Wrists / hands', d: 'M100 212 L124 214 L128 250 L102 248 Z' },
  ]
}

/** Soft athletic silhouettes — female = fit recreational runner/yoga proportions. */
function silhouettePath(view: ViewAngle, gender: Gender): string {
  const male = gender === 'male'
  if (view === 'side') {
    return male
      ? 'M100 28 C116 28 120 46 112 56 L118 68 L132 98 L136 138 L128 198 L124 236 L136 278 L130 358 L126 418 L132 468 L92 470 L88 418 L84 358 L76 278 L82 236 L74 198 L68 138 L76 98 L90 68 L94 56 C86 46 84 28 100 28 Z'
      : 'M100 26 C114 26 118 44 110 54 L116 66 L128 96 L130 136 L122 196 L118 232 L130 272 L126 358 L122 418 L128 468 L94 470 L90 418 L86 358 L78 272 L86 232 L78 196 L74 136 L82 96 L94 66 L96 54 C88 44 86 26 100 26 Z'
  }
  if (view === 'three-quarter') {
    return male
      ? 'M102 26 C118 26 124 46 114 56 L128 68 L150 106 L156 150 L146 196 L142 232 L152 272 L148 358 L142 418 L148 468 L112 470 L108 418 L104 358 L102 300 L100 358 L98 418 L96 470 L62 468 L68 418 L64 358 L62 272 L70 232 L64 196 L52 150 L58 106 L78 68 L92 56 C84 46 86 26 102 26 Z'
      : 'M102 24 C116 24 120 44 112 54 L124 66 L144 102 L148 146 L138 192 L136 228 L146 270 L142 358 L136 418 L142 468 L114 470 L110 418 L106 358 L104 300 L102 358 L100 418 L98 470 L68 468 L72 418 L68 358 L64 270 L72 228 L70 192 L60 146 L66 102 L84 66 L96 54 C88 44 88 24 102 24 Z'
  }
  // front/back
  if (male) {
    return 'M100 26 C116 26 120 46 112 56 L128 68 L150 105 L156 152 L146 198 L140 230 L146 270 L144 358 L140 418 L146 470 L110 472 L106 418 L104 358 L102 300 L100 358 L98 418 L94 472 L54 470 L60 418 L56 358 L54 270 L60 230 L54 198 L44 152 L50 105 L72 68 L88 56 C80 46 84 26 100 26 Z'
  }
  // Female athletic: narrower shoulders, clear waist, natural hip (not heavy)
  return 'M100 24 C114 24 118 44 110 54 L124 66 L142 100 L146 144 L136 188 L132 222 L142 265 L138 358 L134 418 L140 470 L112 472 L108 418 L105 358 L102 300 L100 358 L97 418 L94 472 L60 470 L66 418 L62 358 L58 265 L68 222 L64 188 L54 144 L58 100 L76 66 L90 54 C82 44 86 24 100 24 Z'
}

function muscleGuides(view: ViewAngle, gender: Gender): string[] {
  const male = gender === 'male'
  if (view === 'front') {
    return male
      ? [
          'M100 125 L100 230',
          'M78 140 Q100 148 122 140',
          'M80 175 Q100 182 120 175',
          'M82 250 Q100 258 118 250',
          'M84 300 Q92 310 88 340',
          'M116 300 Q108 310 112 340',
        ]
      : [
          'M100 128 L100 226',
          'M80 142 Q100 150 120 142',
          'M82 178 Q100 184 118 178',
          'M84 248 Q100 254 116 248',
          'M86 302 Q94 312 90 340',
          'M114 302 Q106 312 110 340',
        ]
  }
  if (view === 'back') {
    return [
      'M100 120 L100 248',
      'M82 140 Q100 150 118 140',
      'M84 175 Q100 184 116 175',
      'M80 255 Q100 268 120 255',
      'M86 310 Q94 320 90 350',
      'M114 310 Q106 320 110 350',
    ]
  }
  if (view === 'three-quarter') {
    return [
      'M104 128 L104 230',
      'M82 145 Q104 152 120 146',
      'M86 250 Q104 258 122 252',
      'M90 305 Q98 315 94 342',
      'M118 308 Q112 318 116 345',
    ]
  }
  return [
    'M96 130 L96 230',
    'M88 250 Q100 260 112 255',
    'M90 310 Q100 320 108 350',
  ]
}

export function BodySilhouette({ gender, view, selected, onToggle }: Props) {
  const spots = hotspotsFor(view, gender)
  const guides = muscleGuides(view, gender)
  const uid = `${gender}-${view}`

  return (
    <svg
      className="body-svg"
      viewBox="0 0 200 490"
      role="img"
      aria-label={`${gender} body, ${view} view. Tap regions that hurt.`}
    >
      <defs>
        {/* Soft key light from upper-left (world-locked per painted view) */}
        <linearGradient id={`skin-${uid}`} x1="18%" y1="8%" x2="88%" y2="92%">
          <stop offset="0%" stopColor="#d8ebe4" />
          <stop offset="42%" stopColor="#b7d4cc" />
          <stop offset="100%" stopColor="#8fb5ac" />
        </linearGradient>
        <linearGradient id={`cyl-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.18" />
          <stop offset="28%" stopColor="#000" stopOpacity="0.02" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="78%" stopColor="#000" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id={`ao-${uid}`} cx="50%" cy="18%" r="75%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="70%" stopColor="#000" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.16" />
        </radialGradient>
        <filter id={`soft-${uid}`} x="-8%" y="-8%" width="116%" height="116%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="b" />
          <feBlend in="SourceGraphic" in2="b" mode="normal" />
        </filter>
        <clipPath id={`body-clip-${uid}`}>
          <path d={silhouettePath(view, gender)} />
        </clipPath>
      </defs>

      {/* Soft ground contact / AO */}
      <ellipse className="body-shadow" cx="100" cy="476" rx="42" ry="6" />

      <g filter={`url(#soft-${uid})`}>
        <path
          className="body-outline"
          d={silhouettePath(view, gender)}
          fill={`url(#skin-${uid})`}
        />
        <g clipPath={`url(#body-clip-${uid})`}>
          <rect x="0" y="0" width="200" height="490" fill={`url(#cyl-${uid})`} opacity="0.55" />
          <rect x="0" y="0" width="200" height="490" fill={`url(#ao-${uid})`} />
          {guides.map((d, i) => (
            <path key={i} className="muscle-guide" d={d} />
          ))}
        </g>
      </g>

      {spots.map((spot) => {
        const isOn = selected.has(spot.id)
        return (
          <path
            key={`${view}-${spot.id}`}
            className={`hotspot${isOn ? ' selected' : ''}${spot.id.includes('it-band') ? ' itband' : ''}`}
            d={spot.d}
            role="button"
            tabIndex={0}
            aria-pressed={isOn}
            aria-label={`${spot.label}${isOn ? ', selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
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
