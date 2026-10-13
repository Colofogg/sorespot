/**
 * Low-poly human wireframe for SoreSpot.
 *
 * One 3D body is projected into Front, ¾, Side, and Back. Hit targets are the
 * projected faces (see hotspots.ts), so a tap lands on the limb that is drawn.
 * Left stays on the left of the screen in every view, including Back.
 *
 * Geometry is original. Hex/octagon stations, quads only (no diagonals).
 */
import type { Gender, ViewAngle } from '../../types'

export type Pt = [number, number]

export interface Face {
  pts: Pt[]
  zone: string
  /** Larger = closer to the camera. Faces are sorted far → near. */
  depth: number
  /** Body-space centroid, before projection. */
  body: { x: number; y: number; z: number }
  part: string
}

export interface WireMesh {
  faces: Face[]
  outlines: Pt[][]
  /** Closed joint rings (shoulders, hips, knees, ankles, wrists). */
  landmarks: Pt[][]
}

type V3 = { x: number; y: number; z: number }

const TAU = Math.PI * 2
/** Three-quarter turn, radians. Shared by projection and which faces face the camera. */
const THREE_QUARTER_YAW = 0.95

interface Metrics {
  male: boolean
  head: number
  neck: number
  shoulder: number
  chest: number
  chestZ: number
  waist: number
  hip: number
  hipZ: number
  glute: number
  stance: number
  thigh: number
  arm: number
  /** Where the arm hangs, outside the hip. */
  armHang: number
}

function metrics(male: boolean): Metrics {
  if (male) {
    return {
      male: true,
      head: 1,
      neck: 7.4,
      shoulder: 47,
      chest: 39,
      chestZ: 4,
      waist: 32,
      hip: 38,
      hipZ: -2,
      glute: 35,
      stance: 16,
      thigh: 13,
      arm: 1,
      armHang: 66,
    }
  }
  return {
    male: false,
    head: 0.94,
    neck: 6.5,
    shoulder: 35,
    chest: 31,
    chestZ: 6.5,
    waist: 24,
    hip: 44,
    hipZ: -3.5,
    glute: 40,
    stance: 18,
    thigh: 14,
      arm: 0.86,
      armHang: 62,
  }
}

function camera(v: V3, view: ViewAngle): { sx: number; sy: number; depth: number } {
  if (view === 'front') {
    return { sx: 100 + v.x + v.z * 0.04, sy: v.y + v.z * 0.07, depth: v.z }
  }
  if (view === 'back') {
    // Keep screen-left = body-left. Posterior surface faces the camera.
    return { sx: 100 + v.x - v.z * 0.04, sy: v.y - v.z * 0.07, depth: -v.z }
  }
  if (view === 'side') {
    // Profile facing screen-left. Person's right side (+x) is near the camera.
    // Depth (z) is the wide axis so the chest, back, and a forward arm stay apart.
    return {
      sx: 100 - v.z * 1.5 + v.x * 0.14,
      sy: v.y + v.x * 0.01,
      depth: v.x * 0.92 + v.z * 0.12,
    }
  }
  const yaw = THREE_QUARTER_YAW
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  const x = v.x * c - v.z * s
  const z = v.x * s + v.z * c
  return { sx: 100 + x, sy: v.y + z * 0.055, depth: z }
}

/** Direction a face normal must agree with to face the camera. */
function camDir(view: ViewAngle): V3 {
  if (view === 'front') return { x: 0, y: 0, z: 1 }
  if (view === 'back') return { x: 0, y: 0, z: -1 }
  if (view === 'side') return { x: 1, y: 0, z: 0.15 }
  const yaw = THREE_QUARTER_YAW
  return { x: Math.sin(yaw), y: 0, z: Math.cos(yaw) }
}

function sub(a: V3, b: V3): V3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

function cross(a: V3, b: V3): V3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

function dot(a: V3, b: V3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function centroid3(pts: V3[]): V3 {
  const n = pts.length
  let x = 0
  let y = 0
  let z = 0
  for (const p of pts) {
    x += p.x
    y += p.y
    z += p.z
  }
  return { x: x / n, y: y / n, z: z / n }
}

function polyArea(pts: Pt[]): number {
  let a = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1]
  }
  return Math.abs(a) / 2
}

