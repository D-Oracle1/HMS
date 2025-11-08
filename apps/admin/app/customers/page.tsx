"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input } from "ui";
import { Search, Mail, Phone, MapPin } from "lucide-react";

export default function CustomersPage() {
  const customers = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      phone: "+1 234 567 8900",
      location: "New York, USA",
      totalBookings: 5,
      totalSpent: 3250,
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+1 234 567 8901",
      location: "Los Angeles, USA",
      totalBookings: 3,
      totalSpent: 1800,
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@example.com",
      phone: "+1 234 567 8902",
      location: "Chicago, USA",
      totalBookings: 7,
      totalSpent: 5600,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Customers</h1>
            <p className="text-muted-foreground">
              Manage your hotel guests
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search customers..."
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <Card key={customer.id}>
              <CardHeader>
                <CardTitle>{customer.name}</CardTitle>
                <CardDescription>
                  {customer.totalBookings} bookings • ${customer.totalSpent}{" "}
                  spent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.location}</span>
                </div>
                <div className="pt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
