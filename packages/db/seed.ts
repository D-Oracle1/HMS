import { PrismaClient, Role } from "./generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: "demo" },
    update: {},
    create: {
      name: "Demo Hotel Group",
      subdomain: "demo",
      logoUrl: "/demo-logo.png",
      theme: {
        primaryColor: "#000000",
        secondaryColor: "#ffffff",
        fontFamily: "Inter",
      },
      isActive: true,
    },
  });

  console.log("Created tenant:", tenant.name);

  // Create demo hotel
  const hotel = await prisma.hotel.upsert({
    where: { id: "demo-hotel-1" },
    update: {},
    create: {
      id: "demo-hotel-1",
      name: "Demo Grand Hotel",
      address: "123 Main Street, Lagos, Nigeria",
      email: "info@demograndhotel.com",
      phone: "+234-123-456-7890",
      tenantId: tenant.id,
    },
  });

  console.log("Created hotel:", hotel.name);

  // Create rooms
  const rooms = [
    {
      name: "Deluxe Suite",
      description: "Luxury suite with ocean view",
      price: 250.0,
      capacity: 2,
      imageUrl: "/rooms/deluxe-suite.jpg",
    },
    {
      name: "Standard Room",
      description: "Comfortable room with city view",
      price: 100.0,
      capacity: 2,
      imageUrl: "/rooms/standard-room.jpg",
    },
    {
      name: "Family Room",
      description: "Spacious room for families",
      price: 180.0,
      capacity: 4,
      imageUrl: "/rooms/family-room.jpg",
    },
    {
      name: "Executive Suite",
      description: "Premium suite with business amenities",
      price: 350.0,
      capacity: 2,
      imageUrl: "/rooms/executive-suite.jpg",
    },
  ];

  for (const room of rooms) {
    await prisma.room.create({
      data: {
        ...room,
        hotelId: hotel.id,
      },
    });
    console.log("Created room:", room.name);
  }

  // Create demo users
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@hms.com" },
    update: {},
    create: {
      email: "superadmin@hms.com",
      name: "Super Admin",
      password: "$2a$10$YourHashedPasswordHere", // In production, use bcrypt
      role: Role.SUPER_ADMIN,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      name: "Hotel Admin",
      password: "$2a$10$YourHashedPasswordHere", // In production, use bcrypt
      role: Role.ADMIN,
      tenantId: tenant.id,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@demo.com" },
    update: {},
    create: {
      email: "user@demo.com",
      name: "Demo User",
      password: "$2a$10$YourHashedPasswordHere", // In production, use bcrypt
      role: Role.USER,
      tenantId: tenant.id,
    },
  });

  console.log("Created users:", {
    superAdmin: superAdmin.email,
    admin: admin.email,
    user: user.email,
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
