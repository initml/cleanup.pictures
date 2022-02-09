import { ExclamationCircleIcon, XIcon } from '@heroicons/react/outline'
import { createContext, useContext, useState } from 'react'

enum AlertType {
  ERROR = 'error',
  SUCCESS = 'success',
  INFO = 'info',
}

type Alert = (message: string, type?: AlertType) => void

export const AlertContext = createContext<Alert | undefined>(undefined)

export function useAlert() {
  const ctx = useContext(AlertContext)
  if (!ctx) {
    throw new Error('No Alert context (missing AlertProvider?)')
  }
  return ctx
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<string>()

  return (
    <AlertContext.Provider value={setCurrent}>
      {current && (
        <div className="z-50 fixed flex w-full justify-center p-4 animate-slide-in-up">
          <div
            className={[
              'bg-red-100 rounded-lg py-5 px-6 mb-3 text-base',
              'text-red-700 inline-flex items-center',
              ' fade show',
            ].join(' ')}
            role="alert"
          >
            <div>
              <ExclamationCircleIcon className="w-6 h-6 mr-4" />
            </div>
            {current}
            <button
              type="button"
              className={[
                'btn-close box-content p-1 ml-8 flex items-center',
                'text-red-700 border-none rounded-none opacity-50',
                'focus:shadow-none focus:outline-none focus:opacity-100',
                'hover:text-yellow-900 hover:opacity-75 hover:no-underline',
              ].join(' ')}
              data-bs-dismiss="alert"
              aria-label="Close"
              onClick={() => setCurrent(undefined)}
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
      {children}
    </AlertContext.Provider>
  )
}
