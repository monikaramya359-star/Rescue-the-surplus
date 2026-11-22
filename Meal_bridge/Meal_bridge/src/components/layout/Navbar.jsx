import { Leaf, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { navLinks } from '../../data/sampleData.js'

// Same classes as Button.jsx (base + size md + variant), applied to Link so it stays an anchor.
const linkBase =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 px-5 py-2.5 text-sm'
const outlineLinkClass = `${linkBase} border border-primary-600 bg-white text-primary-700 hover:bg-primary-50`
const primaryLinkClass = `${linkBase} bg-primary-600 text-white shadow-md shadow-primary-600/25 hover:bg-primary-700`

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-cream/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
        <a href="/" className="flex items-center gap-2 font-display text-xl font-semibold text-primary-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </span>
          Rescue the Surplus
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link to={`/${link.href}`} className="text-sm font-medium text-stone-700 transition hover:text-primary-700">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className={outlineLinkClass}>
            Login
          </Link>
          <Link to="/register" className={primaryLinkClass}>
            Get Started
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 md:hidden"
        >
          {menuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-stone-200 bg-white md:hidden">
          <ul className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={`/${link.href}`}
                  onClick={closeMenu}
                  className="block rounded-xl px-3 py-2.5 text-base font-medium text-stone-700 hover:bg-primary-50 hover:text-primary-700"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex gap-3 px-4 pb-4">
            <Link to="/login" onClick={closeMenu} className={`${outlineLinkClass} flex-1`}>
              Login
            </Link>
            <Link to="/register" onClick={closeMenu} className={`${primaryLinkClass} flex-1`}>
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
