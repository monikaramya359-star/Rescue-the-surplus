export const ROLE_ORDER = ['donor', 'receiver', 'volunteer']

const EMAIL_FIELD = {
  name: 'email',
  label: 'Email address',
  type: 'email',
  placeholder: 'you@example.com',
  autoComplete: 'email',
  required: true,
}

const PHONE_FIELD = {
  name: 'phone',
  label: 'Phone number',
  type: 'tel',
  placeholder: '+91 98765 43210',
  autoComplete: 'tel',
  required: true,
}

const PASSWORD_FIELD = {
  name: 'password',
  label: 'Password',
  type: 'password',
  placeholder: 'At least 8 characters',
  autoComplete: 'new-password',
  required: true,
}

const LOCATION_FIELD = {
  name: 'location',
  label: 'Location (city / area)',
  type: 'text',
  placeholder: 'e.g. Koramangala, Bengaluru',
  autoComplete: 'address-level2',
  required: true,
}

export const ROLES = {
  donor: {
    key: 'donor',
    title: 'Donate Food',
    shortLabel: 'Donor',
    registerTitle: 'Register as a Food Donor',
    accent: 'Rescue surplus',
    description: 'Restaurants, cafés and caterers share surplus meals before they go to waste.',
    icon: 'Store',
    fields: [
      {
        name: 'restaurantName',
        label: 'Restaurant name',
        type: 'text',
        placeholder: 'e.g. Green Leaf Bistro',
        autoComplete: 'organization',
        required: true,
      },
      {
        name: 'ownerName',
        label: 'Owner name',
        type: 'text',
        placeholder: 'e.g. Priya Sharma',
        autoComplete: 'name',
        required: true,
      },
      EMAIL_FIELD,
      PHONE_FIELD,
      PASSWORD_FIELD,
      LOCATION_FIELD,
    ],
  },
  receiver: {
    key: 'receiver',
    title: 'Receive Food',
    shortLabel: 'Receiver',
    registerTitle: 'Register as a Food Receiver',
    accent: 'Source surplus',
    description: 'NGOs, shelters and community kitchens collect food and feed people in need.',
    icon: 'Handshake',
    fields: [
      {
        name: 'organizationName',
        label: 'Organization name',
        type: 'text',
        placeholder: 'e.g. Hope Kitchen Trust',
        autoComplete: 'organization',
        required: true,
      },
      {
        name: 'contactPerson',
        label: 'Contact person',
        type: 'text',
        placeholder: 'e.g. Rahul Mehta',
        autoComplete: 'name',
        required: true,
      },
      EMAIL_FIELD,
      PHONE_FIELD,
      {
        name: 'organizationType',
        label: 'Organization type',
        type: 'select',
        options: ['NGO', 'Community kitchen', 'Shelter', 'Food bank', 'Other'],
        autoComplete: 'off',
        required: true,
      },
      LOCATION_FIELD,
      PASSWORD_FIELD,
    ],
  },
  volunteer: {
    key: 'volunteer',
    title: 'Volunteer',
    shortLabel: 'Volunteer',
    registerTitle: 'Register as a Volunteer',
    accent: 'Move the food',
    description: 'Pick up surplus food and deliver it to the people who need it most.',
    icon: 'Bike',
    fields: [
      {
        name: 'fullName',
        label: 'Full name',
        type: 'text',
        placeholder: 'e.g. Ananya Iyer',
        autoComplete: 'name',
        required: true,
      },
      EMAIL_FIELD,
      PHONE_FIELD,
      LOCATION_FIELD,
      {
        name: 'availability',
        label: 'Availability',
        type: 'select',
        options: ['Weekdays', 'Weekends', 'Evenings', 'Flexible'],
        autoComplete: 'off',
        required: true,
      },
      PASSWORD_FIELD,
    ],
  },
}

export function getRole(key) {
  return Object.hasOwn(ROLES, key) ? ROLES[key] : undefined
}
