import React, { useEffect, useState } from 'react'
import { useFirebase } from './adapters/firebase'
import { useUser } from './adapters/user'
import UpgradeModal from './components/UpgradeModal'
import Editor from './Editor'
import EditorHeader from './EditorHeader'
import Homepage from './Homepage'
import { resizeImageFile } from './utils'

function App() {
  const [file, setFile] = useState<File>()
  const [originalFile, setOriginalFile] = useState<File>()
  const [upgradeFlowScreen, setUpgradeFlowScreen] = useState(
    new URLSearchParams(window.location.search).get('upgrade')
  )
  const [showUpgrade, setShowUpgrade] = useState(
    upgradeFlowScreen !== null && typeof upgradeFlowScreen !== 'undefined'
  )
  const user = useUser()
  const [useHD, setUseHD] = useState(user?.isPro() || false)

  useEffect(() => {
    if (user?.isPro()) {
      setUseHD(true)
      document.body.classList.add('pro')
    } else {
      setUseHD(false)
      document.body.classList.remove('pro')
    }
  }, [user])

  // Toggle the editor class on body when a file is selected
  useEffect(() => {
    if (file) {
      document.body.classList.add('editor')
    } else {
      document.body.classList.remove('editor')
    }
  }, [file])

  const firebase = useFirebase()

  if (!firebase) {
    return <></>
  }

  async function startWithDemoImage(img: string) {
    firebase?.logEvent('set_demo_file', { demo_image: img })
    const imgBlob = await fetch(`/exemples/${img}.jpeg`).then(r => r.blob())
    setFile(new File([imgBlob], `${img}.jpeg`, { type: 'image/jpeg' }))
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
    setFile(resizedFile)
  }

  function closeUpgradeFlow() {
    firebase?.logEvent('upgrade_close')
    window.history.pushState({}, document.title, '/')
    setUpgradeFlowScreen(null)
    setShowUpgrade(false)
  }

  return (
    <div className="app full-visible-h-safari flex flex-col">
      {file ? (
        <>
          <EditorHeader
            useHD={useHD}
            setUseHD={(value: boolean) => {
              firebase?.logEvent('upgrade_hd_toggle', { enabled: value })
              if (user?.isPro()) {
                if (originalFile) {
                  // eslint-disable-next-line no-alert
                  const result = window.confirm(
                    'Current changes will be reset. Continue?'
                  )
                  if (result) {
                    onFileChange(originalFile, value)
                  }
                }
                setUseHD(value)
              } else {
                setShowUpgrade(true)
              }
            }}
            onBack={() => {
              firebase?.logEvent('start_new')
              setOriginalFile(undefined)
              setFile(undefined)
            }}
            setShowUpgrade={setShowUpgrade}
          />
          <main
            className={[
              'flex flex-1 flex-col sm:items-center sm:justify-center overflow-hidden',
              // file ? 'items-center justify-center' : '', // center on mobile
              'mt-10',
              'items-center justify-center',
              'pb-20',
            ].join(' ')}
          >
            <Editor file={file} original={originalFile || file} hd={useHD} />
          </main>
        </>
      ) : (
        <Homepage
          setOriginalFile={setOriginalFile}
          onFileChange={f => onFileChange(f, useHD)}
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
