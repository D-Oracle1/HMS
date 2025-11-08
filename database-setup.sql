-- ============================================
-- Multi-Tenant Hotel Management System
-- Complete Database Schema Setup
-- ============================================

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS "Booking" CASCADE;
DROP TABLE IF EXISTS "Room" CASCADE;
DROP TABLE IF EXISTS "Hotel" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Tenant" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "BookingStatus" CASCADE;

-- ============================================
-- Create Enums
-- ============================================

CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- ============================================
-- Create Tables
-- ============================================

-- Tenant Table (Multi-tenant support)
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "logoUrl" TEXT,
    "theme" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- Hotel Table
CREATE TABLE "Hotel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

-- Room Table
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "hotelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- User Table (with role-based access)
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Booking Table
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentId" TEXT,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Create Indexes
-- ============================================

-- Unique indexes
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Performance indexes
CREATE INDEX "Hotel_tenantId_idx" ON "Hotel"("tenantId");
CREATE INDEX "Room_hotelId_idx" ON "Room"("hotelId");
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX "Booking_roomId_idx" ON "Booking"("roomId");
CREATE INDEX "Booking_hotelId_idx" ON "Booking"("hotelId");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "User_role_idx" ON "User"("role");

-- ============================================
-- Add Foreign Key Constraints
-- ============================================

ALTER TABLE "Hotel"
    ADD CONSTRAINT "Hotel_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE "Room"
    ADD CONSTRAINT "Room_hotelId_fkey"
    FOREIGN KEY ("hotelId")
    REFERENCES "Hotel"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE "User"
    ADD CONSTRAINT "User_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

ALTER TABLE "Booking"
    ADD CONSTRAINT "Booking_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "User"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE "Booking"
    ADD CONSTRAINT "Booking_roomId_fkey"
    FOREIGN KEY ("roomId")
    REFERENCES "Room"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE "Booking"
    ADD CONSTRAINT "Booking_hotelId_fkey"
    FOREIGN KEY ("hotelId")
    REFERENCES "Hotel"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- ============================================
-- Insert Demo Data
-- ============================================

-- Demo Tenant
INSERT INTO "Tenant" ("id", "name", "subdomain", "logoUrl", "theme", "isActive", "createdAt", "updatedAt")
VALUES (
    'demo-tenant-1',
    'Demo Hotel Group',
    'demo',
    '/demo-logo.png',
    '{"primaryColor":"#000000","secondaryColor":"#ffffff","accentColor":"#3b82f6","fontFamily":"Inter","borderRadius":"0.5rem"}',
    true,
    NOW(),
    NOW()
);

-- Demo Hotel
INSERT INTO "Hotel" ("id", "name", "address", "email", "phone", "tenantId", "createdAt", "updatedAt")
VALUES (
    'demo-hotel-1',
    'Demo Grand Hotel',
    '123 Main Street, Victoria Island, Lagos, Nigeria',
    'info@demograndhotel.com',
    '+234-123-456-7890',
    'demo-tenant-1',
    NOW(),
    NOW()
);

-- Demo Rooms
INSERT INTO "Room" ("id", "name", "description", "price", "capacity", "available", "imageUrl", "hotelId", "createdAt", "updatedAt")
VALUES
    (
        'room-deluxe-1',
        'Deluxe Suite',
        'Luxury suite with ocean view, king-size bed, and premium amenities including marble bathroom, smart TV, and private balcony',
        250.00,
        2,
        true,
        '/rooms/deluxe-suite.jpg',
        'demo-hotel-1',
        NOW(),
        NOW()
    ),
    (
        'room-standard-1',
        'Standard Room',
        'Comfortable room with city view, queen-size bed, air conditioning, work desk, and complimentary Wi-Fi',
        100.00,
        2,
        true,
        '/rooms/standard-room.jpg',
        'demo-hotel-1',
        NOW(),
        NOW()
    ),
    (
        'room-family-1',
        'Family Room',
        'Spacious room perfect for families with two queen beds, separate seating area, and child-friendly amenities',
        180.00,
        4,
        true,
        '/rooms/family-room.jpg',
        'demo-hotel-1',
        NOW(),
        NOW()
    ),
    (
        'room-executive-1',
        'Executive Suite',
        'Premium suite with business amenities, executive lounge access, meeting space, and panoramic city views',
        350.00,
        2,
        true,
        '/rooms/executive-suite.jpg',
        'demo-hotel-1',
        NOW(),
        NOW()
    ),
    (
        'room-standard-2',
        'Standard Room - Garden View',
        'Peaceful room overlooking lush gardens with queen bed, modern bathroom, and relaxing ambiance',
        110.00,
        2,
        true,
        '/rooms/garden-view.jpg',
        'demo-hotel-1',
        NOW(),
        NOW()
    ),
    (
        'room-deluxe-2',
        'Deluxe Suite - Penthouse',
        'Top floor luxury suite with 360-degree views, jacuzzi, separate living area, and exclusive concierge service',
        450.00,
        3,
        true,
        '/rooms/penthouse.jpg',
        'demo-hotel-1',
        NOW(),
        NOW()
    );

