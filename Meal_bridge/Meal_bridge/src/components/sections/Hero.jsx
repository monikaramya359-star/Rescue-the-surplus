import { Clock, Heart, MapPin, Sprout, Truck } from 'lucide-react'
import Button from '../ui/Button.jsx'
import FoodImage from '../ui/FoodImage.jsx'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Hero() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const openDonate = () => navigate(
    isAuthenticated ? '/dashboard/donor/add' : '/donate',
  )

  const scrollToFood = () => {
    document.getElementById('available-food')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="home" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-semibold text-primary-800">
            <Sprout className="h-4 w-4" aria-hidden="true" />
            Rescuing edible food every day
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-stone-900 sm:text-5xl lg:text-6xl">
            Good Food Deserves a Second Chance
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600">
            Connect surplus food with people who need it. Rescue meals, reduce waste and make a difference in your community.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" icon={Heart} onClick={openDonate}>
              Donate Food
            </Button>
            <Button size="lg" variant="secondary" onClick={scrollToFood}>
              Find Food
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-3xl bg-white p-3 shadow-xl shadow-primary-900/10">
            <FoodImage
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80"
              alt="Colourful plated meal with fresh vegetables, grains and herbs"
              className="aspect-[4/5] w-full rounded-2xl sm:aspect-[5/4]"
            />
          </div>
          <div className="absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg sm:left-auto sm:-right-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <Truck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-stone-900">Pickup on the way</p>
              <p className="flex items-center gap-1 text-xs text-stone-500">
                <Clock className="h-3 w-3" aria-hidden="true" />
                Ready in 25 min · <MapPin className="h-3 w-3" aria-hidden="true" />
                1.2 km
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
