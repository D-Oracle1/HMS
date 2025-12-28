'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from 'ui'
import {
  Search,
  MapPin,
  Calendar,
  Navigation,
  Loader2,
} from 'lucide-react'
import { getCurrentLocation } from '@/lib/google-maps'

export default function HeroSection() {
  const router = useRouter()
  const [searchType, setSearchType] = useState<'hotel' | 'room' | 'luxury'>(
    'hotel'
  )
  const [location, setLocation] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)

  // Set default check-in to today and check-out to tomorrow
  useEffect(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    setCheckIn(today.toISOString().split('T')[0])
    setCheckOut(tomorrow.toISOString().split('T')[0])
  }, [])

  const handleSearch = async () => {
    // Build search URL with parameters
    const params = new URLSearchParams()

    if (location) {
      params.set('location', location)
    }
    if (checkIn) {
      params.set('checkIn', checkIn)
    }
    if (checkOut) {
      params.set('checkOut', checkOut)
    }
    if (searchType === 'luxury') {
      params.set('featured', 'true')
      params.set('rating', '4')
    }

    router.push(`/search?${params.toString()}`)
  }

  const handleUseMyLocation = async () => {
    setGettingLocation(true)
    try {
      const coords = await getCurrentLocation()
      if (coords) {
        // Use coordinates as location
        setLocation(`${coords.latitude},${coords.longitude}`)

        // Optionally, fetch address name
        try {
          const response = await fetch(
            `/api/geocode?lat=${coords.latitude}&lng=${coords.longitude}`
          )
          if (response.ok) {
            const data = await response.json()
            if (data.city) {
              setLocation(data.city)
            }
          }
        } catch (error) {
          console.error('Error fetching address:', error)
        }
      } else {
        alert(
          'Unable to get your location. Please enable location services or enter a city manually.'
        )
      }
    } catch (error) {
      console.error('Error getting location:', error)
      alert('Error getting your location. Please try again.')
    } finally {
      setGettingLocation(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <section className="relative h-[85vh] min-h-[600px] overflow-hidden bg-slate-900">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 z-10"></div>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000')",
          }}
        ></div>
      </div>

      <div className="container mx-auto px-4 h-full relative z-20">
        <div className="flex flex-col justify-center h-full max-w-5xl mx-auto">
          {/* Main Heading */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
              Let's Find Your
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                Dream Stay.
              </span>
            </h1>
          </div>

          {/* Search Card with Glassmorphism */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setSearchType('hotel')}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  searchType === 'hotel'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                Hotel
              </button>
              <button
                onClick={() => setSearchType('room')}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  searchType === 'room'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                Room
              </button>
              <button
                onClick={() => setSearchType('luxury')}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  searchType === 'luxury'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                Luxury Suite
              </button>
            </div>

            {/* Search Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Location */}
              <div className="lg:col-span-2">
                <label className="text-white/70 text-sm mb-2 block">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 z-10" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="City or location"
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-white/40"
                  />
                  <button
                    onClick={handleUseMyLocation}
                    disabled={gettingLocation}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Use my location"
                  >
                    {gettingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Check-in Date */}
              <div>
                <label className="text-white/70 text-sm mb-2 block">
                  Check-in
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Check-out Date */}
              <div>
                <label className="text-white/70 text-sm mb-2 block">
                  Check-out
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Search className="w-5 h-5" />
                  Search
                </Button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-3 mt-6 flex-wrap">
              <button
                onClick={() => {
                  setSearchType('hotel')
                  setLocation('Lagos')
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full text-sm font-medium transition-all"
              >
                Lagos Hotels 🏨
              </button>
              <button
                onClick={() => {
                  setSearchType('hotel')
                  setLocation('Abuja')
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full text-sm font-medium transition-all"
              >
                Abuja Hotels 🏛️
              </button>
              <button
                onClick={() => {
                  setSearchType('luxury')
                  handleSearch()
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full text-sm font-medium transition-all"
              >
                Luxury Stays 💎
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
