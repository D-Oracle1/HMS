import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const body = await request.json();
    const { theme } = body;

    const tenant = await prisma.tenant.update({
      where: {
        id: params.tenantId,
      },
      data: {
        theme,
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Error updating theme:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
