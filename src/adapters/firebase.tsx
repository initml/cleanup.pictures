import {
  Analytics,
  getAnalytics,
  logEvent as analyticsLogEvent,
} from 'firebase/analytics'
import { FirebaseApp, initializeApp } from 'firebase/app'
import {
  AppCheck,
  getToken,
  initializeAppCheck,
  ReCaptchaV3Provider,
} from 'firebase/app-check'
import { getAuth, signInAnonymously } from 'firebase/auth'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

const IS_DEV = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.REACT_APP_FIREBASE_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
}

interface Firebase {
  app: FirebaseApp
  appCheck: AppCheck
  analytics: Analytics
  logEvent: (event: string, data?: any) => void
  getAppCheckToken: () => Promise<string | undefined>
  getAuthToken: () => Promise<string | undefined>
}

const FirebaseContext = createContext<Firebase | undefined>(undefined)

interface Props {
  children: ReactNode
}

export default function FirebaseProvider(props: Props) {
  const { children } = props
  const [state, setState] = useState<Firebase>()

  useEffect(() => {
    const app = initializeApp(firebaseConfig)
    const analytics = getAnalytics(app)

    const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY
    if (!recaptchaSiteKey) {
      throw new Error('missing env REACT_APP_RECAPTCHA_SITE_KEY')
    }

    // Pass your reCAPTCHA v3 site key (public key) to activate(). Make sure this
    // key is the counterpart to the secret key you set in the Firebase console.
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),

      // Optional argument. If true, the SDK automatically refreshes App Check
      // tokens as needed.
      isTokenAutoRefreshEnabled: true,
    })

    const logEvent = (event: string, data?: any) => {
      if (IS_DEV) {
        // eslint-disable-next-line
        console.log('Analytics Debug:', event, data)
      }
      analyticsLogEvent(analytics, event, data)
    }

    const getAppCheckToken = async () => {
      try {
        // Get a token from AppCheck.
        const token = await getToken(appCheck, true)
        return token.token
      } catch (e) {
        // Log failures AppCheck.
        logEvent('app_check_failed', { error: e })
      }
    }

    const getAuthToken = async () => {
      // User the user ID token if signed in.
      const auth = getAuth()
      if (auth.currentUser) {
        return auth.currentUser.getIdToken()
      }
      // Otherwise if the user is not signed in, we signed them in anonymously
      // and return that anonymous user id token.
      const user = await signInAnonymously(auth)
      return user.user.getIdToken()
    }

    setState({
      app,
      appCheck,
      analytics,
      logEvent,
      getAppCheckToken,
      getAuthToken,
    })
  }, [])

  return (
    <FirebaseContext.Provider value={state}>
      {children}
    </FirebaseContext.Provider>
  )
}

export function useFirebase() {
  return useContext(FirebaseContext)
}
