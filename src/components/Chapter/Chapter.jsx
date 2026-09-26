import { useRef } from 'react'
import Rule from '../Rule/Rule'
import { useReveal } from '../../hooks/useReveal'

export default function Chapter({
  id,
  index,
  label,
  tone = 'dark',
  titleId,
  hero = false,
  book,
  children,
}) {
  const ref = useRef(null)
  useReveal(ref)

  return (
    <section
      ref={ref}
      id={id}
      className={`chapter tone-${tone}${hero ? ' is-hero' : ''}`}
      data-tone={tone}
      data-book={book || undefined}
      aria-labelledby={titleId}
    >
      <div className="chapter-copy">
        <p className="kicker">
          <span>{index}</span>
          {label}
        </p>
        <Rule immediate={hero} />
        {children}
      </div>
    </section>
  )
}
