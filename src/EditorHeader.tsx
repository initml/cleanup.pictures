import { ArrowLeftIcon, DownloadIcon, EyeIcon } from '@heroicons/react/outline'
import { useWindowSize } from 'react-use'
import Button from './components/Button'
import Menu from './components/Menu'
import Toggle from './components/Toggle'
import { useEditor } from './context/EditorContext'

interface EditorHeaderProps {
  onBack: () => void
  useHD: boolean
  setUseHD: (useHD: boolean) => void
  showOriginal: boolean
  setShowOriginal: (showOriginal: boolean) => void
  setShowUpgrade: (showUpgrade: boolean) => void
  setShowSignin: (showSignin: boolean) => void
}

export default function EditorHeader({
  onBack,
  useHD,
  setUseHD,
  showOriginal,
  setShowOriginal,
  setShowUpgrade,
  setShowSignin,
}: EditorHeaderProps) {
  const windowSize = useWindowSize()
  const editor = useEditor()

  return (
    <header
      className={[
        'absolute z-10 flex p-2 w-full',
        'bg-white bg-opacity-50 backdrop-blur-xl',
        'justify-between items-center sm:items-start',
      ].join(' ')}
    >
      <Button icon={<ArrowLeftIcon className="w-6 h-6" />} onClick={onBack}>
        {windowSize.width > 640 ? 'Start new' : undefined}
      </Button>

      <div className="flex space-x-4">
        <div className="mr-4 flex items-center">
          <Toggle
            label={<EyeIcon className="w-6 h-6" />}
            enabled={showOriginal}
            setEnabled={setShowOriginal}
          />
        </div>
        <div className="mr-4 pr-4 flex items-center">
          <Toggle label="HD" enabled={useHD} setEnabled={setUseHD} />
        </div>
        {editor.edits[editor.edits.length - 1].render ? (
          <>
            <Button
              primary
              icon={<DownloadIcon className="w-6 h-6" />}
              onClick={editor.download}
            >
              {windowSize.width > 640 ? 'Download' : undefined}
            </Button>
          </>
        ) : (
          <></>
        )}
        <Menu
          onUpgrade={() => setShowUpgrade(true)}
          onSignin={() => setShowSignin(true)}
        />
      </div>
    </header>
  )
}
