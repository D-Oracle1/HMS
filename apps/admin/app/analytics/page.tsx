import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "db";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui";
import { DollarSign, Calendar, TrendingUp, Users, Bed } from "lucide-react";

export default async function AnalyticsPage() {
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
            <p className="text-gray-600">No hotel found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Get bookings for analytics
  const bookings = await prisma.booking.findMany({
    where: { room: { hotelId: hotel.id } },
    include: { room: true },
  });

  const totalRevenue = bookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
    .reduce((sum, b) => sum + Number(b.totalPrice), 0);

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED").length;
  const averageBookingValue = totalBookings > 0 ? totalRevenue / confirmedBookings : 0;

  // Room stats
  const rooms = await prisma.room.findMany({
    where: { hotelId: hotel.id },
    include: {
      bookings: {
        where: {
          OR: [{ status: "CONFIRMED" }, { status: "COMPLETED" }],
        },
      },
    },
  });

  const popularRooms = rooms
    .map((room) => ({
      roomName: room.name,
      bookingCount: room.bookings.length,
      totalRevenue: room.bookings.reduce((sum, b) => sum + Number(b.totalPrice), 0),
    }))
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 5);

  const occupancyRate =
    rooms.length > 0
      ? ((rooms.filter((r) => r.status === "OCCUPIED").length / rooms.length) * 100).toFixed(1)
      : "0";

  const stats = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Total Bookings",
      value: totalBookings.toString(),
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Average Booking Value",
      value: `$${averageBookingValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate}%`,
      icon: Bed,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-gray-600">Track your hotel's performance and insights</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Popular Rooms */}
        {popularRooms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Popular Rooms</CardTitle>
              <CardDescription>Top performing rooms by bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularRooms.map((room, index) => (
                  <div
                    key={room.roomName}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{room.roomName}</p>
                        <p className="text-sm text-gray-600">
                          {room.bookingCount} {room.bookingCount === 1 ? "booking" : "bookings"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        ${room.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500">Total revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
