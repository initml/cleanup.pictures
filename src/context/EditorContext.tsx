import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useFirebase } from '../adapters/firebase'
import inpaint from '../adapters/inpainting'
import { useUser } from '../adapters/user'
import { downloadImage, loadImage, shareImage, useImage } from '../utils'

const BRUSH_COLOR = 'rgba(189, 255, 1, 0.75)'

export type Editor = {
  useHD: boolean
  setUseHD: (useHD: boolean) => void

  file?: File
  setFile: (file?: File) => void

  originalFile?: File
  setOriginalFile: (file?: File) => void

  image?: HTMLImageElement
  isImageLoaded: boolean
  originalImage?: HTMLImageElement

  renders: HTMLImageElement[]
  // setRenders: (renders: HTMLImageElement[]) => void

  maskCanvas: HTMLCanvasElement

  lines: Line[]
  addLine: () => void
  // setLines: (lines: Line[]) => void

  context?: CanvasRenderingContext2D
  setContext: (ctx: CanvasRenderingContext2D) => void

  // refreshCanvasMask: () => void

  render: () => void
  draw: (noLine?: boolean) => void
  // reset: () => void
  undo: () => void
  download: () => void
}

export interface Line {
  size?: number
  pts: { x: number; y: number }[]
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: Line[],
  color = BRUSH_COLOR
) {
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  lines.forEach(line => {
    if (!line?.pts.length || !line.size) {
      return
    }
    ctx.lineWidth = line.size
    ctx.beginPath()
    ctx.moveTo(line.pts[0].x, line.pts[0].y)
    line.pts.forEach(pt => ctx.lineTo(pt.x, pt.y))
    ctx.stroke()
  })
}

const EditorContext = createContext<Editor | undefined>(undefined)

