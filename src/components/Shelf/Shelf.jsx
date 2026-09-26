import { useState } from 'react'
import { NewsletterBookshelf } from '../ui/newsletter-bookshelf'
import { shelfBooks } from '../../app/books'

function Entry({ entry }) {
  return (
    <article className="book-page">
      {entry.status ? <p className="book-status">{entry.status}</p> : null}
      <h2>
        {entry.href ? (
          <a href={entry.href} target="_blank" rel="noopener noreferrer">{entry.title}</a>
        ) : entry.title}
      </h2>
      {entry.workingTitle ? <p className="book-working">{entry.workingTitle}</p> : null}
      {entry.paragraphs?.map((text) => <p key={text}>{text}</p>)}
      {entry.steps ? (
        <ol>
          {entry.steps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {step}
            </li>
          ))}
        </ol>
      ) : null}
      {entry.more?.map((text) => <p key={text}>{text}</p>)}
      {entry.roles ? (
        <ul>
          {entry.roles.map(([name, detail]) => (
            <li key={name}>
              <strong>{name}</strong>
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {entry.layers ? (
        <ul>
          {entry.layers.map(([name, detail]) => (
            <li key={name}>
              <strong>{name}</strong>
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {entry.decisions ? (
        <dl>
          {entry.decisions.map(([name, detail]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {entry.tiles ? (
        <ul>
          {entry.tiles.map(([name, detail]) => (
            <li key={name}>
              <strong>{name}</strong>
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {entry.quiet ? <p className="book-quiet">{entry.quiet}</p> : null}
      {entry.links ? (
        <p className="book-links">
          {entry.links.map((link) => (
            <a key={link.href + link.label} href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          ))}
        </p>
      ) : null}
      {entry.aside ? <p className="book-aside">{entry.aside}</p> : null}
    </article>
  )
}

export default function Shelf() {
  const [bookId, setBookId] = useState(null)
  const [page, setPage] = useState(0)
  const book = shelfBooks.find((item) => item.id === bookId) || null
  const entry = book?.pages[page]

  return (
    <section id="shelf" className="shelf-stage">
      <NewsletterBookshelf
        className="shelf-fit"
        height="100%"
        brand=""
        items={shelfBooks.map(({ id, title, date, color, foil }) => ({ id, title, date, color, foil }))}
        onSelect={(item) => {
          setBookId(item.id)
          setPage(0)
        }}
        onClose={() => setBookId(null)}
      />
      {book && entry ? (
        <div className="book-pages">
          <div className="book-sheet">
            <Entry entry={entry} />
            {book.pages.length > 1 ? (
              <div className="page-turn">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={page === 0}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                />
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={page === book.pages.length - 1}
                  onClick={() => setPage((current) => Math.min(book.pages.length - 1, current + 1))}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