/**
 * Outward normal of a stitched quad. Vertex order a[i] → a[j] → b[j] produces
 * an inward cross product (y grows downward), so the normal is negated.
 */
function outwardNormal(verts: V3[]): V3 {
  const e1 = sub(verts[1], verts[0])
  const e2 = sub(verts[2], verts[0])
  const n = cross(e1, e2)
  return { x: -n.x, y: -n.y, z: -n.z }
}

function facesCamera(verts: V3[], view: ViewAngle): boolean {
  const n = outwardNormal(verts)
  // Keep grazing silhouette faces; drop the far side of the cage.
  return dot(n, camDir(view)) > -0.18
}

function ring(y: number, rx: number, rz: number, n: number, cx = 0, cz = 0): V3[] {
  const pts: V3[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU - Math.PI / 2
    pts.push({
      x: cx + Math.cos(a) * rx,
      y,
      z: cz + Math.sin(a) * rz,
    })
  }
  return pts
}

interface Built {
  faces: Face[]
  outlines: Pt[][]
  landmarks: Pt[][]
}

function projectRing(r: V3[], view: ViewAngle): Pt[] {
  const pts = r.map((v) => {
    const c = camera(v, view)
    return [c.sx, c.sy] as Pt
  })
  pts.push(pts[0])
  return pts
}

function addFace(
  built: Built,
  verts: V3[],
  zone: string,
  view: ViewAngle,
  part: string,
) {
  if (verts.length < 3) return
  if (!facesCamera(verts, view)) return
  const pts = verts.map((v) => {
    const c = camera(v, view)
    return [c.sx, c.sy] as Pt
  })
  if (polyArea(pts) < 0.4) return
  const body = centroid3(verts)
  let depth = 0
  for (const v of verts) depth += camera(v, view).depth
  depth /= verts.length
  built.faces.push({ pts, zone, depth, body, part })
}

function stitch(
  built: Built,
  a: V3[],
  b: V3[],
  view: ViewAngle,
  part: string,
  zoneAt: (i: number, mid: V3) => string,
) {
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const verts = [a[i], a[j], b[j], b[i]]
    const mid = centroid3(verts)
    addFace(built, verts, zoneAt(i, mid), view, part)
  }
}

function outlineOf(rings: V3[][], view: ViewAngle): Pt[][] {
  if (!rings.length) return []
  const left: Pt[] = []
  const right: Pt[] = []
  for (const r of rings) {
    let minX = Infinity
    let maxX = -Infinity
    let minP: Pt = [0, 0]
    let maxP: Pt = [0, 0]
    for (const v of r) {
      const c = camera(v, view)
      if (c.sx < minX) {
        minX = c.sx
        minP = [c.sx, c.sy]
      }
      if (c.sx > maxX) {
        maxX = c.sx
        maxP = [c.sx, c.sy]
      }
    }
    left.push(minP)
    right.push(maxP)
  }
  return [left, right]
}

interface Axial {
  y: number
  rx: number
  rz: number
  cz?: number
  /** Zone on the anterior surface of the segment that ENDS here. */
  front: string
  back: string
  mark?: boolean
}

