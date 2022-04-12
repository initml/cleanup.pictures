type User = import('firebase/auth').User

declare namespace Express {
  export interface Request {
    user: User
    useHD: boolean
    refiner: 'none' | 'medium'
    isPro: boolean
  }
}
