import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
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

const VIEWS: ViewAngle[] = ['front', 'side', 'back']
const VIEW_YAW: Record<ViewAngle, number> = { front: 0, side: 90, back: 180 }

function nearestView(yaw: number): ViewAngle {
  // normalize 0..360
  let y = ((yaw % 360) + 360) % 360
  if (y > 180) y -= 360
  // compare to 0, 90, 180 (and -90 as side alias)
  const candidates: { view: ViewAngle; a: number }[] = [
    { view: 'front', a: 0 },
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
  const [dragYaw, setDragYaw] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startYaw = useRef(0)
  const moved = useRef(false)
  const reduceMotion = usePrefersReducedMotion()

  const snapTo = useCallback(
    (next: ViewAngle) => {
      setView(next)
      setDragYaw(VIEW_YAW[next])
    },
    [],
  )

  const onPointerDown = (e: ReactPointerEvent) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    startX.current = e.clientX
    startYaw.current = VIEW_YAW[view]
    moved.current = false
    setDragging(true)
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - startX.current
    if (Math.abs(dx) > 8) moved.current = true
    // drag left → show side/back (positive yaw)
    const next = startYaw.current + dx * 0.6
    setDragYaw(next)
    if (!reduceMotion) {
      // live preview snap hint
      setView(nearestView(next))
    }
  }

  const onPointerUp = () => {
    if (!dragging) return
    setDragging(false)
    const snapped = nearestView(dragYaw)
    snapTo(snapped)
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
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div
        className={`body-stage${dragging ? ' dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="body-rotate"
          style={
            reduceMotion
              ? undefined
              : {
                  transform: `perspective(800px) rotateY(${-dragYaw}deg)`,
                }
          }
        >
          <BodySilhouette
            gender={gender}
            view={view}
            selected={selected}
            onToggle={(id) => {
              if (moved.current) return
              onToggle(id)
            }}
          />
        </div>
        <p className="drag-hint">Drag to spin · Front / Side / Back</p>
      </div>

      <div className="body-footer">
        {hasSpots ? (
          <p className="spots-line">
            {Array.from(selected).map(regionLabel).join(' · ')}
          </p>
        ) : (
          <div className="empty-copy">
            <p className="empty-title">Where does it hurt?</p>
            <p className="empty-sub">Spin the body, then tap the sore spots.</p>
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

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}
