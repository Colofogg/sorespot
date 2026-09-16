import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Gender, ViewAngle } from '../types'
import { hotspotsFor } from './wireframe/hotspots'
import {
  buildWireMesh,
  faceMatchesSelection,
  type Face,
  type Pt,
} from './wireframe/mesh'

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

const HINT_KEY = 'sorespot-hotspot-hint-v14'
const PULSE_IDS_FRONT = ['shoulders', 'quads-r', 'it-band-l']

function ptsToAttr(pts: Pt[]): string {
  return pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')
}

function WireFaces({
  faces,
  selected,
  pressedId,
}: {
  faces: Face[]
  selected: Set<string>
  pressedId: string | null
}) {
  const pressedSet = useMemo(
    () => (pressedId ? new Set([pressedId]) : new Set<string>()),
    [pressedId],
  )

  return (
    <g className="wire-faces" aria-hidden="true">
      {faces.map((face, i) => {
        const lit =
          faceMatchesSelection(face, selected) ||
          (pressedId ? faceMatchesSelection(face, pressedSet) : false)
        return (
          <polygon
            key={i}
            className={`wire-face${lit ? ' lit' : ''}`}
            points={ptsToAttr(face.pts)}
            data-zone={face.zone}
          />
        )
      })}
    </g>
  )
}

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
  const mesh = useMemo(() => buildWireMesh(gender, view), [gender, view])
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
      aria-label={`${gender} body wireframe, ${view} view. Tap regions that hurt.`}
    >
      <ellipse className="body-shadow" cx="100" cy="478" rx="44" ry="6" />

      {/* Low-poly wireframe mesh — edges + ultra-light face fills */}
      <WireFaces faces={mesh.faces} selected={selected} pressedId={pressedId} />

      {/* Stronger silhouette polylines */}
      <g className="wire-outlines" aria-hidden="true">
        {mesh.outlines.map((line, i) => (
          <polyline
            key={i}
            className="wire-outline"
            points={ptsToAttr(line)}
            fill="none"
          />
        ))}
      </g>

      {/* Invisible organic hit pads under / over mesh */}
      <g className="hit-layer">
        {spots.map((spot) => {
          const isOn = selected.has(spot.id)
          const isPressed = pressedId === spot.id
          const isPulse = pulse && view === 'front' && PULSE_IDS_FRONT.includes(spot.id)
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
      </g>
    </svg>
  )
}

/** Mini wireframe figure for gender form cards. */
export function MiniFigure({ gender }: { gender: Gender }) {
  const mesh = useMemo(() => buildWireMesh(gender, 'front'), [gender])
  // Scale viewBox content: full body is ~200x490 → fit in 120x280
  return (
    <svg className="gender-preview" viewBox="10 10 180 470" aria-hidden="true">
      <ellipse cx="100" cy="472" rx="36" ry="5" fill="rgba(26,46,46,0.14)" />
      <g className="wire-faces mini-wire">
        {mesh.faces.map((face, i) => (
          <polygon key={i} className="wire-face" points={ptsToAttr(face.pts)} />
        ))}
      </g>
      <g className="wire-outlines">
        {mesh.outlines.map((line, i) => (
          <polyline
            key={i}
            className="wire-outline"
            points={ptsToAttr(line)}
            fill="none"
          />
        ))}
      </g>
    </svg>
  )
}
