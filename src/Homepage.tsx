import { useWindowSize } from 'react-use'
import { useUser } from './adapters/user'
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
}

export default function Homepage({
  setOriginalFile,
  onFileChange,
  startWithDemoImage,
  setShowUpgrade,
}: HomepageProps) {
  const windowSize = useWindowSize()
  const user = useUser()
  return (
    <>
      <header className="relative z-10 flex px-5 pt-3 justify-between items-center sm:items-start">
        <div>
          {user?.isPro() ? (
            <LogoPro className="w-60 h-14" />
          ) : (
            <Logo className="w-60 h-14" />
          )}
        </div>
        <Menu onUpgrade={() => setShowUpgrade(true)} />
      </header>

      <main
        className={[
          'flex flex-1 flex-col sm:items-center sm:justify-center overflow-hidden',
          // file ? 'items-center justify-center' : '', // center on mobile
          'mt-10',
          'items-center justify-center',
          'pb-20',
        ].join(' ')}
      >
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

        <div className="h-20 sm:h-52 px-4 w-full" style={{ maxWidth: '800px' }}>
          <FileSelect
            onSelection={async f => {
              setOriginalFile(f)
              onFileChange(f)
            }}
          />
        </div>

        <div
          className={[
            'flex flex-col sm:flex-row items-center justify-center cursor-pointer',
            'pt-4 sm:pt-10',
          ].join(' ')}
        >
          <span className="text-gray-500">Or try with an example</span>
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
                    className="rounded-md hover:opacity-75 w-20 h-20 object-cover"
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
