import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import ListingCard from '../../components/receiver/ListingCard.jsx'
import DonationDetailsModal from '../../components/receiver/DonationDetailsModal.jsx'
import ClaimModal from '../../components/receiver/ClaimModal.jsx'
import { useReceiver } from '../../context/ReceiverContext.jsx'
import { useDemo } from '../../context/DemoContext.jsx'
import {
  DEADLINE_OPTIONS,
  DISTANCE_OPTIONS,
  FOOD_CATEGORIES,
  QUANTITY_OPTIONS,
} from '../../data/receiverData.js'

const CATEGORY_OPTIONS = [
  { label: 'All categories', value: '' },
  ...FOOD_CATEGORIES.map((category) => ({ label: category, value: category })),
]

const DEFAULT_FILTERS = { category: '0', distance: '0', quantity: '0', deadline: '0' }

const MS_PER_HOUR = 3600000

function FilterSelect({ id, label, value, options, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-stone-800">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        {options.map((option, index) => (
          <option key={option.label} value={String(index)}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function AvailableFoodPage() {
  const { listings, now } = useReceiver()
  const { showToast } = useDemo()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedListing, setSelectedListing] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [claimOpen, setClaimOpen] = useState(false)

  const updateFilter = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }))

  const resetFilters = () => setFilters(DEFAULT_FILTERS)

  const availableListings = useMemo(
    () => listings.filter((listing) => listing.status === 'Available'),
    [listings],
  )

  const visibleListings = useMemo(() => {
    const category = CATEGORY_OPTIONS[Number(filters.category)].value
    const maxKm = DISTANCE_OPTIONS[Number(filters.distance)].value
    const minQty = QUANTITY_OPTIONS[Number(filters.quantity)].value
    const maxHours = DEADLINE_OPTIONS[Number(filters.deadline)].value

    return availableListings
      .filter((listing) => {
        const hoursLeft = (new Date(listing.pickupDeadline) - now) / MS_PER_HOUR
        const withinDistance =
          listing.distanceKm == null ? !Number.isFinite(maxKm) : listing.distanceKm <= maxKm
        return (
          (category === '' || listing.category === category) &&
          withinDistance &&
          listing.availableQuantity >= minQty &&
          hoursLeft > 0 &&
          hoursLeft <= maxHours
        )
      })
      .sort((a, b) => new Date(a.pickupDeadline) - new Date(b.pickupDeadline))
  }, [availableListings, filters, now])

  const handleView = (listing) => {
    setSelectedListing(listing)
    setDetailsOpen(true)
  }

  const handleClaimFromDetails = (listing) => {
    setSelectedListing(listing)
    setDetailsOpen(false)
    setClaimOpen(true)
  }

  const handleClaimed = () => {
    showToast('Claim confirmed (demo, stored in this session). Track it under My Claims.')
    setClaimOpen(false)
  }

  return (
    <div>
      <PageHeader
        title="Available Food"
        description="Surplus food near you, ready to claim before the pickup deadline."
      />

      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            id="filter-category"
            label="Food category"
            value={filters.category}
            options={CATEGORY_OPTIONS}
            onChange={updateFilter('category')}
          />
          <FilterSelect
            id="filter-distance"
            label="Distance"
            value={filters.distance}
            options={DISTANCE_OPTIONS}
            onChange={updateFilter('distance')}
          />
          <FilterSelect
            id="filter-quantity"
            label="Quantity"
            value={filters.quantity}
            options={QUANTITY_OPTIONS}
            onChange={updateFilter('quantity')}
          />
          <FilterSelect
            id="filter-deadline"
            label="Pickup deadline"
            value={filters.deadline}
            options={DEADLINE_OPTIONS}
            onChange={updateFilter('deadline')}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-stone-500">
            {`Showing ${visibleListings.length} of ${availableListings.length} listings`}
          </p>
          <Button variant="outline" type="button" className="w-full sm:w-auto" onClick={resetFilters}>
            Reset filters
          </Button>
        </div>
      </div>

      {visibleListings.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visibleListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              now={now}
              onView={handleView}
              onClaim={handleClaimFromDetails}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center shadow-sm">
          <Search className="h-10 w-10 text-stone-400" aria-hidden="true" />
          <p className="mt-4 text-stone-600">No food matches these filters.</p>
          <Button variant="outline" type="button" className="mt-4" onClick={resetFilters}>
            Reset filters
          </Button>
        </div>
      )}

      <DonationDetailsModal
        listing={selectedListing}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onClaim={handleClaimFromDetails}
      />

      <ClaimModal
        listing={selectedListing}
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        onClaimed={handleClaimed}
      />
    </div>
  )
}