-- Demo Users (Note: In production, use bcrypt to hash passwords)
-- Password for all demo accounts is 'demo123' (you should implement proper hashing)
INSERT INTO "User" ("id", "email", "name", "password", "role", "tenantId", "createdAt", "updatedAt")
VALUES
    (
        'superadmin-1',
        'superadmin@hms.com',
        'Super Admin',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- demo123
        'SUPER_ADMIN',
        NULL,
        NOW(),
        NOW()
    ),
    (
        'admin-1',
        'admin@demo.com',
        'Hotel Admin',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- demo123
        'ADMIN',
        'demo-tenant-1',
        NOW(),
        NOW()
    ),
    (
        'user-1',
        'user@demo.com',
        'Demo User',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- demo123
        'USER',
        'demo-tenant-1',
        NOW(),
        NOW()
    ),
    (
        'user-2',
        'john@example.com',
        'John Doe',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- demo123
        'USER',
        'demo-tenant-1',
        NOW(),
        NOW()
    ),
    (
        'user-3',
        'jane@example.com',
        'Jane Smith',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- demo123
        'USER',
        'demo-tenant-1',
        NOW(),
        NOW()
    );

-- Demo Bookings
INSERT INTO "Booking" ("id", "checkIn", "checkOut", "totalPrice", "status", "paymentId", "userId", "roomId", "hotelId", "createdAt", "updatedAt")
VALUES
    (
        'booking-1',
        '2025-12-01 14:00:00',
        '2025-12-05 11:00:00',
        1000.00,
        'CONFIRMED',
        'pi_demo_123456',
        'user-2',
        'room-deluxe-1',
        'demo-hotel-1',
        NOW(),
        NOW()
    ),
    (
        'booking-2',
        '2025-12-10 14:00:00',
        '2025-12-12 11:00:00',
        200.00,
        'PENDING',
        NULL,
        'user-3',
        'room-standard-1',
        'demo-hotel-1',
        NOW(),
        NOW()
    ),
    (
        'booking-3',
        '2025-12-15 14:00:00',
        '2025-12-20 11:00:00',
        1750.00,
        'CONFIRMED',
        'pi_demo_789012',
        'user-1',
        'room-executive-1',
        'demo-hotel-1',
        NOW(),
        NOW()
    );

-- ============================================
-- Verification Queries
-- ============================================

-- Count records in each table
SELECT
    'Tenants' as table_name,
    COUNT(*) as record_count
FROM "Tenant"
UNION ALL
SELECT 'Hotels', COUNT(*) FROM "Hotel"
UNION ALL
SELECT 'Rooms', COUNT(*) FROM "Room"
UNION ALL
SELECT 'Users', COUNT(*) FROM "User"
UNION ALL
SELECT 'Bookings', COUNT(*) FROM "Booking";

-- Display all demo data
SELECT '=== TENANTS ===' as info;
SELECT * FROM "Tenant";

SELECT '=== HOTELS ===' as info;
SELECT * FROM "Hotel";

SELECT '=== ROOMS ===' as info;
SELECT * FROM "Room";

SELECT '=== USERS ===' as info;
SELECT id, email, name, role FROM "User";

SELECT '=== BOOKINGS ===' as info;
SELECT * FROM "Booking";

-- ============================================
-- Success Message
-- ============================================

SELECT '✅ Database setup complete!' as status,
       '6 tables created' as tables,
       '1 tenant, 1 hotel, 6 rooms, 5 users, 3 bookings' as demo_data;
