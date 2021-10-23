import {
  ArrowLeftIcon,
  ChatAltIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'
import React, { useRef, useState } from 'react'
import { useClickAway, useWindowSize } from 'react-use'
import { useFirebase } from './adapters/firebase'
import Button from './components/Button'
import FileSelect from './components/FileSelect'
import Link from './components/Link'
import Logo from './components/Logo'
import MadeWidthBadge from './components/MadeWidthBadge'
import Modal from './components/Modal'
import Editor from './Editor'
import { resizeImageFile } from './utils'

const EXAMPLES = ['bag', 'table', 'paris', 'jacket', 'shoe']

function App() {
  const [file, setFile] = useState<File>()
  const [showAbout, setShowAbout] = useState(false)
  const modalRef = useRef(null)
  const firebase = useFirebase()
  const windowSize = useWindowSize()

  useClickAway(modalRef, () => {
    setShowAbout(false)
  })

  if (!firebase) {
    return <></>
  }

  async function startWithDemoImage(img: string) {
    firebase?.logEvent('set_demo_file', { demo_image: img })
    const imgBlob = await fetch(`/exemples/${img}.jpeg`).then(r => r.blob())
    setFile(new File([imgBlob], `${img}.jpeg`, { type: 'image/jpeg' }))
  }

  return (
    <div className="h-full full-visible-h-safari flex flex-col">
      <header className="relative z-10 flex px-5 py-3 justify-center sm:justify-between items-center sm:items-start">
        {file ? (
          <Button
            icon={<ArrowLeftIcon className="w-6 h-6" />}
            onClick={() => {
              firebase.logEvent('start_new')
              setFile(undefined)
            }}
          >
            {windowSize.width > 640 ? 'Start new' : undefined}
          </Button>
        ) : (
          <></>
        )}
        <Logo className={[file ? 'h-12' : 'w-72 h-16'].join(' ')} />
        <Button
          className="hidden sm:flex"
          icon={<InformationCircleIcon className="w-6 h-6" />}
          onClick={() => {
            firebase.logEvent('show_modal')
            setShowAbout(true)
          }}
        >
          About
        </Button>
      </header>

      <main
        className={[
          'h-full flex flex-1 flex-col sm:items-center sm:justify-center overflow-hidden',
          file ? 'items-center justify-center' : '', // center on mobile
          'pb-24',
        ].join(' ')}
      >
        {file ? (
          <Editor file={file} />
        ) : (
          <>
            <div
              className={[
                'flex flex-col sm:flex-row items-center',
                'space-y-5 sm:space-y-0 sm:space-x-6 p-5 pb-10',
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
                    src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=316605&theme=light&period=daily"
                    alt="CleanUp.Pictures - Remove objects and defects from your pictures - 100% free | Product Hunt"
                    // style={{ width: '230px', height: '54px' }}
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
                onSelection={async f => {
                  const {
                    file: resizedFile,
                    resized,
                    originalWidth,
                    originalHeight,
                  } = await resizeImageFile(f, 1024)
                  firebase.logEvent('set_file', {
                    resized,
                    originalWidth,
                    originalHeight,
                  })
                  setFile(resizedFile)
                }}
              />
            </div>

            {windowSize.height > 680 && (
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
                    windowSize.width > 640 ? undefined : 3
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

      {showAbout && (
        <Modal>
          <div ref={modalRef} className="text-xl space-y-5">
            <p>
              Some photobomber ruined your selfie? There’s a ketchup stain on
              your shirt? You want to replace some text or graphic?
            </p>

            <p>
              <Link href="https://cleanup.pictures">CleanUp.pictures</Link> is a
              free web application that lets you cleanup your photos with a
              quick & simple interface.
            </p>

            <p>
              It uses <Link href="https://arxiv.org/abs/2109.07161">LaMa</Link>,
              an open-source model from Samsung’s AI Lab to automatically &
              acurately redraw the areas that you delete.
            </p>

            <p>
              <Link href="https://cleanup.pictures">CleanUp.pictures</Link> has
              been built by the engineering team at{' '}
              <Link href="https://clipdrop.co">ClipDrop</Link> and it&apos;s{' '}
              <Link href="https://github.com/initml/cleanup.pictures">
                open-source
              </Link>{' '}
              under the Apache License 2.0.
            </p>

            <p>
              If you have any question please{' '}
              <Link href="mailto:contact@clipdrop.co">contact us!</Link>
            </p>
          </div>
        </Modal>
      )}

      <footer
        className={[
          'absolute bottom-0 pl-7 pb-5 px-5 w-full flex items-center justify-between',
          'pointer-events-none',
          // Hide footer when editing on mobile
          file ? 'hidden lg:flex' : '',
        ].join(' ')}
      >
        <div className="flex space-x-8 items-center">
          <a
            className="pointer-events-auto"
            href="https://clipdrop.co?utm_source=cleanup_pictures"
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              firebase.logEvent('click_clipdrop_badge')
            }}
          >
            <MadeWidthBadge />
          </a>
        </div>

        <Button
          className="pointer-events-auto"
          icon={<ChatAltIcon className="w-6 h-6" />}
          onClick={() =>
            window.open('mailto:contact@cleanup.pictures', '_blank')
          }
        >
          Report issue
        </Button>
      </footer>
    </div>
  )
}

export default App
