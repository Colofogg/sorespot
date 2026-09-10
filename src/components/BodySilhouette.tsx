import type { Gender, ViewAngle } from '../types'

interface Props {
  gender: Gender
  view: ViewAngle
  selected: Set<string>
  onToggle: (regionId: string) => void
}

type Hotspot = { id: string; d: string; label: string }

/** Large thumb-friendly hotspot paths in a shared 200x480 body viewBox. */
function hotspotsFor(view: ViewAngle, gender: Gender): Hotspot[] {
  const wide = gender === 'male'
  // Shoulder / hip width tweaks are baked into path coordinates below via offsets
  const sx = wide ? 0 : 2 // slight inward for female torso top
  const hx = wide ? 0 : -3 // wider hips female (negative = expand outward via path design)

  if (view === 'front') {
    return [
      { id: 'neck', label: 'Neck', d: `M${88 + sx} 72 L${112 - sx} 72 L${110 - sx} 95 L${90 + sx} 95 Z` },
      { id: 'shoulders', label: 'Shoulders', d: `M${55 + sx} 95 L${145 - sx} 95 L${150 - sx} 125 L${130 - sx} 130 L${100} 118 L${70 + sx} 130 L${50 + sx} 125 Z` },
      { id: 'chest', label: 'Chest', d: `M${70 + sx} 125 L${130 - sx} 125 L${128 - sx} 175 L${72 + sx} 175 Z` },
      { id: 'abs', label: 'Abs', d: `M${74 + sx} 175 L${126 - sx} 175 L${122 - sx} 235 L${78 + sx} 235 Z` },
      { id: 'hips-glutes', label: 'Hips / glutes', d: `M${72 + hx} 230 L${128 - hx} 230 L${135 - hx} 275 L${65 + hx} 275 Z` },
      { id: 'quads', label: 'Quads', d: 'M68 275 L100 275 L98 360 L72 360 Z M100 275 L132 275 L128 360 L102 360 Z' },
      { id: 'knees', label: 'Knees', d: 'M70 355 L98 355 L96 390 L72 390 Z M102 355 L130 355 L128 390 L104 390 Z' },
      { id: 'calves', label: 'Calves', d: 'M72 388 L96 388 L94 445 L74 445 Z M104 388 L128 388 L126 445 L106 445 Z' },
      { id: 'ankles', label: 'Ankles', d: 'M74 442 L94 442 L93 458 L75 458 Z M106 442 L126 442 L125 458 L107 458 Z' },
      { id: 'soles-feet', label: 'Soles / feet', d: 'M68 456 L98 456 L100 475 L66 475 Z M102 456 L132 456 L134 475 L100 475 Z' },
      { id: 'elbows-forearms', label: 'Elbows / forearms', d: `M${38 + sx} 150 L${58 + sx} 145 L${48 + sx} 220 L${28 + sx} 225 Z M${142 - sx} 145 L${162 - sx} 150 L${172 - sx} 225 L${152 - sx} 220 Z` },
      { id: 'wrists-hands', label: 'Wrists / hands', d: `M${24 + sx} 220 L${48 + sx} 218 L${42 + sx} 255 L${18 + sx} 258 Z M${152 - sx} 218 L${176 - sx} 220 L${182 - sx} 258 L${158 - sx} 255 Z` },
    ]
  }

  if (view === 'back') {
    return [
      { id: 'neck', label: 'Neck', d: `M${88 + sx} 72 L${112 - sx} 72 L${110 - sx} 95 L${90 + sx} 95 Z` },
      { id: 'shoulders', label: 'Shoulders', d: `M${55 + sx} 95 L${145 - sx} 95 L${150 - sx} 125 L${130 - sx} 130 L${100} 118 L${70 + sx} 130 L${50 + sx} 125 Z` },
      { id: 'upper-back', label: 'Upper back', d: `M${70 + sx} 120 L${130 - sx} 120 L${128 - sx} 170 L${72 + sx} 170 Z` },
      { id: 'mid-back', label: 'Mid back', d: `M${72 + sx} 168 L${128 - sx} 168 L${124 - sx} 215 L${76 + sx} 215 Z` },
      { id: 'lower-back', label: 'Lower back', d: `M${74 + sx} 212 L${126 - sx} 212 L${130 - hx} 255 L${70 + hx} 255 Z` },
      { id: 'hips-glutes', label: 'Hips / glutes', d: `M${68 + hx} 250 L${132 - hx} 250 L${138 - hx} 300 L${62 + hx} 300 Z` },
      { id: 'hamstrings', label: 'Hamstrings', d: 'M68 298 L100 298 L98 365 L72 365 Z M100 298 L132 298 L128 365 L102 365 Z' },
      { id: 'knees', label: 'Knees', d: 'M70 360 L98 360 L96 390 L72 390 Z M102 360 L130 360 L128 390 L104 390 Z' },
      { id: 'calves', label: 'Calves', d: 'M72 388 L96 388 L94 445 L74 445 Z M104 388 L128 388 L126 445 L106 445 Z' },
      { id: 'ankles', label: 'Ankles', d: 'M74 442 L94 442 L93 458 L75 458 Z M106 442 L126 442 L125 458 L107 458 Z' },
      { id: 'soles-feet', label: 'Soles / feet', d: 'M68 456 L98 456 L100 475 L66 475 Z M102 456 L132 456 L134 475 L100 475 Z' },
      { id: 'elbows-forearms', label: 'Elbows / forearms', d: `M${38 + sx} 150 L${58 + sx} 145 L${48 + sx} 220 L${28 + sx} 225 Z M${142 - sx} 145 L${162 - sx} 150 L${172 - sx} 225 L${152 - sx} 220 Z` },
    ]
  }

  // side view (right profile)
  return [
    { id: 'neck', label: 'Neck', d: 'M88 70 L112 72 L110 98 L90 96 Z' },
    { id: 'shoulders', label: 'Shoulders', d: 'M78 95 L120 92 L125 130 L85 135 Z' },
    { id: 'chest', label: 'Chest', d: 'M70 125 L105 120 L108 175 L68 180 Z' },
    { id: 'upper-back', label: 'Upper back', d: 'M105 115 L130 118 L128 170 L108 168 Z' },
    { id: 'abs', label: 'Abs', d: 'M68 178 L105 172 L108 230 L72 235 Z' },
    { id: 'mid-back', label: 'Mid back', d: 'M105 168 L128 170 L126 220 L108 218 Z' },
    { id: 'lower-back', label: 'Lower back', d: 'M100 215 L126 218 L130 255 L98 252 Z' },
    { id: 'hips-glutes', label: 'Hips / glutes', d: 'M70 230 L130 248 L135 295 L65 290 Z' },
    { id: 'quads', label: 'Quads', d: 'M72 288 L105 290 L100 365 L70 360 Z' },
    { id: 'hamstrings', label: 'Hamstrings', d: 'M105 290 L132 295 L128 365 L102 360 Z' },
    { id: 'knees', label: 'Knees', d: 'M72 355 L110 358 L108 392 L74 388 Z' },
    { id: 'calves', label: 'Calves', d: 'M74 388 L108 392 L106 448 L78 445 Z' },
    { id: 'ankles', label: 'Ankles', d: 'M78 442 L106 445 L105 460 L80 458 Z' },
    { id: 'soles-feet', label: 'Soles / feet', d: 'M70 456 L112 458 L118 475 L65 474 Z' },
    { id: 'elbows-forearms', label: 'Elbows / forearms', d: 'M95 145 L118 150 L125 220 L100 218 Z' },
    { id: 'wrists-hands', label: 'Wrists / hands', d: 'M100 215 L125 218 L130 255 L102 252 Z' },
  ]
}

