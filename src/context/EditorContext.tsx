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
import { useAlert } from '../components/Alert'
import { downloadImage, loadImage, shareImage, useImage } from '../utils'

const BRUSH_COLOR = 'rgba(189, 255, 1, 0.75)'

interface BatchEdit {
  lines: Line[]
  render?: HTMLImageElement
}

export type Editor = {
  useHD: boolean
  setUseHD: (useHD: boolean) => void

  file?: File
  setFile: (file?: File) => void

  originalFile?: File
  setOriginalFile: (file?: File) => void

  image?: HTMLImageElement
  originalImage?: HTMLImageElement

  maskCanvas: HTMLCanvasElement

  edits: BatchEdit[]
  addLine: (forceBatch?: boolean) => void

  context?: CanvasRenderingContext2D
  setContext: (ctx: CanvasRenderingContext2D) => void

  render: () => void
  draw: () => void
  undo: (forceBatch?: boolean) => void
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

  const [edits, setEdits] = useState<BatchEdit[]>([{ lines: [{ pts: [] }] }])

  const [file, setFile] = useState<File>()
  const [originalFile, setOriginalFile] = useState<File>()

  const image = useImage(file)
  const originalImage = useImage(originalFile)

  const user = useUser()
  const [useHD, setUseHD] = useState(user?.isPro() || false)

  const [output] = useState(() => {
    return document.createElement('canvas')
  })
  const [patch] = useState(() => {
    return document.createElement('canvas')
  })
  const [maskCanvas] = useState<HTMLCanvasElement>(() => {
    return document.createElement('canvas')
  })

  const alert = useAlert()

  const firebase = useFirebase()

  // Refresh HD & pro layoutclass when the user changes
  useEffect(() => {
    if (user?.isPro()) {
      setUseHD(true)
      document.body.classList.add('pro')
    } else {
      setUseHD(false)
      document.body.classList.remove('pro')
    }
  }, [user])

  // Reset edits when HD changes
  useEffect(() => {
    setEdits([{ lines: [{ pts: [] }] }])
  }, [useHD])

  // Reset when the file changes
  useEffect(() => {
    if (!file) {
      setOriginalFile(undefined)
      setEdits([{ lines: [{ pts: [] }] }])
      setContext(undefined)
    }
  }, [file])

  const undo = useCallback(
    (forceBatch = false) => {
      const currentEdit = edits[edits.length - 1]
      if (!currentEdit) {
        throw new Error('no edit to undo')
      }
      if (!useHD && !forceBatch) {
        edits.pop()
        edits[edits.length - 1].lines = [{ pts: [] }]
        setEdits([...edits])
      }
      // If the current batch has more than one line, we just remove the last line
      else if (currentEdit.lines.length > 1 || !useHD) {
        currentEdit.lines.pop()
        currentEdit.lines[currentEdit.lines.length - 1] = { pts: [] }
        setEdits([...edits])
      }
      // Otherwise if the current batch has only one line and there are more than
      // 1 batch, we remove the entire batch
      else if (edits.length > 1) {
        edits.pop()
        setEdits([...edits])
      } else {
        // eslint-disable-next-line no-console
        console.log('nothing to undo')
      }
    },
    [edits, useHD]
  )

  const draw = useCallback(() => {
    if (!context || !image) {
      return
    }
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)
    const currentEdit = edits[edits.length - 1]
    if (currentEdit.render?.src) {
      context.drawImage(currentEdit.render, 0, 0)
    } else {
      context.drawImage(image, 0, 0)
    }

    drawLines(context, edits[edits.length - 1].lines)
  }, [context, image, edits])

  // Draw when edits change
  useEffect(() => {
    draw()
  }, [edits, draw])

  const getLastRender = useCallback(() => {
    for (let i = edits.length - 1; i >= 0; i -= 1) {
      if (edits[i].render) {
        return edits[i].render
      }
    }
  }, [edits])

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
    // Combine the lines of all the edits into one array using reduce
    const lines = edits.reduce(
      (acc, edit) => [...acc, ...edit.lines],
      [] as Line[]
    )
    drawLines(ctx, lines, 'white')
  }, [context?.canvas.height, context?.canvas.width, edits, maskCanvas])

  const renderOutput = useCallback(() => {
    if (!file || !originalImage || !context?.canvas) {
      // eslint-disable-next-line
      console.error(file, originalImage, context?.canvas)
      return
    }

    // Make sure that the canvas doesn't have lines drawn on it.
    const lastRender = getLastRender()
    if (!lastRender) {
      throw new Error('no last render')
    }
    context.drawImage(lastRender, 0, 0)

    patch.width = originalImage.width
    patch.height = originalImage.height
    const patchCtx = patch.getContext('2d')
    if (!patchCtx) {
      throw new Error('Could not get patch context')
    }

    // Clear the canvas
    patchCtx.globalCompositeOperation = 'source-over'
    patchCtx.clearRect(0, 0, patch.width, patch.height)

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
    output.width = originalImage.width
    output.height = originalImage.height
    const outputCtx = output.getContext('2d')
    if (!patchCtx) {
      throw new Error('Could not get output context')
    }
    outputCtx?.drawImage(originalImage, 0, 0)
    outputCtx?.drawImage(patch, 0, 0)
    return outputCtx?.canvas.toDataURL(file.type)
  }, [context, file, maskCanvas, originalImage, output, patch, getLastRender])

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
      if (!image) {
        throw new Error('No image')
      }
      const start = Date.now()
      firebase?.logEvent('inpaint_start')
      const appCheckToken = await firebase.getAppCheckToken()
      const authToken = await firebase.getAuthToken()
      const res = await inpaint(
        file,
        maskCanvas.toDataURL(),
        useHD,
        appCheckToken,
        authToken
      )
      if (!res) {
        throw new Error('empty response')
      }
      // TODO: fix the render if it failed loading
      const newRender = new Image()
      await loadImage(newRender, res)

      // Add the new render & new line.
      setEdits([...edits, { lines: [{ pts: [] }], render: newRender }])

      firebase?.logEvent('inpaint_processed', {
        duration: Date.now() - start,
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    } catch (e: any) {
      firebase?.logEvent('inpaint_failed', {
        error: e,
      })
      // Add a new line. It prevents from adding a long straight line when
      // the user draws again.
      const currentEdit = edits[edits.length - 1]
      currentEdit.lines.push({ pts: [] })
      setEdits([...edits])

      alert(e.message ? e.message : e.toString())
    }
  }, [
    file,
    firebase,
    image,
    maskCanvas,
    edits,
    refreshCanvasMask,
    alert,
    useHD,
  ])

  const addLine = useCallback(
    (forceBatch = false) => {
      // In SD we create a new batch for each line
      if (!useHD && !forceBatch) {
        const newEdit = { lines: [{ pts: [] }] }
        setEdits([...edits, newEdit])
      }
      // In HD we add the line to the current batch
      else {
        const currentEdit = edits[edits.length - 1]
        currentEdit.lines.push({ pts: [] } as Line)
        setEdits([...edits])
      }
    },
    [edits, useHD]
  )

  const editor: Editor = {
    useHD,
    setUseHD,

    file,
    setFile,
    originalFile,
    setOriginalFile,

    image,

    edits,

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
