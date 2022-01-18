import { useEffect, useState } from 'react'
import { useWindowSize } from 'react-use'
import { useFirebase } from './adapters/firebase'
import Button from './components/Button'
import Slider from './components/Slider'
import { useEditor } from './context/EditorContext'

const TOOLBAR_SIZE = 180

interface EditorUIProps {
  showOriginal: boolean
  showSeparator: boolean
}

export default function EditorUI({
  showOriginal,
  showSeparator,
}: EditorUIProps) {
  const [brushSize, setBrushSize] = useState(40)

  const [{ x, y }, setCoords] = useState({ x: -1, y: -1 })
  const [showBrush, setShowBrush] = useState(false)
  const [isInpaintingLoading, setIsInpaintingLoading] = useState(false)
  const firebase = useFirebase()
  const [scale, setScale] = useState(1)
  const windowSize = useWindowSize()

  const editor = useEditor()
  const {
    image,
    undo,
    file,
    edits,
    addLine,
    context,
    isImageLoaded,
    render,
    draw,
    setContext,
    maskCanvas,
    useHD,
  } = editor
  const currentEdit = edits[edits.length - 1]

  // Reset when the file changes
  useEffect(() => {
    setScale(1)
    setIsInpaintingLoading(false)
  }, [])

  // Draw once the image image is loaded
  useEffect(() => {
    if (!context?.canvas || !image) {
      return
    }
    if (isImageLoaded) {
      context.canvas.width = image.naturalWidth
      context.canvas.height = image.naturalHeight
      const rW = windowSize.width / image.naturalWidth
      const rH = (windowSize.height - TOOLBAR_SIZE) / image.naturalHeight
      if (rW < 1 || rH < 1) {
        setScale(Math.min(rW, rH))
      } else {
        setScale(1)
      }
      draw()
    }
  }, [context?.canvas, draw, image, isImageLoaded, windowSize])

  // Handle mouse interactions
  useEffect(() => {
    if (!firebase || !image || !context) {
      return
    }
    const canvas = context?.canvas
    if (!canvas) {
      return
    }

    const onMouseDown = (ev: MouseEvent) => {
      if (!image.src) {
        return
      }
      const currLine = currentEdit.lines[currentEdit.lines.length - 1]
      currLine.size = brushSize
      canvas.addEventListener('mousemove', onMouseDrag)
      window.addEventListener('mouseup', onPointerUp)
      onPaint(ev.offsetX, ev.offsetY)
    }
    const onMouseMove = (ev: MouseEvent) => {
      setCoords({ x: ev.pageX, y: ev.pageY })
    }
    const onPaint = (px: number, py: number) => {
      const currLine = currentEdit.lines[currentEdit.lines.length - 1]
      currLine.pts.push({ x: px, y: py })
      draw()
    }
    const onMouseDrag = (ev: MouseEvent) => {
      const px = ev.offsetX
      const py = ev.offsetY
      onPaint(px, py)
    }

    const onPointerUp = async () => {
      if (!image?.src || !file) {
        return
      }
      canvas.removeEventListener('mousemove', onMouseDrag)
      window.removeEventListener('mouseup', onPointerUp)
      if (!useHD) {
        setIsInpaintingLoading(true)
        await render()
        setIsInpaintingLoading(false)
      } else {
        addLine()
      }
    }
    window.addEventListener('mousemove', onMouseMove)

    const onTouchMove = (ev: TouchEvent) => {
      ev.preventDefault()
      ev.stopPropagation()
      const currLine = currentEdit.lines[currentEdit.lines.length - 1]
      const coords = canvas.getBoundingClientRect()
      currLine.pts.push({
        x: (ev.touches[0].clientX - coords.x) / scale,
        y: (ev.touches[0].clientY - coords.y) / scale,
      })
      draw()
    }
    const onPointerStart = (ev: TouchEvent) => {
      if (!image.src) {
        return
      }
      const currLine = currentEdit.lines[currentEdit.lines.length - 1]
      currLine.size = brushSize
      canvas.addEventListener('mousemove', onMouseDrag)
      window.addEventListener('mouseup', onPointerUp)
      const coords = canvas.getBoundingClientRect()
      const px = (ev.touches[0].clientX - coords.x) / scale
      const py = (ev.touches[0].clientY - coords.y) / scale
      onPaint(px, py)
    }
    canvas.addEventListener('touchstart', onPointerStart)
    canvas.addEventListener('touchmove', onTouchMove)
    canvas.addEventListener('touchend', onPointerUp)
    canvas.onmouseenter = () => setShowBrush(true)
    canvas.onmouseleave = () => setShowBrush(false)
    canvas.onmousedown = onMouseDown

    return () => {
      canvas.removeEventListener('mousemove', onMouseDrag)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onPointerUp)
      canvas.removeEventListener('touchstart', onPointerStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onPointerUp)
      canvas.onmouseenter = null
      canvas.onmouseleave = null
      canvas.onmousedown = null
    }
  }, [
    brushSize,
    context,
    file,
    draw,
    addLine,
    maskCanvas,
    image,
    currentEdit,
    firebase,
    scale,
    render,
    useHD,
  ])

  // Handle Cmd+Z
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (edits.length < 2 && !currentEdit.lines.length) {
        return
      }
      const isCmdZ = (event.metaKey || event.ctrlKey) && event.key === 'z'
      if (isCmdZ) {
        event.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [edits, currentEdit, undo])

  if (!image) {
    return <></>
  }

  return (
    <>
      <div
        className={[
          isInpaintingLoading
            ? 'animate-pulse-fast pointer-events-none transition-opacity'
            : '',
        ].join(' ')}
        style={{
          height: scale !== 1 ? image.naturalHeight * scale : undefined,
        }}
      >
        <div
          className={[scale !== 1 ? '' : 'relative'].join(' ')}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          <canvas
            className="rounded-sm"
            style={showBrush ? { cursor: 'none' } : {}}
            ref={r => {
              // console.log('ref', context)
              if (r && !context) {
                const ctx = r.getContext('2d')
                if (ctx) {
                  setContext(ctx)
                }
              }
            }}
          />
          <div
            className={[
              'absolute top-0 right-0 pointer-events-none',
              'overflow-hidden',
              'border-primary',
              showSeparator ? 'border-l-4' : '',
            ].join(' ')}
            style={{
              width: showOriginal
                ? `${Math.round(image.naturalWidth)}px`
                : '0px',
              height: image.naturalHeight,
              transitionProperty: 'width, height',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDuration: '300ms',
            }}
          >
            <img
              className="absolute right-0"
              src={image.src}
              alt="original"
              width={`${image.naturalWidth}px`}
              height={`${image.naturalHeight}px`}
              style={{
                width: `${image.naturalWidth}px`,
                height: `${image.naturalHeight}px`,
                maxWidth: 'none',
              }}
            />
          </div>
        </div>

        {showBrush && (
          <div
            className="hidden sm:block absolute rounded-full border border-primary bg-primary bg-opacity-80 pointer-events-none"
            style={{
              width: `${brushSize * scale}px`,
              height: `${brushSize * scale}px`,
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </div>

      <div
        className={[
          'absolute bottom-3',
          'flex items-center space-x-8 max-w-3xl',
          'bg-gray-200 bg-opacity-50 backdrop-blur px-4 rounded-2xl',
          'p-2 sm:px-6 sm:py-2',
          'fixed justify-evenly',
        ].join(' ')}
      >
        {edits.length > 1 || currentEdit.lines.length > 1 ? (
          <Button
            icon={
              <svg
                width="19"
                height="9"
                viewBox="0 0 19 9"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
              >
                <path
                  d="M2 1C2 0.447715 1.55228 0 1 0C0.447715 0 0 0.447715 0 1H2ZM1 8H0V9H1V8ZM8 9C8.55228 9 9 8.55229 9 8C9 7.44771 8.55228 7 8 7V9ZM16.5963 7.42809C16.8327 7.92721 17.429 8.14016 17.9281 7.90374C18.4272 7.66731 18.6402 7.07103 18.4037 6.57191L16.5963 7.42809ZM16.9468 5.83205L17.8505 5.40396L16.9468 5.83205ZM0 1V8H2V1H0ZM1 9H8V7H1V9ZM1.66896 8.74329L6.66896 4.24329L5.33104 2.75671L0.331035 7.25671L1.66896 8.74329ZM16.043 6.26014L16.5963 7.42809L18.4037 6.57191L17.8505 5.40396L16.043 6.26014ZM6.65079 4.25926C9.67554 1.66661 14.3376 2.65979 16.043 6.26014L17.8505 5.40396C15.5805 0.61182 9.37523 -0.710131 5.34921 2.74074L6.65079 4.25926Z"
                  fill="currentColor"
                />
              </svg>
            }
            onClick={undo}
          />
        ) : (
          <></>
        )}
        <div className="py-2">
          <Slider
            label={
              <span>
                <span className="hidden sm:inline">Brush </span>Size
              </span>
            }
            min={10}
            max={150}
            value={brushSize}
            onChange={setBrushSize}
          />
        </div>
        {editor.useHD ? (
          <Button
            primary
            disabled={isInpaintingLoading || currentEdit.lines.length <= 1}
            onClick={async () => {
              setIsInpaintingLoading(true)
              await render()
              setIsInpaintingLoading(false)
            }}
          >
            Clean HD
          </Button>
        ) : (
          <></>
        )}
      </div>
    </>
  )
}
