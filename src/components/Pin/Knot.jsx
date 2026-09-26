import { useState } from 'react'
import TraceCard from '../TraceCard/TraceCard'
import { useDeviceProfile } from '../../hooks/useDeviceProfile'

export function Pin({ pin, thread = 'main', group, className = '' }) {
  return (
    <span
      className={`pin ${className}`}
      data-pin={pin}
      data-thread={thread}
      data-group={group}
    />
  )
}

export function Knot({
  pin,
  thread = 'main',
  group,
  drag = false,
  card,
  href,
  hero = false,
}) {
  const { fine } = useDeviceProfile()
  const [open, setOpen] = useState(false)
  const [visited, setVisited] = useState(false)

  const show = () => setOpen(true)
  const hide = () => setOpen(false)

  const onClick = (event) => {
    const host = event.currentTarget.parentElement
    if (host?.dataset.dragged === '1') {
      host.dataset.dragged = ''
      return
    }
    if (fine && href) {
      setVisited(true)
      window.open(href, '_blank', 'noopener')
      return
    }
    setOpen((value) => !value)
  }

  return (
    <span
      className={`knot ${hero ? 'knot-hero' : ''} ${visited ? 'is-visited' : ''}`}
      data-pin={pin}
      data-thread={thread}
      data-group={group}
      data-knot={hero ? 'hero' : '1'}
      data-drag={drag && fine ? '1' : undefined}
    >
      <button
        type="button"
        className="knot-hit"
        aria-expanded={open}
        aria-label={card?.kicker || pin}
        onMouseEnter={fine ? show : undefined}
        onMouseLeave={fine ? hide : undefined}
        onFocus={show}
        onBlur={hide}
        onClick={onClick}
      />
      {open && card ? <TraceCard {...card} /> : null}
    </span>
  )
}
