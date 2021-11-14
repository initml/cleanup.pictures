import { Menu, Transition } from '@headlessui/react'
import {
  ChatAltIcon,
  CogIcon,
  ExternalLinkIcon,
  InformationCircleIcon,
  LogoutIcon,
  UserIcon,
} from '@heroicons/react/outline'
import React, { Fragment, ReactNode, useState } from 'react'
import { useFirebase } from '../adapters/firebase'
import { useUser } from '../adapters/user'
import Loader from './Loader'

type MenuItemButtonProps = {
  label: string
  icon?: ReactNode
  onClick: () => void
}

function MenuItemButton(props: MenuItemButtonProps) {
  const { label, onClick, icon } = props
  return (
    <Menu.Item>
      {({ active }) => (
        <button
          type="button"
          className={[
            active ? 'bg-gray-100' : '',
            'flex w-full px-5 py-3 text-sm text-gray-700 space-x-3 whitespace-nowrap flex-nowrap',
          ].join(' ')}
          onClick={onClick}
        >
          {icon}
          <span>{label}</span>
        </button>
      )}
    </Menu.Item>
  )
}

interface UserMenuProps {
  onAbout: () => void
}

export default function UserMenu(props: UserMenuProps) {
  const { onAbout } = props
  const user = useUser()
  const firebase = useFirebase()
  const [isLoading, setIsLoading] = useState(false)

  return (
    <>
      <Menu as="div" className="ml-3 relative">
        {({ open }) => (
          <>
            {isLoading ? (
              <div className="p-3">
                <Loader />
              </div>
            ) : (
              <div>
                <Menu.Button className="flex items-center justify-center p-3 px-5 rounded-md hover:bg-primary">
                  <CogIcon className="w-6 h-6" />
                </Menu.Button>
              </div>
            )}
            <Transition
              show={open}
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                static
                className="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                {user?.isPro() && (
                  <div className="p-4 ">
                    <p>Cleanup Pro</p>
                    <p
                      className="text-xs font-thin font-mono opacity-70 selection-text"
                      style={{ userSelect: 'text' }}
                    >
                      {user.user?.firebaseUser.uid}
                    </p>
                  </div>
                )}
                {!user?.user && (
                  <MenuItemButton
                    label="Sign in"
                    icon={<UserIcon className="w-6 h-6" />}
                    onClick={() => user?.signInWithGoogle()}
                  />
                )}
                <MenuItemButton
                  label="About"
                  icon={<InformationCircleIcon className="w-6 h-6" />}
                  onClick={() => {
                    firebase?.logEvent('show_modal')
                    onAbout()
                  }}
                />
                <MenuItemButton
                  label="Contact Support"
                  icon={<ChatAltIcon className="w-6 h-6" />}
                  onClick={() => {
                    window.open('mailto:contact@cleanup.pictures', '_blank')
                  }}
                />

                {user?.user && (
                  <>
                    {user.isPro() && (
                      <MenuItemButton
                        label="Manage subscription"
                        icon={<ExternalLinkIcon className="w-6 h-6" />}
                        onClick={async () => {
                          setIsLoading(true)
                          await user?.openPortal()
                          // setIsLoading(false)
                        }}
                      />
                    )}
                    <MenuItemButton
                      label="Sign out"
                      icon={<LogoutIcon className="w-6 h-6" />}
                      onClick={() => user?.signOut()}
                    />
                  </>
                )}
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
    </>
  )
}
