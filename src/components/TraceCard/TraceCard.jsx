export default function TraceCard({ kicker, rows, note }) {
  return (
    <aside className="trace" role="note">
      <p className="trace-kicker">{kicker}</p>
      <dl>
        {rows.map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className="trace-note">{note}</p> : null}
    </aside>
  )
}
