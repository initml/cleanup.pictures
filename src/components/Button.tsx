import React, { ReactNode, useState } from 'react'

interface ButtonProps {
  children: ReactNode
  className?: string
  icon?: ReactNode
  primary?: boolean
  onClick?: () => void
  onDown?: (ev: PointerEvent) => void
  onUp?: (ev: PointerEvent) => void
}

export default function Button(props: ButtonProps) {
  const { children, className, icon, primary, onClick, onDown, onUp } = props
  const [active, setActive] = useState(false)
  let background = ''
  if (primary) {
    background = 'bg-primary hover:bg-black hover:text-white'
  }
  if (active) {
    background = 'bg-black text-white'
  }
  if (!primary && !active) {
    background = 'hover:bg-primary'
  }
  return (
    <div
      role="button"
      onKeyDown={onClick}
      onClick={onClick}
      onPointerDown={(ev: React.PointerEvent<HTMLDivElement>) => {
        setActive(true)
        onDown?.(ev.nativeEvent)
      }}
      onPointerUp={(ev: React.PointerEvent<HTMLDivElement>) => {
        setActive(false)
        onUp?.(ev.nativeEvent)
      }}
      tabIndex={-1}
      className={[
        'inline-flex sm:space-x-3 py-3 px-5 rounded-md cursor-pointer',
        background,
        className,
      ].join(' ')}
    >
      {icon}
      <span className="whitespace-nowrap select-none">{children}</span>
    </div>
  )
}
