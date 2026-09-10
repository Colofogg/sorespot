import raw from './data/stretches.json'
import type { Catalog, Stretch } from './types'

export const catalog: Catalog = raw

const stretchById = new Map(catalog.stretches.map((s) => [s.id, s]))

/** Strip left/right suffix so quads-l → quads, it-band-r → it-band. */
export function catalogRegionId(id: string): string {
  return id.replace(/-(?:l|r)$/i, '')
}

const ALIASES: Record<string, string[]> = {
  traps: ['neck', 'shoulders'],
}

export function regionLabel(id: string): string {
  const base = catalogRegionId(id)
  if (base === 'traps') {
    const side = /-(?:l)$/i.test(id) ? 'Left ' : /-(?:r)$/i.test(id) ? 'Right ' : ''
    return `${side}Traps`
  }
  const label = catalog.regions.find((r) => r.id === base)?.label ?? base
  if (/-(?:l)$/i.test(id)) return `Left ${label.toLowerCase()}`
  if (/-(?:r)$/i.test(id)) return `Right ${label.toLowerCase()}`
  return label
}

function stretchIdsForRegion(rid: string): string[] {
  const base = catalogRegionId(rid)
  if (ALIASES[base]) {
    const out: string[] = []
    for (const a of ALIASES[base]) {
      out.push(...(catalog.regionToStretchIds[a] ?? []))
    }
    return out
  }
  return catalog.regionToStretchIds[base] ?? catalog.regionToStretchIds[rid] ?? []
}

/** Deduped stretches for selected region ids, preserving catalog order. */
export function stretchesForRegions(regionIds: string[]): Stretch[] {
  const seen = new Set<string>()
  const out: Stretch[] = []
  for (const rid of regionIds) {
    for (const sid of stretchIdsForRegion(rid)) {
      if (seen.has(sid)) continue
      const stretch = stretchById.get(sid)
      if (stretch) {
        seen.add(sid)
        out.push(stretch)
      }
    }
  }
  return out
}
