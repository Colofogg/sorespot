/**
 * Hit targets derived from the wireframe faces.
 *
 * Each visible face is a precise target (see BodySilhouette). Pads underneath
 * only catch a near-miss, and they are centered on the faces they belong to
 * so they cannot drift off the limb. Pads are split per limb so an arm target
 * never covers the chest.
 */
import { regionLabel } from '../../catalog'
import type { Gender, ViewAngle } from '../../types'
import { buildWireMesh, type Face, type Pt, type WireMesh } from './mesh'

/**
 * Minimum target size in viewBox units. On a ~390px-wide phone the figure
 * scales to about one unit per CSS pixel (the SVG is height-limited).
 */
export const MIN_HIT = 44

export interface HitPad {
  id: string
  cx: number
  cy: number
  rx: number
  ry: number
}

export interface Hotspot {
  id: string
  label: string
  pads: HitPad[]
}

function screenCentroid(face: Face): Pt {
  let x = 0
  let y = 0
  for (const p of face.pts) {
    x += p[0]
    y += p[1]
  }
  return [x / face.pts.length, y / face.pts.length]
}

function pointInPoly(x: number, y: number, pts: Pt[]): boolean {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0]
    const yi = pts[i][1]
    const xj = pts[j][0]
    const yj = pts[j][1]
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function pointInEllipse(x: number, y: number, pad: HitPad): boolean {
  if (pad.rx <= 0 || pad.ry <= 0) return false
  const dx = (x - pad.cx) / pad.rx
  const dy = (y - pad.cy) / pad.ry
  return dx * dx + dy * dy <= 1
}

/** Group faces of one region into limbs (left arm vs right arm, each foot, …). */
function clustersOf(faces: Face[]): Face[][] {
  const parent = faces.map((_, i) => i)
  const find = (i: number): number => {
    let x = i
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]
      x = parent[x]
    }
    return x
  }
  const union = (a: number, b: number) => {
    const pa = find(a)
    const pb = find(b)
    if (pa !== pb) parent[pa] = pb
  }
  for (let i = 0; i < faces.length; i++) {
    for (let j = i + 1; j < faces.length; j++) {
      const A = faces[i].body
      const B = faces[j].body
      const crossMidline =
        Math.abs(A.x) > 9 && Math.abs(B.x) > 9 && Math.sign(A.x) !== Math.sign(B.x)
      if (crossMidline) continue
      const dist = Math.hypot(A.x - B.x, A.y - B.y, (A.z - B.z) * 0.4)
      if (dist < 30) union(i, j)
    }
  }
  const groups = new Map<number, Face[]>()
  for (let i = 0; i < faces.length; i++) {
    const id = find(i)
    const list = groups.get(id)
    if (list) list.push(faces[i])
    else groups.set(id, [faces[i]])
  }
  return [...groups.values()]
}

function padFor(id: string, faces: Face[]): HitPad {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const face of faces) {
    for (const p of face.pts) {
      if (p[0] < minX) minX = p[0]
      if (p[0] > maxX) maxX = p[0]
      if (p[1] < minY) minY = p[1]
      if (p[1] > maxY) maxY = p[1]
    }
  }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const rx = Math.max((maxX - minX) / 2, MIN_HIT / 2)
  const ry = Math.max((maxY - minY) / 2, MIN_HIT / 2)
  return { id, cx, cy, rx, ry }
}

export function hotspotsFromMesh(mesh: WireMesh): Hotspot[] {
  const byZone = new Map<string, Face[]>()
  for (const face of mesh.faces) {
    if (!face.zone) continue
    const list = byZone.get(face.zone)
    if (list) list.push(face)
    else byZone.set(face.zone, [face])
  }
  const spots: Hotspot[] = []
  for (const [id, faces] of byZone) {
    const pads = clustersOf(faces)
      .map((cluster) => padFor(id, cluster))
      // Larger pads paint first so a smaller neighbor wins the empty gap.
      .sort((a, b) => b.rx * b.ry - a.rx * a.ry)
    spots.push({ id, label: regionLabel(id), pads })
  }
  spots.sort((a, b) => a.id.localeCompare(b.id))
  return spots
}

export function hotspotsFor(view: ViewAngle, gender: Gender): Hotspot[] {
  return hotspotsFromMesh(buildWireMesh(gender, view))
}

/** Large pads first, so a smaller neighbor sits on top of the gap between them. */
export function padsInPaintOrder(spots: Hotspot[]): HitPad[] {
  return spots
    .flatMap((s) => s.pads)
    .sort((a, b) => b.rx * b.ry - a.rx * a.ry || a.id.localeCompare(b.id))
}

/**
 * Region under a viewBox point, matching paint order: nearest face wins,
 * otherwise the topmost (smallest) pad.
 */
export function regionAtPoint(mesh: WireMesh, spots: Hotspot[], x: number, y: number): string | null {
  for (let i = mesh.faces.length - 1; i >= 0; i--) {
    const face = mesh.faces[i]
    if (pointInPoly(x, y, face.pts)) return face.zone
  }
  const pads = padsInPaintOrder(spots)
  for (let i = pads.length - 1; i >= 0; i--) {
    if (pointInEllipse(x, y, pads[i])) return pads[i].id
  }
  return null
}

export function faceCentroid(face: Face): Pt {
  return screenCentroid(face)
}
