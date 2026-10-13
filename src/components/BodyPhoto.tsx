import { useEffect, useState, type KeyboardEvent } from 'react'
import type { Gender, ViewAngle } from '../types'
import { regionLabel } from '../catalog'
import { BODY_IMAGE, bodyParts, type Pt } from './body/regions'

interface Props {
  gender: Gender
  view: ViewAngle
  selected: Set<string>
  onToggle: (regionId: string) => void
  /** Parent handles short taps. Keyboard still toggles here. */
  suppressTap?: boolean
  pressedId?: string | null
}

const HINT_KEY = 'sorespot-hotspot-hint-v16'
const PULSE_IDS = ['shoulders', 'quads-r', 'it-band-l']
const VIEWS: ViewAngle[] = ['front', 'three-quarter', 'side', 'back']

function ptsAttr(poly: Pt[]): string {
  return poly.map((p) => `${p[0]},${p[1]}`).join(' ')
}

export function BodyPhoto({
  gender,
  view,
  selected,
  onToggle,
  suppressTap = false,
  pressedId = null,
}: Props) {
  const parts = bodyParts[gender][view]
  const [pulse, setPulse] = useState(false)
  const base = import.meta.env.BASE_URL

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

  const onKey = (id: string) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle(id)
    }
  }

  return (
    <div className="photo-box">
      {VIEWS.map((v) => (
        <img
          key={v}
          src={`${base}bodies/${gender}-${v}.webp`}
          alt=""
          className={v === view ? 'is-on' : ''}
          draggable={false}
        />
      ))}
      <svg
        className="hit-svg"
        viewBox={`0 0 ${BODY_IMAGE.width} ${BODY_IMAGE.height}`}
        role="group"
        aria-label={`${gender} body, ${view} view. Tap where it hurts.`}
      >
        <g className="hit-pads">
          {parts.flatMap((part) =>
            part.pads.map((pad, i) => (
              <ellipse
                key={`${part.id}-pad-${i}`}
                className="hit-pad"
                cx={pad.cx}
                cy={pad.cy}
                rx={pad.rx}
                ry={pad.ry}
                data-region={part.id}
              />
            )),
          )}
        </g>
        {parts.map((part) => {
          const on = selected.has(part.id)
          const pressed = pressedId === part.id
          const showPulse = pulse && view === 'front' && PULSE_IDS.includes(part.id)
          const label = regionLabel(part.id)
          return (
            <g
              key={part.id}
              className={`part${on ? ' on' : ''}${pressed ? ' pressed' : ''}${showPulse ? ' pulse' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={on}
              aria-label={`${label}${on ? ', selected' : ''}`}
              data-region={part.id}
              onClick={(e) => {
                e.stopPropagation()
                if (suppressTap) return
                onToggle(part.id)
              }}
              onKeyDown={onKey(part.id)}
            >
              {part.shapes.map((shape, i) => (
                <polygon key={i} className="region-shape" points={ptsAttr(shape)}>
                  <title>{label}</title>
                </polygon>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** Front photo for the male / female choice cards. */
export function MiniFigure({ gender }: { gender: Gender }) {
  const base = import.meta.env.BASE_URL
  return (
    <img
      className="gender-preview"
      src={`${base}bodies/${gender}-front.webp`}
      alt=""
      draggable={false}
    />
  )
}
