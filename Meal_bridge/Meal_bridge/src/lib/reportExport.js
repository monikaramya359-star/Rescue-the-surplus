// CSV report helpers for the admin and sponsor dashboards. Pure except downloadCsv, which triggers a browser download. Replace with a server-generated export when the backend is connected.

import { IMPACT_CONFIG } from './impactConfig.js';

const NEEDS_QUOTING = /[",\r\n]/;

function escapeCell(value) {
  const text = String(value ?? '');
  return NEEDS_QUOTING.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCell(row[header])).join(','));
  }
  return lines.join('\r\n');
}

export function downloadCsv(filename, rows) {
  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

const PERIOD_LABELS = { week: 'Last 7 days', month: 'Last 30 days', all: 'All time' };

// Display rounding only. Inputs come from computeImpact, which returns unrounded values.
export function formatImpactValue(value) {
  return (Number(value) || 0).toFixed(1);
}

// Plain-text donor report. Uses only computeImpact output and IMPACT_CONFIG; no new numbers.
export function buildDonorImpactReport(impact, period) {
  const lines = [
    'Impact report — synthetic sample data when seeded',
    `Period: ${PERIOD_LABELS[period] ?? period}`,
    '',
    `Completed pickups: ${impact.completedPickups}`,
    `Meals rescued: ${formatImpactValue(impact.meals)}`,
    `Kg rescued: ${formatImpactValue(impact.kgRescued)}`,
    `CO2e avoided (kg): ${formatImpactValue(impact.co2eKg)}`,
    `Active donors: ${impact.activeDonors}`,
    '',
    'Formulas:',
    `- ${impact.formulas.completedPickups}`,
    `- ${impact.formulas.kgRescued}`,
    `- ${impact.formulas.meals}`,
    `- ${impact.formulas.co2e}`,
    `- ${impact.formulas.activeDonors}`,
    '',
    `Source note: ${IMPACT_CONFIG.sourceNote}`,
    `Last updated: ${IMPACT_CONFIG.lastUpdated}`,
    '',
    'The platform does not provide tax or legal advice, and does not promise tax or legal benefits.',
  ];
  return lines.join('\r\n');
}

// Triggers a plain-text download. Revokes the object URL after the click has been dispatched.
export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
