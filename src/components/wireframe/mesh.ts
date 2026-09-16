/**
 * Original low-poly human wireframe mesh for SoreSpot.
 * Procedural elliptical cross-section stacks → projected faces.
 * Style inspired by public-domain prismatic wireframes; geometry is original.
 */
import type { Gender, ViewAngle } from '../../types'

export type Pt = [number, number]

export interface Face {
  pts: Pt[]
  zone?: string
}

export interface WireMesh {
  faces: Face[]
  outlines: Pt[][]
}

type V3 = { x: number; y: number; z: number }

const TAU = Math.PI * 2

function project(v: V3, view: ViewAngle): Pt {
  const { x, y, z } = v
  if (view === 'front') return [100 + x, y]
  if (view === 'back') return [100 - x, y]
  if (view === 'side') {
    // Keep a whisper of lateral so limbs don't fully collapse
    return [100 + z * 1.2 + x * 0.12, y]
  }
  const yaw = Math.PI / 4.2
  const xr = x * Math.cos(yaw) - z * Math.sin(yaw)
  const zr = x * Math.sin(yaw) + z * Math.cos(yaw)
  return [100 + xr * 0.95 + zr * 0.1, y - zr * 0.035]
}

function ring(y: number, rx: number, rz: number, segs: number, cx = 0, cz = 0): V3[] {
  const pts: V3[] = []
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * TAU - Math.PI / 2
    pts.push({
      x: cx + Math.cos(a) * rx,
      y,
      z: cz + Math.sin(a) * rz,
    })
  }
  return pts
}

function stitch(a: V3[], b: V3[], view: ViewAngle, zone?: string): Face[] {
  const n = Math.min(a.length, b.length)
  const faces: Face[] = []
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const p0 = project(a[i], view)
    const p1 = project(a[j], view)
    const p2 = project(b[j], view)
    const p3 = project(b[i], view)
    faces.push({ pts: [p0, p1, p2], zone })
    faces.push({ pts: [p0, p2, p3], zone })
  }
  return faces
}

function areaOk(pts: Pt[]): boolean {
  if (pts.length < 3) return false
  const [a, b, c] = pts
  const area = Math.abs((a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1])) / 2)
  return area > 0.4
}

type Seg = { y: number; rx: number; rz: number; zone: string; cx?: number; cz?: number }

function stack(segs: Seg[], view: ViewAngle, ringSegs = 8): { faces: Face[]; rings: V3[][] } {
  const rings = segs.map((s) => ring(s.y, s.rx, s.rz, ringSegs, s.cx ?? 0, s.cz ?? 0))
  const faces: Face[] = []
  for (let i = 0; i < rings.length - 1; i++) {
    const zone = segs[i + 1]?.zone ?? segs[i].zone
    faces.push(...stitch(rings[i], rings[i + 1], view, zone))
  }
  return { faces, rings }
}

function limbChain(
  points: { y: number; rx: number; rz: number; cx: number; cz: number; zone: string }[],
  view: ViewAngle,
  segs = 6,
): Face[] {
  const rings = points.map((p) => ring(p.y, p.rx, p.rz, segs, p.cx, p.cz))
  const faces: Face[] = []
  for (let i = 0; i < rings.length - 1; i++) {
    faces.push(...stitch(rings[i], rings[i + 1], view, points[i + 1].zone))
  }
  return faces
}

function headCage(view: ViewAngle, male: boolean): Face[] {
  const s = male ? 1 : 0.96
  const cy = male ? 40 : 38
  const levels = [
    { y: cy - 18 * s, rx: 7 * s, rz: 8 * s },
    { y: cy - 10 * s, rx: 14 * s, rz: 15 * s },
    { y: cy - 2 * s, rx: 16 * s, rz: 17 * s },
    { y: cy + 8 * s, rx: 15 * s, rz: 16 * s },
    { y: cy + 18 * s, rx: 11 * s, rz: 12 * s },
    { y: cy + 26 * s, rx: 8 * s, rz: 9 * s },
  ]
  const rings = levels.map((l) => ring(l.y, l.rx, l.rz, 8))
  const faces: Face[] = []
  for (let i = 0; i < rings.length - 1; i++) {
    faces.push(...stitch(rings[i], rings[i + 1], view, 'neck'))
  }
  // Nose prism (forward)
  const noseZ = 17 * s
  const nose = [
    { x: 0, y: cy - 2, z: noseZ },
    { x: -3.5 * s, y: cy + 3, z: noseZ * 0.72 },
    { x: 3.5 * s, y: cy + 3, z: noseZ * 0.72 },
    { x: 0, y: cy + 10, z: noseZ * 0.5 },
  ].map((v) => project(v, view))
  faces.push({ pts: [nose[0], nose[1], nose[2]], zone: 'neck' })
  faces.push({ pts: [nose[1], nose[3], nose[2]], zone: 'neck' })
  return faces
}

