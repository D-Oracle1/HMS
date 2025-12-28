import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "db";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RoomList } from "@/components/RoomList";

export default async function RoomsPage() {
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

  // Get rooms
  const rooms = await prisma.room.findMany({
    where: { hotelId: hotel.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Rooms Management</h1>
          <p className="text-gray-600">
            Manage your hotel rooms, pricing, and availability
          </p>
        </div>

        <RoomList initialRooms={rooms} hotelId={hotel.id} />
      </div>
    </DashboardLayout>
  );
}
