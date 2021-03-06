interface LinkProps {
  children: string
  href: string
}

export default function Link(props: LinkProps) {
  const { children, href } = props
  return (
    <a href={href} className="font-black underline">
      {children}
    </a>
  )
}
