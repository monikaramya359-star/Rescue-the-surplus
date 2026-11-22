import { ArrowLeft, Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  backTo = '/',
  backLabel = 'Back',
  wide = false,
}) {
  return (
    <div className="min-h-screen bg-cream px-4 py-10 sm:py-16">
      <div className={`mx-auto w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-lg sm:p-10">
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-stone-600 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {backLabel}
          </Link>

          <div className="mt-6 flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
              <Leaf className="h-7 w-7" aria-hidden="true" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-semibold text-primary-800">{title}</h1>
            {subtitle && <p className="mt-2 text-stone-600">{subtitle}</p>}
          </div>

          <div className="mt-8">{children}</div>

          {footer && (
            <div className="mt-8 border-t border-stone-200 pt-6 text-center text-sm text-stone-600">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
