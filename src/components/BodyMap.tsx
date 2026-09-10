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
  const [dragYaw, setDragYaw] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startYaw = useRef(0)
  const moved = useRef(false)
  const reduceMotion = usePrefersReducedMotion()

  const snapTo = useCallback((next: ViewAngle) => {
    setView(next)
    setDragYaw(VIEW_YAW[next])
  }, [])

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
    const next = startYaw.current + dx * 0.55
    setDragYaw(next)
    if (!reduceMotion) setView(nearestView(next))
  }

  const onPointerUp = () => {
    if (!dragging) return
    setDragging(false)
    snapTo(nearestView(dragYaw))
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
                  transform: `perspective(900px) rotateY(${-dragYaw}deg)`,
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
