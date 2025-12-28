'use client'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMapsScript } from '@/lib/google-maps'
import { MapPin } from 'lucide-react'

interface Hotel {
  id: string
  name: string
  latitude: number
  longitude: number
  imageUrl?: string | null
  rating?: number
  minPrice?: number
}

interface MapViewProps {
  hotels: Hotel[]
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  onHotelClick?: (hotel: Hotel) => void
}

export function MapView({
  hotels,
  center,
  zoom = 12,
  height = '600px',
  onHotelClick,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  // Initialize map
  useEffect(() => {
    let mounted = true

    const initMap = async () => {
      try {
        await loadGoogleMapsScript()

        if (!mounted || !mapRef.current) return

        // Calculate center if not provided
        const mapCenter =
          center ||
          (hotels.length > 0
            ? { lat: hotels[0].latitude, lng: hotels[0].longitude }
            : { lat: 6.5244, lng: 3.3792 }) // Default to Lagos

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: mapCenter,
          zoom,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#0f172a' }],
            },
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#cbd5e1' }],
            },
            {
              featureType: 'all',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#1e293b' }],
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#1e3a8a' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#475569' }],
            },
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        })

        setMap(mapInstance)
        setIsLoading(false)
      } catch (err) {
        console.error('Error loading map:', err)
        setError('Failed to load map')
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      mounted = false
    }
  }, [center, zoom])

  // Add markers
  useEffect(() => {
    if (!map || hotels.length === 0) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    // Add new markers
    const bounds = new google.maps.LatLngBounds()

    hotels.forEach((hotel) => {
      const marker = new google.maps.Marker({
        position: { lat: hotel.latitude, lng: hotel.longitude },
        map,
        title: hotel.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#f97316', // Orange
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      })

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #1e293b;">
              ${hotel.name}
            </h3>
            ${
              hotel.rating
                ? `<p style="margin: 4px 0; font-size: 12px; color: #64748b;">
                  ⭐ ${hotel.rating.toFixed(1)}
                </p>`
                : ''
            }
            ${
              hotel.minPrice
                ? `<p style="margin: 4px 0; font-size: 12px; color: #64748b;">
                  From ₦${hotel.minPrice.toLocaleString()}
                </p>`
                : ''
            }
          </div>
        `,
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
        if (onHotelClick) {
          onHotelClick(hotel)
        }
      })

      markersRef.current.push(marker)
      bounds.extend(marker.getPosition()!)
    })

    // Fit bounds to show all markers
    if (hotels.length > 1 && !center) {
      map.fitBounds(bounds)
    }
  }, [map, hotels, onHotelClick, center])

  if (isLoading) {
    return (
      <div
        className="bg-slate-800 rounded-2xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading map...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="bg-slate-800 rounded-2xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{ height, width: '100%' }}
    />
  )
}
