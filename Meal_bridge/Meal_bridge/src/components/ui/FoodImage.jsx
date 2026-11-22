import { useState } from 'react'
import { Utensils } from 'lucide-react'

export default function FoodImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-cream-100 to-primary-100 text-primary-600 ${className}`}
      >
        <Utensils className="h-10 w-10" aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  )
}
