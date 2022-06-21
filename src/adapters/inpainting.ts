import { dataURItoBlob } from '../utils'

export type RefinerType = 'none' | 'medium'

/**
 * Run the inpainting remote service on an input file and mask.
 * @param imageFile The original image file. It's recommended to always use the original file here.
 * @param maskBase64 A black & white mask with the parts to remove in white.
 * @param appCheckToken A valid AppCheck Token.
 * @returns A base64 encoding of the result image.
 */
export default async function inpaint(
  imageFile: File,
  maskBase64: string,
  isHD: boolean,
  refiner: RefinerType,
  appCheckToken?: string,
  authToken?: string
) {
  const fd = new FormData()
  fd.append('image_file', imageFile)
  const mask = dataURItoBlob(maskBase64)
  fd.append('mask_file', mask)
  fd.append('refiner', refiner)
  fd.append('hd', isHD ? 'true' : 'false')

  if (!process.env.REACT_APP_INPAINTING_ENDPOINT_INTERNAL) {
    throw new Error('missing env var REACT_APP_INPAINTING_ENDPOINT_INTERNAL')
  }
  const headers: Record<string, any> = {}
  // Add the app check token.
  if (appCheckToken) {
    headers['X-Firebase-AppCheck'] = appCheckToken
  }
  // Add the auth token.
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }
  // Add the HD flag.
  headers['X-HD'] = isHD ? 'true' : 'false'

  // Add the Refiner flag.
  headers['X-REFINER'] = refiner

  // Make the request.
  const res = await fetch(process.env.REACT_APP_INPAINTING_ENDPOINT_INTERNAL, {
    method: 'POST',
    headers,
    body: fd,
  })
  if (!res.ok) {
    throw new Error(res.statusText)
  }
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
