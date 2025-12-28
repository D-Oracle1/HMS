"use client";

import Link from "next/link";
import { Star, MapPin, Bed, Users, Heart, Wifi, Car, Coffee, CheckCircle, TrendingUp, Eye } from "lucide-react";
import { useState, useEffect } from "react";

interface HotelCardProps {
  hotel: any;
}

export default function HotelCard({ hotel }: HotelCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [viewingCount, setViewingCount] = useState(0);
  const [bookingsToday, setBookingsToday] = useState(0);

  // Simulate viewing activity and booking stats
  useEffect(() => {
    setViewingCount(Math.floor(Math.random() * 15) + 3); // 3-17 people viewing
    setBookingsToday(Math.floor(Math.random() * 25) + 5); // 5-29 bookings today
  }, []);

  // Get the cheapest room price
  const cheapestRoom = hotel.rooms?.length > 0
    ? hotel.rooms.reduce((min: any, room: any) =>
        room.price < min.price ? room : min, hotel.rooms[0])
    : null;

  const totalRooms = hotel.rooms?.length || 0;
  const availableRooms = hotel.rooms?.filter((r: any) => r.status === 'AVAILABLE').length || 0;

  // Calculate fake discount for display (10-25% off original price)
  const discountPercent = Math.floor(Math.random() * 16) + 10; // 10-25%
  const originalPrice = cheapestRoom ? Math.round(cheapestRoom.price * (1 + discountPercent / 100)) : 0;

  // Calculate tax (7.5% VAT for Nigeria)
  const taxAmount = cheapestRoom ? Math.round(cheapestRoom.price * 0.075) : 0;
  const totalWithTax = cheapestRoom ? cheapestRoom.price + taxAmount : 0;

  // Fake amenities (in real app, these would come from hotel data)
  const hasWifi = Math.random() > 0.2; // 80% have WiFi
  const hasParking = Math.random() > 0.4; // 60% have parking
  const hasBreakfast = Math.random() > 0.5; // 50% include breakfast
  const freeCancellation = Math.random() > 0.3; // 70% free cancellation

  // Urgency indicator
  const isLowAvailability = availableRooms > 0 && availableRooms <= 3;
  const isHotDeal = discountPercent >= 20;

  // Random review count and rating
  const reviewCount = Math.floor(Math.random() * 500) + 50; // 50-549 reviews
  const rating = (Math.random() * 1.5 + 3.5).toFixed(1); // 3.5-5.0

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 relative">
      {/* HOT DEAL Badge - Top Right Corner */}
      {isHotDeal && (
        <div className="absolute top-2 right-2 z-20 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          HOT DEAL
        </div>
      )}

      {/* Image Section */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={hotel.imageUrl || "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800"}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        {/* Favorite Button */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all z-10"
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-700"
            }`}
          />
        </button>

        {/* Hotel Badge */}
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-orange-500 text-white rounded-full text-sm font-semibold">
          {hotel.tenant?.name || "Featured"}
        </div>

        {/* Discount Badge */}
        {discountPercent >= 15 && (
          <div className="absolute top-14 left-4 px-2.5 py-1 bg-green-500 text-white rounded-md text-xs font-bold">
            -{discountPercent}%
          </div>
        )}

        {/* Rating */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold text-sm">{rating}</span>
          <span className="text-gray-500 text-xs ml-1">({reviewCount})</span>
        </div>

        {/* Trust Badges - Bottom Right */}
        {freeCancellation && (
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="text-xs font-medium text-gray-700">Free Cancellation</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Urgency Signal */}
        {isLowAvailability && (
          <div className="mb-3 flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold">Only {availableRooms} room{availableRooms > 1 ? 's' : ''} left!</span>
          </div>
        )}

        {/* Social Proof - Viewing Activity */}
        {viewingCount > 5 && (
          <div className="mb-2 flex items-center gap-1.5 text-orange-600 text-xs">
            <Eye className="w-3.5 h-3.5" />
            <span className="font-medium">{viewingCount} people viewing now</span>
          </div>
        )}

        {/* Social Proof - Bookings Today */}
        {bookingsToday > 10 && (
          <div className="mb-3 flex items-center gap-1.5 text-slate-600 text-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-medium">Booked {bookingsToday} times today</span>
          </div>
        )}

        {/* Hotel Name */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors line-clamp-1">
          {hotel.name}
        </h3>

        {/* Location */}
        <div className="flex items-start gap-2 text-gray-600 mb-4">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="text-sm line-clamp-2">{hotel.address}</span>
        </div>

        {/* Amenities Icons */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
          {hasWifi && (
            <div className="flex items-center gap-1 text-gray-600" title="Free WiFi">
              <Wifi className="w-4 h-4" />
              <span className="text-xs">WiFi</span>
            </div>
          )}
          {hasParking && (
            <div className="flex items-center gap-1 text-gray-600" title="Free Parking">
              <Car className="w-4 h-4" />
              <span className="text-xs">Parking</span>
            </div>
          )}
          {hasBreakfast && (
            <div className="flex items-center gap-1 text-gray-600" title="Breakfast Included">
              <Coffee className="w-4 h-4" />
              <span className="text-xs">Breakfast</span>
            </div>
          )}
        </div>

        {/* Price Section - Enhanced Transparency */}
        <div className="mb-4">
          {/* Original Price (crossed out) */}
          {discountPercent >= 15 && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-400 line-through">
                ${originalPrice}
              </span>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                Save ${originalPrice - (cheapestRoom?.price || 0)}
              </span>
            </div>
          )}

          {/* Current Price */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-gray-900">
              ${cheapestRoom?.price || "299"}
            </span>
            <span className="text-gray-500 text-sm">/night</span>
          </div>

          {/* Tax Information */}
          <div className="text-xs text-gray-500">
            +${taxAmount} taxes and fees
          </div>
          <div className="text-xs font-medium text-gray-700 mt-0.5">
            Total: ${totalWithTax}/night
          </div>
        </div>

        {/* Room Stats */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100 mb-4">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Bed className="w-4 h-4" />
            <span className="text-sm">{totalRooms} Room{totalRooms !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Users className="w-4 h-4" />
            <span className="text-sm">Up to {cheapestRoom?.capacity || 2}</span>
          </div>
        </div>

        {/* Book Button */}
        <Link href={`/hotels/${hotel.id}`}>
          <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-orange-500 transition-colors shadow-md hover:shadow-lg">
            View Details & Book
          </button>
        </Link>

        {/* No Hidden Fees Badge */}
        <div className="mt-3 text-center">
          <span className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-600" />
            No hidden fees • Price transparency guaranteed
          </span>
        </div>
      </div>
    </div>
  );
}
