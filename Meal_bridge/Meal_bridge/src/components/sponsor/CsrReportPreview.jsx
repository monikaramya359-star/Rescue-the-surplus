import { Download, Leaf } from 'lucide-react'
import Button from '../ui/Button'

export default function CsrReportPreview({ report, onDownload }) {
  const highlights = report.highlights || []
  const monthlyRows = report.monthlyRows || []
  const columns = Object.keys(monthlyRows[0] || {})
  const columnCount = columns.length || 1

  return (
    <article className="rounded-3xl border border-t-4 border-stone-200 border-t-primary-600 bg-white p-6 shadow-sm sm:p-10">
      <header>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          <Leaf className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary-700">
          CSR impact report preview
        </p>
        <h2 className="mt-2 font-display text-2xl text-stone-900 sm:text-3xl">{report.title}</h2>
        <p className="mt-2 text-sm text-stone-600">
          {`${report.period} · Generated ${report.generatedOn} · Prepared for ${report.preparedFor}`}
        </p>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {highlights.map((highlight) => (
          <div key={highlight.label} className="rounded-2xl bg-cream p-4">
            <p className="font-display text-2xl text-primary-800">{highlight.value}</p>
            <p className="mt-1 text-xs text-stone-600">{highlight.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} className="border-b px-3 py-2 text-left font-semibold text-stone-700">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthlyRows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-3 py-2 text-center text-stone-500">
                  No rows
                </td>
              </tr>
            ) : (
              monthlyRows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'bg-stone-50' : undefined}>
                  {columns.map((column) => (
                    <td key={column} className="px-3 py-2 text-stone-800">
                      {row[column]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-stone-500">{report.assumption}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="primary" icon={Download} type="button" onClick={onDownload}>
          Download report (CSV)
        </Button>
      </div>
    </article>
  )
}
