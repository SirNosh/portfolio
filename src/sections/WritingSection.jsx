import PaperSheet from '../components/PaperSheet/PaperSheet'
import MarginalNote from '../components/MarginalNote/MarginalNote'
import { Pin } from '../components/Pin/Knot'

export default function WritingSection() {
  return (
    <PaperSheet id="writing" index="09" label="Writing" titleId="writing-title" className="chapter-empty">
      <div className="sheet-grid">
        <div className="prose" data-copy>
          <h2 id="writing-title">Writing</h2>
          <p className="writing-line">None as of now :P</p>
        </div>
        <MarginalNote>Apparently, building the systems came first.</MarginalNote>
      </div>
      <div className="spine">
        <Pin pin="g-write" />
      </div>
    </PaperSheet>
  )
}
