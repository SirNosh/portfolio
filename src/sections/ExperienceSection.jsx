import PaperSheet from '../components/PaperSheet/PaperSheet'
import { Knot } from '../components/Pin/Knot'

export default function ExperienceSection() {
  return (
    <PaperSheet id="experience" index="08" label="Experience" titleId="experience-title">
      <div className="prose" data-copy>
        <h2 id="experience-title">Operational systems, not just experiments.</h2>
        <article>
          <h3>Safe Guard Products International</h3>
          <p>
            Vision-language work on claim images: preprocessing, targeted visual regions, and YOLO-assisted localization. I also worked on an internal agentic claims assistant that surfaced the policy that applied while a form was being filled. That assistant is internal.
          </p>
        </article>
        <article>
          <h3>MEDxAI</h3>
          <p>
            End-to-end machine learning for prediction and recommendation, then the part that decides whether any of it matters: production integration, reliability, and efficiency.
          </p>
        </article>
        <p className="quiet">Computer Science, Georgia State University.</p>
      </div>
      <div className="spine">
        <Knot
          pin="g-exp"
          card={{
            kicker: 'IN PRODUCTION',
            rows: [
              ['Safe Guard', 'Internal claims assistant'],
              ['MEDxAI', 'Models that had to ship'],
            ],
          }}
        />
      </div>
    </PaperSheet>
  )
}
