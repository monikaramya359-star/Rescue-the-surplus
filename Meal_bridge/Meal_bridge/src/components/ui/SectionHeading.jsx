export default function SectionHeading({ eyebrow, title, subtitle, align = 'center' }) {
  const alignment = align === 'left' ? 'text-left' : 'mx-auto text-center'

  return (
    <div className={`max-w-2xl ${alignment}`}>
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">{eyebrow}</p>
      )}
      <h2 className="mt-3 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-stone-600 sm:text-lg">{subtitle}</p>}
    </div>
  )
}
