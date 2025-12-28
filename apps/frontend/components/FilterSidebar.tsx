'use client'

import { useState } from 'react'
import { Sliders, Star, DollarSign, Home, Wifi, Car, Coffee, Dumbbell } from 'lucide-react'

interface FilterSidebarProps {
  filters: any
  onFilterChange: (filters: any) => void
}

const amenitiesList = [
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'breakfast', label: 'Breakfast', icon: Coffee },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
]

export function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const [minPrice, setMinPrice] = useState(filters.minPrice || 0)
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || 100000)
  const [rating, setRating] = useState(filters.rating || 0)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    filters.amenities || []
  )

  const handleApplyFilters = () => {
    onFilterChange({
      minPrice,
      maxPrice,
      rating,
      amenities: selectedAmenities,
    })
  }

  const handleResetFilters = () => {
    setMinPrice(0)
    setMaxPrice(100000)
    setRating(0)
    setSelectedAmenities([])
    onFilterChange({
      minPrice: 0,
      maxPrice: 100000,
      rating: 0,
      amenities: [],
    })
  }

  const toggleAmenity = (amenityId: string) => {
    const updated = selectedAmenities.includes(amenityId)
      ? selectedAmenities.filter((a) => a !== amenityId)
      : [...selectedAmenities, amenityId]
    setSelectedAmenities(updated)
  }

  return (
    <div className="w-full lg:w-80 bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 sticky top-24 h-fit">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-bold text-white">Filters</h2>
        </div>
        <button
          onClick={handleResetFilters}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-orange-500" />
          <h3 className="font-semibold text-white">Price Range</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Min Price: ₦{minPrice.toLocaleString()}
            </label>
            <input
              type="range"
              min="0"
              max="100000"
              step="5000"
              value={minPrice}
              onChange={(e) => setMinPrice(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Max Price: ₦{maxPrice.toLocaleString()}
            </label>
            <input
              type="range"
              min="0"
              max="100000"
              step="5000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-orange-500" />
          <h3 className="font-semibold text-white">Minimum Rating</h3>
        </div>

        <div className="flex gap-2">
          {[0, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setRating(r)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-all ${
                rating === r
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {r === 0 ? (
                'Any'
              ) : (
                <>
                  {r}
                  <Star className="w-3 h-3 fill-current" />
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-4 h-4 text-orange-500" />
          <h3 className="font-semibold text-white">Amenities</h3>
        </div>

        <div className="space-y-2">
          {amenitiesList.map((amenity) => {
            const Icon = amenity.icon
            const isSelected = selectedAmenities.includes(amenity.id)

            return (
              <button
                key={amenity.id}
                onClick={() => toggleAmenity(amenity.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{amenity.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Apply Button */}
      <button
        onClick={handleApplyFilters}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30"
      >
        Apply Filters
      </button>
    </div>
  )
}