function torsoSegs(male: boolean): Seg[] {
  if (male) {
    return [
      { y: 66, rx: 10, rz: 11, zone: 'neck' },
      { y: 80, rx: 14, rz: 13, zone: 'traps' },
      { y: 96, rx: 44, rz: 16, zone: 'shoulders' },
      { y: 112, rx: 46, rz: 18, zone: 'shoulders' },
      { y: 132, rx: 40, rz: 22, zone: 'chest' },
      { y: 154, rx: 38, rz: 22, zone: 'chest' },
      { y: 176, rx: 33, rz: 18, zone: 'abs' },
      { y: 198, rx: 30, rz: 16, zone: 'abs' },
      { y: 220, rx: 32, rz: 17, zone: 'abs' },
      { y: 242, rx: 37, rz: 20, zone: 'hips-glutes' },
      { y: 262, rx: 35, rz: 19, zone: 'hips-glutes' },
    ]
  }
  return [
    { y: 64, rx: 9.5, rz: 10.5, zone: 'neck' },
    { y: 78, rx: 13, rz: 12, zone: 'traps' },
    { y: 94, rx: 37, rz: 15, zone: 'shoulders' },
    { y: 110, rx: 38, rz: 16, zone: 'shoulders' },
    { y: 130, rx: 34, rz: 19, zone: 'chest' },
    { y: 152, rx: 32, rz: 19, zone: 'chest' },
    { y: 172, rx: 27, rz: 15, zone: 'abs' },
    { y: 192, rx: 26, rz: 14, zone: 'abs' },
    { y: 214, rx: 32, rz: 17, zone: 'hips-glutes' },
    { y: 236, rx: 41, rz: 21, zone: 'hips-glutes' },
    { y: 258, rx: 39, rz: 20, zone: 'hips-glutes' },
  ]
}

function leg(side: 1 | -1, male: boolean, view: ViewAngle): Face[] {
  const hx = male ? 15 : 17
  const startY = male ? 262 : 258
  const pts = [
    { y: startY, rx: 14, rz: 15, cx: side * hx, cz: 2, zone: 'hips-glutes' },
    {
      y: startY + 30,
      rx: side === 1 ? 14 : 12.5,
      rz: 14,
      cx: side * (hx + 1),
      cz: 1,
      zone: side === 1 ? 'it-band-r' : 'it-band-l',
    },
    {
      y: startY + 60,
      rx: side === 1 ? 13 : 11.5,
      rz: 13,
      cx: side * (hx + 1.5),
      cz: 0,
      zone: side === 1 ? 'it-band-r' : 'it-band-l',
    },
    {
      y: startY + 90,
      rx: 11,
      rz: 12,
      cx: side * hx,
      cz: 0,
      zone: side === 1 ? 'quads-r' : 'quads-l',
    },
    {
      y: startY + 112,
      rx: 10,
      rz: 11,
      cx: side * (hx - 0.5),
      cz: 1,
      zone: side === 1 ? 'knees-r' : 'knees-l',
    },
    {
      y: startY + 140,
      rx: 9,
      rz: 10,
      cx: side * (hx - 1),
      cz: 0,
      zone: side === 1 ? 'calves-r' : 'calves-l',
    },
    {
      y: startY + 168,
      rx: 8,
      rz: 9,
      cx: side * (hx - 1),
      cz: -1,
      zone: side === 1 ? 'calves-r' : 'calves-l',
    },
    {
      y: startY + 190,
      rx: 7,
      rz: 8,
      cx: side * (hx - 1),
      cz: 0,
      zone: side === 1 ? 'ankles-r' : 'ankles-l',
    },
    {
      y: startY + 204,
      rx: 9,
      rz: 15,
      cx: side * hx,
      cz: 9,
      zone: 'soles-feet',
    },
    {
      y: startY + 214,
      rx: 11,
      rz: 17,
      cx: side * hx,
      cz: 13,
      zone: 'soles-feet',
    },
  ]
  if (view === 'back') {
    for (const p of pts) {
      if (p.zone.startsWith('quads')) {
        p.zone = side === 1 ? 'hamstrings-r' : 'hamstrings-l'
      }
    }
  }
  return limbChain(pts, view, 6)
}

