import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertCircle, CheckCircle2, PlusCircle, Save, X } from 'lucide-react'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import FoodImage from '../../components/ui/FoodImage.jsx'
import { useDonor } from '../../context/DonorContext.jsx'
import { ALLERGEN_OPTIONS } from '../../lib/allergens.js'
import {
  LISTING_CATEGORIES,
  LISTING_STORAGE_CONDITIONS,
  LISTING_UNITS,
  validateFoodListing,
} from '../../lib/validation.js'
import { uploadListingImage } from '../../services/uploadService.js'

const DONATIONS_PATH = '/dashboard/donor/donations'
const EDITABLE_STATUSES = ['Active', 'Claimed']
const NO_ALLERGEN_TEXT = ['', 'None', 'None declared']
const DISCLAIMER =
  'This platform connects donors and receivers. It does not certify that food is safe. Follow the handling guidance and time limits.'
// Order used to focus the first invalid field after a failed submit.
const FIELD_ORDER = [
  'foodName',
  'category',
  'quantity',
  'unit',
  'preparedAt',
  'pickupDeadline',
  'storage',
  'pickupLocation',
  'allergens',
]

// Formats a date as the local "YYYY-MM-DDTHH:mm" string that datetime-local inputs expect.
function toDatetimeLocal(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function hoursFromNow(hours) {
  return toDatetimeLocal(Date.now() + hours * 60 * 60 * 1000)
}

function parseAllergens(text) {
  if (NO_ALLERGEN_TEXT.includes(text)) return []
  // Unknown legacy entries are dropped here; only the fixed list can be selected.
  return String(text)
    .split(',')
    .map((item) => item.trim())
    .filter((item) => ALLERGEN_OPTIONS.includes(item))
}

function buildInitialValues(donation, defaultLocation) {
  if (!donation) {
    return {
      foodName: '',
      category: '',
      quantity: '',
      unit: 'Meals',
      preparedAt: '',
      pickupDeadline: hoursFromNow(2),
      storage: 'Room temperature',
      allergens: [],
      packaging: '',
      pickupLocation: defaultLocation ?? '',
    }
  }
  return {
    foodName: donation.foodName ?? '',
    category: donation.category ?? '',
    quantity: String(donation.quantity ?? ''),
    unit: donation.unit ?? 'Meals',
    preparedAt: toDatetimeLocal(donation.preparedAt),
    pickupDeadline: toDatetimeLocal(donation.pickupDeadline),
    storage: donation.storage ?? '',
    allergens: parseAllergens(donation.allergens),
    packaging: donation.packaging === 'Not specified' ? '' : (donation.packaging ?? ''),
    pickupLocation: donation.pickupLocation ?? defaultLocation ?? '',
  }
}

function formatCountdown(deadline, now) {
  const remaining = new Date(deadline).getTime() - now
  if (Number.isNaN(remaining)) return ''
  if (remaining <= 0) return 'The pickup-by time has passed.'
  const totalMinutes = Math.floor(remaining / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m left to collect` : `${minutes}m left to collect`
}

function releaseObjectUrl(ref) {
  if (ref.current) {
    URL.revokeObjectURL(ref.current)
    ref.current = null
  }
}

function inputClass(error) {
  return `w-full rounded-xl border bg-white px-4 py-2.5 text-stone-800 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
    error ? 'border-red-500' : 'border-stone-300'
  }`
}

function Field({ id, label, error, className = '', children }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold text-stone-700">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default function AddFoodPage() {
  const routeLocation = useLocation()
  const { addDonation, updateDonation, profile } = useDonor()

  const donation = routeLocation.state?.donation ?? null
  const isEditing = Boolean(donation)
  const editable = !isEditing || EDITABLE_STATUSES.includes(donation.status)

  const [values, setValues] = useState(() => buildInitialValues(donation, profile.location))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [image, setImage] = useState(donation?.image ?? '')
  const [imageFile, setImageFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  const inputRefs = useRef({})
  const fileInputRef = useRef(null)
  const objectUrlRef = useRef(null)
  // Synchronous guard: state updates are async, so a fast second click could slip past `submitting`.
  const submittingRef = useRef(false)

  // Release any blob preview created by this page when it unmounts.
  useEffect(() => () => releaseObjectUrl(objectUrlRef), [])

  // Keep the pickup-by countdown on the success panel current.
  useEffect(() => {
    if (!submitted) return undefined
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [submitted])

  const setRef = (name) => (element) => {
    inputRefs.current[name] = element
  }

  function updateField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
  }

  function toggleAllergen(allergen) {
    setValues((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((item) => item !== allergen)
        : [...prev.allergens, allergen],
    }))
    setErrors((prev) => (prev.allergens ? { ...prev, allergens: undefined } : prev))
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    releaseObjectUrl(objectUrlRef)
    if (file) {
      setImageFile(file)
      objectUrlRef.current = URL.createObjectURL(file)
      setImage(objectUrlRef.current)
    } else {
      setImageFile(null)
      setImage('')
    }
  }

  function handleRemoveImage() {
    releaseObjectUrl(objectUrlRef)
    setImageFile(null)
    setImage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!editable || submittingRef.current) return

    setFormError('')
    const nextErrors = validateFoodListing(values)
    setErrors(nextErrors)

    const firstInvalid = FIELD_ORDER.find((key) => nextErrors[key])
    if (firstInvalid) {
      inputRefs.current[firstInvalid]?.focus()
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    try {
      let imageUrl = donation?.imageUrl || ''
      if (imageFile) {
        const upload = await uploadListingImage(imageFile)
        if (!upload.ok) {
          setFormError(upload.error || 'The photo could not be uploaded.')
          return
        }
        imageUrl = upload.url
      }

      const payload = {
        foodName: values.foodName.trim(),
        category: values.category,
        quantity: Number(values.quantity),
        unit: values.unit,
        preparedAt: values.preparedAt ? new Date(values.preparedAt).toISOString() : '',
        pickupDeadline: new Date(values.pickupDeadline).toISOString(),
        // Blank storage is sent as null: '' is not an allowed value in the database.
        storage: values.storage || null,
        allergens: values.allergens.length ? values.allergens.join(', ') : 'None declared',
        packaging: values.packaging.trim() || 'Not specified',
        pickupLocation: values.pickupLocation.trim(),
        image: image || '',
        imageUrl,
      }

      const result = isEditing
        ? await updateDonation(donation.id, payload)
        : await addDonation(payload)
      if (result?.ok === false) {
        setFormError(result.message || 'We could not save this listing. Your entries are still here.')
        return
      }
      setNow(Date.now())
      setSubmitted({ foodName: payload.foodName, pickupDeadline: payload.pickupDeadline })
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const title = isEditing ? 'Edit listing' : 'Add food'
  const description = isEditing
    ? 'Update the details of this food listing.'
    : 'Post surplus food in under a minute. NGOs and volunteers nearby will see it.'

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={title} description={description} />

      {!editable && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            This listing is {donation.status}. Only Active or Claimed listings can be edited, so
            changes cannot be saved.
          </p>
        </div>
      )}

      <form
        noValidate
        onSubmit={handleSubmit}
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="foodName" label="Food name" error={errors.foodName}>
            <input
              id="foodName"
              ref={setRef('foodName')}
              type="text"
              required
              placeholder="e.g. Vegetable biryani"
              value={values.foodName}
              onChange={(e) => updateField('foodName', e.target.value)}
              aria-invalid={Boolean(errors.foodName)}
              aria-describedby={errors.foodName ? 'foodName-error' : undefined}
              className={inputClass(errors.foodName)}
            />
          </Field>

          <Field id="category" label="Food category" error={errors.category}>
            <select
              id="category"
              ref={setRef('category')}
              required
              value={values.category}
              onChange={(e) => updateField('category', e.target.value)}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? 'category-error' : undefined}
              className={inputClass(errors.category)}
            >
              <option value="">Select a category</option>
              {LISTING_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>

          <Field id="quantity" label="Quantity" error={errors.quantity}>
            <input
              id="quantity"
              ref={setRef('quantity')}
              type="number"
              inputMode="numeric"
              min="1"
              max="10000"
              step="1"
              required
              value={values.quantity}
              onChange={(e) => updateField('quantity', e.target.value)}
              aria-invalid={Boolean(errors.quantity)}
              aria-describedby={errors.quantity ? 'quantity-error' : undefined}
              className={inputClass(errors.quantity)}
            />
            <div className="flex gap-2">
              {[10, 25, 50].map((quantity) => (
                <button
                  key={quantity}
                  type="button"
                  onClick={() => updateField('quantity', String(quantity))}
                  className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700 hover:border-primary-300"
                >
                  {quantity}
                </button>
              ))}
            </div>
          </Field>

          <Field id="unit" label="Quantity unit" error={errors.unit}>
            <select
              id="unit"
              ref={setRef('unit')}
              required
              value={values.unit}
              onChange={(e) => updateField('unit', e.target.value)}
              aria-invalid={Boolean(errors.unit)}
              aria-describedby={errors.unit ? 'unit-error' : undefined}
              className={inputClass(errors.unit)}
            >
              {LISTING_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </Field>

          <Field id="preparedAt" label="Preparation date and time (optional)" error={errors.preparedAt}>
            <input
              id="preparedAt"
              ref={setRef('preparedAt')}
              type="datetime-local"
              value={values.preparedAt}
              onChange={(e) => updateField('preparedAt', e.target.value)}
              aria-invalid={Boolean(errors.preparedAt)}
              aria-describedby={errors.preparedAt ? 'preparedAt-error' : undefined}
              className={inputClass(errors.preparedAt)}
            />
          </Field>

          <Field id="pickupDeadline" label="Pickup-by time" error={errors.pickupDeadline}>
            <input
              id="pickupDeadline"
              ref={setRef('pickupDeadline')}
              type="datetime-local"
              required
              value={values.pickupDeadline}
              onChange={(e) => updateField('pickupDeadline', e.target.value)}
              aria-invalid={Boolean(errors.pickupDeadline)}
              aria-describedby={errors.pickupDeadline ? 'pickupDeadline-error' : undefined}
              className={inputClass(errors.pickupDeadline)}
            />
            <div className="flex gap-2 mt-2">
              {[2, 4, 6].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => updateField('pickupDeadline', hoursFromNow(hours))}
                  className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700 hover:border-primary-300"
                >
                  +{hours}h
                </button>
              ))}
            </div>
          </Field>

          <Field id="storage" label="Storage condition (optional)" error={errors.storage}>
            <select
              id="storage"
              ref={setRef('storage')}
              value={values.storage}
              onChange={(e) => updateField('storage', e.target.value)}
              aria-invalid={Boolean(errors.storage)}
              aria-describedby={errors.storage ? 'storage-error' : undefined}
              className={inputClass(errors.storage)}
            >
              <option value="">Select a storage condition</option>
              {LISTING_STORAGE_CONDITIONS.map((storage) => (
                <option key={storage} value={storage}>
                  {storage}
                </option>
              ))}
            </select>
          </Field>

          <fieldset
            ref={setRef('allergens')}
            tabIndex={-1}
            className="flex flex-col gap-2 sm:col-span-2"
          >
            <legend className="text-sm font-semibold text-stone-700">Allergens</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ALLERGEN_OPTIONS.map((allergen) => (
                <label
                  key={allergen}
                  className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 hover:border-primary-300"
                >
                  <input
                    type="checkbox"
                    value={allergen}
                    checked={values.allergens.includes(allergen)}
                    onChange={() => toggleAllergen(allergen)}
                    aria-invalid={Boolean(errors.allergens)}
                    aria-describedby={errors.allergens ? 'allergens-error' : 'allergens-hint'}
                    className="h-4 w-4 accent-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500"
                  />
                  {allergen}
                </label>
              ))}
            </div>
            {values.allergens.length === 0 ? (
              <p id="allergens-hint" className="text-xs text-stone-500">
                No allergens selected. The listing will say “None declared”.
              </p>
            ) : (
              <p id="allergens-hint" className="text-xs text-stone-500">
                Selected: {values.allergens.join(', ')}
              </p>
            )}
            {errors.allergens && (
              <p id="allergens-error" role="alert" className="text-sm text-red-600">
                {errors.allergens}
              </p>
            )}
          </fieldset>

          <Field id="packaging" label="Packaging and handling notes (optional)">
            <input
              id="packaging"
              type="text"
              placeholder="e.g. Sealed containers. Keep chilled until served."
              value={values.packaging}
              onChange={(e) => updateField('packaging', e.target.value)}
              className={inputClass()}
            />
          </Field>

          <Field
            id="pickupLocation"
            label="Pickup location"
            error={errors.pickupLocation}
            className="sm:col-span-2"
          >
            <input
              id="pickupLocation"
              ref={setRef('pickupLocation')}
              type="text"
              required
              value={values.pickupLocation}
              onChange={(e) => updateField('pickupLocation', e.target.value)}
              aria-invalid={Boolean(errors.pickupLocation)}
              aria-describedby={errors.pickupLocation ? 'pickupLocation-error' : undefined}
              className={inputClass(errors.pickupLocation)}
            />
          </Field>

          <Field id="image" label="Food photo (optional)" className="sm:col-span-2">
            <input
              id="image"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-stone-600 file:mr-4 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:font-semibold file:text-primary-700 hover:file:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
            {image && (
              <div className="mt-2 flex flex-col gap-3 rounded-xl bg-cream-100 p-3 sm:flex-row sm:items-center">
                <FoodImage
                  src={image}
                  alt={`Preview of ${values.foodName.trim() || 'the food'}`}
                  className="h-40 w-full rounded-xl sm:w-56"
                />
                <Button variant="outline" size="md" icon={X} onClick={handleRemoveImage}>
                  Remove photo
                </Button>
              </div>
            )}
          </Field>
        </div>

        {formError && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>
              {formError} Your entries are still here. Please try again.
            </p>
          </div>
        )}

        {submitting && (
          <p role="status" className="mt-6 text-sm text-stone-600">
            {isEditing ? 'Saving your changes...' : 'Posting your listing. Please wait.'}
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to={DONATIONS_PATH}
            className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            icon={isEditing ? Save : PlusCircle}
            disabled={!editable || submitting}
            className="disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? 'Saving...' : isEditing ? 'Save changes' : 'Post food listing'}
          </Button>
        </div>
      </form>

      {submitted && (
        <div className="mt-8 rounded-2xl border border-primary-200 bg-primary-50 p-6 shadow-sm sm:p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary-600" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-stone-900">Listing posted</h2>
          <p className="mt-2 text-sm text-stone-600">
            “{submitted.foodName}” is now live for nearby receivers and volunteers.
          </p>
          <p className="mt-3 text-sm font-semibold text-stone-800">
            Pickup by {new Date(submitted.pickupDeadline).toLocaleString([], {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
          <p className="mt-1 text-sm font-semibold text-primary-700">
            {formatCountdown(submitted.pickupDeadline, now)}
          </p>
          <p className="mt-3 text-xs text-stone-500">
            Receivers will match on distance, quantity and timing. Track status under My Donations.
          </p>
          <p className="mt-4 rounded-xl bg-white p-3 text-xs text-stone-600">{DISCLAIMER}</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={DONATIONS_PATH}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              View my donations
            </Link>
            <Link
              to="/dashboard/donor/add"
              className="inline-flex items-center justify-center rounded-full border border-primary-600 bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Post another listing
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
