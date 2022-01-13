import { ArrowLeftIcon } from '@heroicons/react/outline'
import React from 'react'
import { useWindowSize } from 'react-use'
import { useUser } from './adapters/user'
import Button from './components/Button'
import Logo from './components/Logo'
import LogoPro from './components/LogoPro'
import Menu from './components/Menu'
import Toggle from './components/Toggle'

interface EditorHeaderProps {
  onBack: () => void
  useHD: boolean
  setUseHD: (useHD: boolean) => void
  setShowUpgrade: (showUpgrade: boolean) => void
}

export default function EditorHeader({
  onBack,
  useHD,
  setUseHD,
  setShowUpgrade,
}: EditorHeaderProps) {
  const user = useUser()
  const windowSize = useWindowSize()

  function getLogo() {
    if (user?.isPro()) {
      return <LogoPro className={['h-12'].join(' ')} />
    }
    return <Logo className={['h-12'].join(' ')} />
  }

  return (
    <header className="relative z-10 flex sm:px-5 pt-3 justify-between items-center sm:items-start">
      <Button icon={<ArrowLeftIcon className="w-6 h-6" />} onClick={onBack}>
        {windowSize.width > 640 ? 'Start new' : undefined}
      </Button>
      {windowSize.width > 640 ? getLogo() : <></>}

      <div className="flex space-x-4">
        <Toggle label="HD" enabled={useHD} setEnabled={setUseHD} />
        <Menu onUpgrade={() => setShowUpgrade(true)} />
      </div>
    </header>
  )
}
