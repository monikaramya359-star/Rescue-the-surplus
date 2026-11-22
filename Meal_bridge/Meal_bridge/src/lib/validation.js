import { getRole } from '../data/authRoles.js'

const REQUIRED_MESSAGE = 'This field is required'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_PATTERN = /^\+?[\d\s-]+$/
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

const isValidPhone = (value) => {
  const digits = value.replace(/\D/g, '')
  return PHONE_PATTERN.test(value) && digits.length >= 7 && digits.length <= 15
}

const RULES_BY_TYPE = {
  email: (value) => (EMAIL_PATTERN.test(value.trim()) ? '' : 'Enter a valid email address'),
  tel: (value) => (isValidPhone(value.trim()) ? '' : 'Enter a valid phone number'),
  password: (value) =>
    PASSWORD_PATTERN.test(value)
      ? ''
      : 'Password must be at least 8 characters and include a letter and a number',
  text: (value) => (value.trim().length >= 2 ? '' : 'Must be at least 2 characters'),
}

function getFieldError(field, value) {
  if (!value.trim()) return field.required ? REQUIRED_MESSAGE : ''
  const rule = RULES_BY_TYPE[field.type]
  return rule ? rule(value) : ''
}

function withoutEmpty(entries) {
  return Object.fromEntries(entries.filter(([, message]) => message))
}

export function validateRegistration(roleKey, values = {}) {
  const role = getRole(roleKey)
  if (!role) return {}
  return withoutEmpty(
    role.fields.map((field) => [field.name, getFieldError(field, values[field.name] ?? '')]),
  )
}

export function validateLogin({ email = '', password = '' } = {}) {
  return withoutEmpty([
    ['email', email.trim() ? RULES_BY_TYPE.email(email) : 'Enter your email address'],
    ['password', password ? '' : 'Enter your password'],
  ])
}

export function validateForgotPassword({ email = '' } = {}) {
  return withoutEmpty([
    ['email', email.trim() ? RULES_BY_TYPE.email(email) : 'Enter your email address'],
  ])
}

const WHOLE_NUMBER_MESSAGE = 'Enter a whole number of at least 1'
const DEADLINE_MESSAGE = 'Pickup deadline must be after the preparation time'

const isBlank = (value) => !String(value ?? '').trim()

function requiredError(value) {
  return isBlank(value) ? REQUIRED_MESSAGE : ''
}

function fieldError(type, value) {
  return getFieldError({ required: true, type }, String(value ?? ''))
}

function wholeNumberError(value) {
  if (isBlank(value)) return REQUIRED_MESSAGE
  const number = Number(value)
  return Number.isInteger(number) && number >= 1 ? '' : WHOLE_NUMBER_MESSAGE
}

function pickupDeadlineError(pickupDeadline, preparedAt) {
  if (isBlank(pickupDeadline)) return REQUIRED_MESSAGE
  if (preparedAt && new Date(pickupDeadline) <= new Date(preparedAt)) return DEADLINE_MESSAGE
  return ''
}

export function validateFoodListing(values = {}) {
  return withoutEmpty([
    ['foodName', requiredError(values.foodName)],
    ['category', requiredError(values.category)],
    ['quantity', wholeNumberError(values.quantity)],
    ['unit', requiredError(values.unit)],
    ['preparedAt', requiredError(values.preparedAt)],
    ['pickupDeadline', pickupDeadlineError(values.pickupDeadline, values.preparedAt)],
    ['storage', requiredError(values.storage)],
    ['pickupLocation', requiredError(values.pickupLocation)],
  ])
}

export function validateDonorProfile(values = {}) {
  return withoutEmpty([
    ['restaurantName', requiredError(values.restaurantName)],
    ['ownerName', requiredError(values.ownerName)],
    ['email', fieldError('email', values.email)],
    ['phone', fieldError('tel', values.phone)],
    ['location', requiredError(values.location)],
    ['donorType', requiredError(values.donorType)],
  ])
}

export function validateOrganizationProfile(values = {}) {
  return withoutEmpty([
    ['organizationName', requiredError(values.organizationName)],
    ['contactPerson', requiredError(values.contactPerson)],
    ['email', fieldError('email', values.email)],
    ['phone', fieldError('tel', values.phone)],
    ['organizationType', requiredError(values.organizationType)],
    ['location', requiredError(values.location)],
    ['capacityMealsPerDay', wholeNumberError(values.capacityMealsPerDay)],
  ])
}

