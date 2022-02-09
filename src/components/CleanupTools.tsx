import { useWindowSize } from 'react-use'
import { Editor } from '../context/EditorContext'
import Button from './Button'
import Slider from './Slider'

interface CleanupToolsProps {
  editor: Editor
  brushSize: number
  setBrushSize: (size: number) => void
  isLoading: boolean
  onCleanupClick: () => void
}

export default function CleanupTools({
  editor,
  brushSize,
  setBrushSize,
  isLoading,
  onCleanupClick,
}: CleanupToolsProps) {
  const { undo, edits } = editor
  const currentEdit = edits[edits.length - 1]
  const canUndo = edits.length > 1 || currentEdit.lines.length > 1
  const windowSize = useWindowSize()
  const isSmallScreen = windowSize.width < 640
  return (
    <div
      className={[
        'flex sm:items-center space-x-4 max-w-3xl',
        'bg-gray-200 bg-opacity-50 backdrop-blur-xl rounded-2xl',
        'p-2',
        'justify-evenly',
      ].join(' ')}
    >
      {canUndo ? (
        <Button
          icon={
            <svg
              width="19"
              height="9"
              viewBox="0 0 19 9"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
            >
              <path
                d="M2 1C2 0.447715 1.55228 0 1 0C0.447715 0 0 0.447715 0 1H2ZM1 8H0V9H1V8ZM8 9C8.55228 9 9 8.55229 9 8C9 7.44771 8.55228 7 8 7V9ZM16.5963 7.42809C16.8327 7.92721 17.429 8.14016 17.9281 7.90374C18.4272 7.66731 18.6402 7.07103 18.4037 6.57191L16.5963 7.42809ZM16.9468 5.83205L17.8505 5.40396L16.9468 5.83205ZM0 1V8H2V1H0ZM1 9H8V7H1V9ZM1.66896 8.74329L6.66896 4.24329L5.33104 2.75671L0.331035 7.25671L1.66896 8.74329ZM16.043 6.26014L16.5963 7.42809L18.4037 6.57191L17.8505 5.40396L16.043 6.26014ZM6.65079 4.25926C9.67554 1.66661 14.3376 2.65979 16.043 6.26014L17.8505 5.40396C15.5805 0.61182 9.37523 -0.710131 5.34921 2.74074L6.65079 4.25926Z"
                fill="currentColor"
              />
            </svg>
          }
          onClick={() => {
            undo(isSmallScreen)
          }}
        />
      ) : (
        <></>
      )}
      <div
        className={[
          'py-2',
          canUndo ? 'ml-0' : 'pl-4',
          // Add padding to the right if there is no "Clean HD" button
          editor.useHD ? '' : 'pr-4',
        ].join(' ')}
      >
        <Slider
          label={<span>Brush</span>}
          min={10}
          max={200}
          value={brushSize}
          onChange={setBrushSize}
        />
      </div>
      {editor.useHD || isSmallScreen ? (
        <Button
          primary
          disabled={isLoading || currentEdit.lines.length <= 1}
          onClick={onCleanupClick}
        >
          Clean{editor.useHD ? ' HD' : ''}
        </Button>
      ) : (
        <></>
      )}
    </div>
  )
}
