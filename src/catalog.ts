import raw from './data/stretches.json'
import type { Catalog, Stretch } from './types'

export const catalog: Catalog = raw

const stretchById = new Map(catalog.stretches.map((s) => [s.id, s]))

export function regionLabel(id: string): string {
  return catalog.regions.find((r) => r.id === id)?.label ?? id
}

/** Deduped stretches for selected region ids, preserving catalog order. */
export function stretchesForRegions(regionIds: string[]): Stretch[] {
  const seen = new Set<string>()
  const out: Stretch[] = []
  for (const rid of regionIds) {
    const ids = catalog.regionToStretchIds[rid] ?? []
    for (const sid of ids) {
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
