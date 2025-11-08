"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "ui";
import { Plus, Edit, Trash2, DollarSign, Users } from "lucide-react";

export default function RoomsPage() {
  const [rooms, setRooms] = useState([
    {
      id: "1",
      name: "Deluxe Suite",
      description: "Luxury suite with ocean view",
      price: 250,
      capacity: 2,
      available: true,
    },
    {
      id: "2",
      name: "Standard Room",
      description: "Comfortable room with city view",
      price: 100,
      capacity: 2,
      available: true,
    },
    {
      id: "3",
      name: "Family Room",
      description: "Spacious room for families",
      price: 180,
      capacity: 4,
      available: true,
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Rooms Management</h1>
            <p className="text-muted-foreground">
              Manage your hotel rooms and availability
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </div>

        {/* Add Room Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Room</CardTitle>
              <CardDescription>Create a new room listing</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Room Name</Label>
                    <Input id="name" placeholder="Deluxe Suite" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price per Night</Label>
                    <Input id="price" type="number" placeholder="250" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Luxury suite with ocean view"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input id="capacity" type="number" placeholder="2" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Save Room</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Rooms Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{room.name}</CardTitle>
                    <CardDescription>{room.description}</CardDescription>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      room.available
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {room.available ? "Available" : "Occupied"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Price
                      </span>
                    </div>
                    <span className="font-semibold">${room.price}/night</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Capacity
                      </span>
                    </div>
                    <span className="font-semibold">
                      {room.capacity} guests
                    </span>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
