"use client";

import { Building2, Home, Crown, Users, Briefcase, Warehouse } from "lucide-react";

const roomTypes = [
  {
    icon: Building2,
    name: "Standard",
    count: "6 Properties",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Home,
    name: "Deluxe",
    count: "6 Properties",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Crown,
    name: "Suite",
    count: "6 Properties",
    gradient: "from-yellow-500 to-amber-500",
  },
  {
    icon: Users,
    name: "Family Room",
    count: "6 Properties",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Briefcase,
    name: "Executive",
    count: "6 Properties",
    gradient: "from-orange-500 to-red-500",
  },
];

export default function RoomTypeCategories() {
  return (
    <section className="py-20 bg-slate-900 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-orange-500 font-semibold mb-2">Property by Requirement</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Explore Room Types
          </h2>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {roomTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <button
                key={index}
                className="group relative bg-slate-800/40 backdrop-blur-sm border-2 border-slate-700/50 hover:border-orange-500/50 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-500/20"
              >
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${type.gradient} p-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-full h-full text-white" />
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-white font-bold text-lg mb-2 text-center">
                  {type.name}
                </h3>

                {/* Count */}
                <p className="text-white/60 text-sm text-center">{type.count}</p>

                {/* Hover Effect Border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-orange-500/20 transition-all"></div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
