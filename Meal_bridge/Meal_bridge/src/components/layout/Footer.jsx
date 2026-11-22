import { Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDemo } from '../../context/DemoContext.jsx'
import { footerLinks } from '../../data/sampleData.js'

const privacyText =
  'This describes how Rescue the Surplus handles personal data such as contact details and pickup records. The full privacy policy will be published with the launch.'

function FooterColumn({ title, children }) {
  return (
    <div>
      <h3 className="font-display text-base font-semibold text-stone-900">{title}</h3>
      <div className="mt-4 space-y-3 text-sm text-stone-600">{children}</div>
    </div>
  )
}

// In-page section links use the router so they work from any route; other links stay plain anchors.
function FooterLinkList({ links }) {
  return links.map((link) =>
    link.href.startsWith('#') ? (
      <Link key={link.label} to={`/${link.href}`} className="block transition hover:text-primary-700">
        {link.label}
      </Link>
    ) : (
      <a key={link.label} href={link.href} className="block transition hover:text-primary-700">
        {link.label}
      </a>
    ),
  )
}

export default function Footer() {
  const { openDemo } = useDemo()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <FooterColumn title="About">
            <p className="flex items-center gap-2 font-display text-base font-semibold text-primary-800">
              <Leaf className="h-5 w-5 text-primary-600" aria-hidden="true" />
              Rescue the Surplus
            </p>
            <p className="leading-relaxed">
              A food rescue platform connecting donors with nearby NGOs, community kitchens and volunteers.
            </p>
            <FooterLinkList links={footerLinks.about} />
          </FooterColumn>

          <FooterColumn title="Contact">
            <FooterLinkList links={footerLinks.contact} />
          </FooterColumn>

          <FooterColumn title="How It Works">
            <FooterLinkList links={footerLinks.howItWorks} />
          </FooterColumn>

          <FooterColumn title="Privacy Policy">
            <button
              type="button"
              onClick={() => openDemo('Privacy Policy', privacyText)}
              className="text-left transition hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Read our privacy policy
            </button>
          </FooterColumn>
        </div>

        <p className="mt-12 border-t border-stone-200 pt-6 text-center text-sm text-stone-500">
          © {year} Rescue the Surplus. Illustrative project.
        </p>
      </div>
    </footer>
  )
}
