// Mock volunteer data. Replace with Supabase queries when the backend is connected. Locations are fictional demo places.

export const TASK_STEPS = ['Claimed', 'Pickup Assigned', 'Collected', 'Delivered']

export const AVAILABILITY_OPTIONS = ['Weekdays', 'Weekends', 'Evenings', 'Flexible']

export const VEHICLE_OPTIONS = ['On foot', 'Bicycle', 'Scooter', 'Car']

function minutesFromNow(m) {
  return new Date(Date.now() + m * 60000).toISOString()
}

const biryaniImage =
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80'
const breadImage =
  'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=800&q=80'
const fruitImage =
  'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80'
const paneerImage =
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80'
const riceImage =
  'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80'
const saladImage =
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80'

export const seedAvailablePickups = [
  {
    id: 'p-301',
    donorId: 'saffron-kitchen',
    receiverId: 'hope-community-kitchen',
    receiverName: 'Hope Community Kitchen',
    listingId: 'r-201',
    claimId: 'c-101',
    foodName: 'Vegetable biryani',
    image: biryaniImage,
    donorName: 'Saffron Kitchen',
    pickupLocation: 'Harbor Lane Kitchen, 12 Mill Road, Demo Sector 4',
    receiverOrganization: 'Hope Community Kitchen',
    receiverLocation: 'Lakeside Community Hall, 8 Lake View Road, Demo Sector 2',
    quantity: 40,
    unit: 'Meals',
    distanceKm: 1.4,
    pickupDeadline: minutesFromNow(180),
    status: 'Claimed',
  },
  {
    id: 'p-302',
    donorId: 'crust-co-bakery',
    receiverId: 'little-hearts-shelter',
    receiverName: 'Little Hearts Shelter',
    listingId: 'r-202',
    claimId: null,
    foodName: 'Sourdough loaves',
    image: breadImage,
    donorName: 'Crust & Co. Bakery',
    pickupLocation: 'Old Mill Bakery, 45 Harbor Street, Demo Sector 1',
    receiverOrganization: 'Little Hearts Shelter',
    receiverLocation: 'Maple Court Shelter, 3 Orchard Lane, Demo Sector 6',
    quantity: 20,
    unit: 'Packets',
    distanceKm: 2.9,
    pickupDeadline: minutesFromNow(240),
    status: 'Claimed',
  },
  {
    id: 'p-303',
    donorId: 'fresh-basket-grocers',
    receiverId: 'sunrise-food-ngo',
    receiverName: 'Sunrise Food NGO',
    listingId: 'r-203',
    claimId: null,
    foodName: 'Fresh fruit crates',
    image: fruitImage,
    donorName: 'Fresh Basket Grocers',
    pickupLocation: 'Green Market Hub, 7 Station Square, Demo Sector 3',
    receiverOrganization: 'Sunrise Food NGO',
    receiverLocation: 'Sunrise Depot, 21 Canal Road, Demo Sector 5',
    quantity: 12,
    unit: 'Kg',
    distanceKm: 4.2,
    pickupDeadline: minutesFromNow(300),
    status: 'Claimed',
  },
  {
    id: 'p-304',
    donorId: 'hostel-mess-block-c',
    receiverId: 'riverside-night-shelter',
    receiverName: 'Riverside Night Shelter',
    listingId: 'r-205',
    claimId: null,
    foodName: 'Steamed rice and dal',
    image: riceImage,
    donorName: 'Hostel Mess, Block C',
    pickupLocation: 'Block C Dining Hall, 99 College Avenue, Demo Sector 7',
    receiverOrganization: 'Riverside Night Shelter',
    receiverLocation: 'Riverside Annex, 15 Bridge Road, Demo Sector 8',
    quantity: 60,
    unit: 'Meals',
    distanceKm: 0.9,
    pickupDeadline: minutesFromNow(45),
    status: 'Claimed',
  },
]

