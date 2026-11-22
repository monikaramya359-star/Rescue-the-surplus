/**
 * Pure impact calculations. Inputs are donation/delivery records; no React, no fetching.
 * All conversion constants come from IMPACT_CONFIG (impactConfig.js).
 */

import { IMPACT_CONFIG } from './impactConfig.js';

export const KG_PER_MEAL = IMPACT_CONFIG.kgPerMeal;

// Completed deliveries only: a delivery counts for impact once its status is Delivered.
export function isCompletedDelivery(record) {
  return record.status === 'Delivered';
}

// Only meal-unit records count toward meals. Kg and Packets deliveries are excluded from meals.
export function mealsFromRecord(record) {
  return record.unit === 'Meals' ? Number(record.quantity) || 0 : 0;
}

export function wasteAvoidedKg(meals) {
  return Math.round(meals * KG_PER_MEAL * 10) / 10;
}

function countDistinct(items, key) {
  return new Set(items.map((item) => item[key])).size;
}

// Dashboard impact summary. Only Delivered deliveries count.
// mealsRescued = Meals-unit quantity from delivered deliveries (Kg and Packets excluded).
// wasteAvoidedKg = mealsRescued × KG_PER_MEAL.
// activeDonors = distinct donors with at least one donation in status 'Active'.
export function computeImpactSummary(deliveries, donations) {
  const delivered = deliveries.filter(isCompletedDelivery);
  const mealsRescued = delivered.reduce((sum, record) => sum + mealsFromRecord(record), 0);
  const activeDonations = donations.filter((donation) => donation.status === 'Active');

  return {
    mealsRescued,
    wasteAvoidedKg: wasteAvoidedKg(mealsRescued),
    successfulDonations: countDistinct(delivered, 'donationId'),
    completedDeliveries: delivered.length,
    activeDonors: countDistinct(activeDonations, 'donorId'),
    participatingNgos: countDistinct(delivered, 'receiverId'),
  };
}

export function mealsOverTime(deliveries) {
  const byMonth = new Map();
  deliveries
    .filter((record) => isCompletedDelivery(record) && record.unit === 'Meals')
    .forEach((record) => {
      byMonth.set(record.month, (byMonth.get(record.month) || 0) + mealsFromRecord(record));
    });

  return [...byMonth.entries()]
    .map(([month, meals]) => ({ month, meals }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function donationsByCategory(donations) {
  const counts = new Map();
  donations.forEach((donation) => {
    counts.set(donation.category, (counts.get(donation.category) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export function monthlyWasteAvoided(deliveries) {
  const byMonth = new Map();
  deliveries.filter(isCompletedDelivery).forEach((record) => {
    byMonth.set(record.month, (byMonth.get(record.month) || 0) + mealsFromRecord(record));
  });

  return [...byMonth.entries()]
    .map(([month, meals]) => ({ month, meals, wasteKg: wasteAvoidedKg(meals) }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function donorContributions(deliveries, donors) {
  const completed = deliveries.filter(isCompletedDelivery);

  return donors
    .map((donor) => {
      const mine = completed.filter((record) => record.donorId === donor.id);
      const meals = mine.reduce((sum, record) => sum + mealsFromRecord(record), 0);
      return {
        donorId: donor.id,
        name: donor.name,
        deliveries: mine.length,
        meals,
        wasteKg: wasteAvoidedKg(meals),
      };
    })
    .sort((a, b) => b.meals - a.meals || b.deliveries - a.deliveries);
}

export function formatMonthLabel(yyyyMm) {
  const [year, month] = yyyyMm.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
}

const DAY_MS = 86400000;
const PERIOD_DAYS = { week: 7, month: 30 };

// Timestamp used to place a listing in a period: completion time, falling back to last update.
export function listingTimestamp(listing) {
  const raw = listing.completedAt ?? listing.updatedAt ?? null;
  if (!raw) return null;
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? null : ms;
}

// period: 'week' (last 7 days) | 'month' (last 30 days) | 'all' (no cutoff).
// Records with no valid timestamp are excluded from week/month and kept for 'all'.
export function filterByPeriod(listings, period, now) {
  const days = PERIOD_DAYS[period];
  if (!days) return listings;
  const cutoff = now - days * DAY_MS;
  return listings.filter((listing) => {
    const ts = listingTimestamp(listing);
    return ts !== null && ts >= cutoff;
  });
}

// Impact totals from Delivered listings only.
// kgRescued = Kg-unit quantity + Meals-unit quantity × gramsPerMeal ÷ 1000 (Packets excluded).
// meals = kgRescued × 1000 ÷ gramsPerMeal.
// co2eKg = kgRescued × kgCo2ePerKgFood.
// Values are unrounded; round for display only.
export function computeImpact(listings, period = 'all', now = Date.now()) {
  const delivered = filterByPeriod((listings || []).filter(isCompletedDelivery), period, now);

  const kgRescued = delivered.reduce((sum, listing) => {
    const qty = Number(listing.quantity) || 0;
    if (listing.unit === 'Kg') return sum + qty;
    if (listing.unit === 'Meals') return sum + (qty * IMPACT_CONFIG.gramsPerMeal) / 1000;
    return sum;
  }, 0);
  const meals = (kgRescued * 1000) / IMPACT_CONFIG.gramsPerMeal;
  const co2eKg = kgRescued * IMPACT_CONFIG.kgCo2ePerKgFood;
  const completedPickups = delivered.length;
  const activeDonors = countDistinct(
    delivered.filter((listing) => listing.donorId != null),
    'donorId',
  );

  return {
    kgRescued,
    meals,
    co2eKg,
    completedPickups,
    activeDonors,
    isEmpty: completedPickups === 0,
    formulas: {
      kgRescued: `Kg rescued = Delivered Kg quantity + (Delivered Meals quantity × ${IMPACT_CONFIG.gramsPerMeal} g ÷ 1000)`,
      meals: `Meals = kg rescued × 1000 ÷ ${IMPACT_CONFIG.gramsPerMeal} g per meal`,
      co2e: `CO2e avoided = kg rescued × ${IMPACT_CONFIG.kgCo2ePerKgFood} kg CO2e per kg food`,
      completedPickups: 'Completed pickups = count of listings with status Delivered in the period',
      activeDonors: 'Active donors = distinct donors with a Delivered listing in the period',
    },
  };
}
