import { ArrowLeftIcon } from '@heroicons/react/outline'
import React, { useEffect, useState } from 'react'
import { useWindowSize } from 'react-use'
import { useFirebase } from './adapters/firebase'
import { useUser } from './adapters/user'
import AboutModal from './components/AboutModal'
import Button from './components/Button'
import FileSelect from './components/FileSelect'
import Logo from './components/Logo'
import LogoPro from './components/LogoPro'
import Menu from './components/Menu'
import Toggle from './components/Toggle'
import TryClipDrop from './components/TryClipDrop'
import UpgradeModal from './components/UpgradeModal'
import Editor from './Editor'
import { resizeImageFile } from './utils'

const EXAMPLES = ['bag', 'table', 'paris', 'jacket', 'shoe']

function App() {
  const [file, setFile] = useState<File>()
  const [originalFile, setOriginalFile] = useState<File>()
  const [showAbout, setShowAbout] = useState(false)
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
    } else {
      setUseHD(false)
    }
  }, [user])

  const firebase = useFirebase()
  const windowSize = useWindowSize()

  if (!firebase) {
    return <></>
  }

  async function startWithDemoImage(img: string) {
    firebase?.logEvent('set_demo_file', { demo_image: img })
    const imgBlob = await fetch(`/exemples/${img}.jpeg`).then(r => r.blob())
    setFile(new File([imgBlob], `${img}.jpeg`, { type: 'image/jpeg' }))
  }

  function getClipDropURL() {
    const userAgent = navigator.userAgent || navigator.vendor
    // If IOS return the iOS App Store
    const isIOS = /ipad|iphone|ipod/i.test(userAgent.toLowerCase())
    if (isIOS) {
      return 'https://apps.apple.com/us/app/id1512594879'
    }
    // If Android return the play store URL
    const isAndroid = /android/i.test(userAgent.toLowerCase())
    if (isAndroid) {
      return 'https://play.google.com/store/apps/details?id=app.arcopypaste'
    }
    // Otherwise return the main website
    return 'https://clipdrop.co?utm_source=cleanup_pictures'
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
    } = await resizeImageFile(f, hd ? 2000 : 720)
    firebase.logEvent('set_file', {
      resized,
      originalWidth,
      originalHeight,
    })
    setFile(resizedFile)
  }

  function closeUpgradeFlow() {
    window.history.pushState({}, document.title, '/')
    setUpgradeFlowScreen(null)
    setShowUpgrade(false)
  }

  function getLogo() {
    if (user?.isPro()) {
      return <LogoPro className={[file ? 'h-12' : 'w-72 h-16'].join(' ')} />
    }
    return <Logo className={[file ? 'h-12' : 'w-72 h-16'].join(' ')} />
  }

  return (
    <div className="h-full full-visible-h-safari flex flex-col">
      <header className="relative z-10 flex sm:px-5 pt-3 justify-between items-center sm:items-start">
        {file ? (
          <Button
            icon={<ArrowLeftIcon className="w-6 h-6" />}
            onClick={() => {
              firebase.logEvent('start_new')
              setOriginalFile(undefined)
              setFile(undefined)
            }}
          >
            {windowSize.width > 640 ? 'Start new' : undefined}
          </Button>
        ) : (
          <></>
        )}
        {windowSize.width > 640 || !file ? getLogo() : <></>}

        <div className="flex space-x-4">
          {(windowSize.width > 640 || file) && (
            <Toggle
              label="HD"
              enabled={useHD}
              setEnabled={(value: boolean) => {
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
            />
          )}
          {/* {(windowSize.width > 640 || file) &&
            user?.user?.entitlement !== 'pro' && (
              <Button
                primary
                className="flex"
                // icon={<InformationCircleIcon className="w-6 h-6" />}
                onClick={() => {
                  firebase.logEvent('show_upgrade')
                  setShowUpgrade(true)
                }}
              >
                Try Cleanup Pro
              </Button>
            )} */}
          <Menu onAbout={() => setShowAbout(true)} />
        </div>
      </header>

      <main
        className={[
          'h-full flex flex-1 flex-col sm:items-center sm:justify-center overflow-hidden',
          // file ? 'items-center justify-center' : '', // center on mobile
          'items-center justify-center',
          'pb-20',
        ].join(' ')}
      >
        {file ? (
          <Editor file={file} />
        ) : (
          <>
            <div
              className={[
                'flex flex-col sm:flex-row items-center',
                'space-y-5 sm:space-y-0 sm:space-x-6 p-5 pt-0 pb-10',
              ].join(' ')}
            >
              <div className="max-w-lg flex flex-col items-center sm:items-start p-0 m-0 space-y-5">
                <h1 className="text-center sm:text-left text-xl sm:text-3xl">
                  Remove any object, people, text or defects from your pictures.
                </h1>
                {/* <span className="text-gray-500">
                  Stunning quality for free on images up to 1024px
                </span> */}

                <a
                  className="hidden sm:block pointer-events-auto"
                  href="https://www.producthunt.com/posts/cleanup-pictures?utm_source=badge-top-post-badge&utm_medium=badge&utm_souce=badge-cleanup-pictures"
                >
                  <img
                    src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=316605&theme=light&period=weekly"
                    alt="CleanUp.pictures - Remove objects and defects from your pictures for free | Product Hunt"
                    width="210"
                    height="54"
                  />
                </a>
              </div>

              <div className="h-40 w-56 flex items-center rounded-md overflow-hidden">
                <video
                  // className="h-40 w-56 rounded-md object-cover"
                  style={{ transform: 'scale(1.01, 1.01)' }}
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src="demo_small.mp4" type="video/mp4" />
                  <track kind="captions" />
                </video>
              </div>
            </div>

            <div
              className="h-20 sm:h-52 px-4 w-full"
              style={{ maxWidth: '800px' }}
            >
              <FileSelect
                onSelection={f => {
                  setOriginalFile(f)
                  onFileChange(f, useHD)
                }}
              />
            </div>

            {(windowSize.width > 1024 || windowSize.height > 650) && (
              <div
                className={[
                  'flex flex-col sm:flex-row items-center justify-center cursor-pointer',
                  'pt-4 sm:pt-10',
                ].join(' ')}
              >
                <span className="text-gray-500">Or try with an example</span>
                <div className="flex space-x-2 sm:space-x-4 px-4">
                  {EXAMPLES.slice(
                    0,
                    windowSize.width > 650 ? undefined : 3
                  ).map(image => (
                    <div
                      key={image}
                      onClick={() => startWithDemoImage(image)}
                      role="button"
                      onKeyDown={() => startWithDemoImage(image)}
                      tabIndex={-1}
                    >
                      <img
                        className="rounded-md hover:opacity-75 w-20 h-20 object-cover"
                        src={`exemples/${image}.thumb.jpeg`}
                        alt={image}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {showUpgrade && (
        <UpgradeModal
          onClose={() => closeUpgradeFlow()}
          screen={upgradeFlowScreen}
          isProUser={user?.isPro()}
        />
      )}

      {!showAbout && !showUpgrade && (
        <footer
          className={[
            'absolute bottom-0 pb-5 px-5 w-full flex items-center justify-between',
            'pointer-events-none',
            // Hide footer when editing on mobile
            file ? 'hidden lg:flex' : '',
          ].join(' ')}
        >
          <div className="flex space-x-8 items-center">
            <a
              className="pointer-events-auto"
              href={getClipDropURL()}
              onClick={() => {
                firebase.logEvent('click_clipdrop_badge')
              }}
            >
              <TryClipDrop />
            </a>
          </div>
        </footer>
      )}
    </div>
  )
}

export default App