function axialStations(m: Metrics): Axial[] {
  const s = m.head
  return [
    { y: 12, rx: 6.5 * s, rz: 7.5 * s, front: 'neck', back: 'neck' },
    { y: 26, rx: 14.2 * s, rz: 15.4 * s, front: 'neck', back: 'neck' },
    { y: 42, rx: 16 * s, rz: 17.2 * s, front: 'neck', back: 'neck' },
    { y: 56, rx: 14 * s, rz: 15.2 * s, front: 'neck', back: 'neck' },
    { y: 68, rx: 9.2 * s, rz: 11 * s, front: 'neck', back: 'neck' },
    { y: 80, rx: m.neck * 0.82, rz: m.neck * 0.9, front: 'neck', back: 'neck' },
    { y: 94, rx: m.neck + 1.2, rz: m.neck + 1.6, front: 'neck', back: 'neck' },
    // Trapezius slope into the shoulder line.
    { y: 108, rx: m.shoulder * 0.46, rz: 12, cz: -1, front: 'shoulders', back: 'traps' },
    { y: 122, rx: m.shoulder, rz: 15, front: 'shoulders', back: 'shoulders', mark: true },
    { y: 146, rx: m.chest, rz: m.male ? 20 : 18, cz: m.chestZ, front: 'chest', back: 'upper-back' },
    { y: 168, rx: m.chest * 0.92, rz: m.male ? 17 : 16, cz: m.chestZ * 0.55, front: 'chest', back: 'upper-back' },
    { y: 190, rx: (m.chest + m.waist) / 2, rz: m.male ? 15 : 13.5, cz: 1, front: 'abs', back: 'mid-back' },
    { y: 210, rx: m.waist, rz: m.male ? 14 : 12.5, front: 'abs', back: 'mid-back' },
    { y: 228, rx: (m.waist + m.hip) * 0.46, rz: 16, cz: m.hipZ * 0.4, front: 'abs', back: 'lower-back' },
    { y: 244, rx: m.hip * 0.96, rz: m.male ? 20 : 22, cz: m.hipZ, front: 'hips', back: 'hips', mark: true },
    { y: 260, rx: m.glute, rz: m.male ? 19 : 21, cz: m.hipZ - 2, front: 'hips', back: 'hips' },
  ]
}

function anteriorFacesView(sinA: number, view: ViewAngle): boolean {
  if (view === 'front') return sinA > -0.5
  if (view === 'back') return sinA > 0.5
  if (view === 'side') return sinA > 0
  return sinA > -0.02
}

function buildAxial(built: Built, m: Metrics, view: ViewAngle) {
  const segs = 8
  const stations = axialStations(m)
  const rings = stations.map((s) => ring(s.y, s.rx, s.rz, segs, 0, s.cz ?? 0))
  for (let i = 0; i < rings.length - 1; i++) {
    const dest = stations[i + 1]
    stitch(built, rings[i], rings[i + 1], view, 'axial', (_k, mid) => {
      if (dest.front === 'hips') {
        return mid.x >= 0 ? 'hips-glutes-r' : 'hips-glutes-l'
      }
      const ang = Math.atan2(mid.z - (dest.cz ?? 0), mid.x)
      const sinA = Math.sin(ang)
      return anteriorFacesView(sinA, view) ? dest.front : dest.back
    })
  }
  built.outlines.push(...outlineOf(rings, view))
  stations.forEach((s, i) => {
    if (s.mark) built.landmarks.push(projectRing(rings[i], view))
  })

  // Nose so the head has a facing direction. Same region as the head (neck).
  const cy = 40 * m.head
  const nz = 17.4 * m.head
  const nose: V3[] = [
    { x: 0, y: cy - 5, z: nz },
    { x: -3.2 * m.head, y: cy + 2, z: nz * 0.62 },
    { x: 3.2 * m.head, y: cy + 2, z: nz * 0.62 },
    { x: 0, y: cy + 9, z: nz * 0.42 },
  ]
  addFace(built, [nose[0], nose[1], nose[2]], 'neck', view, 'nose')
  addFace(built, [nose[1], nose[3], nose[2]], 'neck', view, 'nose')
}

interface LimbSta {
  y: number
  rx: number
  rz: number
  cx: number
  cz: number
  zone: string
  mark?: boolean
}

