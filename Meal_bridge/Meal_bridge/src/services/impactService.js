/**
 * Impact data for the demo. Seeded deliveries and donations, plus Delivered tasks from the demo store.
 */
import {
  computeImpactSummary,
  mealsOverTime,
  donationsByCategory,
  monthlyWasteAvoided,
  donorContributions,
  KG_PER_MEAL,
  isCompletedDelivery,
} from '../lib/impactCalculations';
import { FOOD_CATEGORIES } from '../data/donorData';
import { getState } from '../lib/demoStore';
import { isSupabaseConfigured, supabase } from '../lib/supabase.js';

export const IMPACT_ASSUMPTION =
  'Demo assumption: one meal weighs 0.2 kg. Estimated waste avoided = successfully delivered meals × 0.2 kg. Only completed deliveries are counted.';

const donors = [
  { id: 'don-1', name: 'Saffron Kitchen', type: 'Restaurant' },
  { id: 'don-2', name: 'Crust & Co. Bakery', type: 'Bakery' },
  { id: 'don-3', name: 'Hostel Mess, Block C', type: 'Hostel mess' },
  { id: 'don-4', name: 'Green Leaf Caterers', type: 'Caterer' },
];

const receivers = [
  { id: 'rec-1', name: 'Hope Community Kitchen' },
  { id: 'rec-2', name: 'Rise Shelter' },
  { id: 'rec-3', name: 'Open Plate Trust' },
  { id: 'rec-4', name: 'Anand Old Age Home' },
];

const MONTHS = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];

const DONATION_STATUS_CYCLE = [
  'Delivered',
  'Delivered',
  'Collected',
  'Delivered',
  'Active',
  'Delivered',
  'Expired',
  'Claimed',
  'Delivered',
  'Delivered',
  'Cancelled',
  'Delivered',
];

const donations = Array.from({ length: 24 }, (_, index) => ({
  id: `dn-${index + 1}`,
  donorId: donors[index % donors.length].id,
  category: FOOD_CATEGORIES[index % FOOD_CATEGORIES.length],
  status: DONATION_STATUS_CYCLE[index % DONATION_STATUS_CYCLE.length],
}));

const deliveries = Array.from({ length: 36 }, (_, index) => {
  const donation = donations[(index * 5) % donations.length];
  const month = MONTHS[Math.floor(index / 6)];
  const status = index % 9 === 4 ? 'Collected' : index % 9 === 7 ? 'Claimed' : 'Delivered';
  const unit = index % 4 === 2 ? 'Kg' : index % 6 === 5 ? 'Packets' : 'Meals';

  return {
    id: `del-${String(index + 1).padStart(2, '0')}`,
    donationId: donation.id,
    donorId: donation.donorId,
    receiverId: receivers[index % receivers.length].id,
    category: donation.category,
    unit,
    quantity: 10 + ((index * 7) % 25),
    status,
    completedAt: status === 'Delivered' ? `${month}-15T12:00:00.000Z` : null,
    month,
  };
});

// Returns the existing entry for a name, or adds one to the given copy of the list.
function ensureEntry(list, name, idPrefix, extra = {}) {
  const existing = list.find((item) => item.name === name);
  if (existing) return existing;
  const entry = { id: `${idPrefix}-${list.length + 1}`, name, ...extra };
  list.push(entry);
  return entry;
}

// SUPABASE SEAM: the data source for getImpactData will become Supabase queries (food_claims and
// impact_records joined to donors and receivers). Keep the same return shape so the dashboard does not change.
export async function getImpactData() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('impact_records')
      .select('id,claim_id,donor_id,receiver_id,category,quantity,unit,estimated_waste_avoided_kg,completed_at')
      .order('completed_at', { ascending: false })
    if (!error && data) {
      const deliveries = data.map((row) => ({
        id: row.id,
        donationId: row.claim_id,
        donorId: row.donor_id,
        receiverId: row.receiver_id,
        category: row.category,
        unit: row.unit,
        quantity: row.quantity,
        status: 'Delivered',
        completedAt: row.completed_at,
        month: row.completed_at?.slice(0, 7),
      }))
      const donations = deliveries.map((row) => ({
        id: row.donationId,
        donorId: row.donorId,
        category: row.category,
        status: 'Delivered',
      }))
      const allDonors = Array.from(new Map(deliveries.map((row) => [row.donorId, { id: row.donorId, name: 'Donor', type: 'Organization' }])).values())
      const summary = computeImpactSummary(deliveries, donations)
      return {
        summary,
        deliveredListings: deliveries,
        mealsOverTime: mealsOverTime(deliveries),
        categoryBreakdown: donationsByCategory(donations),
        monthlyWaste: monthlyWasteAvoided(deliveries),
        donorContributions: donorContributions(deliveries, allDonors),
        recentSuccessfulDonations: deliveries.slice(0, 5).map((record) => ({
          id: record.id,
          donorName: 'Donor',
          category: record.category,
          quantity: record.quantity,
          unit: record.unit,
          completedAt: record.completedAt,
          receiverId: record.receiverId,
        })),
        kgPerMeal: KG_PER_MEAL,
      }
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Copies, so session donors/receivers never change the seed lists.
  const allDonors = [...donors];
  const allReceivers = [...receivers];

  // Deliveries completed in this session from the demo store, on top of the seed deliveries.
  const sessionRecords = getState().sessionDeliveries.map((task) => {
    const donor = ensureEntry(allDonors, task.donorName, 'don-s', { type: 'Other' });
    const receiver = ensureEntry(allReceivers, task.receiverOrganization, 'rec-s');
    return {
      id: `session-${task.id}`,
      donationId: task.pickupId ?? task.id,
      donorId: donor.id,
      receiverId: receiver.id,
      category: task.category,
      unit: task.unit,
      quantity: task.quantity,
      status: 'Delivered',
      completedAt: task.deliveredAt,
      month: task.deliveredAt.slice(0, 7),
    };
  });
  const allDeliveries = [...deliveries, ...sessionRecords];

  const summary = computeImpactSummary(allDeliveries, donations);

  const recentSuccessfulDonations = allDeliveries.filter(isCompletedDelivery)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 5)
    .map((record) => ({
      id: record.id,
      donorName: allDonors.find((donor) => donor.id === record.donorId)?.name ?? 'Unknown donor',
      category: record.category,
      quantity: record.quantity,
      unit: record.unit,
      completedAt: record.completedAt,
      receiverId: record.receiverId,
    }));

  return {
    summary,
    deliveredListings: allDeliveries,
    mealsOverTime: mealsOverTime(allDeliveries),
    categoryBreakdown: donationsByCategory(donations),
    monthlyWaste: monthlyWasteAvoided(allDeliveries),
    donorContributions: donorContributions(allDeliveries, allDonors),
    recentSuccessfulDonations,
    kgPerMeal: KG_PER_MEAL,
  };
}

// Landing page stats, derived from the same summary as the dashboard.
export async function getLandingImpactStats() {
  const { summary } = await getImpactData();
  return [
    { id: 'meals', icon: 'Heart', value: summary.mealsRescued, unit: 'meals', label: 'Meals rescued' },
    {
      id: 'donations',
      icon: 'Handshake',
      value: summary.successfulDonations,
      unit: 'donations',
      label: 'Donations completed',
    },
    { id: 'waste', icon: 'Recycle', value: summary.wasteAvoidedKg, unit: 'kg', label: 'Food waste avoided' },
  ];
}
