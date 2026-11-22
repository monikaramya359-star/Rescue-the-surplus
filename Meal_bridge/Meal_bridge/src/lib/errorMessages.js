const GENERIC_MESSAGE = 'Something went wrong. Please try again.'
const DATA_GENERIC_MESSAGE = 'The request could not be completed. Please try again.'
const NETWORK_MESSAGE = 'Network error. Check your connection and try again.'

function rawMessage(error) {
  if (!error) return ''
  return typeof error === 'string' ? error : String(error.message || '')
}

function isNetworkError(error) {
  if (!error) return false
  if (error.name === 'TypeError' && /fetch/i.test(rawMessage(error))) return true
  return /failed to fetch|fetch failed|networkerror|network request failed/i.test(rawMessage(error))
}

const AUTH_RULES = [
  [/invalid login credentials/i, 'Email or password is incorrect.'],
  [/email not confirmed/i, 'Please confirm your email before logging in.'],
  [/user already registered|already been registered/i, 'An account with this email already exists.'],
  [/password should be at least/i, 'Password is too short. Please choose a longer one.'],
  [/rate limit|too many requests/i, 'Too many attempts. Please wait a moment and try again.'],
]

// Maps a Supabase auth error to a message safe to show to a user.
export function toFriendlyAuthError(error) {
  if (!error) return GENERIC_MESSAGE
  if (isNetworkError(error)) return NETWORK_MESSAGE
  const message = rawMessage(error)
  const match = AUTH_RULES.find(([pattern]) => pattern.test(message))
  return match ? match[1] : GENERIC_MESSAGE
}

const DATA_RULES = [
  [/listing is not available/i, 'This listing is no longer available.'],
  [/only \d+ left to claim/i, 'Not enough quantity left to claim.'],
  [/too little time left/i, 'This listing is too close to its pickup deadline.'],
  [/already have an active claim/i, 'You already have an active claim on this listing.'],
  [/cannot be cancelled|can no longer be cancelled/i, 'This can no longer be cancelled.'],
  [/not open for assignment|no longer active/i, 'This pickup is no longer open.'],
]

// Maps a PostgREST / RPC error to a message safe to show to a user.
export function toFriendlyDataError(error) {
  if (!error) return DATA_GENERIC_MESSAGE
  if (isNetworkError(error)) return NETWORK_MESSAGE
  if (error.code === '42501') return "You don't have permission to do that."
  const message = rawMessage(error)
  const match = DATA_RULES.find(([pattern]) => pattern.test(message))
  return match ? match[1] : DATA_GENERIC_MESSAGE
}
