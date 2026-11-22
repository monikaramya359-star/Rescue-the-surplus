import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import ListingCard from '../../components/receiver/ListingCard.jsx'
import DonationDetailsModal from '../../components/receiver/DonationDetailsModal.jsx'
import ClaimModal from '../../components/receiver/ClaimModal.jsx'
import { useReceiver } from '../../context/ReceiverContext.jsx'
import { useDemo } from '../../context/DemoContext.jsx'
import { DEADLINE_OPTIONS, FOOD_CATEGORIES } from '../../data/receiverData.js'
import {
  estimateDistanceKm,
  isListingFeedEligible,
  scoreListing,
} from '../../lib/matchingScore.js'

const CATEGORY_OPTIONS = [
  { label: 'All categories', value: '' },
  ...FOOD_CATEGORIES.map((category) => ({ label: category, value: category })),
]

const DEFAULT_FILTERS = { category: '0', maxDistance: '15', minQuantity: '', deadline: '0' }

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
  const { listings, now, profile } = useReceiver()
  const { showToast } = useDemo()
  const navigate = useNavigate()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedListing, setSelectedListing] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [claimOpen, setClaimOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [sort, setSort] = useState('best-match')
  const updateFilter = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }))

  const resetFilters = () => setFilters(DEFAULT_FILTERS)

  const widenRadius = () =>
    setFilters((prev) => ({
      ...prev,
      maxDistance: String(Math.max(1, Number(prev.maxDistance) || 0) * 2),
    }))

  const feed = useMemo(() => {
    const category = CATEGORY_OPTIONS[Number(filters.category)].value
    const maxKm = filters.maxDistance === '' ? Infinity : Number(filters.maxDistance)
    const minQty = filters.minQuantity === '' ? 0 : Number(filters.minQuantity)
    const maxHours = DEADLINE_OPTIONS[Number(filters.deadline)].value
    const search = searchText.trim().toLowerCase()

    const receiver = {
      area: profile?.area || profile?.location || 'Kothrud, Pune',
      capacityMeals: profile?.capacityMealsPerDay || 300,
    }

    const eligible = listings
      .filter((listing) => isListingFeedEligible(listing, now))
      .map((listing) => {
        const pickupArea = listing.pickupArea ?? listing.pickupLocation
        const { score, reasons } = scoreListing(
          { ...listing, pickupArea, quantity: listing.availableQuantity },
          receiver,
          now,
        )
        const distanceKm = estimateDistanceKm(pickupArea, receiver.area)
        return {
          listing: { ...listing, match: { distanceKm, score, reasons } },
          distanceKm,
          score,
        }
      })

    const passing = eligible.filter(({ listing }) => {
      const hoursLeft = (new Date(listing.pickupDeadline) - now) / MS_PER_HOUR
      const searchable = [
        listing.foodName,
        listing.donorName,
        listing.category,
        listing.pickupLocation,
      ].join(' ').toLowerCase()
      return (
        searchable.includes(search) &&
        (category === '' || listing.category === category) &&
        listing.availableQuantity >= minQty &&
        hoursLeft <= maxHours
      )
    })

    const withinDistance = passing.filter((item) => item.distanceKm <= maxKm)

    const comparators = {
      'best-match': (a, b) => b.score - a.score,
      soonest: (a, b) => new Date(a.listing.pickupDeadline) - new Date(b.listing.pickupDeadline),
      nearest: (a, b) => a.distanceKm - b.distanceKm || b.score - a.score,
    }

    return {
      visible: [...withinDistance].sort(comparators[sort] ?? comparators['best-match']),
      eligibleCount: eligible.length,
      beyondRadius: passing.length > 0 && withinDistance.length === 0,
    }
  }, [listings, filters, now, searchText, sort, profile])


  const handleView = (listing) => {
    navigate(`/dashboard/receiver/listings/${listing.id}`)
  }

  const handleClaimFromDetails = (listing) => {
    setSelectedListing(listing)
    setDetailsOpen(false)
    setClaimOpen(true)
  }

  const handleClaimed = () => {
    showToast('Claim confirmed. Track it under My Claims.')
    setClaimOpen(false)
  }

  return (
    <div>
      <PageHeader
        title="Available Food"
        description="Surplus food near you, ready to claim before the pickup deadline."
      />

      <div className="mb-4">
        <label htmlFor="listing-search" className="sr-only">Search listings</label>
        <input
          id="listing-search"
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search food, donor or pickup area"
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        />
      </div>

      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            id="filter-category"
            label="Food category"
            value={filters.category}
            options={CATEGORY_OPTIONS}
            onChange={updateFilter('category')}
          />
          <div>
            <label htmlFor="filter-max-distance" className="block text-sm font-semibold text-stone-800">
              Max distance (km, approximate)
            </label>
            <input
              id="filter-max-distance"
              type="number"
              min="0"
              step="1"
              value={filters.maxDistance}
              onChange={(event) => updateFilter('maxDistance')(event.target.value)}
              className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="filter-min-quantity" className="block text-sm font-semibold text-stone-800">
              Minimum quantity
            </label>
            <input
              id="filter-min-quantity"
              type="number"
              min="0"
              step="1"
              placeholder="Any"
              value={filters.minQuantity}
              onChange={(event) => updateFilter('minQuantity')(event.target.value)}
              className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
          </div>
          <FilterSelect
            id="filter-deadline"
            label="Pickup deadline"
            value={filters.deadline}
            options={DEADLINE_OPTIONS}
            onChange={updateFilter('deadline')}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold text-stone-800">
            Sort
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3"
            >
              <option value="best-match">Best match</option>
              <option value="soonest">Soonest expiry</option>
              <option value="nearest">Nearest</option>
            </select>
          </label>
        </div>


        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-stone-500">
            {`Showing ${feed.visible.length} of ${feed.eligibleCount} listings`}
          </p>
          <Button variant="outline" type="button" className="w-full sm:w-auto" onClick={resetFilters}>
            Reset filters
          </Button>
        </div>
      </div>

      {feed.visible.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {feed.visible.map(({ listing }) => (
            <div key={listing.id} className="flex flex-col gap-3">
              <ListingCard
                listing={listing}
                now={now}
                onView={handleView}
                onClaim={handleClaimFromDetails}
              />
              <ul aria-label="Why this matches" className="list-disc space-y-1 pl-6 text-sm text-stone-600">
                {listing.match.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center shadow-sm">
          <Search className="h-10 w-10 text-stone-400" aria-hidden="true" />
          {feed.eligibleCount === 0 ? (
            <p className="mt-4 text-stone-600">No food available right now</p>
          ) : feed.beyondRadius ? (
            <>
              <p className="mt-4 text-stone-600">{`No listings within ${filters.maxDistance} km.`}</p>
              <Button type="button" className="mt-3" onClick={widenRadius}>
                Widen radius
              </Button>
            </>
          ) : (
            <p className="mt-4 text-stone-600">No food matches these filters.</p>
          )}
          {feed.eligibleCount > 0 && (
            <Button variant="outline" type="button" className="mt-4" onClick={resetFilters}>
              Reset filters
            </Button>
          )}
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
