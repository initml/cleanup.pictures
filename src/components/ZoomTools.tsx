import Button from './Button'
import Slider from './Slider'

interface ZoomToolsProps {
  zoom: number
  setZoom: (size: number) => void
  onResetClick: () => void
}

export default function ZoomTools({
  zoom,
  setZoom,
  onResetClick,
}: ZoomToolsProps) {
  return (
    <div
      className={[
        'flex items-center space-x-8 max-w-3xl',
        'bg-gray-200 bg-opacity-50 backdrop-blur-xl px-4 rounded-2xl',
        'p-2 sm:px-6 sm:py-2',
        'justify-evenly',
      ].join(' ')}
    >
      <div className="py-2">
        <Slider
          label={<span>Zoom</span>}
          min={100}
          max={500}
          value={zoom * 100}
          onChange={v => setZoom(v / 100)}
        />
      </div>
      <Button primary disabled={zoom === 1} onClick={onResetClick}>
        Reset zoom
      </Button>
    </div>
  )
}
