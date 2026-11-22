/**
 * Synthetic sponsor data for the demo. Replace the body of getSponsorData with Supabase aggregate queries that return the same shape. All figures are fictional.
 */

import { wasteAvoidedKg } from '../lib/impactCalculations';

export const SPONSOR_ASSUMPTION =
  'Demo assumption: one meal weighs 0.2 kg. Estimated food waste avoided = successfully delivered meals × 0.2 kg. Figures are synthetic and illustrative.';

const MONTHLY_DATA = [
  { month: '2025-01', donations: 18, successfulDonations: 15, meals: 1240 },
  { month: '2025-02', donations: 22, successfulDonations: 19, meals: 1610 },
  { month: '2025-03', donations: 25, successfulDonations: 22, meals: 1890 },
  { month: '2025-04', donations: 27, successfulDonations: 25, meals: 2100 },
  { month: '2025-05', donations: 31, successfulDonations: 28, meals: 2480 },
  { month: '2025-06', donations: 34, successfulDonations: 31, meals: 2760 },
];

const RESTAURANTS_PARTICIPATING = 14;
const NGOS_SUPPORTED = 9;

const monthlyTrend = MONTHLY_DATA.map((row) => ({
  month: row.month,
  meals: row.meals,
  wasteKg: wasteAvoidedKg(row.meals),
  donations: row.donations,
  successfulDonations: row.successfulDonations,
}));

const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);

const mealsRescued = sum(monthlyTrend, 'meals');
const totalDonations = sum(monthlyTrend, 'donations');
const successfulDonations = sum(monthlyTrend, 'successfulDonations');
const successRate = totalDonations ? Math.round((successfulDonations / totalDonations) * 100) : 0;
const totalWasteAvoidedKg = wasteAvoidedKg(mealsRescued);

const summary = {
  mealsRescued,
  wasteAvoidedKg: totalWasteAvoidedKg,
  restaurantsParticipating: RESTAURANTS_PARTICIPATING,
  ngosSupported: NGOS_SUPPORTED,
  totalDonations,
  successfulDonations,
  successRate,
};

const report = {
  title: 'Rescue the Surplus - CSR Impact Report',
  period: 'January to June 2025',
  generatedOn: '2025-07-01',
  preparedFor: 'Demo Sponsor Foundation',
  assumption: SPONSOR_ASSUMPTION,
  highlights: [
    { label: 'Meals rescued', value: mealsRescued },
    { label: 'Food waste avoided (kg)', value: totalWasteAvoidedKg },
    { label: 'Donation success rate (%)', value: successRate },
    { label: 'NGOs supported', value: NGOS_SUPPORTED },
  ],
  monthlyRows: monthlyTrend.map((row) => ({
    Month: row.month,
    Donations: row.donations,
    'Successful donations': row.successfulDonations,
    'Meals rescued': row.meals,
    'Waste avoided (kg)': row.wasteKg,
  })),
};

export async function getSponsorData() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    assumption: SPONSOR_ASSUMPTION,
    summary,
    monthlyTrend,
    report,
  };
}
