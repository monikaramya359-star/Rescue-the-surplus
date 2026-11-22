import SectionHeading from '../ui/SectionHeading.jsx'
import FoodCard from './FoodCard.jsx'
import { useDemo } from '../../context/DemoContext.jsx'
import { donations } from '../../data/sampleData.js'

export default function AvailableFood() {
  const { showToast } = useDemo()

  return (
    <section id="available-food" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Available Food"
          title="Surplus food ready for pickup nearby"
          subtitle="Freshly listed donations from restaurants, bakeries and grocers. Request a pickup before the deadline."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {donations.map((donation) => (
            <FoodCard
              key={donation.id}
              donation={donation}
              onRequestPickup={() => showToast('Pickup request sent')}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
