import { ArrowsExpandIcon } from '@heroicons/react/outline'
import Button from './Button'
import Slider from './Slider'

interface ZoomToolsProps {
  zoom: number
  minZoom: number
  setZoom: (size: number) => void
  onResetClick: () => void
}

export default function ZoomTools({
  zoom,
  minZoom,
  setZoom,
  onResetClick,
}: ZoomToolsProps) {
  return (
    <div
      className={[
        'flex items-center space-x-4 max-w-3xl',
        'bg-gray-200 bg-opacity-50 backdrop-blur-xl rounded-2xl',
        'p-2',
        'justify-evenly',
      ].join(' ')}
    >
      <div className="py-2 pl-4">
        <Slider
          label={<span>Zoom</span>}
          min={minZoom * 100}
          max={500}
          value={zoom * 100}
          onChange={v => setZoom(v / 100)}
        />
      </div>
      <Button
        primary
        icon={<ArrowsExpandIcon className="w-6 h-6" />}
        disabled={zoom === 1}
        onClick={onResetClick}
      >
        Reset
      </Button>
    </div>
  )
}
