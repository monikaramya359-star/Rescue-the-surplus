import { useEffect, useState } from 'react'
import { Handshake, Heart, Recycle } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading.jsx'
import { getLandingImpactStats } from '../../services/impactService.js'

const iconMap = { Heart, Handshake, Recycle }

export default function Impact() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let active = true

    getLandingImpactStats().then((result) => {
      if (active) setStats(result)
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <section id="impact" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Impact"
          title="Every rescued meal adds up"
          subtitle="Here is how the network of donors, NGOs and volunteers is making a measurable difference."
        />

        <p className="mx-auto mt-6 w-fit rounded-full bg-amber-100 px-4 py-1.5 text-center text-sm font-semibold text-amber-900">
          Illustrative demo statistics
        </p>

        {!stats ? (
          <p className="mt-12 text-center text-sm text-stone-600">Loading impact statistics…</p>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {stats.map((stat) => {
              const Icon = iconMap[stat.icon]
              return (
                <div
                  key={stat.id}
                  className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200/70 transition hover:shadow-lg"
                >
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <p className="mt-6 font-display text-4xl font-semibold text-primary-800 sm:text-5xl">
                    {stat.value.toLocaleString('en-IN')}
                    <span className="ml-2 text-2xl text-primary-600">{stat.unit}</span>
                  </p>
                  <p className="mt-3 text-base font-medium text-stone-700">{stat.label}</p>
                </div>
              )
            })}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-stone-500">
          Note: these numbers are sample data created for demonstration and are not real program results.
        </p>
      </div>
    </section>
  )
}
