/**
 * Geometric checks: a tap on a drawn part selects that part, and the pad
 * for that part is centered on the same faces. Run with: npx tsx scripts/check-hits.ts
 */
import { writeFileSync } from 'node:fs'
import { catalog, regionLabel } from '../src/catalog'
import {
  faceCentroid,
  hotspotsFromMesh,
  MIN_HIT,
  regionAtPoint,
} from '../src/components/wireframe/hotspots'
import {
  buildWireMesh,
  faceMatchesSelection,
  type Face,
  type WireMesh,
} from '../src/components/wireframe/mesh'
import type { Gender, ViewAngle } from '../src/types'

const VIEWS: ViewAngle[] = ['front', 'three-quarter', 'side', 'back']
const GENDERS: Gender[] = ['male', 'female']

const CATALOG_IDS = new Set(catalog.regions.map((r) => r.id))

const failures: string[] = []

function fail(msg: string) {
  failures.push(msg)
}

function nearestFace(mesh: WireMesh, zone: string): Face | null {
  let best: Face | null = null
  for (const face of mesh.faces) {
    if (face.zone !== zone) continue
    if (!best || face.depth > best.depth) best = face
  }
  return best
}

function zoneCounts(mesh: WireMesh): Map<string, number> {
  const map = new Map<string, number>()
  for (const face of mesh.faces) {
    map.set(face.zone, (map.get(face.zone) ?? 0) + 1)
  }
  return map
}

function meanX(mesh: WireMesh, zone: string): number {
  const faces = mesh.faces.filter((f) => f.zone === zone)
  if (!faces.length) return NaN
  let x = 0
  let n = 0
  for (const face of faces) {
    const c = faceCentroid(face)
    x += c[0]
    n++
  }
  return x / n
}

function bboxOf(faces: Face[]) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const face of faces) {
    for (const p of face.pts) {
      minX = Math.min(minX, p[0])
      maxX = Math.max(maxX, p[0])
      minY = Math.min(minY, p[1])
      maxY = Math.max(maxY, p[1])
    }
  }
  return { minX, maxX, minY, maxY }
}

/** Required visible regions. Chest/abs/quads are front surfaces; backs are the rear. */
const REQUIRED: Record<ViewAngle, string[]> = {
  front: [
    'neck',
    'shoulders',
    'chest',
    'abs',
    'hips-glutes-l',
    'hips-glutes-r',
    'quads-l',
    'quads-r',
    'it-band-l',
    'it-band-r',
    'knees-l',
    'knees-r',
    'calves-l',
    'calves-r',
    'ankles-l',
    'ankles-r',
    'soles-feet',
    'elbows-forearms',
    'wrists-hands',
  ],
  back: [
    'neck',
    'shoulders',
    'upper-back',
    'mid-back',
    'lower-back',
    'hips-glutes-l',
    'hips-glutes-r',
    'hamstrings-l',
    'hamstrings-r',
    'it-band-l',
    'it-band-r',
    'knees-l',
    'knees-r',
    'calves-l',
    'calves-r',
    'ankles-l',
    'ankles-r',
    'soles-feet',
    'elbows-forearms',
    'wrists-hands',
  ],
  side: [
    'neck',
    'shoulders',
    'chest',
    'abs',
    'upper-back',
    'mid-back',
    'lower-back',
    'hips-glutes-r',
    'quads-r',
    'hamstrings-r',
    'it-band-r',
    'knees-r',
    'calves-r',
    'ankles-r',
    'soles-feet',
    'elbows-forearms',
    'wrists-hands',
  ],
  'three-quarter': [
    'neck',
    'shoulders',
    'chest',
    'abs',
    'upper-back',
    'hips-glutes-l',
    'hips-glutes-r',
    'quads-r',
    'it-band-r',
    'knees-l',
    'knees-r',
    'calves-l',
    'calves-r',
    'ankles-l',
    'ankles-r',
    'soles-feet',
    'elbows-forearms',
    'wrists-hands',
  ],
}

