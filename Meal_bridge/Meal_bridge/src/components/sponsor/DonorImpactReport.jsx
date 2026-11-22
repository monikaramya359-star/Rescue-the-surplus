import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Printer } from 'lucide-react'
import Button from '../ui/Button'
import { useDonor } from '../../context/DonorContext.jsx'
import { computeImpact } from '../../lib/impactCalculations.js'
import { IMPACT_CONFIG } from '../../lib/impactConfig.js'
import { buildDonorImpactReport, downloadText, formatImpactValue } from '../../lib/reportExport.js'

const PERIOD_OPTIONS = [
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
]

const SELECT_FOCUS =
  'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'

const ADD_LINK_CLASS =
  'inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'

export default function DonorImpactReport() {
  const { donations } = useDonor()
  const [period, setPeriod] = useState('all')

  const everDelivered = computeImpact(donations, 'all')
  if (everDelivered.isEmpty) {
    return (
      <article className="rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <h2 className="font-display text-2xl text-stone-900">Donor impact report</h2>
        <p className="mt-4 text-base text-stone-700">No completed pickups yet</p>
        <div className="mt-6">
          <Link to="/dashboard/donor/add" className={ADD_LINK_CLASS}>
            Post surplus food
          </Link>
        </div>
      </article>
    )
  }

  const impact = computeImpact(donations, period)
  const stats = [
    { label: 'Completed pickups', value: String(impact.completedPickups) },
    { label: 'Meals rescued', value: formatImpactValue(impact.meals) },
    { label: 'Kg rescued', value: formatImpactValue(impact.kgRescued) },
    { label: 'CO2e avoided (kg)', value: formatImpactValue(impact.co2eKg) },
  ]
  const formulaRows = [
    impact.formulas.completedPickups,
    impact.formulas.kgRescued,
    impact.formulas.meals,
    impact.formulas.co2e,
    impact.formulas.activeDonors,
  ]

  function handleDownload() {
    downloadText(`donor-impact-report-${period}.txt`, buildDonorImpactReport(impact, period))
  }

  return (
    <article className="donor-print-area rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Donor impact report</p>
        <h2 className="mt-2 font-display text-2xl text-stone-900 sm:text-3xl">Impact report — synthetic sample data when seeded</h2>
      </header>

      <div className="print:hidden mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label htmlFor="donor-report-period" className="block text-xs font-semibold text-stone-700">
            Period
          </label>
          <select
            id="donor-report-period"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className={`mt-1 ${SELECT_FOCUS}`}
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="primary" icon={Download} onClick={handleDownload}>
            Download donor report
          </Button>
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
            Print report
          </Button>
        </div>
      </div>

      {impact.isEmpty ? (
        <p className="mt-8 text-sm text-stone-600">No completed pickups in this period. Choose a longer period to see totals.</p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-cream p-4">
                <p className="font-display text-2xl text-primary-800">{stat.value}</p>
                <p className="mt-1 text-xs text-stone-600">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-stone-800">How each number is calculated</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-stone-700">
              {formulaRows.map((formula) => (
                <li key={formula}>{formula}</li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="mt-8 space-y-1 text-xs text-stone-500">
        <p>{`Source note: ${IMPACT_CONFIG.sourceNote}`}</p>
        <p>{`Last updated: ${IMPACT_CONFIG.lastUpdated}`}</p>
        <p>The platform does not provide tax or legal advice, and does not promise tax or legal benefits.</p>
      </div>
    </article>
  )
}
