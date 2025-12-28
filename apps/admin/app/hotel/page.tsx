import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "db";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "ui";
import { Hotel as HotelIcon, MapPin, Phone, Mail, Star, CheckCircle, XCircle } from "lucide-react";
import { HotelForm } from "@/components/HotelForm";

export default async function HotelPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Get user's hotel with all details
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
            <HotelIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-2">No Hotel Found</h1>
            <p className="text-gray-600 mb-6">
              You don't have a hotel associated with your account yet.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hotel Management</h1>
          <p className="text-gray-600">
            Manage your hotel details, photos, and settings
          </p>
        </div>

        {/* Hotel Overview Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Hotel Overview</span>
              <div className="flex items-center gap-2">
                {hotel.verified ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    <XCircle className="h-4 w-4" />
                    Pending Verification
                  </span>
                )}
                {hotel.featured && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    <Star className="h-4 w-4" />
                    Featured
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Hotel Name</label>
                  <p className="text-lg font-semibold">{hotel.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-gray-400" />
                    <span>{hotel.address}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">City</label>
                  <p>{hotel.city}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{hotel.phone}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{hotel.email}</span>
                  </p>
                </div>
                {hotel.rating && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rating</label>
                    <p className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{hotel.rating.toFixed(1)}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {hotel.description && (
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-2 text-gray-700">{hotel.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hotel Edit Form */}
        <HotelForm hotel={hotel} />
      </div>
    </DashboardLayout>
  );
}