function silhouettePath(view: ViewAngle, gender: Gender): string {
  const male = gender === 'male'
  if (view === 'side') {
    return male
      ? 'M100 28 C118 28 122 48 112 58 L118 70 L135 100 L140 140 L130 200 L125 240 L138 280 L132 360 L128 420 L135 470 L90 472 L85 420 L80 360 L72 280 L78 240 L70 200 L65 140 L72 100 L88 70 L92 58 C82 48 82 28 100 28 Z'
      : 'M100 26 C116 26 120 46 110 55 L116 68 L130 98 L132 140 L122 200 L118 235 L140 275 L130 360 L126 420 L132 470 L92 472 L88 420 L84 360 L70 275 L80 235 L72 200 L70 140 L78 98 L92 68 L94 55 C84 46 84 26 100 26 Z'
  }
  // front/back same outer silhouette
  if (male) {
    return 'M100 26 C118 26 122 48 112 58 L130 70 L155 110 L162 160 L148 200 L140 230 L148 270 L145 360 L140 420 L148 472 L108 474 L105 420 L102 360 L100 300 L98 360 L95 420 L92 474 L52 472 L60 420 L55 360 L52 270 L60 230 L52 200 L38 160 L45 110 L70 70 L88 58 C78 48 82 26 100 26 Z'
  }
  return 'M100 24 C116 24 120 46 110 55 L125 68 L148 105 L152 150 L140 195 L145 235 L158 275 L148 360 L142 420 L148 472 L110 474 L106 420 L103 360 L100 300 L97 360 L94 420 L90 474 L52 472 L58 420 L52 360 L42 275 L55 235 L60 195 L48 150 L52 105 L75 68 L90 55 C80 46 84 24 100 24 Z'
}

export function BodySilhouette({ gender, view, selected, onToggle }: Props) {
  const spots = hotspotsFor(view, gender)

  return (
    <svg
      className="body-svg"
      viewBox="0 0 200 490"
      role="img"
      aria-label={`${gender} body, ${view} view. Tap regions that hurt.`}
    >
      <path className="body-outline" d={silhouettePath(view, gender)} />
      {spots.map((spot) => {
        const isOn = selected.has(spot.id)
        return (
          <path
            key={`${view}-${spot.id}`}
            className={`hotspot${isOn ? ' selected' : ''}`}
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
