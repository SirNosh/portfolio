import Chapter from '../components/Chapter/Chapter'

export default function ExperienceSection() {
  return (
    <Chapter id="experience" index="08" label="Experience" tone="light" titleId="experience-title">
      <h2 id="experience-title">
        Operational systems, not just experiments<span className="dot">.</span>
      </h2>
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
    </Chapter>
  )
}
