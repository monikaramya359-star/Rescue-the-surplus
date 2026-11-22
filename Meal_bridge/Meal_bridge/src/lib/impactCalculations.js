/**
 * Pure impact calculations. Inputs are donation/delivery records; no React, no fetching.
 * Assumption for the demo: one meal weighs 0.2 kg.
 */

export const KG_PER_MEAL = 0.2;

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
