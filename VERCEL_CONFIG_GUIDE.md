# 🔧 Vercel Build Configuration & Environment Variables

Complete configuration guide for deploying all 3 apps to Vercel.

---

## 📦 Build Settings for Each App

### **App 1: Frontend**

**In Vercel Dashboard:**

| Setting | Value |
|---------|-------|
| **Project Name** | `hms-frontend` |
| **Root Directory** | `apps/frontend` |
| **Framework Preset** | Next.js (auto-detected) |
| **Build Command** | (leave empty - uses default `npm run build`) |
| **Output Directory** | (leave empty - uses default `.next`) |
| **Install Command** | (leave empty - uses default `npm install`) |
| **Node Version** | 18.x (default) |

---

### **App 2: Admin**

**In Vercel Dashboard:**

| Setting | Value |
|---------|-------|
| **Project Name** | `hms-admin` |
| **Root Directory** | `apps/admin` |
| **Framework Preset** | Next.js (auto-detected) |
| **Build Command** | (leave empty) |
| **Output Directory** | (leave empty) |
| **Install Command** | (leave empty) |
| **Node Version** | 18.x (default) |

---

### **App 3: Super Admin**

**In Vercel Dashboard:**

| Setting | Value |
|---------|-------|
| **Project Name** | `hms-super-admin` |
| **Root Directory** | `apps/super-admin` |
| **Framework Preset** | Next.js (auto-detected) |
| **Build Command** | (leave empty) |
| **Output Directory** | (leave empty) |
| **Install Command** | (leave empty) |
| **Node Version** | 18.x (default) |

---

## 🔐 Environment Variables (Copy-Paste Ready)

Add these to **ALL THREE** Vercel projects (Frontend, Admin, Super Admin).

### **Step 1: Generate NEXTAUTH_SECRET**

Run this in your terminal:
```bash
openssl rand -base64 32
```

Copy the output (something like: `abc123XYZ789...`)

---

### **Step 2: Add Environment Variables to Vercel**

In each Vercel project: **Settings → Environment Variables**

Click **"Add New"** for each variable below:

---

#### ✅ **Required Variables (Add These Now):**

| Name | Value | Notes |
|------|-------|-------|
| `DATABASE_URL` | `postgresql://postgres:VicsonDigitals@db.mnjqupwgvxvckouhzqhw.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1` | Supabase pooled connection |
| `DIRECT_URL` | `postgresql://postgres:VicsonDigitals@db.mnjqupwgvxvckouhzqhw.supabase.co:5432/postgres` | Direct connection for migrations |
| `NEXTAUTH_SECRET` | `[paste your generated secret]` | From `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` | Update after deployment ⚠️ |

---

#### 🎨 **Stripe Variables (Optional - for payments):**

If you have Stripe keys, add these. Otherwise, use placeholder values:

| Name | Value | Notes |
|------|-------|-------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_YOUR_KEY` | Get from https://dashboard.stripe.com/test/apikeys |
| `STRIPE_SECRET_KEY` | `sk_test_YOUR_KEY` | Get from Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | (leave empty) | Add after setting up webhook |

**If you don't have Stripe yet**, use these placeholders:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=
```

---

#### 📱 **App URL Variables (Optional):**

These are optional but helpful:

| Name | Value | Notes |
|------|-------|-------|
| `FRONTEND_URL` | `http://localhost:3000` | Update after deployment |
| `ADMIN_URL` | `http://localhost:3001` | Update after deployment |
| `SUPER_ADMIN_URL` | `http://localhost:3002` | Update after deployment |

---

## 🚀 Deployment Process (Step-by-Step)

### **Deploy Frontend First:**

1. **Go to:** https://vercel.com/new

2. **Import Repository:**
   - Click "Import Git Repository"
   - Select `D-Oracle1/HMS`
   - Click "Import"

