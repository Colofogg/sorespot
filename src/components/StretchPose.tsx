/** Simple schematic pose illustrations for stretches without a video. */

const poses: Record<string, { label: string; paths: string[] }> = {
  'illust/side-lying-quad': {
    label: 'Side-lying quad',
    paths: [
      'M70 40 h60 v20 h-20 v80 h-20 v-80 h-20 z',
      'M90 140 c0 40 35 55 55 40',
      'M40 100 h50 v14 h-50 z',
    ],
  },
  'illust/seated-twist': {
    label: 'Seated twist',
    paths: [
      'M85 30 h30 v40 h-30 z',
      'M70 70 h60 v50 h-60 z',
      'M55 120 h90 v20 h-90 z',
      'M40 85 h30 v12 h-30 z',
      'M130 75 h30 v12 h-30 z',
    ],
  },
  'illust/thread-the-needle': {
    label: 'Thread the needle',
    paths: [
      'M50 120 h100 v16 h-100 z',
      'M60 80 h20 v40 h-20 z',
      'M120 80 h20 v40 h-20 z',
      'M40 95 h90 v12 h-90 z',
      'M130 40 h16 v55 h-16 z',
    ],
  },
  'illust/wrist-circles': {
    label: 'Wrist circles',
    paths: [
      'M90 40 h20 v70 h-20 z',
      'M70 110 h60 v18 h-60 z',
      'M75 135 h16 v30 h-16 z',
      'M95 135 h16 v32 h-16 z',
      'M115 135 h16 v28 h-16 z',
      'M55 100 a25 25 0 1 1 50 0',
    ],
  },
  'illust/finger-spread-open': {
    label: 'Finger spread',
    paths: [
      'M80 70 h40 v50 h-40 z',
      'M70 40 h12 v35 h-12 z',
      'M88 30 h12 v40 h-12 z',
      'M106 28 h12 v42 h-12 z',
      'M124 38 h12 v32 h-12 z',
      'M60 85 h18 v14 h-18 z',
    ],
  },
  'illust/standing-side-reach': {
    label: 'Standing side reach',
    paths: [
      'M90 20 h20 v30 h-20 z',
      'M80 50 h40 v70 h-40 z',
      'M75 120 h20 v70 h-20 z',
      'M105 120 h20 v70 h-20 z',
      'M55 55 h30 v12 h-30 z',
      'M120 30 h14 v50 h-14 z',
    ],
  },
  'illust/prone-press-up': {
    label: 'Prone press-up',
    paths: [
      'M40 120 h120 v16 h-120 z',
      'M50 90 h100 v30 h-100 z',
      'M55 70 h20 v25 h-20 z',
      'M125 70 h20 v25 h-20 z',
      'M70 50 h60 v25 h-60 z',
    ],
  },
  'illust/ankle-dorsiflex-wall': {
    label: 'Ankle at wall',
    paths: [
      'M40 30 h16 v140 h-16 z',
      'M70 50 h30 v80 h-30 z',
      'M110 70 h30 v60 h-30 z',
      'M105 130 h50 v18 h-50 z',
      'M70 130 h35 v16 h-35 z',
    ],
  },
}

export function StretchPose({ imageUrl }: { imageUrl: string }) {
  const pose = poses[imageUrl] ?? {
    label: 'Stretch pose',
    paths: ['M70 40 h60 v30 h-60 z', 'M80 70 h40 v80 h-40 z', 'M75 150 h20 v40 h-20 z', 'M105 150 h20 v40 h-20 z'],
  }

  return (
    <div className="pose-illust" role="img" aria-label={`${pose.label} illustration`}>
      <svg viewBox="0 0 200 200" className="pose-svg" aria-hidden="true">
        <rect x="8" y="8" width="184" height="184" rx="16" className="pose-bg" />
        {pose.paths.map((d, i) => (
          <path key={i} d={d} className="pose-figure" />
        ))}
      </svg>
      <span className="pose-caption">Pose guide</span>
    </div>
  )
}
