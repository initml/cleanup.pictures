import { dataURItoBlob } from '../utils'

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
  appCheckToken?: string,
  authToken?: string
) {
  const fd = new FormData()
  fd.append('image_file', imageFile)
  const mask = dataURItoBlob(maskBase64)
  fd.append('mask_file', mask)

  if (!process.env.REACT_APP_INPAINTING_ENDPOINT) {
    throw new Error('missing env var REACT_APP_INPAINTING_ENDPOINT')
  }
  const headers: Record<string, any> = {}
  if (appCheckToken) {
    headers['X-Firebase-AppCheck'] = appCheckToken
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }
  const res = await fetch(process.env.REACT_APP_INPAINTING_ENDPOINT, {
    method: 'POST',
    headers,
    body: fd,
  }).then(async r => {
    return r.blob()
  })

  return URL.createObjectURL(res)
}
