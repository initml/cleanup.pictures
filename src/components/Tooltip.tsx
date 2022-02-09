type TooltipProps = {
  children: any
}

export default function Tooltip(props: TooltipProps) {
  const { children } = props
  return (
    <div className="tooltip pointer-events-none relative mx-2 hidden sm:block">
      <div
        className={[
          'text-black bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
          'text-xs font-medium rounded-xl py-3 px-5 right-0 top-full whitespace-nowrap',
        ].join(' ')}
      >
        {children}
        <svg
          className={[
            'absolute text-gray-100 dark:text-gray-800 h-2 w-full left-0 bottom-0',
          ].join(' ')}
          style={{ transform: 'translateY(8px)' }}
          x="0px"
          y="0px"
          viewBox="0 0 255 255"
          xmlSpace="preserve"
        >
          <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
        </svg>
      </div>
    </div>
  )
}
