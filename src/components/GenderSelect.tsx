import type { Gender } from '../types'

interface Props {
  onSelect: (gender: Gender) => void
}

export function GenderSelect({ onSelect }: Props) {
  return (
    <div className="screen gender-screen">
      <header className="screen-header">
        <h1 className="app-title">SoreSpot</h1>
        <p className="prompt">Which body looks most like yours?</p>
        <p className="micro">You can change this later.</p>
      </header>

      <div className="gender-cards" role="list">
        <button
          type="button"
          className="gender-card"
          onClick={() => onSelect('male')}
          aria-label="Male body"
        >
          <svg className="gender-preview" viewBox="0 0 120 220" aria-hidden="true">
            <ellipse cx="60" cy="28" rx="18" ry="20" className="sil-fill" />
            <path
              className="sil-fill"
              d="M42 48 Q60 52 78 48 L88 95 Q92 110 88 130 L82 200 Q78 210 70 210 L50 210 Q42 210 38 200 L32 130 Q28 110 32 95 Z"
            />
            <path className="sil-fill" d="M42 55 L22 120 Q18 130 24 132 L38 90 Z" />
            <path className="sil-fill" d="M78 55 L98 120 Q102 130 96 132 L82 90 Z" />
          </svg>
          <span className="gender-label">Male</span>
        </button>

        <button
          type="button"
          className="gender-card"
          onClick={() => onSelect('female')}
          aria-label="Female body"
        >
          <svg className="gender-preview" viewBox="0 0 120 220" aria-hidden="true">
            <ellipse cx="60" cy="26" rx="16" ry="18" className="sil-fill" />
            <path
              className="sil-fill"
              d="M46 44 Q60 48 74 44 L82 90 Q95 115 90 145 L78 200 Q74 210 66 210 L54 210 Q46 210 42 200 L30 145 Q25 115 38 90 Z"
            />
            <path className="sil-fill" d="M46 52 L28 105 Q24 115 30 116 L44 78 Z" />
            <path className="sil-fill" d="M74 52 L92 105 Q96 115 90 116 L76 78 Z" />
          </svg>
          <span className="gender-label">Female</span>
        </button>
      </div>
    </div>
  )
}
