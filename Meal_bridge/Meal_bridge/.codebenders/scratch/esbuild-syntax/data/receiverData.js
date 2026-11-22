import { FOOD_CATEGORIES } from "./donorData.js";
const RECEIVER_STATUSES = ["Available", "Claimed", "Collected", "Delivered", "Expired"];
const DISTANCE_OPTIONS = [
  { label: "Any distance", value: Infinity },
  { label: "Within 2 km", value: 2 },
  { label: "Within 5 km", value: 5 },
  { label: "Within 10 km", value: 10 }
];
const DEADLINE_OPTIONS = [
  { label: "Any time", value: Infinity },
  { label: "Closing within 2 hours", value: 2 },
  { label: "Closing within 6 hours", value: 6 },
  { label: "Closing within 24 hours", value: 24 }
];
const QUANTITY_OPTIONS = [
  { label: "Any quantity", value: 0 },
  { label: "At least 10", value: 10 },
  { label: "At least 25", value: 25 }
];
const ORGANIZATION_TYPES = ["NGO", "Community kitchen", "Shelter", "Food bank", "Other"];
function minutesFromNow(m) {
  return new Date(Date.now() + m * 6e4).toISOString();
}
const biryaniImage = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80";
const breadImage = "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=800&q=80";
const fruitImage = "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80";
const paneerImage = "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80";
const riceImage = "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80";
const saladImage = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80";
const r201Deadline = minutesFromNow(95);
const r202Deadline = minutesFromNow(360);
const r203Deadline = minutesFromNow(1200);
const seedListings = [
  {
    id: "r-201",
    foodName: "Vegetable biryani",
    category: "Cooked Meals",
    donorName: "Saffron Kitchen",
    donorType: "Restaurant",
    quantity: 40,
    claimedQuantity: 10,
    unit: "Meals",
    distanceKm: 1.2,
    preparedAt: minutesFromNow(-120),
    pickupDeadline: r201Deadline,
    storage: "Hot (above 60\xB0C)",
    allergens: "Contains dairy, gluten",
    pickupLocation: "FC Road, Pune",
    image: biryaniImage
  },
  {
    id: "r-202",
    foodName: "Sourdough loaves",
    category: "Bread",
    donorName: "Crust & Co. Bakery",
    donorType: "Bakery",
    quantity: 20,
    claimedQuantity: 8,
    unit: "Packets",
    distanceKm: 3.4,
    preparedAt: minutesFromNow(-240),
    pickupDeadline: r202Deadline,
    storage: "Room temperature",
    allergens: "Contains gluten",
    pickupLocation: "Baner Road, Pune",
    image: breadImage
  },
  {
    id: "r-203",
    foodName: "Fresh fruit crates",
    category: "Fruits",
    donorName: "Fresh Basket Grocers",
    donorType: "Grocery",
    quantity: 12,
    claimedQuantity: 5,
    unit: "Kg",
    distanceKm: 4.8,
    preparedAt: minutesFromNow(-480),
    pickupDeadline: r203Deadline,
    storage: "Chilled (0-5\xB0C)",
    allergens: "None declared",
    pickupLocation: "Kalyani Nagar, Pune",
    image: fruitImage
  },
  {
    id: "r-204",
    foodName: "Paneer tikka wraps",
    category: "Cooked Meals",
    donorName: "Spice Route Hotel",
    donorType: "Restaurant",
    quantity: 25,
    claimedQuantity: 25,
    unit: "Meals",
    distanceKm: 2.1,
    preparedAt: minutesFromNow(-200),
    pickupDeadline: minutesFromNow(180),
    storage: "Chilled (0-5\xB0C)",
    allergens: "Contains dairy, gluten",
    pickupLocation: "Koregaon Park, Pune",
    image: paneerImage
  },
  {
    id: "r-205",
    foodName: "Steamed rice and dal",
    category: "Rice",
    donorName: "Hostel Mess, Block C",
    donorType: "Hostel mess",
    quantity: 60,
    claimedQuantity: 0,
    unit: "Meals",
    distanceKm: 0.8,
    preparedAt: minutesFromNow(-300),
    pickupDeadline: minutesFromNow(-30),
    storage: "Hot (above 60\xB0C)",
    allergens: "None declared",
    pickupLocation: "Block C, Hostel Campus, Pune",
    image: riceImage
  },
  {
    id: "r-206",
    foodName: "Garden salad boxes",
    category: "Vegetables",
    donorName: "Green Leaf Caterers",
    donorType: "Caterer",
    quantity: 30,
    claimedQuantity: 5,
    unit: "Packets",
    distanceKm: 6.5,
    preparedAt: minutesFromNow(-60),
    pickupDeadline: minutesFromNow(240),
    storage: "Chilled (0-5\xB0C)",
    allergens: "None declared",
    pickupLocation: "Aundh, Pune",
    image: saladImage
  }
];
const seedClaims = [
  {
    id: "c-101",
    donationId: "r-201",
    foodName: "Vegetable biryani",
    donorName: "Saffron Kitchen",
    image: biryaniImage,
    quantityClaimed: 10,
    unit: "Meals",
    pickupLocation: "FC Road, Pune",
    storage: "Hot (above 60\xB0C)",
    allergens: "Contains dairy, gluten",
    pickupDeadline: r201Deadline,
    claimedAt: minutesFromNow(-40),
    status: "Claimed"
  },
  {
    id: "c-102",
    donationId: "r-203",
    foodName: "Fresh fruit crates",
    donorName: "Fresh Basket Grocers",
    image: fruitImage,
    quantityClaimed: 5,
    unit: "Kg",
    pickupLocation: "Kalyani Nagar, Pune",
    storage: "Chilled (0-5\xB0C)",
    allergens: "None declared",
    pickupDeadline: r203Deadline,
    claimedAt: minutesFromNow(-300),
    collectedAt: minutesFromNow(-180),
    status: "Collected"
  },
  {
    id: "c-103",
    donationId: "r-202",
    foodName: "Sourdough loaves",
    donorName: "Crust & Co. Bakery",
    image: breadImage,
    quantityClaimed: 8,
    unit: "Packets",
    pickupLocation: "Baner Road, Pune",
    storage: "Room temperature",
    allergens: "Contains gluten",
    pickupDeadline: r202Deadline,
    claimedAt: minutesFromNow(-540),
    collectedAt: minutesFromNow(-480),
    deliveredAt: minutesFromNow(-420),
    status: "Delivered"
  }
];
const seedNotifications = [
  {
    id: "n-1",
    title: "Pickup reminder",
    message: "Vegetable biryani from Saffron Kitchen is due for pickup by the deadline shown in My Claims.",
    time: "12 min ago",
    read: false
  },
  {
    id: "n-2",
    title: "Claim confirmed",
    message: "Your claim for Vegetable biryani from Saffron Kitchen has been confirmed.",
    time: "40 min ago",
    read: true
  },
  {
    id: "n-3",
    title: "New listing nearby",
    message: "Fresh fruit crates from Fresh Basket Grocers are closing soon, 4.8 km away.",
    time: "1 hour ago",
    read: false
  },
  {
    id: "n-4",
    title: "Delivery confirmed",
    message: "Sourdough loaves from Crust & Co. Bakery were delivered to your organization.",
    time: "Yesterday",
    read: true
  }
];
const receiverProfile = {
  organizationName: "Hope Community Kitchen",
  contactPerson: "Anita Desai",
  email: "contact@hopekitchen.example",
  phone: "+91 98900 45678",
  organizationType: "Community kitchen",
  location: "Kothrud, Pune",
  capacityMealsPerDay: 300
};
export {
  DEADLINE_OPTIONS,
  DISTANCE_OPTIONS,
  FOOD_CATEGORIES,
  ORGANIZATION_TYPES,
  QUANTITY_OPTIONS,
  RECEIVER_STATUSES,
  receiverProfile,
  seedClaims,
  seedListings,
  seedNotifications
};
