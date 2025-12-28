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

    const { name, address, city, phone, email, description, image } =
      await request.json();

    // Verify user owns this hotel
    const hotel = await prisma.hotel.findUnique({
      where: { id: params.id },
      include: { tenant: true },
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.tenantId !== hotel.tenantId) {
      return NextResponse.json(
        { error: "You don't have permission to edit this hotel" },
        { status: 403 }
      );
    }

    // Update hotel
    const updatedHotel = await prisma.hotel.update({
      where: { id: params.id },
      data: {
        name,
        address,
        city,
        phone,
        email,
        description,
        image: image || null,
      },
    });

    return NextResponse.json(updatedHotel);
  } catch (error) {
    console.error("Hotel update error:", error);
    return NextResponse.json(
      { error: "Failed to update hotel" },
      { status: 500 }
    );
  }
}
