"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui";
import { DollarSign, Users, Calendar, TrendingUp, Bed } from "lucide-react";

export default function AdminDashboardPage() {
  const stats = [
    {
      title: "Total Revenue",
      value: "$45,231",
      change: "+20.1%",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Total Bookings",
      value: "156",
      change: "+12.5%",
      icon: Calendar,
      trend: "up",
    },
    {
      title: "Occupancy Rate",
      value: "78%",
      change: "+3.2%",
      icon: Bed,
      trend: "up",
    },
    {
      title: "Total Guests",
      value: "342",
      change: "+8.1%",
      icon: Users,
      trend: "up",
    },
  ];

  const recentBookings = [
    {
      id: "1",
      guest: "John Doe",
      room: "Deluxe Suite",
      checkIn: "2025-11-10",
      status: "Confirmed",
    },
    {
      id: "2",
      guest: "Jane Smith",
      room: "Standard Room",
      checkIn: "2025-11-12",
      status: "Pending",
    },
    {
      id: "3",
      guest: "Bob Johnson",
      room: "Executive Suite",
      checkIn: "2025-11-15",
      status: "Confirmed",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your hotel performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest reservations in your hotel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{booking.guest}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.room}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{booking.checkIn}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        booking.status === "Confirmed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
