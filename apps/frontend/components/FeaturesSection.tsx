"use client";

import { Card, CardContent } from "ui";
import {
  Calendar,
  Shield,
  Clock,
  CreditCard,
  Star,
  MapPin,
  Users,
  Wifi,
  Coffee,
  Sparkles
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Easy Booking",
    description: "Book your stay in just a few clicks with our intuitive booking system",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Shield,
    title: "Secure & Safe",
    description: "Your data and payments are protected with enterprise-grade security",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Round-the-clock customer support to assist you whenever needed",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: CreditCard,
    title: "Flexible Payment",
    description: "Multiple payment options with secure transaction processing",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: Star,
    title: "Premium Quality",
    description: "Hand-picked hotels ensuring the highest standards of luxury",
    color: "from-yellow-500 to-amber-500"
  },
  {
    icon: MapPin,
    title: "Prime Locations",
    description: "Hotels in the most sought-after destinations worldwide",
    color: "from-indigo-500 to-blue-500"
  }
];

const amenities = [
  { icon: Wifi, label: "Free WiFi" },
  { icon: Coffee, label: "Breakfast" },
  { icon: Users, label: "Concierge" },
  { icon: Sparkles, label: "Premium Service" }
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Why Choose Us</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Everything You Need for a Perfect Stay
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience unmatched convenience, security, and luxury with our comprehensive hotel booking platform
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-blue-500 bg-white"
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Amenities Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl">
            <h3 className="text-3xl font-bold mb-6 text-center">
              Premium Amenities Included
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {amenities.map((amenity, index) => {
                const Icon = amenity.icon;
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <Icon className="w-8 h-8" />
                    <span className="font-semibold text-sm text-center">
                      {amenity.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
