import { useState } from 'react'

export type PreloaderProps = {
  numCircles?: number
  circleSize?: number
  color?: string
}

export default function Loader(props: PreloaderProps) {
  const { numCircles, circleSize, color } = props
  const size = circleSize || 8

  const crcls = []
  for (let i = 0; i < (numCircles || 3); i += 1) {
    crcls.push(0)
  }
  const [circles] = useState(crcls)
  return (
    <div
      className={[
        'flex flex-row space-x-2',
        color || 'text-gray-400 dark:text-gray-500',
      ].join(' ')}
    >
      {circles.map((c, i) => {
        /* eslint-disable react/no-array-index-key */
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ animation: `wait 0.5s linear ${i / 16}s infinite` }}
            className="fill-current"
          >
            <circle r={size / 2} cx={size / 2} cy={size / 2} />
          </svg>
        )
        /* eslint-enable react/no-array-index-key */
      })}
    </div>
  )
}