function armStations(side: 1 | -1, m: Metrics, view: ViewAngle): LimbSta[] {
  const s = side
  const a = m.arm
  const hang = m.armHang
  const socket = m.shoulder - 1
  // Side view swings the near arm forward so it doesn't lie on the torso.
  const fwd = view === 'side' ? [0, 6, 14, 22, 28, 32, 34, 34] : [0, 0, 0, 0, 0, 0, 0, 0]
  const rows: LimbSta[] = [
    { y: 124, rx: 11 * a, rz: 10 * a, cx: s * socket, cz: 2, zone: 'shoulders' },
    { y: 146, rx: 8.4 * a, rz: 7.8 * a, cx: s * (hang - 6), cz: 4, zone: 'shoulders' },
    { y: 168, rx: 6.4 * a, rz: 6 * a, cx: s * (hang - 2), cz: 6, zone: 'elbows-forearms' },
    { y: 190, rx: 8 * a, rz: 7.2 * a, cx: s * hang, cz: 7, zone: 'elbows-forearms', mark: true },
    { y: 214, rx: 5.5 * a, rz: 5.1 * a, cx: s * (hang + 0.5), cz: 5, zone: 'elbows-forearms' },
    { y: 236, rx: 4 * a, rz: 3.7 * a, cx: s * hang, cz: 4, zone: 'wrists-hands', mark: true },
    // Palm is wide and flat so the hand reads at phone size.
    { y: 252, rx: 8.6 * a, rz: 3.1 * a, cx: s * hang, cz: 6, zone: 'wrists-hands' },
    { y: 272, rx: 6.2 * a, rz: 2.4 * a, cx: s * (hang + 0.4), cz: 8, zone: 'wrists-hands' },
  ]
  rows.forEach((row, i) => {
    row.cz += fwd[i]
  })
  return rows
}

function legStations(side: 1 | -1, m: Metrics, view: ViewAngle): LimbSta[] {
  const s = side
  const x = s * m.stance
  const th = m.thigh
  // Far leg sits behind the near one so a side view shows two contours.
  const back = side === -1 ? (view === 'side' ? -16 : -4) : 0
  return [
    { y: 258, rx: th + 0.6, rz: th + 1.4, cx: x, cz: 1 + back, zone: 'hip' },
    { y: 284, rx: th + 1.4, rz: th + 0.8, cx: x + s * 0.4, cz: 2 + back, zone: 'thigh' },
    { y: 310, rx: th + 0.2, rz: th, cx: x, cz: 2 + back, zone: 'thigh' },
    { y: 332, rx: th - 2.4, rz: th - 2, cx: x - s * 0.2, cz: 1.5 + back, zone: 'thigh' },
    // Kneecap: wider than the thigh just above it, and forward.
    { y: 348, rx: th + 0.8, rz: th + 0.4, cx: x, cz: 7 + back, zone: 'knee', mark: true },
    { y: 366, rx: th - 4.6, rz: th - 4.2, cx: x - s * 0.2, cz: 1 + back, zone: 'knee' },
    // Calf belly sits back, then the ankle pinches.
    { y: 394, rx: th - 1.2, rz: th - 0.6, cx: x, cz: -4 + back, zone: 'calf' },
    { y: 422, rx: 6.2, rz: 6.4, cx: x, cz: -0.5 + back, zone: 'ankle', mark: true },
    { y: 438, rx: 7.2, rz: 6.2, cx: x + s * 0.6, cz: -10 + back, zone: 'foot' },
    { y: 452, rx: 7.4, rz: 5, cx: x + s * 3.2, cz: 4 + back, zone: 'foot' },
    { y: 462, rx: 5.8, rz: 3.6, cx: x + s * 6, cz: 18 + back, zone: 'foot' },
  ]
}

function limbZone(sta: LimbSta, side: 1 | -1): string {
  const L = side === 1 ? 'r' : 'l'
  if (sta.zone === 'hip') return side === 1 ? 'hips-glutes-r' : 'hips-glutes-l'
  if (sta.zone === 'knee') return `knees-${L}`
  if (sta.zone === 'calf') return `calves-${L}`
  if (sta.zone === 'ankle') return `ankles-${L}`
  if (sta.zone === 'foot') return 'soles-feet'
  if (sta.zone === 'thigh') return `thigh-${L}`
  return sta.zone
}

function buildLimb(
  built: Built,
  stations: LimbSta[],
  side: 1 | -1,
  view: ViewAngle,
  part: string,
  segs: number,
) {
  const rings = stations.map((p) => ring(p.y, p.rx, p.rz, segs, p.cx, p.cz))
  for (let i = 0; i < rings.length - 1; i++) {
    const zone = limbZone(stations[i + 1], side)
    stitch(built, rings[i], rings[i + 1], view, part, () => zone)
  }
  built.outlines.push(...outlineOf(rings, view))
  stations.forEach((s, i) => {
    if (s.mark) built.landmarks.push(projectRing(rings[i], view))
  })
  return rings
}

