import { useEffect, useRef, useState } from 'react'
import { useClickAway, useWindowSize } from 'react-use'
import { useFirebase } from '../adapters/firebase'
import useSubscriptions, { checkout, Product } from '../adapters/subscriptions'
import { useUser } from '../adapters/user'
import Button from './Button'
import Loader from './Loader'
import LogoPro from './LogoPro'
import Modal from './Modal'
import PriceSelector from './PriceSelector'
import Signin from './Signin'

interface UpgradeModalProps {
  onClose: () => void
  screen: string | null
  isProUser?: boolean
}

export default function UpgradeModal(props: UpgradeModalProps) {
  const { onClose, screen, isProUser } = props
  const upgradeModalRef = useRef(null)
  const firebase = useFirebase()

  useClickAway(upgradeModalRef, () => {
    onClose()
  })

  // Close the popup if the user is already a pro user,
  // and we're not showing the success screen.
  useEffect(() => {
    if (isProUser && screen !== 'success') {
      onClose()
    }
  }, [screen, isProUser, onClose])

  // Report success screen event
  useEffect(() => {
    if (screen === 'success') {
      firebase?.logEvent('upgrade_success')
    }
  }, [firebase, screen])

  if (screen === 'success') {
    return (
      <Modal onClose={onClose}>
        <div className="text-center">
          <LogoPro className="h-20" />
          <div className="pt-8 pb-10">
            <h2 className="text-xl">Upgrade successful!</h2>
            <p>Congratulations, you now have access to Cleanup Pro :)</p>
          </div>
          <Button primary onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose} className="h-full sm:h-auto p-0 sm:p-0">
      <div className="h-full sm:h-auto flex flex-col sm:flex-row">
        <div className="flex-1 px-4 pt-12 sm:p-12 flex flex-col justify-center">
          <div
            className="flex items-center rounded-md overflow-hidden"
            style={{ maxHeight: '25vh' }}
          >
            <video
              // className="h-40 w-56 rounded-md object-cover"
              style={{ transform: 'scale(1.01, 1.01)' }}
              autoPlay
              muted
              loop
              playsInline
            >
              <source
                src="https://firebasestorage.googleapis.com/v0/b/cleanup-pictures.appspot.com/o/demo_pro.mp4?alt=media"
                type="video/mp4"
              />
              <track kind="captions" />
            </video>
          </div>
          <p className="pb-4 mt-4">
            Upgrade now to enable high resolution with no compression (vs 720p
            max for the free version).
          </p>
        </div>
        <div className="sm:flex-1 bg-gray-100 p-4 sm:p-12 sm:flex sm:items-center sm:justify-center">
          <CheckoutFlow />
        </div>
      </div>
    </Modal>
  )
}

function CheckoutFlow() {
  const user = useUser()
  const products = useSubscriptions()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const firebase = useFirebase()

  function startCheckout(priceId: string) {
    firebase?.logEvent('upgrade_checkout', { priceId })
    if (!user?.user) {
      throw new Error('no user')
    }
    const userId = user.user.firebaseUser.uid
    setIsCheckingOut(true)
    checkout(userId, priceId)
  }

  // Step 3 - Wait for checking session to be created
  if (isCheckingOut) {
    return (
      <span className="flex justify-center">
        <Loader />
      </span>
    )
  }
  // Step 2 - Show the price
  if (user?.user) {
    return <Prices products={products} onCheckout={startCheckout} />
  }
  // Step 1 - Login required
  return <Signin />
}

interface PricesProps {
  products?: Product[]
  onCheckout: (priceId: string) => void
}

function Prices(props: PricesProps) {
  const { products, onCheckout } = props
  const [selectedPriceId, setSelectedPriceId] = useState<string>()
  const windowSize = useWindowSize()

  // Select the first price by default
  useEffect(() => {
    if (!products?.length) {
      return
    }
    const pro = products.find(p => p.role === 'pro')
    if (!pro?.prices.length) {
      return
    }
    if (!selectedPriceId) {
      setSelectedPriceId(pro.prices[0].id)
    }
  }, [products, selectedPriceId])

  // Return a loader while the prices are loading.
  if (!products?.length) {
    return <Loader />
  }

  // Return an error if no prices are found for the pro product.
  const pro = products?.find(p => p.role === 'pro')
  if (!pro?.prices || !selectedPriceId) {
    return <p>Could not load prices</p>
  }
  return (
    <div className="flex flex-col">
      {(windowSize.width > 640 || windowSize.height > 550) && (
        <span className="text-lg">Try Cleanup Pro</span>
      )}
      <PriceSelector
        prices={pro?.prices}
        selectedPriceId={selectedPriceId}
        onSelectionChange={priceId => setSelectedPriceId(priceId)}
      />
      <Button
        primary
        onClick={() => onCheckout(selectedPriceId)}
        className="justify-center py-4"
      >
        Start {pro.prices.find(p => p.id === selectedPriceId)?.trial} days free
        trial
      </Button>
      <span className="text-center opacity-50 text-xs mt-3">
        Cancel anytime
      </span>
    </div>
  )
}
