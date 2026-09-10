import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Gender, ViewAngle } from '../types'
import { regionLabel } from '../catalog'
import { BodySilhouette } from './BodySilhouette'

interface Props {
  gender: Gender
  selected: Set<string>
  onToggle: (regionId: string) => void
  onClear: () => void
  onFindStretches: () => void
  onChangeBody: () => void
}

const VIEWS: ViewAngle[] = ['front', 'three-quarter', 'side', 'back']
const VIEW_YAW: Record<ViewAngle, number> = {
  front: 0,
  'three-quarter': 45,
  side: 90,
  back: 180,
}
const VIEW_LABEL: Record<ViewAngle, string> = {
  front: 'Front',
  'three-quarter': '¾',
  side: 'Side',
  back: 'Back',
}

/** Horizontal drag past this (px) = rotate; otherwise = tap select. */
const DRAG_THRESHOLD = 12

function nearestView(yaw: number): ViewAngle {
  let y = ((yaw % 360) + 360) % 360
  if (y > 180) y -= 360
  const candidates: { view: ViewAngle; a: number }[] = [
    { view: 'front', a: 0 },
    { view: 'three-quarter', a: 45 },
    { view: 'three-quarter', a: -45 },
    { view: 'side', a: 90 },
    { view: 'side', a: -90 },
    { view: 'back', a: 180 },
    { view: 'back', a: -180 },
  ]
  let best = candidates[0]
  let bestDist = Infinity
  for (const c of candidates) {
    const d = Math.abs(y - c.a)
    if (d < bestDist) {
      bestDist = d
      best = c
    }
  }
  return best.view
}

export function BodyMap({
  gender,
  selected,
  onToggle,
  onClear,
  onFindStretches,
  onChangeBody,
}: Props) {
  const [view, setView] = useState<ViewAngle>('front')
  const [dragging, setDragging] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [pressedId, setPressedId] = useState<string | null>(null)

  const startX = useRef(0)
  const startYaw = useRef(0)
  const dragYaw = useRef(0)
  const isDragging = useRef(false)
  const moved = useRef(false)
  const pendingHotspot = useRef<string | null>(null)
  const viewRef = useRef(view)
  viewRef.current = view

  const snapTo = useCallback((next: ViewAngle) => {
    setView(next)
    dragYaw.current = VIEW_YAW[next]
    startYaw.current = VIEW_YAW[next]
  }, [])

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    startX.current = e.clientX
    startYaw.current = VIEW_YAW[viewRef.current]
    dragYaw.current = startYaw.current
    moved.current = false
    isDragging.current = true
    setDragging(true)
    setSpinning(false)

    const target = e.target as Element | null
    const region =
      target?.closest?.('[data-region]')?.getAttribute('data-region') ?? null
    pendingHotspot.current = region
    setPressedId(region)
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - startX.current
    if (Math.abs(dx) > DRAG_THRESHOLD) {
      if (!moved.current) {
        moved.current = true
        setSpinning(true)
        setPressedId(null)
        pendingHotspot.current = null
      }
    }
    if (!moved.current) return

    const nextYaw = startYaw.current + dx * 0.55
    dragYaw.current = nextYaw
    // Discrete face-on silhouette swap — never CSS rotateY (blanks at ~90°)
    const nextView = nearestView(nextYaw)
    if (nextView !== viewRef.current) {
      setView(nextView)
    }
  }

  const endPointer = () => {
    if (!isDragging.current) return
    isDragging.current = false
    setDragging(false)
    setSpinning(false)
    setPressedId(null)

    if (moved.current) {
      snapTo(nearestView(dragYaw.current))
      pendingHotspot.current = null
      return
    }

    // Short tap → select on touchend
    const id = pendingHotspot.current
    pendingHotspot.current = null
    if (id) onToggle(id)
  }

  const hasSpots = selected.size > 0

  return (
    <div className="screen body-screen">
      <header className="body-top">
        <button type="button" className="link-btn" onClick={onChangeBody}>
          Change body
        </button>
        <div className="view-pills" role="tablist" aria-label="Body angle">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              className={`pill${view === v ? ' active' : ''}`}
              onClick={() => snapTo(v)}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
      </header>

      <div
        className={`body-stage${dragging ? ' pointer-active' : ''}${spinning ? ' dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <div className={`body-rotate${spinning ? ' spinning' : ''}`} data-view={view}>
          <BodySilhouette
            gender={gender}
            view={view}
            selected={selected}
            suppressTap
            pressedId={pressedId}
            onToggle={onToggle}
          />
        </div>
        <p className="drag-hint">Drag to spin · Front / ¾ / Side / Back</p>
      </div>

      <div className="body-footer">
        {hasSpots ? (
          <p className="spots-line">
            {Array.from(selected).map(regionLabel).join(' · ')}
          </p>
        ) : (
          <div className="empty-copy">
            <p className="empty-title">Where does it hurt?</p>
            <p className="empty-sub">Spin for the sides — tap where it hurts.</p>
          </div>
        )}

        <div className="cta-row">
          {hasSpots && (
            <button type="button" className="btn secondary" onClick={onClear}>
              Clear spots
            </button>
          )}
          <button
            type="button"
            className="btn primary"
            disabled={!hasSpots}
            onClick={onFindStretches}
          >
            {hasSpots ? 'Find stretches' : 'Tap a spot first'}
          </button>
        </div>
      </div>
    </div>
  )
}