function arm(side: 1 | -1, male: boolean, view: ViewAngle): Face[] {
  const shoulderY = male ? 112 : 110
  const shoulderX = male ? 46 : 38
  const pts = [
    { y: shoulderY, rx: 11, rz: 10, cx: side * shoulderX, cz: 2, zone: 'shoulders' },
    { y: shoulderY + 30, rx: 9.5, rz: 9, cx: side * (shoulderX + 5), cz: 1, zone: 'shoulders' },
    { y: shoulderY + 62, rx: 8.5, rz: 8, cx: side * (shoulderX + 7), cz: 0, zone: 'elbows-forearms' },
    { y: shoulderY + 96, rx: 7.5, rz: 7, cx: side * (shoulderX + 8), cz: 0, zone: 'elbows-forearms' },
    { y: shoulderY + 126, rx: 6.5, rz: 6, cx: side * (shoulderX + 9), cz: 1, zone: 'wrists-hands' },
    { y: shoulderY + 146, rx: 8, rz: 5, cx: side * (shoulderX + 10), cz: 2, zone: 'wrists-hands' },
  ]
  return limbChain(pts, view, 6)
}

function outlineFromRings(rings: V3[][], view: ViewAngle): Pt[][] {
  if (!rings.length) return []
  const left: Pt[] = []
  const right: Pt[] = []
  for (const r of rings) {
    let minX = Infinity
    let maxX = -Infinity
    let minP: Pt = [0, 0]
    let maxP: Pt = [0, 0]
    for (const v of r) {
      const p = project(v, view)
      if (p[0] < minX) {
        minX = p[0]
        minP = p
      }
      if (p[0] > maxX) {
        maxX = p[0]
        maxP = p
      }
    }
    left.push(minP)
    right.push(maxP)
  }
  return [left, right]
}

/** Dedicated left-facing profile lattice — readable Side view, never blank. */
function buildSideProfile(male: boolean): WireMesh {
  // Front contour (chest / face left) and back contour (spine / glutes)
  const front: Pt[] = male
    ? [
        [108, 22],
        [118, 30],
        [124, 40],
        [122, 52],
        [116, 62],
        [112, 72],
        [120, 92],
        [130, 118],
        [134, 148],
        [128, 178],
        [122, 208],
        [124, 236],
        [130, 258],
        [126, 286],
        [120, 320],
        [118, 356],
        [116, 392],
        [118, 428],
        [124, 456],
        [138, 472],
      ]
    : [
        [108, 20],
        [117, 28],
        [122, 38],
        [120, 50],
        [114, 60],
        [110, 70],
        [118, 90],
        [126, 116],
        [128, 146],
        [122, 174],
        [118, 200],
        [124, 228],
        [134, 252],
        [128, 280],
        [122, 314],
        [118, 350],
        [116, 386],
        [118, 422],
        [124, 450],
        [136, 468],
      ]
  const back: Pt[] = male
    ? [
        [92, 24],
        [86, 36],
        [84, 50],
        [86, 64],
        [88, 78],
        [82, 100],
        [76, 130],
        [74, 162],
        [76, 194],
        [80, 224],
        [86, 248],
        [94, 268],
        [90, 298],
        [84, 332],
        [82, 368],
        [84, 404],
        [86, 438],
        [90, 462],
        [98, 476],
      ]
    : [
        [92, 22],
        [86, 34],
        [84, 48],
        [86, 62],
        [88, 76],
        [80, 98],
        [74, 128],
        [72, 158],
        [74, 188],
        [78, 216],
        [88, 242],
        [98, 264],
        [92, 294],
        [84, 328],
        [82, 364],
        [84, 400],
        [86, 434],
        [90, 458],
        [98, 472],
      ]

  const faces: Face[] = []
  const n = Math.min(front.length, back.length)
  // Horizontal ribs + diagonal triangulation between front/back contours
  for (let i = 0; i < n - 1; i++) {
    const zone =
      i < 3
        ? 'neck'
        : i < 6
          ? 'shoulders'
          : i < 10
            ? 'chest'
            : i < 13
              ? 'abs'
              : i < 15
                ? 'hips-glutes'
                : i < 17
                  ? 'it-band-r'
                  : i < 19
                    ? 'calves-r'
                    : 'soles-feet'
    const a = front[i]
    const b = front[i + 1]
    const c = back[Math.min(i + 1, back.length - 1)]
    const d = back[Math.min(i, back.length - 1)]
    // Mid spine points for extra low-poly faces
    const midA: Pt = [(a[0] + d[0]) / 2, (a[1] + d[1]) / 2]
    const midB: Pt = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2]
    faces.push({ pts: [a, b, midB], zone })
    faces.push({ pts: [a, midB, midA], zone })
    faces.push({ pts: [midA, midB, c], zone })
    faces.push({ pts: [midA, c, d], zone })
  }

  // Visible near arm (profile)
  const armFront: Pt[] = male
    ? [
        [118, 100],
        [128, 128],
        [132, 160],
        [134, 192],
        [136, 220],
        [138, 242],
      ]
    : [
        [116, 98],
        [124, 126],
        [128, 156],
        [130, 188],
        [132, 214],
        [134, 236],
      ]
  const armBack: Pt[] = male
    ? [
        [108, 104],
        [114, 132],
        [116, 164],
        [118, 196],
        [120, 222],
        [122, 244],
      ]
    : [
        [106, 102],
        [112, 130],
        [114, 160],
        [116, 190],
        [118, 216],
        [120, 238],
      ]
  for (let i = 0; i < armFront.length - 1; i++) {
    const zone = i < 2 ? 'shoulders' : i < 4 ? 'elbows-forearms' : 'wrists-hands'
    faces.push({
      pts: [armFront[i], armFront[i + 1], armBack[i + 1]],
      zone,
    })
    faces.push({
      pts: [armFront[i], armBack[i + 1], armBack[i]],
      zone,
    })
  }

  // Near thigh IT-band column emphasis
  const itF: Pt[] = [
    [128, 268],
    [126, 300],
    [124, 332],
    [122, 362],
  ]
  const itB: Pt[] = [
    [112, 270],
    [110, 302],
    [108, 334],
    [106, 364],
  ]
  for (let i = 0; i < itF.length - 1; i++) {
    faces.push({ pts: [itF[i], itF[i + 1], itB[i + 1]], zone: 'it-band-r' })
    faces.push({ pts: [itF[i], itB[i + 1], itB[i]], zone: 'it-band-r' })
  }

  return {
    faces: faces.filter((f) => areaOk(f.pts)),
    outlines: [front, back, armFront, armBack],
  }
}

