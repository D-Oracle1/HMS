import Link from "next/link";
import { prisma } from "db";
import HotelCard from "../components/HotelCard";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import RoomTypeCategories from "../components/RoomTypeCategories";

async function getHotelsAndRooms() {
  const hotels = await prisma.hotel.findMany({
    include: {
      rooms: {
        where: {
          available: true,
        },
      },
      tenant: true,
    },
  });
  return hotels;
}

export default async function Home() {
  const hotels = await getHotelsAndRooms();

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />

      <RoomTypeCategories />

      {/* Hotels Showcase with Videos */}
      <section id="hotels" className="py-20 relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Discover Luxury Hotels
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Browse our curated collection of luxury hotels and find your perfect accommodation.
            </p>
          </div>

          {hotels.length === 0 ? (
            <div className="text-center text-gray-600 py-16">
              <p className="text-xl">No hotels available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hotels.map((hotel, index) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          )}
        </div>
      </section>

      <FeaturesSection />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Book Your Dream Stay?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of satisfied guests who have experienced luxury at its finest.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <button className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold text-lg hover:scale-105 transition-transform shadow-xl">
                Get Started Free
              </button>
            </Link>
            <Link href="/#hotels">
              <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all">
                Browse Hotels
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
