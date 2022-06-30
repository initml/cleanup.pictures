import { CheckIcon } from '@heroicons/react/outline'
import { getAuth, sendSignInLinkToEmail } from 'firebase/auth'
import { useState } from 'react'
import { useFirebase } from '../adapters/firebase'
import { useUser } from '../adapters/user'
import Button from './Button'
import GoogleIcon from './GoogleIcon'
import Loader from './Loader'

interface SigninProps {
  className?: string
}

export default function Signin(props: SigninProps) {
  const { className } = props
  const firebase = useFirebase()
  const user = useUser()

  return (
    <div className={['w-full flex flex-col space-y-5', className].join(' ')}>
      <Button
        primary
        onClick={() => {
          firebase?.logEvent('upgrade_sign_in')
          user?.signInWithGoogle()
        }}
        icon={
          <div className="flex items-center">
            <GoogleIcon />
          </div>
        }
        className="justify-center"
      >
        Continue with Google
      </Button>

      <div className="flex items-center space-x-4">
        <span className="flex-1 h-1 border-b border-gray-300" />
        <span>or</span>
        <span className="flex-1 h-1 border-b border-gray-300" />
      </div>

      <SigninLink />
    </div>
  )
}

function SigninLink() {
  const [email, setEmail] = useState<string | undefined>(
    window.localStorage.getItem('emailForSignIn') || undefined
  )
  const [isLinkSent, setIsLinkSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const firebase = useFirebase()

  async function sendSinginLink() {
    if (!email) {
      return
    }
    const actionCodeSettings = {
      // URL to redirect back to.
      url: `${window.location.origin}?upgrade=select`,
      // This must be true.
      handleCodeInApp: true,
    }
    try {
      setIsLoading(true)
      await sendSignInLinkToEmail(getAuth(), email, actionCodeSettings)
      // The link was successfully sent. Inform the user.
      setIsLinkSent(true)
      setIsLoading(false)
      // Save the email locally so you don't need to ask the user for it again
      // if they open the link on the same device.
      window.localStorage.setItem('emailForSignIn', email)
    } catch (error: any) {
      // eslint-disable-next-line no-alert
      alert(error.message)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <span className="flex justify-center">
        <Loader />
      </span>
    )
  }

  if (isLinkSent) {
    return (
      <span className="inline-flex space-x-4">
        <CheckIcon className="text-green-500 w-6 h-6" />
        <span>Sign-in link sent to {email} (check your spams folder)</span>
      </span>
    )
  }

  return (
    <>
      <input
        autoComplete="email"
        className="px-4 py-3"
        id="email"
        placeholder="Email"
        type="email"
        name="email"
        defaultValue={email}
        onChange={e => setEmail(e.target.value)}
      />
      <Button
        onClick={() => {
          firebase?.logEvent('upgrade_sign_in_link')
          sendSinginLink()
        }}
        className="border-2 border-black border-opacity-50 justify-center"
      >
        Get a sign-in link by email
      </Button>
    </>
  )
}