3. **Configure Project:**
   - Project Name: `hms-frontend`
   - Click "Edit" next to Root Directory
   - Set to: `apps/frontend`
   - Framework should auto-detect as "Next.js"

4. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add all variables from the table above
   - Make sure to select "Production", "Preview", and "Development" for each

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes

6. **After Deployment:**
   - Copy your deployment URL (e.g., `hms-frontend-abc123.vercel.app`)
   - Go to **Settings → Environment Variables**
   - Find `NEXTAUTH_URL` and click "Edit"
   - Change value to: `https://hms-frontend-abc123.vercel.app` (use your actual URL)
   - Save
   - Go to **Deployments** tab
   - Click the ⋯ menu on your latest deployment
   - Click "Redeploy"

---

### **Deploy Admin:**

Repeat the same process:
1. Go to https://vercel.com/new
2. Import same repository
3. Configure:
   - Project Name: `hms-admin`
   - Root Directory: `apps/admin`
4. Add same environment variables
5. Deploy
6. After deployment, update `NEXTAUTH_URL` to your admin URL

---

### **Deploy Super Admin:**

One more time:
1. Go to https://vercel.com/new
2. Import repository
3. Configure:
   - Project Name: `hms-super-admin`
   - Root Directory: `apps/super-admin`
4. Add environment variables
5. Deploy
6. Update `NEXTAUTH_URL` after deployment

---

## 🗄️ Database Setup (After All Apps Deploy)

### **Option A: Using Supabase SQL Editor** (Easiest)

1. **Go to:** https://supabase.com/dashboard/project/mnjqupwgvxvckouhzqhw/sql/new

2. **Copy and paste this SQL:**

```sql
-- Create Enums
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- Create Tables
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL UNIQUE,
    "logoUrl" TEXT,
    "theme" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Hotel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Hotel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE TABLE "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "hotelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Room_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL
);

CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE,
    CONSTRAINT "Booking_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE
);

-- Insert Demo Data
INSERT INTO "Tenant" ("id", "name", "subdomain", "logoUrl", "theme", "isActive", "createdAt", "updatedAt")
VALUES (
    'demo-tenant-1',
    'Demo Hotel Group',
    'demo',
    '/demo-logo.png',
    '{"primaryColor":"#000000","secondaryColor":"#ffffff","fontFamily":"Inter"}',
    true,
    NOW(),
    NOW()
);

INSERT INTO "Hotel" ("id", "name", "address", "email", "phone", "tenantId", "createdAt", "updatedAt")
VALUES (
    'demo-hotel-1',
    'Demo Grand Hotel',
    '123 Main Street, Lagos, Nigeria',
    'info@demograndhotel.com',
    '+234-123-456-7890',
    'demo-tenant-1',
    NOW(),
    NOW()
);

INSERT INTO "Room" ("id", "name", "description", "price", "capacity", "available", "imageUrl", "hotelId", "createdAt", "updatedAt")
VALUES
    ('room-1', 'Deluxe Suite', 'Luxury suite with ocean view', 250, 2, true, '/rooms/deluxe-suite.jpg', 'demo-hotel-1', NOW(), NOW()),
    ('room-2', 'Standard Room', 'Comfortable room with city view', 100, 2, true, '/rooms/standard-room.jpg', 'demo-hotel-1', NOW(), NOW()),
    ('room-3', 'Family Room', 'Spacious room for families', 180, 4, true, '/rooms/family-room.jpg', 'demo-hotel-1', NOW(), NOW()),
    ('room-4', 'Executive Suite', 'Premium suite with business amenities', 350, 2, true, '/rooms/executive-suite.jpg', 'demo-hotel-1', NOW(), NOW());

INSERT INTO "User" ("id", "email", "name", "password", "role", "tenantId", "createdAt", "updatedAt")
VALUES
    ('superadmin-1', 'superadmin@hms.com', 'Super Admin', '$2a$10$demo', 'SUPER_ADMIN', NULL, NOW(), NOW()),
    ('admin-1', 'admin@demo.com', 'Hotel Admin', '$2a$10$demo', 'ADMIN', 'demo-tenant-1', NOW(), NOW()),
    ('user-1', 'user@demo.com', 'Demo User', '$2a$10$demo', 'USER', 'demo-tenant-1', NOW(), NOW());
```

