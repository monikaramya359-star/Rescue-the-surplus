import { AlertCircle } from 'lucide-react'

const BASE_CLASSES =
  'w-full rounded-xl border bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2'
const NORMAL_CLASSES = 'border-stone-300 focus:border-primary-500 focus:ring-primary-200'
const ERROR_CLASSES = 'border-red-400 focus:border-red-400 focus:ring-red-200'

export default function FormField({
  id,
  name = id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  error,
  options = [],
  rightSlot,
  required = false,
}) {
  const errorId = `${id}-error`
  const className = `${BASE_CLASSES} ${error ? ERROR_CLASSES : NORMAL_CLASSES}`
  const a11yProps = {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-stone-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <div className="relative">
        {type === 'select' ? (
          <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            className={className}
            {...a11yProps}
          >
            <option value="" disabled>
              Select an option
            </option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            autoComplete={autoComplete}
            required={required}
            className={`${className} ${rightSlot ? 'pr-12' : ''}`}
            {...a11yProps}
          />
        )}
        {rightSlot && <div className="absolute inset-y-0 right-2 flex items-center">{rightSlot}</div>}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
