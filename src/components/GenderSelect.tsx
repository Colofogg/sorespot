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
            <defs>
              <linearGradient id="gm" x1="20%" y1="0%" x2="90%" y2="100%">
                <stop offset="0%" stopColor="#cfe4de" />
                <stop offset="50%" stopColor="#2d5a5a" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1a3a3a" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            <ellipse cx="60" cy="28" rx="17" ry="19" fill="url(#gm)" />
            <path
              fill="url(#gm)"
              d="M44 48 Q60 52 76 48 L86 92 Q90 108 86 128 L80 198 Q76 208 68 208 L52 208 Q44 208 40 198 L34 128 Q30 108 34 92 Z"
            />
            <path fill="url(#gm)" d="M44 55 L24 118 Q20 128 26 130 L40 88 Z" />
            <path fill="url(#gm)" d="M76 55 L96 118 Q100 128 94 130 L80 88 Z" />
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
            <defs>
              <linearGradient id="gf" x1="20%" y1="0%" x2="90%" y2="100%">
                <stop offset="0%" stopColor="#d8ebe4" />
                <stop offset="50%" stopColor="#2d5a5a" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#1a3a3a" stopOpacity="0.82" />
              </linearGradient>
            </defs>
            {/* Athletic female: natural waist-to-hip, not heavy */}
            <ellipse cx="60" cy="26" rx="15" ry="17" fill="url(#gf)" />
            <path
              fill="url(#gf)"
              d="M48 44 Q60 48 72 44 L78 88 Q84 108 82 130 L76 198 Q72 208 64 208 L56 208 Q48 208 44 198 L38 130 Q36 108 42 88 Z"
            />
            <path fill="url(#gf)" d="M48 52 L32 108 Q28 116 34 117 L46 78 Z" />
            <path fill="url(#gf)" d="M72 52 L88 108 Q92 116 86 117 L74 78 Z" />
          </svg>
          <span className="gender-label">Female</span>
        </button>
      </div>
    </div>
  )
}
