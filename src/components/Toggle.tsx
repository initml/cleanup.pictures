import { Switch } from '@headlessui/react'
import { ReactNode } from 'react'

interface ToggleProps {
  label: string | ReactNode
  enabled: boolean
  setEnabled: (enabled: boolean) => void
}

export default function Toggle(props: ToggleProps) {
  const { enabled, label, setEnabled } = props

  return (
    <Switch.Group>
      <div className="inline-flex items-center">
        <Switch.Label className="mr-4">{label}</Switch.Label>
        <Switch
          checked={enabled}
          onChange={setEnabled}
          className={`${
            enabled ? 'bg-primary' : 'bg-gray-200'
          } relative inline-flex items-center h-6 rounded-full w-11`}
        >
          <span
            className={`
            transform transition ease-in-out duration-200 
            ${
              enabled ? 'bg-black translate-x-6' : 'bg-gray-600 translate-x-1'
            } inline-block w-4 h-4 transform  rounded-full`}
          />
        </Switch>
      </div>
    </Switch.Group>
  )
}
