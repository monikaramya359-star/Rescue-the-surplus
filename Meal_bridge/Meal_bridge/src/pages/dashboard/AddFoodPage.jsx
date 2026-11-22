import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, PlusCircle, Save, X } from 'lucide-react'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import FoodImage from '../../components/ui/FoodImage.jsx'
import { useDemo } from '../../context/DemoContext.jsx'
import { useDonor } from '../../context/DonorContext.jsx'
import { FOOD_CATEGORIES, QUANTITY_UNITS, STORAGE_CONDITIONS } from '../../data/donorData.js'
import { validateFoodListing } from '../../lib/validation.js'

const DONATIONS_PATH = '/dashboard/donor/donations'
const EDITABLE_STATUSES = ['Active', 'Claimed']
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
]

function buildInitialValues(donation, defaultLocation) {
  if (!donation) {
    return {
      foodName: '',
      category: '',
      quantity: '',
      unit: 'Meals',
      preparedAt: '',
      pickupDeadline: '',
      storage: '',
      allergens: '',
      packaging: '',
      pickupLocation: defaultLocation ?? '',
    }
  }
  return {
    foodName: donation.foodName ?? '',
    category: donation.category ?? '',
    quantity: String(donation.quantity ?? ''),
    unit: donation.unit ?? 'Meals',
    preparedAt: donation.preparedAt ?? '',
    pickupDeadline: donation.pickupDeadline ?? '',
    storage: donation.storage ?? '',
    allergens: ['None', 'None declared'].includes(donation.allergens) ? '' : (donation.allergens ?? ''),
    packaging: donation.packaging === 'Not specified' ? '' : (donation.packaging ?? ''),
    pickupLocation: donation.pickupLocation ?? defaultLocation ?? '',
  }
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
  const navigate = useNavigate()
  const { addDonation, updateDonation, profile } = useDonor()
  const { showToast } = useDemo()

  const donation = routeLocation.state?.donation ?? null
  const isEditing = Boolean(donation)
  const editable = !isEditing || EDITABLE_STATUSES.includes(donation.status)

  const [values, setValues] = useState(() => buildInitialValues(donation, profile.location))
  const [errors, setErrors] = useState({})
  const [image, setImage] = useState(donation?.image ?? '')

  const inputRefs = useRef({})
  const fileInputRef = useRef(null)
  const objectUrlRef = useRef(null)

  // Release any blob preview created by this page when it unmounts.
  useEffect(() => () => releaseObjectUrl(objectUrlRef), [])

  const setRef = (name) => (element) => {
    inputRefs.current[name] = element
  }

  function updateField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    releaseObjectUrl(objectUrlRef)
    if (file) {
      objectUrlRef.current = URL.createObjectURL(file)
      setImage(objectUrlRef.current)
    } else {
      setImage('')
    }
  }

  function handleRemoveImage() {
    releaseObjectUrl(objectUrlRef)
    setImage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!editable) return

    const nextErrors = validateFoodListing(values)
    setErrors(nextErrors)

    const firstInvalid = FIELD_ORDER.find((key) => nextErrors[key])
    if (firstInvalid) {
      inputRefs.current[firstInvalid]?.focus()
      return
    }

    const payload = {
      foodName: values.foodName.trim(),
      category: values.category,
      quantity: Number(values.quantity),
      unit: values.unit,
      preparedAt: values.preparedAt,
      pickupDeadline: values.pickupDeadline,
      storage: values.storage,
      allergens: values.allergens.trim() || 'None declared',
      packaging: values.packaging.trim() || 'Not specified',
      pickupLocation: values.pickupLocation.trim(),
      image: image || '',
    }

    if (isEditing) {
      updateDonation(donation.id, payload)
    } else {
      addDonation(payload)
    }
    navigate(DONATIONS_PATH)
    showToast('Food listing saved.')
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
              {FOOD_CATEGORIES.map((category) => (
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
              step="1"
              required
              value={values.quantity}
              onChange={(e) => updateField('quantity', e.target.value)}
              aria-invalid={Boolean(errors.quantity)}
              aria-describedby={errors.quantity ? 'quantity-error' : undefined}
              className={inputClass(errors.quantity)}
            />
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
              {QUANTITY_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </Field>

          <Field id="preparedAt" label="Preparation date and time" error={errors.preparedAt}>
            <input
              id="preparedAt"
              ref={setRef('preparedAt')}
              type="datetime-local"
              required
              value={values.preparedAt}
              onChange={(e) => updateField('preparedAt', e.target.value)}
              aria-invalid={Boolean(errors.preparedAt)}
              aria-describedby={errors.preparedAt ? 'preparedAt-error' : undefined}
              className={inputClass(errors.preparedAt)}
            />
          </Field>

          <Field id="pickupDeadline" label="Pickup deadline" error={errors.pickupDeadline}>
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
          </Field>

          <Field id="storage" label="Storage condition" error={errors.storage}>
            <select
              id="storage"
              ref={setRef('storage')}
              required
              value={values.storage}
              onChange={(e) => updateField('storage', e.target.value)}
              aria-invalid={Boolean(errors.storage)}
              aria-describedby={errors.storage ? 'storage-error' : undefined}
              className={inputClass(errors.storage)}
            >
              <option value="">Select a storage condition</option>
              {STORAGE_CONDITIONS.map((storage) => (
                <option key={storage} value={storage}>
                  {storage}
                </option>
              ))}
            </select>
          </Field>

          <Field id="allergens" label="Allergens (optional)">
            <input
              id="allergens"
              type="text"
              placeholder="e.g. Contains dairy, gluten, nuts"
              value={values.allergens}
              onChange={(e) => updateField('allergens', e.target.value)}
              className={inputClass()}
            />
          </Field>

          <Field id="packaging" label="Packaging (optional)">
            <input
              id="packaging"
              type="text"
              placeholder="e.g. Sealed steel containers"
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
            disabled={!editable}
            className="disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {isEditing ? 'Save changes' : 'Post food listing'}
          </Button>
        </div>
      </form>
    </div>
  )
}