3. **Click "Run"**

4. **Verify:** Check the "Table Editor" in Supabase to see your tables and data

---

### **Option B: Using Prisma Migrate** (If deploying locally first)

```bash
# In your project directory
cd HMS

# Create .env file
echo 'DATABASE_URL="postgresql://postgres:VicsonDigitals@db.mnjqupwgvxvckouhzqhw.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"' > .env
echo 'DIRECT_URL="postgresql://postgres:VicsonDigitals@db.mnjqupwgvxvckouhzqhw.supabase.co:5432/postgres"' >> .env

# Install dependencies
npm install

# Generate Prisma Client
cd packages/db
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed data
npx prisma db seed
```

---

## ✅ Final Checklist

After completing all steps:

- [ ] Frontend deployed to Vercel
- [ ] Admin deployed to Vercel
- [ ] Super Admin deployed to Vercel
- [ ] All environment variables added to all 3 projects
- [ ] `NEXTAUTH_URL` updated with actual URLs for each app
- [ ] Database tables created in Supabase
- [ ] Demo data seeded
- [ ] All apps redeployed after updating `NEXTAUTH_URL`

---

## 🧪 Test Your Deployment

Visit each app and test:

### Frontend (`https://hms-frontend-xxx.vercel.app`)
- ✅ Home page loads
- ✅ Navigate to `/hotels`
- ✅ View hotel details
- ✅ Booking flow works

### Admin (`https://hms-admin-xxx.vercel.app`)
- ✅ Dashboard loads
- ✅ Navigate to `/rooms`
- ✅ View bookings
- ✅ Customer management

### Super Admin (`https://hms-super-admin-xxx.vercel.app`)
- ✅ Platform dashboard loads
- ✅ Navigate to `/theme-editor`
- ✅ Theme customization works
- ✅ Hotel management accessible

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Module not found: Can't resolve 'ui'"**
- Solution: Make sure Root Directory is set correctly
- The `postinstall` script will handle Prisma generation

**Error: "DATABASE_URL is not set"**
- Solution: Double-check environment variables are added
- Make sure they're set for Production, Preview, AND Development

### Runtime Errors

**Error: "PrismaClient is not configured"**
- Solution: Redeploy after adding `DATABASE_URL` and `DIRECT_URL`

**Error: "Invalid session"**
- Solution: Make sure `NEXTAUTH_URL` matches your actual deployment URL
- Must include `https://` prefix

**Database connection timeout**
- Solution: Check that `?pgbouncer=true&connection_limit=1` is in DATABASE_URL
- Verify Supabase project is active

---

## 🎯 Pro Tips

1. **Use Vercel's Preview Deployments:**
   - Every git push creates a preview deployment
   - Test before merging to main

2. **Environment Variable Scopes:**
   - Production: Live site
   - Preview: PR/branch deployments
   - Development: Local development
   - Set variables for all three scopes

3. **Watch the Build Logs:**
   - Click on deployment → View Function Logs
   - Helps debug issues quickly

4. **Prisma Auto-Generation:**
   - The `postinstall` script in each app automatically runs `prisma generate`
   - No manual Prisma setup needed in Vercel

---

## 📊 Expected Build Output

Each app should build successfully with output like:

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (7/7)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                   1.2 kB         85.4 kB
├ ○ /hotels                             2.1 kB         87.3 kB
└ ○ /profile                            1.8 kB         86.9 kB

Build completed in 45s
```

---

**Your apps are now live on Vercel!** 🎉

All three dashboards should be accessible and connected to your Supabase database.