export const seedTasks = [
  {
    id: 't-101',
    pickupId: 'p-401',
    donorId: 'green-leaf-caterers',
    receiverId: 'hope-community-kitchen',
    receiverName: 'Hope Community Kitchen',
    listingId: 'r-206',
    claimId: null,
    volunteerId: 'vol-1',
    foodName: 'Garden salad boxes',
    image: saladImage,
    donorName: 'Green Leaf Caterers',
    pickupLocation: 'Aundh Hub, 4 Cedar Street, Demo Sector 9',
    receiverOrganization: 'Hope Community Kitchen',
    receiverLocation: 'Lakeside Community Hall, 8 Lake View Road, Demo Sector 2',
    quantity: 30,
    unit: 'Packets',
    distanceKm: 3.1,
    pickupDeadline: minutesFromNow(150),
    status: 'Pickup Assigned',
    assignedAt: minutesFromNow(-25),
    collectedAt: null,
    deliveredAt: null,
  },
  {
    id: 't-102',
    pickupId: 'p-402',
    donorId: 'spice-route-hotel',
    receiverId: 'little-hearts-shelter',
    receiverName: 'Little Hearts Shelter',
    listingId: 'r-204',
    claimId: null,
    volunteerId: 'vol-1',
    foodName: 'Paneer tikka wraps',
    image: paneerImage,
    donorName: 'Spice Route Hotel',
    pickupLocation: 'Orchid Terrace, 18 Garden Road, Demo Sector 4',
    receiverOrganization: 'Little Hearts Shelter',
    receiverLocation: 'Maple Court Shelter, 3 Orchard Lane, Demo Sector 6',
    quantity: 25,
    unit: 'Meals',
    distanceKm: 2.0,
    pickupDeadline: minutesFromNow(60),
    status: 'Collected',
    assignedAt: minutesFromNow(-120),
    collectedAt: minutesFromNow(-50),
    deliveredAt: null,
  },
  {
    id: 't-103',
    pickupId: 'p-403',
    donorId: 'fresh-basket-grocers',
    receiverId: 'sunrise-food-ngo',
    receiverName: 'Sunrise Food NGO',
    listingId: 'r-203',
    claimId: null,
    volunteerId: 'vol-1',
    foodName: 'Fresh fruit crates',
    image: fruitImage,
    donorName: 'Fresh Basket Grocers',
    pickupLocation: 'Canal Street Store, 30 Canal Street, Demo Sector 2',
    receiverOrganization: 'Sunrise Food NGO',
    receiverLocation: 'Sunrise Depot, 21 Canal Road, Demo Sector 5',
    quantity: 12,
    unit: 'Kg',
    distanceKm: 3.6,
    pickupDeadline: minutesFromNow(-100),
    status: 'Delivered',
    assignedAt: minutesFromNow(-300),
    collectedAt: minutesFromNow(-260),
    deliveredAt: minutesFromNow(-200),
  },
]

export const seedNotifications = [
  {
    id: 'vn-1',
    title: 'New pickup nearby',
    message: 'Vegetable biryani from Saffron Kitchen is available, 1.4 km away.',
    time: '5 min ago',
    read: false,
  },
  {
    id: 'vn-2',
    title: 'Pickup assigned',
    message: 'Garden salad boxes from Green Leaf Caterers has been assigned to you.',
    time: '25 min ago',
    read: true,
  },
  {
    id: 'vn-3',
    title: 'Pickup closing soon',
    message: 'The pickup for Garden salad boxes closes within the next 2 hours. Please collect on time.',
    time: '30 min ago',
    read: false,
  },
  {
    id: 'vn-4',
    title: 'Thank you',
    message: 'Fresh fruit crates were delivered to Sunrise Food NGO. Thank you for your help.',
    time: 'Yesterday',
    read: true,
  },
]

export const volunteerProfile = {
  id: 'vol-1',
  fullName: 'Arjun Mehta',
  email: 'arjun.mehta@volunteer.example',
  phone: '+91 98765 01234',
  location: 'Viman Nagar, Pune',
  availability: 'Evenings',
  vehicle: 'Bicycle',
}
