import { useEffect, useState } from 'react'
import { useFirebase } from './adapters/firebase'
import { useUser } from './adapters/user'
import UpgradeModal from './components/UpgradeModal'
import { useEditor } from './context/EditorContext'
import EditorHeader from './EditorHeader'
import EditorUI from './EditorUI'
import Homepage from './Homepage'
import { resizeImageFile } from './utils'

function App() {
  const editor = useEditor()
  const [upgradeFlowScreen, setUpgradeFlowScreen] = useState(
    new URLSearchParams(window.location.search).get('upgrade')
  )
  const [showUpgrade, setShowUpgrade] = useState(
    upgradeFlowScreen !== null && typeof upgradeFlowScreen !== 'undefined'
  )

  const [showOriginal, setShowOriginal] = useState(false)
  const [showSeparator, setShowSeparator] = useState(false)

  const user = useUser()

  // Toggle the editor class on body when a file is selected
  useEffect(() => {
    if (editor.file) {
      document.body.classList.add('editor')
    } else {
      document.body.classList.remove('editor')
    }
  }, [editor.file])

  const firebase = useFirebase()

  if (!firebase) {
    return <></>
  }

  async function startWithDemoImage(img: string) {
    firebase?.logEvent('set_demo_file', { demo_image: img })
    const imgBlob = await fetch(`/exemples/${img}.jpeg`).then(r => r.blob())
    const f = new File([imgBlob], `${img}.jpeg`, { type: 'image/jpeg' })
    editor.setFile(f)
    editor.setOriginalFile(f)
  }

  async function onFileChange(f: File, hd: boolean) {
    if (!firebase) {
      throw new Error('No firebase')
    }
    const {
      file: resizedFile,
      resized,
      originalWidth,
      originalHeight,
    } = await resizeImageFile(f, hd ? 1920 : 720)
    firebase.logEvent('set_file', {
      resized,
      originalWidth,
      originalHeight,
    })
    editor.setFile(resizedFile)
  }

  function closeUpgradeFlow() {
    firebase?.logEvent('upgrade_close')
    window.history.pushState({}, document.title, '/')
    setUpgradeFlowScreen(null)
    setShowUpgrade(false)
  }

  return (
    <div
      className={[
        'app full-visible-h-safari min-h-full flex flex-col',
        editor.file ? 'absolute w-full h-full overflow-hidden' : '',
      ].join(' ')}
    >
      {editor.file ? (
        <>
          <EditorHeader
            useHD={editor.useHD}
            setUseHD={(value: boolean) => {
              firebase?.logEvent('upgrade_hd_toggle', { enabled: value })
              if (user?.isPro()) {
                if (editor.originalFile) {
                  // eslint-disable-next-line no-alert
                  const result = window.confirm(
                    'Current changes will be reset. Continue?'
                  )
                  if (result) {
                    onFileChange(editor.originalFile, value)
                  } else {
                    return
                  }
                }
                editor.setUseHD(value)
              } else {
                setShowUpgrade(true)
              }
            }}
            onBack={() => {
              firebase?.logEvent('start_new')
              editor.setOriginalFile(undefined)
              editor.setFile(undefined)
            }}
            setShowUpgrade={setShowUpgrade}
          />
          <EditorUI
            showOriginal={showOriginal}
            showSeparator={showSeparator}
            setShowOriginal={setShowOriginal}
            setShowSeparator={setShowSeparator}
          />
        </>
      ) : (
        <Homepage
          setOriginalFile={editor.setOriginalFile}
          onFileChange={f => onFileChange(f, editor.useHD)}
          startWithDemoImage={startWithDemoImage}
          setShowUpgrade={setShowUpgrade}
        />
      )}

      {showUpgrade && (
        <UpgradeModal
          onClose={() => closeUpgradeFlow()}
          screen={upgradeFlowScreen}
          isProUser={user?.isPro()}
        />
      )}
    </div>
  )
}

export default App
