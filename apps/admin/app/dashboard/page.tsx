import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "db";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "ui";
import { DollarSign, Calendar, Bed, Users, Hotel, Plus, Image, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Get user's hotel
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      tenant: {
        include: {
          hotels: true,
        },
      },
    },
  });

  const hotel = user?.tenant?.hotels[0];

  if (!hotel) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-2xl mx-auto text-center py-12">
            <Hotel className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-2">No Hotel Found</h1>
            <p className="text-gray-600 mb-6">
              You don't have a hotel associated with your account yet.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Get hotel stats
  const rooms = await prisma.room.findMany({
    where: { hotelId: hotel.id },
  });

  const bookings = await prisma.booking.findMany({
    where: { room: { hotelId: hotel.id } },
    include: { room: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const now = new Date();
  const activeBookings = bookings.filter(
    (b) => new Date(b.checkIn) <= now && new Date(b.checkOut) >= now
  );

  const totalRevenue = bookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
    .reduce((sum, b) => sum + Number(b.totalPrice), 0);

  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE").length;
  const occupiedRooms = rooms.filter((r) => r.status === "OCCUPIED").length;
  const occupancyRate = rooms.length > 0 ? ((occupiedRooms / rooms.length) * 100).toFixed(1) : "0";

  const stats = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Active Bookings",
      value: activeBookings.length.toString(),
      icon: Calendar,
      color: "bg-blue-500",
    },
    {
      title: "Available Rooms",
      value: `${availableRooms}/${rooms.length}`,
      icon: Bed,
      color: "bg-purple-500",
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate}%`,
      icon: Users,
      color: "bg-orange-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-gray-600">
            Manage your hotel: <span className="font-semibold">{hotel.name}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/hotel"
              className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <Hotel className="h-8 w-8 text-gray-400 group-hover:text-blue-500 mb-3" />
              <h3 className="font-semibold mb-1">Manage Hotel</h3>
              <p className="text-sm text-gray-600">
                Update hotel details, photos, and settings
              </p>
            </Link>

            <Link
              href="/rooms"
              className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <Plus className="h-8 w-8 text-gray-400 group-hover:text-green-500 mb-3" />
              <h3 className="font-semibold mb-1">Add New Room</h3>
              <p className="text-sm text-gray-600">
                Create new room listings with photos and pricing
              </p>
            </Link>

            <Link
              href="/bookings"
              className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <Calendar className="h-8 w-8 text-gray-400 group-hover:text-purple-500 mb-3" />
              <h3 className="font-semibold mb-1">View Bookings</h3>
              <p className="text-sm text-gray-600">
                Manage reservations and check-ins
              </p>
            </Link>
          </div>
        </div>

        {/* Recent Bookings */}
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>
          <Card>
            <CardContent className="p-0">
              {bookings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No bookings yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Guest
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Room
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Check-in
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Check-out
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {booking.user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {booking.room.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(booking.checkIn).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(booking.checkOut).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            ${Number(booking.totalPrice).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                booking.status === "CONFIRMED"
                                  ? "bg-green-100 text-green-800"
                                  : booking.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : booking.status === "CANCELLED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {booking.status === "CONFIRMED" || booking.status === "COMPLETED" ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : booking.status === "CANCELLED" ? (
                                <XCircle className="h-3 w-3" />
                              ) : null}
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
