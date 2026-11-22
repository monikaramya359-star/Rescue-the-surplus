import { Download, FileBarChart } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import { useAdmin } from '../../context/AdminContext.jsx'
import { downloadCsv } from '../../lib/reportExport.js'

export default function AdminReportsPage() {
  const { listings, stats } = useAdmin()

  const handleExport = () => {
    const rows = listings.map((listing) => ({
      Food: listing.foodName,
      Donor: listing.donorName,
      Quantity: listing.quantity,
      Unit: listing.unit,
      Status: listing.effectiveStatus,
    }))
    downloadCsv('food-listings.csv', rows)
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Export listing data as CSV, or open the sponsor CSR impact report."
        action={
          <Button variant="primary" icon={Download} type="button" onClick={handleExport}>
            Export listings (CSV)
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-xl font-semibold text-primary-800">Platform totals</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-stone-600">Registered users</dt>
              <dd className="font-display text-2xl font-semibold text-primary-800">{stats.registeredUsers}</dd>
            </div>
            <div>
              <dt className="text-sm text-stone-600">Expired listings</dt>
              <dd className="font-display text-2xl font-semibold text-primary-800">{stats.expiredListings}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <FileBarChart className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold text-primary-800">Sponsor CSR report</h2>
          <p className="mt-2 text-sm text-stone-600">Donation success rate and monthly impact for sponsors.</p>
          <Link
            to="/sponsor"
            className="mt-4 inline-flex text-sm font-semibold text-primary-700 hover:text-primary-800"
          >
            Open sponsor report
          </Link>
        </section>
      </div>
    </>
  )
}
