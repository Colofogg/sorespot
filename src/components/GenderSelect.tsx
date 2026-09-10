import type { Gender } from '../types'
import { MiniFigure } from './BodySilhouette'

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
          <MiniFigure gender="male" />
          <span className="gender-label">Male</span>
        </button>

        <button
          type="button"
          className="gender-card"
          onClick={() => onSelect('female')}
          aria-label="Female body"
        >
          <MiniFigure gender="female" />
          <span className="gender-label">Female</span>
        </button>
      </div>
    </div>
  )
}
