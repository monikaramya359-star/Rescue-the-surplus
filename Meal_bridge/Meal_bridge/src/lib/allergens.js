// Fixed allergen list for donor listings. Free-text allergens are not accepted.
export const ALLERGEN_OPTIONS = Object.freeze([
  'Milk',
  'Eggs',
  'Peanuts',
  'Tree nuts',
  'Soy',
  'Wheat/Gluten',
  'Fish',
  'Shellfish',
  'Sesame',
])

// Returns the entries of `list` that are not in ALLERGEN_OPTIONS.
// An empty array means every entry is allowed.
export function validateAllergens(list = []) {
  const items = Array.isArray(list) ? list : []
  return items.filter((item) => !ALLERGEN_OPTIONS.includes(item))
}

// Maps a listing's allergens (array or comma-separated string) to display labels.
// Known values come back as their ALLERGEN_OPTIONS label; anything else becomes
// "Other (see notes)" so raw free text is never shown. Duplicates are removed.
export function allergenLabels(value) {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []
  const labels = raw
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .map((item) => {
      const known = ALLERGEN_OPTIONS.find(
        (option) => option.toLowerCase() === item.toLowerCase(),
      )
      return known ?? 'Other (see notes)'
    })
  return [...new Set(labels)]
}

