export function getHandlingGuidance(storage) {
  if (storage?.includes('Hot')) {
    return 'Keep hot food above 60°C and collect promptly. Reheat only once, to steaming hot, if redistribution requires reheating.'
  }
  if (storage?.includes('Chilled')) {
    return 'Keep chilled at 0–5°C and collect promptly. Consume or reheat within the pickup window; do not leave at room temperature.'
  }
  if (storage?.includes('Frozen')) {
    return 'Keep frozen according to the container label. Thaw in a refrigerator and follow a safe consume-by time.'
  }
  return 'Keep at room temperature only for the stated pickup window, protected from contaminants, heat and pests.'
}

export const SAFETY_DISCLAIMER =
  'This platform connects donors and receivers. It does not certify that food is safe. Follow the handling guidance and time limits.'
