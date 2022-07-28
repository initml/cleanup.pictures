import { useCallback, useEffect, useRef, useState } from 'react'
import { useDebounce, useKeyPressEvent, useWindowSize } from 'react-use'
import {
  ReactZoomPanPinchRef,
  TransformComponent,
  TransformWrapper,
} from 'react-zoom-pan-pinch'
import { useFirebase } from './adapters/firebase'
import CleanupTools from './components/CleanupTools'
import ZoomTools from './components/ZoomTools'
import { useEditor } from './context/EditorContext'
import EditorToolSelector, { EditorTool } from './EditorToolSelector'

const TOOLBAR_SIZE = 180

interface EditorUIProps {
  showOriginal: boolean
  showSeparator: boolean
  setShowOriginal: (showOriginal: boolean) => void
  setShowSeparator: (showSeparator: boolean) => void
}

export default function EditorUI({
  showOriginal,
  showSeparator,
  setShowOriginal,
  setShowSeparator,
}: EditorUIProps) {
  const [{ x, y }, setCoords] = useState({ x: -1, y: -1 })
  const [showBrush, setShowBrush] = useState(false)
  const [isInpaintingLoading, setIsInpaintingLoading] = useState(false)
  const [tool, setTool] = useState<EditorTool>('clean')
  const firebase = useFirebase()
  const [minScale, setMinScale] = useState<number>()
  const windowSize = useWindowSize()
  const isSmallScreen = windowSize.width < 640
  const viewportRef = useRef<ReactZoomPanPinchRef | undefined | null>()
  const [brushSize, setBrushSize] = useState(isSmallScreen ? 90 : 50)
  // Save the scale to a state to refresh when the user zooms in.
  const [currScale, setCurrScale] = useState<number>(1)

  const editor = useEditor()
  const {
    image,
    undo,
    file,
    edits,
    addLine,
    context,
    render,
    draw,
    setContext,
    maskCanvas,
    useHD,
    refiner,
  } = editor
  const currentEdit = edits[edits.length - 1]

  // Zoom reset
  const resetZoom = useCallback(
    (duration = 200) => {
      if (!minScale || !image || !windowSize || !viewportRef.current) {
        return
      }
      const viewport = viewportRef.current
      const offsetX = (windowSize.width - image.width * minScale) / 2
      const offsetY = (windowSize.height - image.height * minScale) / 2
      viewport.setTransform(offsetX, offsetY, minScale, duration, 'easeOutQuad')
      setCurrScale(minScale)
    },
    [minScale, image, windowSize]
  )

  const setZoom = useCallback(
    (s: number) => {
      const viewport = viewportRef.current
      if (!viewport || !image) {
        return
      }
      // Get the percentage of the image currently on the center.
      const anchor = {
        x:
          (windowSize.width * 0.5 - viewport.state.positionX) /
          (image.width * viewport.state.scale),
        y:
          (windowSize.height * 0.5 - viewport.state.positionY) /
          (image.height * viewport.state.scale),
      }
      viewportRef.current?.setTransform(
        windowSize.width * 0.5 - image.width * s * anchor.x,
        windowSize.height * 0.5 - image.height * s * anchor.y,
        s,
        200,
        'easeOutQuad'
      )
      setCurrScale(s)
    },
    [windowSize.width, windowSize.height, image]
  )

  // Toggle original
  useEffect(() => {
    if (showOriginal) {
      setShowSeparator(true)
    } else {
      setTimeout(() => setShowSeparator(false), 300)
    }
  }, [showOriginal, setShowSeparator])

  // Toggle clean/zoom tool on spacebar.
  useKeyPressEvent(
    ' ',
    ev => {
      ev?.preventDefault()
      setShowBrush(false)
      setTool('zoom')
    },
    ev => {
      ev?.preventDefault()
      setShowBrush(true)
      setTool('clean')
    }
  )

  // Reset zoom on Escale
  useKeyPressEvent('Escape', resetZoom)

  // Reset zoom on HD change
  useEffect(() => resetZoom(0), [useHD, resetZoom])

  // Reset zoom on window size change
  useDebounce(resetZoom, 75, [windowSize])

  // Handle Tab
  useKeyPressEvent('Tab', undefined, ev => {
    ev?.preventDefault()
    ev?.stopPropagation()
    setShowOriginal(false)
  })

  // Handle Cmd+Z
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // Switch to original tool when we press tab. We dupli
      if (event.key === 'Tab') {
        event.preventDefault()
        setShowOriginal(true)
      }
      // Handle Cmdt+Z
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
  }, [edits, currentEdit, undo, setShowOriginal])

  // Draw once the image image is loaded
  useEffect(() => {
    if (!image) {
      return
    }
    const rW = windowSize.width / image.naturalWidth
    const rH = (windowSize.height - TOOLBAR_SIZE) / image.naturalHeight
    if (rW < 1 || rH < 1) {
      const s = Math.min(rW, rH)
      setMinScale(s)
      // setCurrScale(s)
    } else {
      setMinScale(1)
      // setCurrScale(1)
    }
    if (context?.canvas) {
      context.canvas.width = image.naturalWidth
      context.canvas.height = image.naturalHeight
    }
    draw()
  }, [context?.canvas, draw, image, windowSize])

  // Re-render when the refiner changes
  useEffect(() => {
    if (context) {
      setIsInpaintingLoading(true)
      render().finally(() => {
        setIsInpaintingLoading(false)
      })
    }
  }, [refiner]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle mouse interactions
  useEffect(() => {
    if (!firebase || !image || !context || tool !== 'clean') {
      return
    }
    const canvas = context?.canvas
    if (!canvas) {
      return
    }

    const onMouseDown = (ev: MouseEvent) => {
      if (!image.src || showOriginal) {
        return
      }
      const currLine = currentEdit.lines[currentEdit.lines.length - 1]
      const scale = viewportRef.current?.state.scale || 1
      currLine.size = brushSize / scale
      canvas.addEventListener('mousemove', onMouseDrag)
      canvas.addEventListener('mouseleave', onPointerUp)
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
      canvas.removeEventListener('mouseleave', onPointerUp)
      window.removeEventListener('mouseup', onPointerUp)
      if (!useHD && !isSmallScreen) {
        setIsInpaintingLoading(true)
        await render()
        setIsInpaintingLoading(false)
      } else {
        addLine(true)
      }
    }
    window.addEventListener('mousemove', onMouseMove)

    const onTouchMove = (ev: TouchEvent) => {
      ev.preventDefault()
      ev.stopPropagation()
      const currLine = currentEdit.lines[currentEdit.lines.length - 1]
      const coords = canvas.getBoundingClientRect()
      const scale = viewportRef.current?.state.scale || 1
      currLine.pts.push({
        x: (ev.touches[0].clientX - coords.x) / scale,
        y: (ev.touches[0].clientY - coords.y) / scale,
      })
      draw()
    }
    const onTouchStart = (ev: TouchEvent) => {
      ev.preventDefault()
      ev.stopPropagation()
      if (!image.src || showOriginal) {
        return
      }
      const s = viewportRef.current?.state.scale || 1
      const currLine = currentEdit.lines[currentEdit.lines.length - 1]
      currLine.size = brushSize / s
      const coords = canvas.getBoundingClientRect()
      const px = (ev.touches[0].clientX - coords.x) / s
      const py = (ev.touches[0].clientY - coords.y) / s
      onPaint(px, py)
    }
    canvas.addEventListener('touchstart', onTouchStart)
    canvas.addEventListener('touchmove', onTouchMove)
    canvas.addEventListener('touchend', onPointerUp)
    canvas.onmouseenter = () => setShowBrush(true)
    canvas.onmouseleave = () => setShowBrush(false)
    canvas.onmousedown = onMouseDown
    canvas.focus()

    return () => {
      canvas.removeEventListener('mousemove', onMouseDrag)
      canvas.removeEventListener('mouseleave', onPointerUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onPointerUp)
      canvas.removeEventListener('touchstart', onTouchStart)
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
    render,
    useHD,
    tool,
    viewportRef,
    // Add showBrush dependency to fix issue when moving the mouse while
    // pressing spacebar.
    showBrush,
    // Add dependency on minScale to fix offset issue with the first touch event
    // minScale,
    isSmallScreen,
    // Prevent drawing when showing the original image
    showOriginal,
  ])

  // Current cursor
  const getCursor = useCallback(() => {
    if (showOriginal) {
      return 'default'
    }
    if (showBrush) {
      return 'none'
    }
    if (tool === 'zoom') {
      return 'grab'
    }
    return undefined
  }, [showBrush, tool, showOriginal])

  if (!image || !minScale) {
    return <></>
  }

  return (
    <>
      <TransformWrapper
        ref={r => {
          if (r) {
            viewportRef.current = r
          }
        }}
        panning={{ disabled: tool !== 'zoom', velocityDisabled: true }}
        wheel={{ step: 0.05 }}
        centerZoomedOut
        alignmentAnimation={{ disabled: true }}
        centerOnInit
        limitToBounds={false}
        initialScale={minScale}
        minScale={minScale}
        onZoom={ref => {
          setCurrScale(ref.state.scale)
        }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentClass={
            isInpaintingLoading
              ? 'animate-pulse-fast pointer-events-none transition-opacity'
              : ''
          }
        >
          <>
            <canvas
              className="rounded-sm"
              style={{ cursor: getCursor() }}
              ref={r => {
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
          </>
        </TransformComponent>
      </TransformWrapper>

      {showBrush && tool === 'clean' && !showOriginal && (
        <div
          className={[
            'hidden sm:block fixed z-50 rounded-full pointer-events-none',
            'border border-primary bg-primary bg-opacity-80',
          ].join(' ')}
          style={{
            width: `${brushSize}px`,
            height: `${brushSize}px`,
            left: `${x}px`,
            top: `${y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      <div
        className={[
          'absolute w-full px-2 pb-2 sm:pb-0 flex',
          'justify-center flex-col sm:flex-row space-y-2 sm:space-y-0',
          'items-end sm:items-center bottom-0 pointer-events-none',
        ].join(' ')}
        style={{
          // Center the action bar in the white area available.
          height:
            windowSize.width > 640
              ? `${Math.max(
                  TOOLBAR_SIZE / 2,
                  (window.innerHeight - image.naturalHeight * currScale) / 2
                )}px`
              : undefined,
        }}
      >
        <EditorToolSelector tool={tool} onChange={setTool} />
        <div className="flex w-full justify-center sm:justify-start sm:w-90 pointer-events-auto">
          {tool === 'clean' && (
            <CleanupTools
              editor={editor}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              isLoading={isInpaintingLoading}
              onCleanupClick={async () => {
                setIsInpaintingLoading(true)
                await render()
                setIsInpaintingLoading(false)
              }}
            />
          )}
          {tool === 'zoom' && (
            <ZoomTools
              zoom={currScale || minScale}
              minZoom={minScale}
              setZoom={setZoom}
              onResetClick={resetZoom}
            />
          )}
        </div>
      </div>
    </>
  )
}
