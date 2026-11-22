import { getRole } from '../data/authRoles.js'
import { validateAllergens } from './allergens.js'

// Copied from the food_listings CHECK constraints. Keep in sync with the database.
export const LISTING_CATEGORIES = ['Cooked Meals', 'Rice', 'Bread', 'Vegetables', 'Fruits', 'Packaged Food', 'Other']
export const LISTING_UNITS = ['Meals', 'Kg', 'Packets']
export const LISTING_STORAGE_CONDITIONS = ['Hot (above 60°C)', 'Chilled (0-5°C)', 'Room temperature', 'Frozen']

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
const DEADLINE_MESSAGE = 'Pickup-by time must be in the future'
const DEADLINE_ORDER_MESSAGE = 'Pickup-by time must be after the preparation time'
const FOOD_NAME_MESSAGE = 'Food name must be 2-120 characters'
const LISTING_QUANTITY_MAX = 10000
const LISTING_QUANTITY_MESSAGE = 'Enter a whole number from 1 to 10000'
const PICKUP_LOCATION_MESSAGE = 'Pickup location must be 2-200 characters'

const DEFAULT_LISTING_UNIT = 'Meals'
const isBlank = (value) => !String(value ?? '').trim()

function requiredError(value) {
  return isBlank(value) ? REQUIRED_MESSAGE : ''
}

function lengthError(value, min, max, message) {
  const length = String(value ?? '').trim().length
  return length >= min && length <= max ? '' : message
}

function optionalLengthError(value, min, max, message) {
  if (isBlank(value)) return ''
  return lengthError(value, min, max, message)
}

function enumError(value, options, message) {
  if (isBlank(value)) return REQUIRED_MESSAGE
  return options.includes(value) ? '' : message
}

function optionalEnumError(value, options, message) {
  if (isBlank(value)) return ''
  return options.includes(value) ? '' : message
}

function listingQuantityError(value) {
  if (isBlank(value)) return REQUIRED_MESSAGE
  const number = Number(value)
  return Number.isInteger(number) && number >= 1 && number <= LISTING_QUANTITY_MAX
    ? ''
    : LISTING_QUANTITY_MESSAGE
}

function optionalDateError(value) {
  if (isBlank(value)) return ''
  return Number.isNaN(new Date(value).getTime()) ? 'Enter a valid date and time' : ''
}

function allergenList(allergens) {
  if (Array.isArray(allergens)) return allergens
  return String(allergens ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
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
  const deadline = new Date(pickupDeadline)
  if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) return DEADLINE_MESSAGE
  if (!isBlank(preparedAt) && deadline <= new Date(preparedAt)) return DEADLINE_ORDER_MESSAGE
  return ''
}

// Pure. Returns { fieldName: message } for every invalid field; {} means valid.
export function validateFoodListing(values = {}) {
  const allergenErrors = validateAllergens(allergenList(values.allergens))
  return withoutEmpty([
    ['foodName', requiredError(values.foodName) || lengthError(values.foodName, 2, 120, FOOD_NAME_MESSAGE)],
    ['category', optionalEnumError(values.category, LISTING_CATEGORIES, 'Choose a category from the list')],
    ['quantity', listingQuantityError(values.quantity)],
    ['unit', enumError(isBlank(values.unit) ? DEFAULT_LISTING_UNIT : values.unit, LISTING_UNITS, 'Choose a unit from the list')],
    ['preparedAt', optionalDateError(values.preparedAt)],
    ['pickupDeadline', pickupDeadlineError(values.pickupDeadline, values.preparedAt)],
    ['storage', optionalEnumError(values.storage, LISTING_STORAGE_CONDITIONS, 'Choose a storage condition from the list')],
    ['pickupLocation', optionalLengthError(values.pickupLocation, 2, 200, PICKUP_LOCATION_MESSAGE)],
    ['allergens', allergenErrors.length ? `Unknown allergen: ${allergenErrors.join(', ')}` : ''],
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

