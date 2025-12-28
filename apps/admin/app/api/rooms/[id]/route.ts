import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, price, capacity, status, images } =
      await request.json();

    // Verify user owns this room's hotel
    const room = await prisma.room.findUnique({
      where: { id: params.id },
      include: { hotel: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.tenantId !== room.hotel.tenantId) {
      return NextResponse.json(
        { error: "You don't have permission to edit this room" },
        { status: 403 }
      );
    }

    // Update room
    const updatedRoom = await prisma.room.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        price,
        capacity,
        status,
        images: images || null,
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("Room update error:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns this room's hotel
    const room = await prisma.room.findUnique({
      where: { id: params.id },
      include: { hotel: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.tenantId !== room.hotel.tenantId) {
      return NextResponse.json(
        { error: "You don't have permission to delete this room" },
        { status: 403 }
      );
    }

    // Delete room
    await prisma.room.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Room deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
