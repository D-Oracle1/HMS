"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Input } from "ui";
import { Calendar, Users, CreditCard } from "lucide-react";
import { getStripe } from "../../../lib/stripe";

export default function BookingPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<any>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Mock room data - replace with actual API call
    setRoom({
      id: roomId,
      name: "Deluxe Suite",
      description: "Luxury suite with ocean view and premium amenities",
      price: 250,
      capacity: 2,
      imageUrl: "/rooms/deluxe-suite.jpg",
    });
  }, [roomId]);

  const calculateTotal = () => {
    if (!checkIn || !checkOut || !room) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days * room.price : 0;
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: room.id,
          roomName: room.name,
          checkIn,
          checkOut,
          totalPrice: calculateTotal(),
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await getStripe();

      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to process checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!room) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Book Your Stay</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Room Details */}
          <Card>
            <CardHeader>
              <CardTitle>{room.name}</CardTitle>
              <CardDescription>{room.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>Capacity: {room.capacity} guests</span>
                </div>
                <div className="text-3xl font-bold text-primary">
                  ${room.price}/night
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Reservation Details</CardTitle>
              <CardDescription>Select your dates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="checkIn">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Check-in Date
                </Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkOut">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Check-out Date
                </Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split("T")[0]}
                />
              </div>

              {total > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg">Total Amount</span>
                    <span className="text-2xl font-bold">${total}</span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={isLoading || !checkIn || !checkOut}
                    className="w-full"
                    size="lg"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    {isLoading ? "Processing..." : "Proceed to Payment"}
                  </Button>
                </div>
              )}

              {!checkIn || !checkOut && (
                <p className="text-sm text-muted-foreground text-center">
                  Please select check-in and check-out dates
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
