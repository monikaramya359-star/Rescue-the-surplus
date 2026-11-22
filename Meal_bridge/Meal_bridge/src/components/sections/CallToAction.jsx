import { Building2, Store } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { useDemo } from '../../context/DemoContext.jsx'

export default function CallToAction() {
  const { openDemo } = useDemo()

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary-800 px-6 py-14 text-center shadow-xl sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-600/40 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary-500/30 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Join the rescue network in your city
            </h2>
            <p className="mt-4 text-base leading-relaxed text-primary-100 sm:text-lg">
              Restaurants, caterers and NGOs can work together to turn surplus into meals. Joining takes minutes and makes a difference from the first pickup.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="light"
                icon={Store}
                onClick={() =>
                  openDemo(
                    'Join as a Restaurant',
                    'Restaurant onboarding comes with the backend.',
                  )
                }
              >
                Join as a Restaurant
              </Button>
              <Button
                size="lg"
                variant="ghost"
                icon={Building2}
                onClick={() =>
                  openDemo(
                    'Register Your NGO',
                    'NGO registration comes with the backend.',
                  )
                }
              >
                Register Your NGO
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
