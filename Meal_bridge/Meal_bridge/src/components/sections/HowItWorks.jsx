import { Package, Truck, Users } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading.jsx'
import { steps } from '../../data/sampleData.js'

const iconMap = { Package, Users, Truck }

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How It Works"
          title="From surplus to supper in three simple steps"
          subtitle="Rescue the Surplus keeps the handoff quick, local and well coordinated, so food reaches plates instead of bins."
        />

        <ol className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = iconMap[step.icon]
            return (
              <li
                key={step.id}
                className="relative rounded-3xl border border-stone-200/80 bg-cream p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-md shadow-primary-600/30">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <span className="font-display text-4xl font-semibold text-primary-200" aria-hidden="true">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold text-stone-900">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-stone-600">{step.description}</p>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
