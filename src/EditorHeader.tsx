import { Listbox, Transition } from '@headlessui/react'
import { ArrowLeftIcon, DownloadIcon, EyeIcon } from '@heroicons/react/outline'
import { useWindowSize } from 'react-use'
import { RefinerType } from './adapters/inpainting'
import Button from './components/Button'
import Menu from './components/Menu'
import Toggle from './components/Toggle'
import { useEditor } from './context/EditorContext'

const refiners = [
  { id: 'medium', name: 'Advanced' },
  { id: 'none', name: 'Basic' },
]

interface EditorHeaderProps {
  onBack: () => void
  useHD: boolean
  setUseHD: (useHD: boolean) => void
  refiner: RefinerType
  setRefiner: (refiner: RefinerType) => void
  showOriginal: boolean
  setShowOriginal: (showOriginal: boolean) => void
  setShowUpgrade: (showUpgrade: boolean) => void
  setShowSignin: (showSignin: boolean) => void
}

export default function EditorHeader({
  onBack,
  useHD,
  setUseHD,
  refiner,
  setRefiner,
  showOriginal,
  setShowOriginal,
  setShowUpgrade,
  setShowSignin,
}: EditorHeaderProps) {
  const windowSize = useWindowSize()
  const editor = useEditor()
  const showRefinerSelection = false

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
        {useHD && showRefinerSelection && (
          <Listbox value={refiner} onChange={setRefiner}>
            {({ open }) => (
              <>
                <div className="relative items-center hidden sm:flex">
                  <Listbox.Label className="block text-sm leading-5 whitespace-nowrap font-medium pr-3">
                    HD Mode
                  </Listbox.Label>
                  <span className="inline-block w-full rounded-md">
                    <Listbox.Button className="cursor-default relative w-full rounded-lg border hover:border-gray-400 border-gray-300 bg-white pl-3 pr-8 py-2 text-left focus:outline-none  transition ease-in-out duration-150 sm:text-sm sm:leading-5">
                      <span className="block truncate">
                        {refiners.find(r => r.id === refiner)?.name}
                      </span>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </Listbox.Button>
                    <Transition
                      show={open}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                      className="absolute mt-1 w-full rounded-md bg-white shadow-lg"
                    >
                      <Listbox.Options
                        static
                        className="max-h-60 rounded-md py-1 text-base leading-6 shadow-xs overflow-auto focus:outline-none sm:text-sm sm:leading-5"
                      >
                        {refiners.map(r => (
                          <Listbox.Option key={r.id} value={r.id}>
                            {({ active }) => (
                              <div
                                className={`${
                                  active ? 'bg-primary' : 'text-gray-900'
                                } cursor-default select-none relative py-2 px-4`}
                              >
                                {r.name}
                              </div>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </span>
                </div>
              </>
            )}
          </Listbox>
        )}
        {editor.edits[editor.edits.length - 1].render ? (
          <>
            <Button
              primary
              icon={<DownloadIcon className="w-6 h-6" />}
              onClick={editor.download}
              className="-mr-4"
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
