import { NewsletterBookshelf } from '../ui/newsletter-bookshelf'
import { shelfBooks } from '../../app/books'

export default function Shelf() {
  return (
    <section id="shelf" className="shelf-stage">
      {/* The library's own studio: seen through the laptop's display, then all around you. */}
      <div className="shelf-backdrop" aria-hidden="true">
        <div className="field-studio is-light" />
        <div className="field-studio is-dark" />
        <div className="field-grain" />
      </div>
      <NewsletterBookshelf
        className="shelf-fit"
        height="100%"
        items={shelfBooks}
      />
      <div className="shelf-glass" aria-hidden="true" />
    </section>
  )
}
