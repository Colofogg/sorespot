import { useEffect, useMemo, useState } from 'react'
import { BodyMap } from './components/BodyMap'
import { GenderSelect } from './components/GenderSelect'
import { StretchList } from './components/StretchList'
import type { Gender, Screen } from './types'

const GENDER_KEY = 'sorespot-gender'

function readStoredGender(): Gender | null {
  try {
    const v = localStorage.getItem(GENDER_KEY)
    if (v === 'male' || v === 'female') return v
  } catch {
    /* ignore */
  }
  return null
}

export default function App() {
  const stored = useMemo(() => readStoredGender(), [])
  const [gender, setGender] = useState<Gender | null>(stored)
  const [screen, setScreen] = useState<Screen>(stored ? 'body' : 'gender')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (gender) {
      try {
        localStorage.setItem(GENDER_KEY, gender)
      } catch {
        /* ignore */
      }
    }
  }, [gender])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (screen === 'gender' || !gender) {
    return (
      <GenderSelect
        onSelect={(g) => {
          setGender(g)
          setScreen('body')
        }}
      />
    )
  }

  if (screen === 'stretches') {
    return (
      <StretchList
        selectedRegions={Array.from(selected)}
        onBack={() => setScreen('body')}
      />
    )
  }

  return (
    <BodyMap
      gender={gender}
      selected={selected}
      onToggle={toggle}
      onClear={() => setSelected(new Set())}
      onFindStretches={() => setScreen('stretches')}
      onChangeBody={() => setScreen('gender')}
    />
  )
}
