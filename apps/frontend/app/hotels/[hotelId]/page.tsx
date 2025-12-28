import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from 'db'
import { MapView } from '@/components/MapView'
import { ReviewCard } from '@/components/ReviewCard'
import { RoomGallery } from '@/components/RoomGallery'
import {
  Star,
  MapPin,
  CheckCircle,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Users,
  Bed,
  Calendar,
} from 'lucide-react'

export default async function HotelDetailPage({
  params,
}: {
  params: { hotelId: string }
}) {
  const hotel = await prisma.hotel.findUnique({
    where: { id: params.hotelId },
    include: {
      rooms: {
        where: {
          status: 'AVAILABLE', // Only show available rooms
        },
        orderBy: { price: 'asc' },
      },
      reviews: {
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      tenant: true,
    },
  })

  if (!hotel) {
    notFound()
  }

  // Parse amenities
  const amenities = hotel.amenities ? JSON.parse(hotel.amenities) : []

  // Amenities icons mapping
  const amenityIcons: { [key: string]: any } = {
    wifi: Wifi,
    parking: Car,
    breakfast: Coffee,
    gym: Dumbbell,
  }

  // Calculate average rating from reviews
  const avgRating =
    hotel.reviews.length > 0
      ? hotel.reviews.reduce((sum, r) => sum + r.rating, 0) /
        hotel.reviews.length
      : 0

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Image */}
      <div className="relative h-[500px] w-full">
        <img
          src={
            hotel.imageUrl ||
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000'
          }
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

        {/* Floating Info */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <div className="flex items-center gap-2 mb-3">
              {hotel.featured && (
                <span className="px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full">
                  Featured
                </span>
              )}
              {hotel.verified && (
                <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                </span>
              )}
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              {hotel.name}
            </h1>

            <div className="flex flex-col md:flex-row md:items-center gap-4 text-white">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span className="text-lg">{hotel.address}</span>
              </div>

              <div className="flex items-center gap-2">
                {renderStars(avgRating)}
                <span className="font-semibold text-lg">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-gray-300">
                  ({hotel.reviews.length} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                About this hotel
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {hotel.description || 'Experience luxury and comfort at this hotel.'}
              </p>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {amenities.map((amenity: string) => {
                    const Icon = amenityIcons[amenity.toLowerCase()] || CheckCircle
                    return (
                      <div
                        key={amenity}
                        className="flex items-center gap-3 text-gray-300"
                      >
                        <Icon className="w-5 h-5 text-orange-500" />
                        <span className="capitalize">{amenity}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Check-in/out Times */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Check-in & Check-out
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-orange-500 mt-1" />
                  <div>
                    <p className="font-semibold text-white">Check-in</p>
                    <p className="text-gray-400">{hotel.checkInTime || '14:00'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-orange-500 mt-1" />
                  <div>
                    <p className="font-semibold text-white">Check-out</p>
                    <p className="text-gray-400">{hotel.checkOutTime || '11:00'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                Guest Reviews
                <span className="text-gray-400 text-lg ml-2">
                  ({hotel.reviews.length})
                </span>
              </h2>

              {hotel.reviews.length > 0 ? (
                <div className="space-y-4">
                  {hotel.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Star className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p>No reviews yet. Be the first to review this hotel!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking & Map */}
          <div className="space-y-6">
            {/* Map */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 sticky top-24">
              <h3 className="text-xl font-bold text-white mb-4">Location</h3>
              {hotel.latitude && hotel.longitude ? (
                <MapView
                  hotels={[hotel]}
                  center={{ lat: hotel.latitude, lng: hotel.longitude }}
                  zoom={15}
                  height="300px"
                />
              ) : (
                <div className="h-[300px] bg-slate-700 rounded-xl flex items-center justify-center">
                  <p className="text-gray-400">Map not available</p>
                </div>
              )}

              <div className="mt-4 flex items-start gap-2 text-gray-300">
                <MapPin className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{hotel.address}</p>
              </div>

              {hotel.city && (
                <p className="text-sm text-gray-400 mt-2">
                  {hotel.city}, {hotel.state || ''} {hotel.country || 'Nigeria'}
                </p>
              )}
            </div>

            {/* Available Rooms */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Available Rooms
              </h3>

              {hotel.rooms.length > 0 ? (
                <div className="space-y-4">
                  {hotel.rooms.map((room) => {
                    // Parse room images
                    let roomImages: string[] = [];
                    try {
                      roomImages = room.images ? JSON.parse(room.images) : [];
                    } catch {
                      roomImages = [];
                    }

                    return (
                      <div
                        key={room.id}
                        className="bg-slate-700/50 rounded-xl overflow-hidden hover:bg-slate-700 transition-colors"
                      >
                        {/* Room Image Gallery */}
                        {roomImages.length > 0 && (
                          <RoomGallery images={roomImages} roomName={room.name} />
                        )}

                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-white mb-1">
                                {room.name}
                              </h4>
                              {room.description && (
                                <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                                  {room.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-sm text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Bed className="w-4 h-4" />
                                  <span>{room.capacity || 2} beds</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>Up to {room.capacity || 2}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-2xl font-bold text-orange-500">
                                ₦{room.price.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-400">per night</p>
                            </div>
                          </div>

                          <Link href={`/book/${room.id}`}>
                            <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2.5 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30">
                              Book Now
                            </button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <Bed className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm">No available rooms</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