export function EditorProvider(props: any) {
  const { children } = props

  const [context, setContext] = useState<CanvasRenderingContext2D>()

  const [renders, setRenders] = useState<HTMLImageElement[]>([])
  const [lines, setLines] = useState<Line[]>([{ pts: [] }])

  const [file, setFile] = useState<File>()
  const [originalFile, setOriginalFile] = useState<File>()

  const [image, isImageLoaded] = useImage(file)
  const [originalImage, isOriginalLoaded] = useImage(originalFile)

  const user = useUser()
  const [useHD, setUseHD] = useState(user?.isPro() || false)

  const [maskCanvas] = useState<HTMLCanvasElement>(() => {
    return document.createElement('canvas')
  })

  const firebase = useFirebase()

  // console.log(isOriginalLoaded)

  useEffect(() => {
    if (user?.isPro()) {
      setUseHD(true)
      document.body.classList.add('pro')
    } else {
      setUseHD(false)
      document.body.classList.remove('pro')
    }
  }, [user])

  // Reset when the file changes
  // const reset = useCallback(() => {

  // }, [])
  useEffect(() => {
    setRenders([])
    setLines([{ pts: [] }])
  }, [file])

  const undo = useCallback(() => {
    const l = lines
    l.pop()
    l.pop()
    setLines([...l, { pts: [] }])
    const r = renders
    r.pop()
    setRenders([...r])
  }, [lines, renders])

  const draw = useCallback(
    (noLine?: boolean) => {
      if (!context || !image) {
        return
      }
      context.clearRect(0, 0, context.canvas.width, context.canvas.height)
      const currRender = renders[renders.length - 1]
      if (currRender?.src) {
        context.drawImage(currRender, 0, 0)
      } else {
        context.drawImage(image, 0, 0)
      }
      if (useHD && !noLine) {
        drawLines(context, lines)
      } else {
        const currentLine = lines[lines.length - 1]
        drawLines(context, [currentLine])
      }
    },
    [context, lines, image, renders, useHD]
  )

  const refreshCanvasMask = useCallback(() => {
    if (!context?.canvas.width || !context?.canvas.height) {
      throw new Error('canvas has invalid size')
    }
    maskCanvas.width = context?.canvas.width
    maskCanvas.height = context?.canvas.height
    const ctx = maskCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('could not retrieve mask canvas')
    }
    drawLines(ctx, lines, 'white')
  }, [context?.canvas.height, context?.canvas.width, lines, maskCanvas])

  const renderOutput = useCallback(() => {
    if (!file || !originalImage || !isOriginalLoaded || !context?.canvas) {
      // eslint-disable-next-line
      console.error(file, originalImage, isOriginalLoaded, context?.canvas)
      return
    }
    const patch = document.createElement('canvas')
    patch.width = originalImage.width
    patch.height = originalImage.height
    const patchCtx = patch.getContext('2d')
    if (!patchCtx) {
      throw new Error('Could not get patch context')
    }

    // Draw the inpainted image masked by the mask
    patchCtx?.drawImage(
      maskCanvas,
      0,
      0,
      originalImage.width,
      originalImage.height
    )
    patchCtx.globalCompositeOperation = 'source-in'
    patchCtx?.drawImage(
      context?.canvas,
      0,
      0,
      originalImage.width,
      originalImage.height
    )

    // Draw the final output
    const output = document.createElement('canvas')
    output.width = originalImage.width
    output.height = originalImage.height
    const outputCtx = output.getContext('2d')
    if (!patchCtx) {
      throw new Error('Could not get output context')
    }
    outputCtx?.drawImage(originalImage, 0, 0)
    outputCtx?.drawImage(patch, 0, 0)
    return outputCtx?.canvas.toDataURL(file.type)
  }, [context, file, isOriginalLoaded, maskCanvas, originalImage])

  const download = useCallback(() => {
    if (!file || !context) {
      // eslint-disable-next-line
      console.error('no file or context')
      return
    }
    const base64 = useHD ? renderOutput() : context.canvas.toDataURL(file.type)
    if (!base64) {
      throw new Error('could not get canvas data')
    }
    const name = file.name.replace(/(\.[\w\d_-]+)$/i, '_cleanup$1')
    if (shareImage(base64, name)) {
      firebase?.logEvent('download', { mode: 'share' })
    } else {
      downloadImage(base64, name)
      firebase?.logEvent('download', { mode: 'download' })
    }
  }, [context, file, firebase, renderOutput, useHD])

  const render = useCallback(async () => {
    refreshCanvasMask()
    try {
      if (!firebase) {
        throw new Error('Firebase is not initialized')
      }
      if (!file) {
        throw new Error('No file')
      }
      const start = Date.now()
      firebase?.logEvent('inpaint_start')
      const { token } = await firebase.getAppCheckToken()
      const res = await inpaint(file, maskCanvas.toDataURL(), token)
      if (!res) {
        throw new Error('empty response')
      }
      // TODO: fix the render if it failed loading
      const newRender = new Image()
      await loadImage(newRender, res)
      renders.push(newRender)
      lines.push({ pts: [] } as Line)

      setRenders([...renders])
      setLines([...lines])

      firebase?.logEvent('inpaint_processed', {
        duration: Date.now() - start,
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    } catch (e: any) {
      firebase?.logEvent('inpaint_failed', {
        error: e,
      })
      // eslint-disable-next-line
      alert(e.message ? e.message : e.toString())
    }
  }, [file, firebase, image, maskCanvas, renders, lines, refreshCanvasMask])

  const addLine = useCallback(() => {
    lines.push({ pts: [] } as Line)
    setLines([...lines])
  }, [lines])

  const editor: Editor = {
    useHD,
    setUseHD,

    file,
    setFile,
    originalFile,
    setOriginalFile,

    image,
    isImageLoaded,

    renders,

    lines,
    addLine,

    maskCanvas,

    context,
    setContext,

    render,
    draw,

    undo,
    download,
  }

  return (
    <EditorContext.Provider value={editor}>{children}</EditorContext.Provider>
  )
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) {
    throw new Error('No EditorUI context (missing EditorUIProvider?)')
  }
  return ctx
}