function buildProjected(gender: Gender, view: ViewAngle): WireMesh {
  const male = gender === 'male'
  const faces: Face[] = []
  faces.push(...headCage(view, male))
  const torso = stack(torsoSegs(male), view, view === 'three-quarter' ? 8 : 8)
  faces.push(...torso.faces)
  faces.push(...arm(1, male, view))
  faces.push(...arm(-1, male, view))
  faces.push(...leg(1, male, view))
  faces.push(...leg(-1, male, view))
  return {
    faces: faces.filter((f) => areaOk(f.pts)),
    outlines: outlineFromRings(torso.rings, view),
  }
}

export function buildWireMesh(gender: Gender, view: ViewAngle): WireMesh {
  if (view === 'side') return buildSideProfile(gender === 'male')
  return buildProjected(gender, view)
}

export function zonesForRegion(regionId: string): string[] {
  const base = regionId.replace(/-(?:l|r)$/i, '')
  const out = new Set<string>([regionId, base])
  if (base === 'traps') {
    out.add('neck')
    out.add('shoulders')
  }
  if (base === 'it-band') {
    out.add(regionId)
  }
  if (base === 'hamstrings') {
    out.add(`hamstrings-l`)
    out.add(`hamstrings-r`)
  }
  if (base === 'lower-back' || base === 'mid-back' || base === 'upper-back') {
    out.add('abs')
    out.add('chest')
    out.add('hips-glutes')
  }
  return [...out]
}

export function faceMatchesSelection(face: Face, selected: Set<string>): boolean {
  const zone: string | undefined = face.zone
  if (!zone || selected.size === 0) return false
  for (const raw of selected) {
    const id: string = raw
    if (zone === id) return true
    if (zonesForRegion(id).includes(zone)) return true
    const baseId: string = id.replace(/-(?:l|r)$/i, '')
    const sideMatch = /-(l|r)$/i.exec(id)
    const sideId: string | undefined = sideMatch ? sideMatch[1].toLowerCase() : undefined
    if (zone === baseId) return true
    if (sideId && zone === baseId + '-' + sideId) return true
    if (!sideId && zone.startsWith(baseId)) return true
  }
  return false
}
