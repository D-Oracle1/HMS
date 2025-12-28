'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import HotelCard from '@/components/HotelCard'
import { FilterSidebar } from '@/components/FilterSidebar'
import { MapView } from '@/components/MapView'
import {
  LayoutGrid,
  Map as MapIcon,
  Search,
  Loader2,
  SlidersHorizontal,
  X,
} from 'lucide-react'

function SearchContent() {
  const searchParams = useSearchParams()
  const [hotels, setHotels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 100000,
    rating: 0,
    amenities: [],
  })
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // Extract search parameters
  const location = searchParams.get('location') || ''
  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const featured = searchParams.get('featured') || ''
  const searchRating = searchParams.get('rating') || ''

  useEffect(() => {
    fetchHotels()
  }, [searchParams, filters, currentPage])

  const fetchHotels = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (location) params.set('location', location)
      if (checkIn) params.set('checkIn', checkIn)
      if (checkOut) params.set('checkOut', checkOut)
      if (featured) params.set('featured', featured)
      if (searchRating) params.set('rating', searchRating)

      // Apply filters
      if (filters.minPrice > 0) params.set('minPrice', filters.minPrice.toString())
      if (filters.maxPrice < 100000)
        params.set('maxPrice', filters.maxPrice.toString())
      if (filters.rating > 0) params.set('rating', filters.rating.toString())
      if (filters.amenities.length > 0)
        params.set('amenities', filters.amenities.join(','))

      params.set('page', currentPage.toString())
      params.set('limit', '12')

      const response = await fetch(`/api/search?${params.toString()}`)
      const data = await response.json()

      setHotels(data.hotels || [])
      setTotalResults(data.total || 0)
    } catch (error) {
      console.error('Error fetching hotels:', error)
      setHotels([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
    setShowFilters(false) // Close mobile filters
  }

  const getMapCenter = () => {
    if (hotels.length === 0) return { lat: 6.5244, lng: 3.3792 } // Default to Lagos

    // If location is coordinates, use them
    if (location.includes(',')) {
      const [lat, lng] = location.split(',').map(Number)
      return { lat, lng }
    }

    // Otherwise, use first hotel's location
    if (hotels[0]?.latitude && hotels[0]?.longitude) {
      return { lat: hotels[0].latitude, lng: hotels[0].longitude }
    }

    return { lat: 6.5244, lng: 3.3792 }
  }

  const totalPages = Math.ceil(totalResults / 12)

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {location || 'All Hotels'}
              </h1>
              <p className="text-gray-400">
                {loading ? (
                  'Searching...'
                ) : (
                  <>
                    {totalResults} hotel{totalResults !== 1 ? 's' : ''} found
                    {checkIn && checkOut && (
                      <span>
                        {' '}
                        • {new Date(checkIn).toLocaleDateString()} -{' '}
                        {new Date(checkOut).toLocaleDateString()}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    viewMode === 'map'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Map</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop Filters */}
          <div className="hidden lg:block">
            <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowFilters(false)}
              />
              <div className="absolute inset-y-0 left-0 w-full max-w-sm bg-slate-900 overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Filters</h2>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-2 text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <FilterSidebar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Searching for hotels...</p>
                </div>
              </div>
            ) : hotels.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl">
                <Search className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  No hotels found
                </h3>
                <p className="text-gray-400 text-center max-w-md">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            ) : viewMode === 'list' ? (
              <>
                {/* Hotel Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {hotels.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                              currentPage === pageNum
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-800 text-gray-300 border border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <MapView
                hotels={hotels}
                center={getMapCenter()}
                zoom={12}
                height="calc(100vh - 200px)"
                onHotelClick={(hotel) => {
                  // Scroll to hotel card or open modal
                  console.log('Hotel clicked:', hotel)
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
