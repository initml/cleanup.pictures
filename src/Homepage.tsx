import { XIcon } from '@heroicons/react/outline'
import { useState } from 'react'
import { useWindowSize } from 'react-use'
import { useUser } from './adapters/user'
import Button from './components/Button'
import FileSelect from './components/FileSelect'
import Logo from './components/Logo'
import LogoPro from './components/LogoPro'
import Menu from './components/Menu'

const EXAMPLES = ['bag', 'table', 'paris', 'jacket', 'shoe']

interface HomepageProps {
  setOriginalFile: (f: File) => void
  onFileChange: (f: File) => void
  startWithDemoImage: (img: string) => void
  setShowUpgrade: (showUpgrade: boolean) => void
  setShowSignin: (showSignin: boolean) => void
}

export default function Homepage({
  setOriginalFile,
  onFileChange,
  startWithDemoImage,
  setShowUpgrade,
  setShowSignin,
}: HomepageProps) {
  const windowSize = useWindowSize()
  const user = useUser()
  const [showBanner, setShowBanner] = useState(true)
  return (
    <>
      {showBanner && !user?.isPro && (
        <div className="hidden sm:block bg-black text-white p-5 text-center relative">
          Looking for automatic background removal?{' '}
          <a
            className="underline"
            href="https://clipdrop.co?utm_campaign=cleanup_pictures"
            target="_blank"
            rel="noreferrer dofollow"
          >
            Try ClipDrop!
          </a>
          <div className="absolute right-1 top-0 h-full flex items-center">
            <Button
              icon={<XIcon className="w-6 h-6" />}
              onClick={() => setShowBanner(false)}
            />
          </div>
        </div>
      )}
      <header
        className={[
          'fixed w-full bg-white bg-opacity-70',
          // 'border-b-2 border-black',
          'filter backdrop-blur-3xl z-10 flex px-5 pt-3 pb-3',
          'justify-between items-center sm:items-start',
        ].join(' ')}
      >
        <div>
          <a href="/#" aria-label="Cleanup Logo">
            {user?.isPro() ? (
              <LogoPro className="w-60 h-14" />
            ) : (
              <Logo className="w-60 h-14" />
            )}
          </a>
        </div>
        <div className="flex items-center space-x-8">
          <a
            className="hidden sm:inline-block hover:underline"
            href="#usecases"
          >
            Use cases
          </a>
          <a className="hidden sm:inline-block hover:underline" href="#pricing">
            Pricing
          </a>
          <a className="hidden sm:inline-block hover:underline" href="#faq">
            FAQ
          </a>
          <a className="hidden sm:inline-block hover:underline" href="#api">
            API
          </a>
          <Menu
            onUpgrade={() => setShowUpgrade(true)}
            onSignin={() => setShowSignin(true)}
          />
        </div>
      </header>

      <main
        className={[
          'flex flex-1 flex-col sm:items-center sm:justify-center overflow-hidden',
          // file ? 'items-center justify-center' : '', // center on mobile
          'sm:mt-10',
          'pt-24',
          'items-center justify-center',
          'pb-10',
        ].join(' ')}
      >
        <div
          className={[
            'flex flex-col sm:flex-row items-center',
            'space-y-5 sm:space-y-0 sm:space-x-6 p-5 pt-0 pb-10',
          ].join(' ')}
        >
          <div className="sm:max-w-lg lg:max-w-2xl flex flex-col items-center sm:items-start p-0 m-0 space-y-5">
            <h1 className="text-center font-bold sm:text-left text-xl sm:text-3xl lg:text-5xl">
              Remove any unwanted{' '}
              <span className="bg-primary font-varent rounded-l-full rounded-r-full px-2">
                object
              </span>
              ,{' '}
              <span className="bg-primary font-varent rounded-l-full rounded-r-full px-2">
                defect
              </span>
              ,{' '}
              <span className="bg-primary font-varent rounded-l-full rounded-r-full px-2">
                people
              </span>{' '}
              or{' '}
              <span className="bg-primary font-varent rounded-l-full rounded-r-full px-2">
                text
              </span>{' '}
              from your pictures{' '}
              <span className="underline font-varent">in seconds</span>
            </h1>
            {/* <span className="text-gray-500">
        Stunning quality for free on images up to 1024px
      </span> */}
          </div>

          <div className="w-60 sm:w-80 flex items-center rounded-xl overflow-hidden">
            <video
              className="w-60 h-48 sm:w-80 sm:h-64 bg-gray-100 rounded-xl overflow-hidden"
              style={{ transform: 'scale(1.03, 1.03)' }}
              autoPlay
              muted
              loop
              playsInline
            >
              <source
                src="https://storage.googleapis.com/cleanup-pictures.appspot.com/demo_small.mp4"
                type="video/mp4"
              />
              <track kind="captions" />
            </video>
          </div>
        </div>

        <div
          className="h-20 sm:h-52 px-4 w-full my-8 sm:my-0"
          style={{ maxWidth: '800px' }}
        >
          <FileSelect
            onSelection={async f => {
              setOriginalFile(f)
              onFileChange(f)
            }}
          />
        </div>

        <div
          className={[
            'flex flex-col items-center justify-center cursor-pointer',
            'pt-4 sm:pt-10',
          ].join(' ')}
        >
          <span className="mb-4">↓ Try with an example</span>
          <div className="flex space-x-2 sm:space-x-4 px-4">
            {EXAMPLES.slice(0, windowSize.width > 650 ? undefined : 3).map(
              image => (
                <div
                  key={image}
                  onClick={() => startWithDemoImage(image)}
                  role="button"
                  onKeyDown={() => startWithDemoImage(image)}
                  tabIndex={-1}
                >
                  <img
                    className="rounded-md hover:opacity-75 w-24 h-24 object-cover"
                    width="96"
                    height="96"
                    src={`exemples/${image}.thumb.jpeg`}
                    alt={image}
                  />
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </>
  )
}
