import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import SectionHeading from '../ui/SectionHeading.jsx'
import FoodCard from './FoodCard.jsx'
import { useDemo } from '../../context/DemoContext.jsx'
import { donations } from '../../data/sampleData.js'
import { getState, subscribe } from '../../lib/demoStore.js'
import { isSupabaseConfigured } from '../../lib/supabase.js'
import { getAvailableListings, normalizeListing } from '../../services/mealService.js'

const getDemoListings = () => getState().listings

function toDonationCard(listing) {
  const deadline = new Date(listing.pickupDeadline)
  const availableQuantity = listing.availableQuantity ??
    Number(listing.quantity) - Number(listing.claimedQuantity || 0)
  const city = listing.pickupLocation?.split(',').pop()?.trim() || 'Nearby'

  return {
    id: listing.id,
    title: listing.foodName,
    donor: listing.donorName || 'Food donor',
    city,
    quantity: `${availableQuantity} ${listing.unit}`,
    pickupBy: Number.isNaN(deadline.getTime())
      ? 'Time unavailable'
      : deadline.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    distance: 'Nearby',
    image: listing.image || listing.imageUrl || '',
    imageAlt: `Donated food: ${listing.foodName}`,
  }
}

function isAvailable(listing) {
  return (
    (!listing.status || listing.status === 'Active') &&
    Number(listing.quantity) - Number(listing.claimedQuantity || 0) > 0 &&
    new Date(listing.pickupDeadline).getTime() > Date.now()
  )
}

export default function AvailableFood() {
  const { showToast } = useDemo()
  const demoListings = useSyncExternalStore(subscribe, getDemoListings)
  const [supabaseListings, setSupabaseListings] = useState([])
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    let active = true
    async function loadListings() {
      try {
        const result = await getAvailableListings()
        if (!active) return
        if (!result.ok) {
          setLoadError(result.message)
          return
        }
        setLoadError('')
        setSupabaseListings((result.data || []).map(normalizeListing))
      } catch {
        if (active) setLoadError('We could not load food listings. Please try again later.')
      }
    }

    loadListings()
    return () => { active = false }
  }, [])

  const recentDonations = useMemo(() => {
    const listings = isSupabaseConfigured
      ? supabaseListings
      : demoListings.filter((listing) => String(listing.id).startsWith('d-'))
    return listings.filter(isAvailable).map(toDonationCard)
  }, [demoListings, supabaseListings])

  return (
    <section id="available-food" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Available Food"
          title="Surplus food ready for pickup nearby"
          subtitle="Freshly listed donations from restaurants, bakeries and grocers. Request a pickup before the deadline."
        />

        {loadError && (
          <p role="status" className="mt-6 text-center text-sm text-red-700">
            {loadError}
          </p>
        )}

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recentDonations.map((donation) => (
            <FoodCard
              key={donation.id}
              donation={donation}
              onRequestPickup={() => showToast('Pickup request sent')}
            />
          ))}
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
