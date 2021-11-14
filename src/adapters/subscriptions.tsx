import { useEffect, useState } from 'react'
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
} from 'firebase/firestore'
import { useFirebase } from './firebase'

export interface Price {
  id: string
  interval: 'year' | 'month'
  currency: string
  amount: number
  trial: number // Number of days for trial period
}

export interface Product {
  id: string
  name: string
  role: string
  prices: Price[]
}

export default function useSubscriptions() {
  const firebase = useFirebase()
  const [products, setProducts] = useState<Product[]>()
  // Retrieve the prices
  useEffect(() => {
    if (!firebase) {
      return
    }
    const db = getFirestore(firebase.app)
    const q = query(collection(db, 'products'), where('active', '==', true))
    getDocs(q).then(querySnapshot => {
      Promise.all(
        querySnapshot.docs.map(async doc => {
          const data = doc.data()
          const product: Product = {
            id: doc.id,
            name: data.name,
            role: data.role,
            prices: [],
          }
          const priceSnap = await getDocs(collection(doc.ref, 'prices'))
          priceSnap.docs.forEach(priceDoc => {
            const priceData = priceDoc.data()
            const price: Price = {
              id: priceDoc.id,
              interval: priceData.interval,
              currency: priceData.currency,
              amount: priceData.unit_amount / 100,
              trial: priceData.trial_period_days,
            }
            product.prices.push(price)
          })
          return product
        })
      ).then(pr => {
        setProducts(pr)
      })
    })
  }, [firebase])

  return products
}

export async function checkout(userId: string, priceId: string) {
  const col = collection(
    getFirestore(),
    'customers',
    userId,
    'checkout_sessions'
  )
  const docRef = await addDoc(col, {
    price: priceId,
    success_url: `${window.location.origin}?upgrade=success`,
    cancel_url: `${window.location.origin}?upgrade=cancel`,
  })
  // Wait for the CheckoutSession to get attached by the extension
  onSnapshot(docRef, snap => {
    const checkoutSession = snap.data()
    if (!checkoutSession) {
      throw new Error('No checkout session')
    }
    if (checkoutSession.error) {
      // Show an error to your customer and
      // inspect your Cloud Function logs in the Firebase console.
      // eslint-disable-next-line no-alert
      alert(`An error occured: ${checkoutSession.error.message}`)
    }
    if (checkoutSession.url) {
      // We have a Stripe Checkout URL, let's redirect.
      window.location.assign(checkoutSession.url)
    }
  })
}