function buildThumb(built: Built, side: 1 | -1, m: Metrics, view: ViewAngle) {
  const s = side
  const a = m.arm
  const hang = m.armHang
  const fwd = view === 'side' ? 34 : 0
  const palm = { x: s * hang, y: 250, z: 6 + fwd }
  const root: V3 = { x: palm.x + s * 4.2 * a, y: palm.y + 2, z: palm.z + 1.2 }
  const tip: V3 = { x: palm.x + s * 12 * a, y: palm.y + 8, z: palm.z + 5 }
  const knuckle: V3 = { x: palm.x + s * 7.5 * a, y: palm.y + 11, z: palm.z - 0.4 }
  const base: V3 = { x: palm.x + s * 2.2 * a, y: palm.y + 8, z: palm.z + 2 }
  const part = side === 1 ? 'arm-r' : 'arm-l'
  addFace(built, [root, tip, knuckle], 'wrists-hands', view, part)
  addFace(built, [root, knuckle, base], 'wrists-hands', view, part)
}

function screenX(face: Face): number {
  let x = 0
  for (const p of face.pts) x += p[0]
  return x / face.pts.length
}

/**
 * Thigh faces are built as placeholders (`thigh-l` / `thigh-r`), then split in
 * screen space so the outer thigh the user actually sees is the IT band.
 * A pure 3D "lateral" slice is only a few pixels wide from the front.
 */
function retargetThighs(faces: Face[], view: ViewAngle) {
  for (const side of [1, -1] as const) {
    const L = side === 1 ? 'r' : 'l'
    const placeholder = `thigh-${L}`
    const group = faces.filter((f) => f.zone === placeholder)
    if (!group.length) continue
    let minX = Infinity
    let maxX = -Infinity
    for (const f of group) {
      const x = screenX(f)
      if (x < minX) minX = x
      if (x > maxX) maxX = x
    }
    const span = Math.max(1, maxX - minX)
    for (const f of group) {
      const t = (screenX(f) - minX) / span
      const outerT = side === 1 ? t : 1 - t
      if (view === 'side') {
        // Screen-left is anterior (the face points left).
        if (t < 0.28) f.zone = `quads-${L}`
        else if (t > 0.72) f.zone = `hamstrings-${L}`
        else f.zone = `it-band-${L}`
      } else if (view === 'back') {
        if (outerT > 0.56) f.zone = `it-band-${L}`
        else f.zone = `hamstrings-${L}`
      } else if (f.body.z < -1.5 && view === 'three-quarter') {
        f.zone = `hamstrings-${L}`
      } else if (outerT > 0.5) {
        f.zone = `it-band-${L}`
      } else {
        f.zone = `quads-${L}`
      }
    }
  }
}

export function buildWireMesh(gender: Gender, view: ViewAngle): WireMesh {
  const m = metrics(gender === 'male')
  const built: Built = { faces: [], outlines: [], landmarks: [] }
  buildAxial(built, m, view)
  for (const side of [1, -1] as const) {
    // A side view shows the near arm only; the far arm would land on the chest.
    if (view === 'side' && side === -1) continue
    const part = side === 1 ? 'arm-r' : 'arm-l'
    buildLimb(built, armStations(side, m, view), side, view, part, 6)
    buildThumb(built, side, m, view)
  }
  for (const side of [1, -1] as const) {
    const part = side === 1 ? 'leg-r' : 'leg-l'
    buildLimb(built, legStations(side, m, view), side, view, part, 6)
  }
  retargetThighs(built.faces, view)
  built.faces.sort((a, b) => a.depth - b.depth)
  return built
}

/** A face lights only for its own region — never a whole neighboring stack. */
export function faceMatchesSelection(face: Face, selected: Set<string>): boolean {
  if (!face.zone || selected.size === 0) return false
  return selected.has(face.zone)
}
