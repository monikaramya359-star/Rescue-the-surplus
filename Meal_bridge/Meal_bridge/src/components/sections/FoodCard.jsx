import { Clock, MapPin, Scale, Store } from 'lucide-react'
import Button from '../ui/Button.jsx'
import FoodImage from '../ui/FoodImage.jsx'

export default function FoodCard({ donation, onRequestPickup }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200/70 transition hover:-translate-y-1 hover:shadow-xl">
      <FoodImage src={donation.image} alt={donation.imageAlt} className="h-48 w-full" />

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold text-stone-900">{donation.title}</h3>
          <span className="shrink-0 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
            {donation.distance}
          </span>
        </div>

        <p className="mt-2 flex items-center gap-2 text-sm text-stone-600">
          <Store className="h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
          {donation.donor} · {donation.city}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-cream p-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-stone-500">
              <Scale className="h-3.5 w-3.5" aria-hidden="true" />
              Quantity
            </dt>
            <dd className="mt-1 font-semibold text-stone-900">{donation.quantity}</dd>
          </div>
          <div className="rounded-2xl bg-cream p-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-stone-500">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Pickup by
            </dt>
            <dd className="mt-1 font-semibold text-stone-900">{donation.pickupBy}</dd>
          </div>
        </dl>

        <p className="mt-4 flex items-center gap-1.5 text-sm text-stone-500">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {donation.distance} away
        </p>

        <Button className="mt-auto w-full" onClick={() => onRequestPickup(donation)}>
          Request Pickup
        </Button>
      </div>
    </article>
  )
}
