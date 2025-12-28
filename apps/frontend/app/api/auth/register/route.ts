import { NextRequest, NextResponse } from "next/server";
import { prisma, hashPassword } from "db";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, userType, hotelData } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Validate hotel-specific data
    if (userType === "HOTEL") {
      if (!hotelData || !hotelData.name || !hotelData.address || !hotelData.city || !hotelData.phone) {
        return NextResponse.json(
          { error: "Hotel name, address, city, and phone are required for hotel registration" },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Determine user role
    const role = userType === "HOTEL" ? "ADMIN" : "USER";

    // Create user and hotel in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant for hotel owner
      let tenant = null;
      if (userType === "HOTEL") {
        tenant = await tx.tenant.create({
          data: {
            name: hotelData.name,
            subdomain: hotelData.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            isActive: true,
          },
        });
      }

      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          phone: phone || null,
          tenantId: tenant?.id || null,
        },
      });

      // Create hotel if user type is HOTEL
      let hotel = null;
      if (userType === "HOTEL" && tenant) {
        hotel = await tx.hotel.create({
          data: {
            name: hotelData.name,
            address: hotelData.address,
            city: hotelData.city,
            phone: hotelData.phone,
            description: hotelData.description || null,
            email: email,
            tenantId: tenant.id,
            verified: false, // Require verification for new hotels
            featured: false,
          },
        });
      }

      return { user, hotel, tenant };
    });

    const responseData: any = {
      message: "Account created successfully",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
    };

    if (result.hotel) {
      responseData.hotel = {
        id: result.hotel.id,
        name: result.hotel.name,
      };
      responseData.message = "Hotel account created successfully! You can now manage your property.";
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
