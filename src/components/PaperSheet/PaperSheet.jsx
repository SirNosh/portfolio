export default function PaperSheet({ id, index, label, titleId, children, className = '', hidden = false }) {
  return (
    <section
      id={id}
      className={`chapter ${className}`}
      data-section={id}
      data-label={label}
      aria-labelledby={hidden ? undefined : titleId}
      aria-hidden={hidden || undefined}
    >
      <div className="sheet-motion">
        <div className="sheet">
          <p className="index-label">
            <span>{index}</span>
            {label}
          </p>
          {children}
        </div>
      </div>
    </section>
  )
}