function checkMesh(gender: Gender, view: ViewAngle) {
  const mesh = buildWireMesh(gender, view)
  const spots = hotspotsFromMesh(mesh)
  const counts = zoneCounts(mesh)
  const tag = `${gender} ${view}`

  for (const face of mesh.faces) {
    for (const p of face.pts) {
      if (p[0] < -2 || p[0] > 202 || p[1] < -2 || p[1] > 492) {
        fail(`${tag}: face ${face.zone} sticks out of the viewBox at (${p[0].toFixed(1)},${p[1].toFixed(1)})`)
      }
    }
    const base = face.zone.replace(/-(?:l|r)$/i, '')
    if (base !== 'traps' && !CATALOG_IDS.has(base)) {
      fail(`${tag}: zone "${face.zone}" is not in the stretch catalog`)
    }
    if (face.zone.startsWith('thigh-')) {
      fail(`${tag}: placeholder zone ${face.zone} was not retargeted`)
    }
  }

  for (const id of REQUIRED[view]) {
    if (!counts.get(id)) fail(`${tag}: missing faces for ${id}`)
  }

  // Every hotspot id has faces, so a label cannot appear with nothing lit.
  for (const spot of spots) {
    if (!counts.get(spot.id)) fail(`${tag}: hotspot ${spot.id} has no faces`)
    const lit = mesh.faces.filter((f) => faceMatchesSelection(f, new Set([spot.id])))
    if (!lit.length) fail(`${tag}: selecting ${spot.id} lights nothing`)
    const others = ['chest', 'abs', 'upper-back', 'mid-back', 'lower-back', 'hips-glutes-l', 'hips-glutes-r']
    if (others.includes(spot.id)) {
      for (const other of others) {
        if (other === spot.id) continue
        const cross = mesh.faces.filter(
          (f) => f.zone === other && faceMatchesSelection(f, new Set([spot.id])),
        )
        if (cross.length) fail(`${tag}: selecting ${spot.id} also lights ${other}`)
      }
    }
  }

  // Every required region has a visible face whose center selects that region.
  // A face hidden behind a nearer limb is not a miss; a fully covered region is.
  for (const id of REQUIRED[view]) {
    const visible = mesh.faces.filter((face) => {
      if (face.zone !== id) return false
      const c = faceCentroid(face)
      return regionAtPoint(mesh, spots, c[0], c[1]) === id
    })
    if (!visible.length) fail(`${tag}: no visible tappable face for ${id}`)
  }

  // Pads are at least MIN_HIT and centered on their own faces.
  for (const spot of spots) {
    const faces = mesh.faces.filter((f) => f.zone === spot.id)
    const box = bboxOf(faces)
    for (const pad of spot.pads) {
      if (pad.rx * 2 < MIN_HIT - 0.1 || pad.ry * 2 < MIN_HIT - 0.1) {
        fail(`${tag}: pad ${spot.id} is ${pad.rx * 2}×${pad.ry * 2}, under ${MIN_HIT}`)
      }
      const insideX = pad.cx >= box.minX - 1 && pad.cx <= box.maxX + 1
      const insideY = pad.cy >= box.minY - 1 && pad.cy <= box.maxY + 1
      if (!insideX || !insideY) {
        fail(
          `${tag}: pad ${spot.id} center (${pad.cx.toFixed(1)},${pad.cy.toFixed(1)}) is outside its faces [${box.minX.toFixed(1)}–${box.maxX.toFixed(1)}, ${box.minY.toFixed(1)}–${box.maxY.toFixed(1)}]`,
        )
      }
    }
  }

  // Left/right are not flipped. Screen-left mean x is smaller.
  for (const pair of [
    ['knees-l', 'knees-r'],
    ['calves-l', 'calves-r'],
    ['quads-l', 'quads-r'],
    ['it-band-l', 'it-band-r'],
    ['hamstrings-l', 'hamstrings-r'],
    ['hips-glutes-l', 'hips-glutes-r'],
  ] as const) {
    if (view === 'side') continue
    const a = meanX(mesh, pair[0])
    const b = meanX(mesh, pair[1])
    if (Number.isNaN(a) || Number.isNaN(b)) continue
    if (!(a < b)) fail(`${tag}: ${pair[0]} mean x ${a.toFixed(1)} is not left of ${pair[1]} ${b.toFixed(1)}`)
  }

  // IT band sits on the outer thigh, not floating outside the leg.
  for (const side of ['l', 'r'] as const) {
    if (view === 'side' && side === 'l') continue
    const it = mesh.faces.filter((f) => f.zone === `it-band-${side}`)
    const leg = mesh.faces.filter((f) => f.part === `leg-${side}` && f.body.y < 370 && f.body.y > 260)
    if (!it.length || !leg.length) continue
    const itBox = bboxOf(it)
    const legBox = bboxOf(leg)
    const itCx = (itBox.minX + itBox.maxX) / 2
    if (itCx < legBox.minX - 2 || itCx > legBox.maxX + 2) {
      fail(
        `${tag}: IT ${side} center x ${itCx.toFixed(1)} is outside the thigh [${legBox.minX.toFixed(1)}–${legBox.maxX.toFixed(1)}]`,
      )
    }
    // On front, back, and ¾ the outer silhouette of the thigh is the IT band.
    // Side view shows that surface face-on, so the middle of the IT faces is the probe.
    const probeX =
      view === 'side' ? (itBox.minX + itBox.maxX) / 2 : side === 'r' ? itBox.maxX - 2 : itBox.minX + 2
    const probeY = (itBox.minY + itBox.maxY) / 2
    const hit = regionAtPoint(mesh, spots, probeX, probeY)
    if (hit !== `it-band-${side}`) {
      fail(
        `${tag}: outer thigh tap (${probeX.toFixed(1)},${probeY.toFixed(1)}) hit ${hit}, expected it-band-${side}`,
      )
    }
  }

  // Torso vertical order: a visible chest tap sits above a visible abs tap.
  if (counts.get('chest') && counts.get('abs')) {
    const visible = (id: string) =>
      mesh.faces.find((face) => {
        if (face.zone !== id) return false
        const c = faceCentroid(face)
        return regionAtPoint(mesh, spots, c[0], c[1]) === id
      })
    const chest = visible('chest')
    const abs = visible('abs')
    if (chest && abs) {
      const cc = faceCentroid(chest)
      const ac = faceCentroid(abs)
      if (!(cc[1] < ac[1])) fail(`${tag}: chest tap is not above abs`)
    }
  }

  // Knee pad must not swallow the mid-thigh. A thigh-face centroid is not "knees".
  for (const side of ['l', 'r'] as const) {
    const thighZones = [`quads-${side}`, `it-band-${side}`, `hamstrings-${side}`]
    for (const zone of thighZones) {
      const face = nearestFace(mesh, zone)
      if (!face) continue
      const c = faceCentroid(face)
      const hit = regionAtPoint(mesh, spots, c[0], c[1])
      if (hit?.startsWith('knees')) {
        fail(`${tag}: ${zone} centroid selected ${hit}`)
      }
    }
  }

  return { mesh, spots, counts }
}

