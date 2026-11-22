import { useEffect, useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import CsrReportPreview from '../../components/sponsor/CsrReportPreview.jsx'
import SuccessRateCard from '../../components/sponsor/SuccessRateCard.jsx'
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
    </div>
  )
}
