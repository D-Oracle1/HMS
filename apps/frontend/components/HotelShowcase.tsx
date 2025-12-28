"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Card, CardHeader, CardTitle, CardContent } from "ui";
import { Play, MapPin, Phone, Mail, Star } from "lucide-react";

interface HotelShowcaseProps {
  hotel: any;
  index: number;
}

export default function HotelShowcase({ hotel, index }: HotelShowcaseProps) {
  const videoRef = useRef<HTMLIFrameElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
          if (entry.isIntersecting && hotel.videoUrl && videoRef.current) {
            // Auto-play video when scrolled into view
            setIsPlaying(true);
            videoRef.current.contentWindow?.postMessage(
              '{"event":"command","func":"playVideo","args":""}',
              "*"
            );
          } else if (!entry.isIntersecting && videoRef.current) {
            setIsPlaying(false);
            videoRef.current.contentWindow?.postMessage(
              '{"event":"command","func":"pauseVideo","args":""}',
              "*"
            );
          }
        });
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [hotel.videoUrl]);

  const isReverse = index % 2 !== 0;

  return (
    <div
      ref={sectionRef}
      className={`transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div
        className={`grid md:grid-cols-2 gap-8 items-center ${
          isReverse ? "md:flex-row-reverse" : ""
        }`}
      >
        {/* Video/Image Section */}
        <div className={`${isReverse ? "md:order-2" : ""} relative group`}>
          {hotel.videoUrl ? (
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800">
                <iframe
                  ref={videoRef}
                  className="w-full h-full"
                  src={`${hotel.videoUrl}?enablejsapi=1&autoplay=0`}
                  title={hotel.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              {isPlaying && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  LIVE TOUR
                </div>
              )}
            </div>
          ) : hotel.imageUrl ? (
            <div className="relative rounded-2xl overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
              <img
                src={hotel.imageUrl}
                alt={hotel.name}
                className="w-full aspect-video object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Play className="w-20 h-20 text-white opacity-50" />
            </div>
          )}
        </div>

        {/* Hotel Details */}
        <div className={`${isReverse ? "md:order-1" : ""} space-y-6`}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-semibold flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" />
                5-Star Luxury
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                {hotel.tenant.name}
              </span>
            </div>
            <h3 className="text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {hotel.name}
            </h3>
            {hotel.description && (
              <p className="text-lg text-gray-600 leading-relaxed">
                {hotel.description}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-gray-700">
              <MapPin className="w-5 h-5 mt-1 text-blue-600 flex-shrink-0" />
              <span>{hotel.address}</span>
            </div>
            {hotel.phone && (
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span>{hotel.phone}</span>
              </div>
            )}
            {hotel.email && (
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span>{hotel.email}</span>
              </div>
            )}
          </div>

          {/* Rooms Grid */}
          {hotel.rooms && hotel.rooms.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-2xl font-bold text-gray-900">Available Rooms</h4>
              <div className="grid grid-cols-1 gap-4">
                {hotel.rooms.slice(0, 3).map((room: any) => (
                  <Card
                    key={room.id}
                    className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-blue-500"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h5 className="text-lg font-semibold text-gray-900 mb-1">
                            {room.name}
                          </h5>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                            {room.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                              👥 {room.capacity} guests
                            </span>
                            <span className="font-bold text-2xl text-blue-600">
                              ${room.price}
                              <span className="text-sm text-gray-500">/night</span>
                            </span>
                          </div>
                        </div>
                        <Link href={`/book/${room.id}`}>
                          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                            Book Now
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {hotel.rooms.length > 3 && (
                <p className="text-center text-gray-600 text-sm">
                  +{hotel.rooms.length - 3} more rooms available
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