function ptsAttr(pts: [number, number][]): string {
  return pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
}

function svgFor(gender: Gender, view: ViewAngle): string {
  const mesh = buildWireMesh(gender, view)
  const faces = mesh.faces
    .map(
      (f) =>
        `<polygon points="${ptsAttr(f.pts)}" fill="rgba(45,140,140,0.08)" stroke="#2a8a8a" stroke-width="0.6" data-zone="${f.zone}"/>`,
    )
    .join('')
  const outlines = mesh.outlines
    .map(
      (line) =>
        `<polyline points="${ptsAttr(line)}" fill="none" stroke="#1a6464" stroke-width="1.3"/>`,
    )
    .join('')
  const marks = mesh.landmarks
    .map(
      (line) =>
        `<polyline points="${ptsAttr(line)}" fill="none" stroke="#164e4e" stroke-width="1.6"/>`,
    )
    .join('')
  return `<svg viewBox="0 0 200 490" width="200" height="490">${faces}${outlines}${marks}</svg>`
}

const summary: string[] = []
for (const gender of GENDERS) {
  for (const view of VIEWS) {
    const { counts } = checkMesh(gender, view)
    const bits = [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, n]) => `${k}:${n}`)
      .join(' ')
    summary.push(`${gender} ${view}  ${bits}`)
  }
}

const html = `<!doctype html><meta charset="utf-8"><title>SoreSpot mesh preview</title>
<style>body{font-family:sans-serif;background:#f4f7f6;margin:0;padding:12px} h2{font-size:14px;margin:8px 0} .row{display:flex;gap:12px;flex-wrap:wrap} figure{margin:0;background:#fff;border-radius:12px;padding:8px}</style>
${GENDERS.map(
  (g) =>
    `<h2>${g}</h2><div class="row">${VIEWS.map(
      (v) => `<figure><figcaption>${v}</figcaption>${svgFor(g, v)}</figure>`,
    ).join('')}</div>`,
).join('')}
`
writeFileSync('/tmp/sorespot-preview.html', html)

console.log(summary.join('\n'))
console.log('---')
if (failures.length) {
  console.error(`${failures.length} failure(s):`)
  for (const f of failures) console.error(' - ' + f)
  process.exit(1)
}
console.log('All geometric hit checks passed.')
console.log('Sample label:', regionLabel('it-band-r'))
