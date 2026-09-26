export default function ExternalLink({ href, children, className = '' }) {
  return (
    <a className={`out ${className}`} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span aria-hidden="true"> ↗</span>
    </a>
  )
}
