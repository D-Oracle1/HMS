import { PrismaClient } from "./generated/client";
import { hashPassword } from "./password";

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
      theme: JSON.stringify({
        primaryColor: "#000000",
        secondaryColor: "#ffffff",
        fontFamily: "Inter",
      }),
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
      description: "Experience luxury like never before at Demo Grand Hotel. Our 5-star property offers world-class amenities, stunning ocean views, and exceptional service that will make your stay unforgettable. Located in the heart of Lagos, we provide the perfect blend of business and leisure facilities.",
      address: "123 Main Street, Lagos, Nigeria",
      email: "info@demograndhotel.com",
      phone: "+234-123-456-7890",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Sample video URL
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200",
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

  // Create demo users with hashed passwords
  // Default password for all demo users: "password123"
  const hashedPassword = await hashPassword("password123");

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@hms.com" },
    update: {},
    create: {
      email: "superadmin@hms.com",
      name: "Super Admin",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      name: "Hotel Admin",
      password: hashedPassword,
      role: "ADMIN",
      tenantId: tenant.id,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@demo.com" },
    update: {},
    create: {
      email: "user@demo.com",
      name: "Demo User",
      password: hashedPassword,
      role: "USER",
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
