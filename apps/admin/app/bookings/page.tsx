"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "ui";
import { Calendar, User, DollarSign, Filter } from "lucide-react";

export default function BookingsPage() {
  const bookings = [
    {
      id: "1",
      guest: "John Doe",
      email: "john@example.com",
      room: "Deluxe Suite",
      checkIn: "2025-11-10",
      checkOut: "2025-11-15",
      totalPrice: 1250,
      status: "CONFIRMED",
    },
    {
      id: "2",
      guest: "Jane Smith",
      email: "jane@example.com",
      room: "Standard Room",
      checkIn: "2025-11-12",
      checkOut: "2025-11-14",
      totalPrice: 200,
      status: "PENDING",
    },
    {
      id: "3",
      guest: "Bob Johnson",
      email: "bob@example.com",
      room: "Executive Suite",
      checkIn: "2025-11-15",
      checkOut: "2025-11-20",
      totalPrice: 1750,
      status: "CONFIRMED",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Bookings</h1>
            <p className="text-muted-foreground">
              Manage all hotel reservations
            </p>
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
            <CardDescription>
              View and manage guest reservations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">
                          {booking.guest}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {booking.email}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Room
                      </p>
                      <p className="font-medium">{booking.room}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Check-in
                      </p>
                      <p className="font-medium">{booking.checkIn}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Check-out
                      </p>
                      <p className="font-medium">{booking.checkOut}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Total
                      </p>
                      <p className="font-medium">${booking.totalPrice}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    {booking.status === "PENDING" && (
                      <>
                        <Button size="sm">Confirm</Button>
                        <Button size="sm" variant="destructive">
                          Cancel
                        </Button>
                      </>
                    )}
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
