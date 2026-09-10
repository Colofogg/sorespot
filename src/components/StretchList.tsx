import { useEffect, useState } from 'react'
import { catalog, regionLabel, stretchesForRegions } from '../catalog'
import type { Stretch } from '../types'

interface Props {
  selectedRegions: string[]
  onBack: () => void
}

export function StretchList({ selectedRegions, onBack }: Props) {
  const [loading, setLoading] = useState(true)
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false)
  const stretches = stretchesForRegions(selectedRegions)

  useEffect(() => {
    setLoading(true)
    const t = window.setTimeout(() => setLoading(false), 450)
    return () => window.clearTimeout(t)
  }, [selectedRegions])

  return (
    <div className="screen stretches-screen">
      <header className="stretches-header">
        <button type="button" className="link-btn" onClick={onBack}>
          ← Back
        </button>
        <h1>Your stretches</h1>
        <p className="spots-summary">
          For: {selectedRegions.map(regionLabel).join(', ')}
        </p>
      </header>

      <p className="disclaimer-short">
        Gentle movement tips only — not medical advice. Stop if pain gets worse.{' '}
        <button
          type="button"
          className="link-btn inline"
          onClick={() => setShowFullDisclaimer((v) => !v)}
        >
          {showFullDisclaimer ? 'Hide details' : 'Full disclaimer'}
        </button>
      </p>
      {showFullDisclaimer && (
        <p className="disclaimer-full">{catalog.disclaimer}</p>
      )}

      {loading ? (
        <div className="loading-state" role="status">
          Finding stretches…
        </div>
      ) : stretches.length === 0 ? (
        <p className="empty-stretches">No stretches found for those spots yet.</p>
      ) : (
        <ul className="stretch-cards">
          {stretches.map((s) => (
            <StretchCard key={s.id} stretch={s} />
          ))}
        </ul>
      )}
    </div>
  )
}

function StretchCard({ stretch }: { stretch: Stretch }) {
  return (
    <li className="stretch-card">
      <h2>{stretch.name}</h2>
      <p className="why">{stretch.whyHelps}</p>
      <p className="duration">
        <strong>How long:</strong> {stretch.durationOrReps}
      </p>
      <ol className="steps">
        {stretch.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      <p className="cautions">
        <strong>Caution:</strong> {stretch.cautions}
      </p>
    </li>
  )
}
