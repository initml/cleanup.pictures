import axios from 'axios'
import * as cors from 'cors'
import * as express from 'express'
import { NextFunction, Request, Response } from 'express'
// @ts-ignore
import { fileParser } from 'express-multipart-file-parser'
import * as functions from 'firebase-functions'
import * as FormData from 'form-data'

// eslint-disable-next-line
const firebaseAdmin = require('firebase-admin')

const CLEANUP_ENDPOINT = functions.config().cleanup.endpoint
const CLEANUP_ENDPOINT_HD = functions.config().cleanup.endpoint_hd

const app = express()
app.use(cors({ origin: true }))

const fileParserMiddleware = fileParser({
  rawBodyOptions: {
    limit: '20mb',
  },
})

firebaseAdmin.initializeApp()

const checkAuthToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    // Read the ID Token from the Authorization header.
    try {
      const idToken = authHeader.split('Bearer ')[1]
      const decodedIdToken = await firebaseAdmin.auth().verifyIdToken(idToken)
      const user = await firebaseAdmin.auth().getUser(decodedIdToken.uid)
      req.user = user
      req.isPro = decodedIdToken.stripeRole === 'pro'
      return next()
    } catch (e) {
      functions.logger.warn('error parsing auth token', e)
      res.status(403)
      return next('Unauthorized')
    }
  } else {
    functions.logger.warn('no auth token')
    res.status(403)
    return next('Unauthorized')
  }
}

const appCheckVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const appCheckToken = req.header('X-Firebase-AppCheck')
  if (!appCheckToken) {
    functions.logger.warn('no app check token for', req.user.uid)
    return next()
  }

  // Make sure that the app check token is valid.
  try {
    firebaseAdmin.appCheck().verifyToken(appCheckToken)
    next()
  } catch (err) {
    functions.logger.warn('invalid app check token')
    res.status(401)
    return next('Unauthorized')
  }
}

const checkHDAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.useHD = req.header('X-HD') === 'true'
  if (req.useHD && !req.isPro) {
    functions.logger.warn('forbidden free access attempt on HD')
    res.status(403)
    return next('HD is forbidden for free users')
  }
  return next()
}

app.post(
  '/',
  checkAuthToken,
  appCheckVerification,
  checkHDAccess,
  fileParserMiddleware,
  async (request, response) => {
    const fd = new FormData()
    // @ts-ignore
    const imageFile = request.files.find(f => f.fieldname === 'image_file')
    fd.append('image_file', imageFile.buffer, {
      contentType: imageFile.mimetype,
      filename: 'image.png',
    })
    // @ts-ignore
    const maskFile = request.files.find(f => f.fieldname === 'mask_file')
    fd.append('mask_file', maskFile.buffer, {
      contentType: maskFile.mimetype,
      filename: 'mask.png',
    })

    if (request.useHD) {
      fd.append('refiner', 'pyramid')
    }
    const endpoint = request.useHD ? CLEANUP_ENDPOINT_HD : CLEANUP_ENDPOINT
    try {
      const result = await axios.post(endpoint, fd, {
        headers: fd.getHeaders(),
        responseType: 'arraybuffer',
      })
      response.set('Content-Type', 'image/png')
      return response.send(result.data)
    } catch (e) {
      functions.logger.error(e, { structuredData: true })
      response.statusCode = 500
      return response.send('Internal server error')
    }
  }
)

exports.cleanup_v2 = functions.https.onRequest(app)
