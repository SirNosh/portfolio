import { NewsletterBookshelf } from '../ui/newsletter-bookshelf'
import { shelfBooks } from '../../app/books'

export default function Shelf() {
  return (
    <section id="shelf" className="shelf-stage">
      <NewsletterBookshelf
        className="shelf-fit"
        height="100%"
        brand=""
        items={shelfBooks}
      />
    </section>
  )
}
