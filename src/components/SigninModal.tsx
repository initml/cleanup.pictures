import { useEffect, useRef } from 'react'
import { useClickAway } from 'react-use'
import { useUser } from '../adapters/user'
import Modal from './Modal'
import Signin from './Signin'

interface SignInModalProps {
  onClose: () => void
}

export default function SignInModal(props: SignInModalProps) {
  const { onClose } = props
  const upgradeModalRef = useRef(null)
  const user = useUser()

  // Close the signin popup when the user is signed in.
  useEffect(() => {
    if (user?.user) {
      onClose()
    }
  }, [user, onClose])

  useClickAway(upgradeModalRef, () => {
    onClose()
  })

  return (
    <Modal onClose={onClose} className="h-auto p-0 sm:p-0">
      <div className="h-full sm:h-auto flex sm:flex-row items-center">
        <div className="sm:flex-1 bg-gray-100 p-4 sm:p-12 sm:flex sm:flex-col sm:items-center sm:justify-center">
          <h1 className="text-xl mb-8">Sign in</h1>
          <Signin />
        </div>
      </div>
    </Modal>
  )
}
