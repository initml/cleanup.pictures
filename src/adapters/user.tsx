import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useFirebase } from './firebase'

interface User {
  firebaseUser: FirebaseUser
  accessToken: string
  entitlement: string | undefined
}

interface UserController {
  user?: User | null
  signInWithGoogle: () => Promise<void>
  signOut: () => void
  isPro: () => boolean
  openPortal: () => Promise<void>
}

const UserContext = createContext<UserController | undefined>(undefined)

interface Props {
  children: ReactNode
}

export default function UserProvider(props: Props) {
  const { children } = props
  const [user, setUser] = useState<User | null>()
  const firebase = useFirebase()

  useEffect(() => {
    if (!firebase?.app) {
      return
    }
    const onAuthChangedCallback = async (firebaseUser: FirebaseUser | null) => {
      try {
        if (!firebaseUser) {
          setUser(null)
          return
        }
        const token = await firebaseUser.getIdToken()
        if (!token) {
          throw new Error('No access token')
        }
        // Retrieve the claims
        const decodedToken = await firebaseUser.getIdTokenResult(true)
        // The signed-in user info.
        setUser({
          firebaseUser,
          accessToken: token,
          entitlement: decodedToken.claims.stripeRole?.toString(),
        })
      } catch (error: any) {
        // Handle Errors here.
        const errorCode = error.code
        const errorMessage = error.message
        // The email of the user's account used.
        const { email } = error
        console.error(errorCode, errorMessage, email)
      }
    }

    const unsub = getAuth().onAuthStateChanged(onAuthChangedCallback)
    return unsub
  }, [firebase?.app])

  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider()
      const auth = getAuth()
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      // Handle Errors here.
      const errorCode = error.code
      const errorMessage = error.message
      // The email of the user's account used.
      const { email } = error
      console.error(errorCode, errorMessage, email)
    }
  }

  async function openPortal() {
    if (!firebase) {
      throw new Error('Firebase not initialized')
    }
    const functionRef = httpsCallable(
      getFunctions(firebase.app),
      'ext-firestore-stripe-payments-createPortalLink'
    )
    const { data } = await functionRef({
      returnUrl: window.location.origin,
      // Optional, defaults to "auto"
      locale: 'auto',
      // Optional ID of a portal configuration:
      // https://stripe.com/docs/api/customer_portal/configuration
      // configuration: 'bpc_1JSEAKHYgolSBA358VNoc2Hs',
    })
    if (!data) {
      throw new Error('No data returned')
    }
    window.location.assign((data as any).url)
  }

  return (
    <UserContext.Provider
      value={{
        user,
        signInWithGoogle,
        signOut: () => getAuth().signOut(),
        openPortal,
        isPro: () => user?.entitlement === 'pro',
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
