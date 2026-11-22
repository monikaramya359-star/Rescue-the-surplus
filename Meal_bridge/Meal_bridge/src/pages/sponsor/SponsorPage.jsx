import { useEffect, useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import CsrReportPreview from '../../components/sponsor/CsrReportPreview.jsx'
import DonorImpactReport from '../../components/sponsor/DonorImpactReport.jsx'
import SuccessRateCard from '../../components/sponsor/SuccessRateCard.jsx'
import { DonorProvider } from '../../context/DonorContext.jsx'
import { downloadCsv } from '../../lib/reportExport.js'
import { getSponsorData } from '../../services/sponsorService.js'

export default function SponsorPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    let active = true
    getSponsorData().then((result) => {
      if (active) setData(result)
    })
    return () => {
      active = false
    }
  }, [])

  if (!data) {
    return <p className="py-16 text-center text-stone-600">Loading sponsor report...</p>
  }

  const { summary, report } = data

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader title="Sponsor impact" description="Donation success and CSR impact for sponsoring partners." />

      <SuccessRateCard
        percent={summary.successRate}
        successful={summary.successfulDonations}
        total={summary.totalDonations}
      />

      <div className="mt-8">
        <CsrReportPreview
          report={report}
          onDownload={() => downloadCsv('csr-impact-report.csv', report.monthlyRows)}
        />
      </div>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="font-display text-xl text-stone-900">Business case</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-stone-800">What a busy caterer gets each week</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-stone-700">
              <li>Less time spent arranging disposal: surplus is posted once and claimed by a receiver.</li>
              <li>A possible reduction in disposal cost, depending on local collection arrangements.</li>
              <li>A compliance-friendly impact report that can be printed or downloaded for internal records.</li>
              <li>Less food sent to waste, shown as meals, kg and CO2e from the same formulas used across the platform.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-800">Who pays</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-stone-700">
              <li>Donor subscriptions pay for detailed impact reporting.</li>
              <li>CSR sponsors pay for community pickups and partner access.</li>
              <li>City authorities may fund pilots and public reporting.</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-xs text-stone-500">
          The platform does not provide tax or legal advice, and does not promise tax or legal benefits.
        </p>
      </section>

      <div className="mt-8">
        <DonorProvider>
          <DonorImpactReport />
        </DonorProvider>
      </div>
    </div>
  )
}
