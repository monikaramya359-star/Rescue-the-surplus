export const DONATION_STATUSES = ['Active', 'Claimed', 'Collected', 'Delivered', 'Expired', 'Cancelled']

export const FOOD_CATEGORIES = [
  'Cooked Meals',
  'Rice',
  'Bread',
  'Vegetables',
  'Fruits',
  'Packaged Food',
  'Other',
]

export const QUANTITY_UNITS = ['Meals', 'Kg', 'Packets']

export const STORAGE_CONDITIONS = [
  'Hot (above 60°C)',
  'Chilled (0-5°C)',
  'Room temperature',
  'Frozen',
]

export const seedDonations = [
  {
    id: 'd-101',
    foodName: 'Vegetable biryani trays',
    category: 'Cooked Meals',
    quantity: 30,
    unit: 'Meals',
    preparedAt: '2025-06-14T18:00:00',
    pickupDeadline: '2025-06-14T21:30:00',
    postedAt: '2025-06-14T18:30:00',
    storage: 'Hot (above 60°C)',
    allergens: 'Contains dairy, nuts',
    packaging: 'Sealed steel containers',
    pickupLocation: 'Saffron Kitchen, FC Road, Pune',
    image:
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    status: 'Active',
  },
  {
    id: 'd-102',
    foodName: 'Sourdough loaves',
    category: 'Bread',
    quantity: 20,
    unit: 'Packets',
    preparedAt: '2025-06-14T14:00:00',
    pickupDeadline: '2025-06-14T22:00:00',
    postedAt: '2025-06-14T15:00:00',
    storage: 'Room temperature',
    allergens: 'Contains gluten',
    packaging: 'Paper bags',
    pickupLocation: 'Saffron Kitchen, FC Road, Pune',
    image:
      'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=800&q=80',
    status: 'Active',
  },
  {
    id: 'd-103',
    foodName: 'Fresh fruit crates',
    category: 'Fruits',
    quantity: 12,
    unit: 'Kg',
    preparedAt: '2025-06-14T10:00:00',
    pickupDeadline: '2025-06-14T20:00:00',
    postedAt: '2025-06-14T11:00:00',
    storage: 'Chilled (0-5°C)',
    allergens: 'None',
    packaging: 'Ventilated plastic crates',
    pickupLocation: 'Saffron Kitchen, FC Road, Pune',
    image:
      'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80',
    status: 'Active',
  },
  {
    id: 'd-104',
    foodName: 'Paneer tikka wraps',
    category: 'Cooked Meals',
    quantity: 25,
    unit: 'Meals',
    preparedAt: '2025-06-14T16:00:00',
    pickupDeadline: '2025-06-14T20:15:00',
    postedAt: '2025-06-14T16:45:00',
    storage: 'Chilled (0-5°C)',
    allergens: 'Contains dairy, gluten',
    packaging: 'Foil-wrapped boxes',
    pickupLocation: 'Saffron Kitchen, FC Road, Pune',
    image:
      'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
    status: 'Claimed',
  },
  {
    id: 'd-105',
    foodName: 'Steamed basmati rice',
    category: 'Rice',
    quantity: 15,
    unit: 'Kg',
    preparedAt: '2025-06-13T19:00:00',
    pickupDeadline: '2025-06-14T08:00:00',
    postedAt: '2025-06-13T20:00:00',
    storage: 'Frozen',
    allergens: 'None',
    packaging: 'Sealed food-grade bags',
    pickupLocation: 'Saffron Kitchen, FC Road, Pune',
    image:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
    status: 'Collected',
  },
  {
    id: 'd-106',
    foodName: 'Dal rice combo meals',
    category: 'Cooked Meals',
    quantity: 40,
    unit: 'Meals',
    preparedAt: '2025-06-12T13:00:00',
    pickupDeadline: '2025-06-12T19:00:00',
    postedAt: '2025-06-12T14:00:00',
    storage: 'Hot (above 60°C)',
    allergens: 'None',
    packaging: 'Sealed steel containers',
    pickupLocation: 'Saffron Kitchen, FC Road, Pune',
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    status: 'Delivered',
  },
]

export const seedNotifications = [
  {
    id: 'n-1',
    title: 'Donation claimed',
    message: 'Hope Community Kitchen claimed Paneer tikka wraps. Pickup is due by 8:15 PM.',
    time: '10 min ago',
    read: false,
  },
  {
    id: 'n-2',
    title: 'Volunteer on the way',
    message: 'A volunteer has accepted the pickup for Steamed basmati rice.',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 'n-3',
    title: 'Delivery confirmed',
    message: 'Dal rice combo meals were delivered to Rise Shelter. Thank you for rescuing 40 meals.',
    time: 'Yesterday',
    read: true,
  },
  {
    id: 'n-4',
    title: 'Listing expired',
    message: 'Fresh fruit crates passed their pickup deadline without a claim. Consider a shorter window next time.',
    time: '2 days ago',
    read: true,
  },
]

export const donorProfile = {
  restaurantName: 'Saffron Kitchen',
  ownerName: 'Ravi Sharma',
  email: 'hello@saffronkitchen.example',
  phone: '+91 98220 11223',
  location: 'FC Road, Pune',
  donorType: 'Restaurant',
}
