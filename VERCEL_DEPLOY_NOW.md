# 🚀 DEPLOY TO VERCEL - Complete Guide

## ✅ Your Database is Ready!

Connection String: `postgresql://postgres:VicsonDigitals@db.mnjqupwgvxvckouhzqhw.supabase.co:5432/postgres`

---

## 📋 Environment Variables for All Apps

Copy these exact values for EACH Vercel project:

### Required for ALL 3 apps (Frontend, Admin, Super Admin):

```env
DATABASE_URL=postgresql://postgres:VicsonDigitals@db.mnjqupwgvxvckouhzqhw.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1

DIRECT_URL=postgresql://postgres:VicsonDigitals@db.mnjqupwgvxvckouhzqhw.supabase.co:5432/postgres

NEXTAUTH_SECRET=
(Generate with: openssl rand -base64 32 in your terminal)

NEXTAUTH_URL=
(Leave blank, update after deployment)

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
(Get from https://dashboard.stripe.com/test/apikeys)

STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
(Get from https://dashboard.stripe.com/test/apikeys)

STRIPE_WEBHOOK_SECRET=
(Leave blank for now)
```

---

## 🚀 Step-by-Step Vercel Deployment

### Step 1: Deploy Frontend

1. **Go to:** https://vercel.com/new

2. **Import your repository:** `D-Oracle1/HMS`

3. **Configure:**
   - Project Name: `hms-frontend`
   - Root Directory: **`apps/frontend`** ← IMPORTANT!
   - Framework: Next.js (auto-detected)

4. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add all variables from above
   - For `NEXTAUTH_SECRET`, run `openssl rand -base64 32` in your terminal and paste result
   - Leave `NEXTAUTH_URL` empty for now

5. **Click Deploy** 🚀

6. **After deployment:**
   - Copy your URL (e.g., `hms-frontend-abc123.vercel.app`)
   - Go to Settings > Environment Variables
   - Edit `NEXTAUTH_URL` → `https://hms-frontend-abc123.vercel.app`
   - Click Deployments > Latest > ⋯ > Redeploy

---

### Step 2: Deploy Admin

1. **Import repository again** (same repo)

2. **Configure:**
   - Project Name: `hms-admin`
   - Root Directory: **`apps/admin`** ← IMPORTANT!
   - Framework: Next.js

3. **Add same environment variables**
   - After deployment, update `NEXTAUTH_URL` to admin URL

4. **Deploy**

---

### Step 3: Deploy Super Admin

1. **Import repository one more time**

2. **Configure:**
   - Project Name: `hms-super-admin`
   - Root Directory: **`apps/super-admin`** ← IMPORTANT!
   - Framework: Next.js

3. **Add environment variables**

4. **Deploy**

---

## 🗄️ Initialize Database (IMPORTANT!)

After all apps are deployed, you need to create the database tables.

### Option A: Run Locally

```bash
# In your local machine, navigate to the project
cd HMS

# Create .env file
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:VicsonDigitals@db.mnjqupwgvxvckouhzqhw.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:VicsonDigitals@db.mnjqupwgvxvckouhzqhw.supabase.co:5432/postgres"
EOF

# Install dependencies
npm install

# Generate Prisma Client
cd packages/db
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed demo data
npx prisma db seed
```

### Option B: Run in Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/mnjqupwgvxvckouhzqhw/sql/new

2. **Copy and run this SQL:**

```sql
-- Create tables
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "logoUrl" TEXT,
    "theme" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Hotel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Add foreign keys
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Room" ADD CONSTRAINT "Room_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert demo data
INSERT INTO "Tenant" ("id", "name", "subdomain", "logoUrl", "theme", "isActive", "createdAt", "updatedAt")
VALUES ('demo-tenant-1', 'Demo Hotel Group', 'demo', '/demo-logo.png', '{"primaryColor":"#000000","secondaryColor":"#ffffff","fontFamily":"Inter"}', true, NOW(), NOW());

INSERT INTO "Hotel" ("id", "name", "address", "email", "phone", "tenantId", "createdAt", "updatedAt")
VALUES ('demo-hotel-1', 'Demo Grand Hotel', '123 Main Street, Lagos, Nigeria', 'info@demograndhotel.com', '+234-123-456-7890', 'demo-tenant-1', NOW(), NOW());

INSERT INTO "Room" ("id", "name", "description", "price", "capacity", "available", "imageUrl", "hotelId", "createdAt", "updatedAt")
VALUES
('room-1', 'Deluxe Suite', 'Luxury suite with ocean view', 250, 2, true, '/rooms/deluxe-suite.jpg', 'demo-hotel-1', NOW(), NOW()),
('room-2', 'Standard Room', 'Comfortable room with city view', 100, 2, true, '/rooms/standard-room.jpg', 'demo-hotel-1', NOW(), NOW()),
('room-3', 'Family Room', 'Spacious room for families', 180, 4, true, '/rooms/family-room.jpg', 'demo-hotel-1', NOW(), NOW()),
('room-4', 'Executive Suite', 'Premium suite with business amenities', 350, 2, true, '/rooms/executive-suite.jpg', 'demo-hotel-1', NOW(), NOW());

INSERT INTO "User" ("id", "email", "name", "password", "role", "tenantId", "createdAt", "updatedAt")
VALUES
('superadmin-1', 'superadmin@hms.com', 'Super Admin', '$2a$10$YourHashedPassword', 'SUPER_ADMIN', NULL, NOW(), NOW()),
('admin-1', 'admin@demo.com', 'Hotel Admin', '$2a$10$YourHashedPassword', 'ADMIN', 'demo-tenant-1', NOW(), NOW()),
('user-1', 'user@demo.com', 'Demo User', '$2a$10$YourHashedPassword', 'USER', 'demo-tenant-1', NOW(), NOW());
```

---

## 🎯 After Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Admin deployed and accessible
- [ ] Super Admin deployed and accessible
- [ ] Database tables created (via SQL or migrations)
- [ ] Demo data seeded
- [ ] Test login on each app
- [ ] Update `NEXTAUTH_URL` for all three apps
- [ ] Configure Stripe webhook (next step)

---

## 💳 Setup Stripe Webhook (Optional)

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://your-frontend-url.vercel.app/api/webhooks/stripe`
4. Select event: `checkout.session.completed`
5. Copy signing secret (whsec_...)
6. Add to Frontend's Vercel env vars: `STRIPE_WEBHOOK_SECRET`
7. Redeploy frontend

---

## 🎉 You're Done!

Your apps will be at:
- **Frontend:** `https://hms-frontend-xxx.vercel.app`
- **Admin:** `https://hms-admin-xxx.vercel.app`
- **Super Admin:** `https://hms-super-admin-xxx.vercel.app`

### Demo Accounts:
```
Super Admin: superadmin@hms.com
Admin: admin@demo.com
User: user@demo.com
Password: (any password - auth is simplified for demo)
```

---

## 🆘 Troubleshooting

**Build fails?**
- Check Root Directory is set correctly
- Verify all environment variables are added
- Check build logs for specific errors

**Database connection error?**
- Verify DATABASE_URL and DIRECT_URL are correct
- Ensure database tables are created
- Check Supabase project is active

**Can't login?**
- Verify NEXTAUTH_URL matches your actual URL
- Check NEXTAUTH_SECRET is set
- Redeploy after updating env vars

---

**Need help? Let me know!** 🚀
