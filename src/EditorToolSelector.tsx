import Button from './components/Button'
import { ZoomIcon, ErasorIcon } from './components/Icons'
import Tooltip from './components/Tooltip'

export type EditorTool = 'clean' | 'zoom' | 'original'

interface EditorToolSelectorProps {
  onChange: (tool: EditorTool) => void
  tool: EditorTool
}

function SelectorButton({
  active,
  icon,
  onClick,
  tip,
}: {
  active: boolean
  icon: JSX.Element
  onClick: () => void
  tip?: string
}) {
  return (
    <div
      className={[active ? 'pointer-events-none' : '', 'has-tooltip'].join(' ')}
    >
      <Button primary={active} icon={icon} onClick={onClick} />
      {tip && <Tooltip>{tip}</Tooltip>}
    </div>
  )
}

export default function EditorToolSelector({
  tool,
  onChange,
}: EditorToolSelectorProps) {
  return (
    <div
      className={[
        'flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:mx-4 sm:space-x-2',
        'bg-white bg-opacity-50 backdrop-blur-xl rounded-2xl',
        'p-2 sm:py-2 pointer-events-auto',
      ].join(' ')}
    >
      <SelectorButton
        icon={<ErasorIcon />}
        active={tool === 'clean'}
        onClick={() => onChange('clean')}
      />
      <SelectorButton
        icon={<ZoomIcon />}
        active={tool === 'zoom'}
        onClick={() => onChange('zoom')}
        tip="Hold Spacebar"
      />
    </div>
  )
}
