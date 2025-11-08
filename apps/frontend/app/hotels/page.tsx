"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button } from "ui";
import { MapPin, Star, ChevronRight } from "lucide-react";

export default function HotelsPage() {
  const [hotels, setHotels] = useState<any[]>([]);

  useEffect(() => {
    // Mock hotel data - replace with actual API call
    setHotels([
      {
        id: "1",
        name: "Demo Grand Hotel",
        address: "123 Main Street, Lagos, Nigeria",
        rating: 4.8,
        roomCount: 4,
        startingPrice: 100,
      },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Find Your Perfect Stay</h1>
          <p className="text-xl opacity-90">
            Discover luxury hotels and book your next adventure
          </p>
        </div>
      </div>

      {/* Hotels List */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hotels.map((hotel) => (
            <Card key={hotel.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <MapPin className="h-16 w-16 text-muted-foreground" />
              </div>
              <CardHeader>
                <CardTitle>{hotel.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {hotel.address}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{hotel.rating}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {hotel.roomCount} rooms available
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-muted-foreground">Starting from</span>
                  <div className="text-2xl font-bold">${hotel.startingPrice}/night</div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/hotels/${hotel.id}`} className="w-full">
                  <Button className="w-full">
                    View Rooms
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
