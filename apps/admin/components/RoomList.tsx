"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "ui";
import { Plus, Edit, Trash2, DollarSign, Users, Bed, Image as ImageIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Room {
  id: string;
  name: string;
  description: string | null;
  price: any;
  capacity: number;
  status: string;
  images: string | null;
}

export function RoomList({ initialRooms, hotelId }: { initialRooms: Room[]; hotelId: string }) {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    capacity: "2",
    status: "AVAILABLE",
    image: "",
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageInput, setCurrentImageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      capacity: "2",
      status: "AVAILABLE",
      image: "",
    });
    setImageUrls([]);
    setCurrentImageInput("");
    setEditingRoom(null);
    setShowAddForm(false);
    setError("");
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      description: room.description || "",
      price: Number(room.price).toString(),
      capacity: room.capacity.toString(),
      status: room.status,
      image: "",
    });
    // Parse images JSON array
    try {
      const parsedImages = room.images ? JSON.parse(room.images) : [];
      setImageUrls(Array.isArray(parsedImages) ? parsedImages : []);
    } catch {
      setImageUrls([]);
    }
    setShowAddForm(true);
  };

  const addImageUrl = () => {
    if (currentImageInput.trim()) {
      setImageUrls([...imageUrls, currentImageInput.trim()]);
      setCurrentImageInput("");
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (imageUrls.length === 0) {
      setError("Please add at least one image");
      return;
    }

    setIsLoading(true);

    try {
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : "/api/rooms";
      const method = editingRoom ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          capacity: parseInt(formData.capacity),
          images: JSON.stringify(imageUrls), // Send images as JSON array
          hotelId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save room");
      }

      resetForm();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete room");
      }

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Add/Edit Room Form */}
      {showAddForm && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingRoom ? "Edit Room" : "Add New Room"}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={resetForm}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Room Images - Multiple Upload */}
              <div className="space-y-3">
                <Label>Room Images (Multiple)</Label>
                <p className="text-xs text-gray-500">Add multiple images showing different angles of the room</p>

                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={currentImageInput}
                    onChange={(e) => setCurrentImageInput(e.target.value)}
                    placeholder="https://example.com/room-image.jpg"
                    disabled={isLoading}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addImageUrl();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addImageUrl}
                    disabled={isLoading || !currentImageInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Image Preview Grid */}
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={url}
                            alt={`Room preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23999'%3EImage not found%3C/text%3E%3C/svg%3E";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImageUrl(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={isLoading}
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {imageUrls.length === 0 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">No images added yet</p>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Room Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Deluxe Suite"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price per Night *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="250.00"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the room features and amenities..."
                  disabled={isLoading}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Guest Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Availability Status *</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="MAINTENANCE">Under Maintenance</option>
                    <option value="CLEANING">Cleaning</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : editingRoom ? "Update Room" : "Add Room"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add Room Button */}
      {!showAddForm && (
        <div className="mb-6">
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Room
          </Button>
        </div>
      )}

      {/* Rooms Grid */}
      {rooms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bed className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 mb-4">No rooms added yet</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id}>
              {room.images && (
                <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={room.images}
                    alt={room.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    {room.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {room.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ml-2 whitespace-nowrap ${
                      room.status === "AVAILABLE"
                        ? "bg-green-100 text-green-800"
                        : room.status === "OCCUPIED"
                        ? "bg-red-100 text-red-800"
                        : room.status === "MAINTENANCE"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {room.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Price</span>
                    </div>
                    <span className="font-semibold">${Number(room.price).toFixed(2)}/night</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Capacity</span>
                    </div>
                    <span className="font-semibold">{room.capacity} guests</span>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(room)}
                      disabled={isLoading}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(room.id)}
                      disabled={isLoading}
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
      )}
    </>
  );
}
