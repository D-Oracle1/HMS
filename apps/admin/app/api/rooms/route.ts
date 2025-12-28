import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, price, capacity, status, images, hotelId } =
      await request.json();

    // Verify user owns this hotel
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.tenantId !== hotel.tenantId) {
      return NextResponse.json(
        { error: "You don't have permission to add rooms to this hotel" },
        { status: 403 }
      );
    }

    // Create room
    const room = await prisma.room.create({
      data: {
        name,
        description: description || null,
        price,
        capacity,
        status: status || "AVAILABLE",
        images: images || null,
        hotelId,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("Room creation error:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
