import { Menu, Transition } from '@headlessui/react'
import {
  ArrowUpIcon,
  ChatAltIcon,
  CogIcon,
  ExternalLinkIcon,
  LogoutIcon,
  UserIcon,
} from '@heroicons/react/outline'
import { Fragment, ReactNode, useState } from 'react'
import { useUser } from '../adapters/user'
import Loader from './Loader'

type MenuItemButtonProps = {
  label: string
  icon?: ReactNode
  onClick: () => void
  primary?: boolean
}

function MenuItemButton(props: MenuItemButtonProps) {
  const { label, onClick, icon, primary } = props
  return (
    <Menu.Item>
      {({ active }) => (
        <button
          type="button"
          className={[
            active ? 'bg-gray-100' : '',
            primary ? 'bg-primary' : '',
            'flex w-full px-5 py-3 text-sm text-gray-700 space-x-3 whitespace-nowrap flex-nowrap',
          ].join(' ')}
          onClick={onClick}
        >
          {icon}
          <span className="font-medium">{label}</span>
        </button>
      )}
    </Menu.Item>
  )
}

interface UserMenuProps {
  onUpgrade: () => void
  onSignin: () => void
}

export default function UserMenu(props: UserMenuProps) {
  const { onUpgrade, onSignin } = props
  const user = useUser()
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
                <Menu.Button
                  aria-label="Menu"
                  className="flex items-center justify-center p-3 px-5 rounded-md hover:bg-primary"
                >
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
                <div className="p-4 ">
                  {user?.isPro() ? <p>Cleanup Pro</p> : <p>Cleanup Free</p>}
                  {user?.user && (
                    <p
                      className="text-xs font-thin font-mono opacity-70 selection-text mt-3"
                      style={{ userSelect: 'text' }}
                    >
                      User id: {user.user?.firebaseUser.uid}
                    </p>
                  )}
                </div>
                {!user?.isPro() && (
                  <MenuItemButton
                    primary
                    label="Upgrade to Cleanup Pro"
                    icon={<ArrowUpIcon className="w-6 h-6" />}
                    onClick={onUpgrade}
                  />
                )}
                {!user?.user && (
                  <MenuItemButton
                    label="Sign in"
                    icon={<UserIcon className="w-6 h-6" />}
                    onClick={onSignin}
                  />
                )}
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
