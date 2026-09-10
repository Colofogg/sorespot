export type Gender = 'male' | 'female'

export type Screen = 'gender' | 'body' | 'stretches'

export type ViewAngle = 'front' | 'side' | 'back'

export interface Region {
  id: string
  label: string
  notes?: string
}

export interface Stretch {
  id: string
  name: string
  regions: string[]
  whyHelps: string
  steps: string[]
  durationOrReps: string
  cautions: string
  seeAProWhen?: string
}

export interface Catalog {
  version: string
  title: string
  audience: string
  disclaimer: string
  regions: Region[]
  stretches: Stretch[]
  regionToStretchIds: Record<string, string[]>
}
