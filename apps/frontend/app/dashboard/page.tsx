import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from 'db'
import { BookingCard } from '@/components/BookingCard'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Heart,
  Settings,
  Search,
  Home,
} from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Fetch user's bookings
  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      room: {
        include: {
          hotel: true,
        },
      },
      review: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Separate upcoming and past bookings
  const now = new Date()
  const upcoming = bookings.filter((b) => new Date(b.checkIn) > now)
  const ongoing = bookings.filter(
    (b) => new Date(b.checkIn) <= now && new Date(b.checkOut) >= now
  )
  const past = bookings.filter((b) => new Date(b.checkOut) < now)

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Dashboard Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-b border-slate-700">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    My Dashboard
                  </h1>
                  <p className="text-blue-100 text-sm md:text-base">
                    Welcome back, {session.user.name || 'Guest'}!
                  </p>
                </div>
              </div>
            </div>

            <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors border border-white/30">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <span>/</span>
            <span className="text-white">Dashboard</span>
          </div>
        </div>

        {/* Section Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Booking Management</h2>
          <p className="text-gray-400">
            Track and manage all your hotel reservations in one place
          </p>
        </div>

        {/* Stats Cards Section */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
            Quick Stats
          </h3>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 backdrop-blur-xl border border-orange-500/30 rounded-xl p-5 hover:border-orange-500/50 transition-colors">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-orange-500/30 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-400" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">
                    {upcoming.length + ongoing.length}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-300 font-medium">Active Bookings</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl border border-blue-500/30 rounded-xl p-5 hover:border-blue-500/50 transition-colors">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{past.length}</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 font-medium">Completed Trips</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl border border-purple-500/30 rounded-xl p-5 hover:border-purple-500/50 transition-colors">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">
                    {new Set(bookings.map((b) => b.room?.hotelId)).size}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-300 font-medium">Hotels Visited</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-xl border border-green-500/30 rounded-xl p-5 hover:border-green-500/50 transition-colors">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-500/30 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{bookings.length}</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 font-medium">Total Bookings</p>
            </div>
          </div>
        </div>
        </div>

        {/* Current/Upcoming Bookings */}
        {(ongoing.length > 0 || upcoming.length > 0) && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">
                {ongoing.length > 0 ? 'Active Bookings' : 'Upcoming Trips'}
              </h2>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm font-semibold rounded-full border border-orange-500/30">
                {ongoing.length + upcoming.length} {ongoing.length + upcoming.length === 1 ? 'Booking' : 'Bookings'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ongoing.map((booking) => (
                <div key={booking.id} className="relative">
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg animate-pulse">
                      Currently Staying
                    </span>
                  </div>
                  <BookingCard booking={booking} />
                </div>
              ))}
              {upcoming.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </section>
        )}

        {/* Past Bookings / Booking History */}
        {past.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">Booking History</h2>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-semibold rounded-full border border-blue-500/30">
                {past.length} Completed {past.length === 1 ? 'Trip' : 'Trips'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {past.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  showReviewButton
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {bookings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-12 text-center max-w-lg">
              <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No Booking Records Yet
              </h3>
              <p className="text-gray-400 mb-8 text-lg">
                Your booking history will appear here once you make your first reservation.
                Start exploring hotels and create your first booking!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30"
                >
                  <Search className="w-5 h-5" />
                  Search Hotels
                </a>
                <a
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Browse Featured
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
