import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Gender, ViewAngle } from '../types'
import { hotspotsFromMesh, padsInPaintOrder, type HitPad } from './wireframe/hotspots'
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

const HINT_KEY = 'sorespot-hotspot-hint-v15'
const PULSE_IDS_FRONT = ['shoulders', 'quads-r', 'it-band-l']

function ptsToAttr(pts: Pt[]): string {
  return pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')
}

function WireFaces({
  faces,
  selected,
  pressedId,
  pulse,
  view,
}: {
  faces: Face[]
  selected: Set<string>
  pressedId: string | null
  pulse: boolean
  view: ViewAngle
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
        const isPulse = pulse && view === 'front' && PULSE_IDS_FRONT.includes(face.zone)
        return (
          <polygon
            key={i}
            className={`wire-face${lit ? ' lit' : ''}${isPulse ? ' pulse' : ''}`}
            points={ptsToAttr(face.pts)}
            data-zone={face.zone}
            data-region={face.zone}
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
  const mesh = useMemo(() => buildWireMesh(gender, view), [gender, view])
  const spots = useMemo(() => hotspotsFromMesh(mesh), [mesh])
  const pads = useMemo(() => padsInPaintOrder(spots), [spots])
  const labels = useMemo(() => {
    const map = new Map<string, string>()
    for (const spot of spots) map.set(spot.id, spot.label)
    return map
  }, [spots])
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
      role="group"
      aria-label={`${gender} body wireframe, ${view} view. Tap regions that hurt.`}
    >
      <ellipse className="body-shadow" cx="100" cy="478" rx="44" ry="6" />

      {/* Near-miss pads sit under the faces, centered on the same limbs. */}
      <g className="hit-layer">
        {pads.map((pad, i) => (
          <HitPadShape
            key={`${view}-${pad.id}-${i}`}
            pad={pad}
            label={labels.get(pad.id) ?? pad.id}
            selected={selected.has(pad.id)}
            pressed={pressedId === pad.id}
            suppressTap={suppressTap}
            onToggle={onToggle}
            onHotspotPointerDown={onHotspotPointerDown}
          />
        ))}
      </g>

      <WireFaces
        faces={mesh.faces}
        selected={selected}
        pressedId={pressedId}
        pulse={pulse}
        view={view}
      />

      <g className="wire-outlines" aria-hidden="true">
        {mesh.outlines.map((line, i) => (
          <polyline key={i} className="wire-outline" points={ptsToAttr(line)} fill="none" />
        ))}
      </g>

      <g className="wire-landmarks" aria-hidden="true">
        {mesh.landmarks.map((line, i) => (
          <polyline key={i} className="wire-landmark" points={ptsToAttr(line)} fill="none" />
        ))}
      </g>
    </svg>
  )
}

function HitPadShape({
  pad,
  label,
  selected,
  pressed,
  suppressTap,
  onToggle,
  onHotspotPointerDown,
}: {
  pad: HitPad
  label: string
  selected: boolean
  pressed: boolean
  suppressTap: boolean
  onToggle: (regionId: string) => void
  onHotspotPointerDown?: (regionId: string, e: ReactPointerEvent) => void
}) {
  return (
    <ellipse
      className={`hotspot${selected ? ' selected' : ''}${pressed ? ' pressed' : ''}${pad.id.includes('it-band') ? ' itband' : ''}`}
      cx={pad.cx}
      cy={pad.cy}
      rx={pad.rx}
      ry={pad.ry}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${label}${selected ? ', selected' : ''}`}
      data-region={pad.id}
      data-hit-pad="true"
      onPointerDown={(e) => {
        onHotspotPointerDown?.(pad.id, e)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (suppressTap) return
        onToggle(pad.id)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle(pad.id)
        }
      }}
    >
      <title>{label}</title>
    </ellipse>
  )
}

/** Mini wireframe figure for gender form cards. */
export function MiniFigure({ gender }: { gender: Gender }) {
  const mesh = useMemo(() => buildWireMesh(gender, 'front'), [gender])
  return (
    <svg className="gender-preview" viewBox="10 8 180 470" aria-hidden="true">
      <ellipse cx="100" cy="472" rx="36" ry="5" fill="rgba(26,46,46,0.14)" />
      <g className="wire-faces mini-wire">
        {mesh.faces.map((face, i) => (
          <polygon key={i} className="wire-face" points={ptsToAttr(face.pts)} />
        ))}
      </g>
      <g className="wire-outlines">
        {mesh.outlines.map((line, i) => (
          <polyline key={i} className="wire-outline" points={ptsToAttr(line)} fill="none" />
        ))}
      </g>
      <g className="wire-landmarks">
        {mesh.landmarks.map((line, i) => (
          <polyline key={i} className="wire-landmark" points={ptsToAttr(line)} fill="none" />
        ))}
      </g>
    </svg>
  )
}
