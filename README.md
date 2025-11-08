# 🏨 Multi-Tenant Hotel Management System (HMS)

A comprehensive, white-label hotel management system built with modern web technologies. This platform enables hotel groups to manage multiple properties with customizable branding, multi-tenant architecture, and integrated payment processing.

## 🌟 Features

### Multi-Tenant Architecture
- **Subdomain-based tenant isolation** - Each hotel group gets their own subdomain (e.g., `luxury.yourdomain.com`)
- **Tenant-specific branding** - Customizable logos, colors, fonts, and themes
- **Data isolation** - Complete separation of tenant data for security and privacy

### Three Powerful Dashboards

#### 1. 🌐 Frontend (Customer Portal)
- Browse hotels and available rooms
- Real-time room availability
- Secure booking system with Stripe integration
- User profile and booking history
- Responsive design for mobile and desktop

#### 2. 👨‍💼 Admin Dashboard
- Revenue and occupancy analytics
- Room management (CRUD operations)
- Booking management and confirmation
- Customer relationship management
- Real-time performance metrics

#### 3. 🎯 Super Admin Dashboard
- **No-Code Theme Editor** - Customize branding without coding
- Platform-wide analytics and monitoring
- Multi-tenant management
- Subscription plan management
- Hotel activation/deactivation controls

### Technical Highlights
- **Monorepo architecture** using Turborepo
- **Type-safe** with TypeScript
- **Modern UI** with Tailwind CSS and ShadCN components
- **Database** with Prisma ORM and PostgreSQL
- **Authentication** with NextAuth.js (role-based access control)
- **Payments** integrated with Stripe
- **State management** with Zustand

## 📁 Project Structure

```
hotel-management-system/
├── apps/
│   ├── frontend/           # Customer-facing application (Port 3000)
│   ├── admin/             # Hotel admin dashboard (Port 3001)
│   └── super-admin/       # Platform admin (Port 3002)
├── packages/
│   ├── ui/                # Shared UI components
│   └── db/                # Database layer
└── turbo.json            # Turborepo configuration
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+ (recommended) or npm
- **PostgreSQL** database
- **Stripe** account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd hotel-management-system
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/hms"
   NEXTAUTH_SECRET="your-secret-key"
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   ```

4. **Initialize the database**
   ```bash
   pnpm db:generate  # Generate Prisma client
   pnpm db:migrate   # Run migrations
   pnpm db:seed      # Seed demo data
   ```

5. **Start development servers**
   ```bash
   pnpm dev
   ```

   This will start all three applications:
   - Frontend: http://localhost:3000
   - Admin: http://localhost:3001
   - Super Admin: http://localhost:3002

## 🗄️ Database Schema

### Key Models

- **Tenant** - Hotel groups/organizations
- **Hotel** - Individual hotel properties
- **Room** - Hotel rooms
- **User** - System users (roles: USER, ADMIN, SUPER_ADMIN)
- **Booking** - Reservations (status: PENDING, CONFIRMED, CANCELLED, COMPLETED)

## 🎨 No-Code Theme Editor

The Super Admin can customize each tenant's branding without writing code:

1. Navigate to `/theme-editor` in the Super Admin dashboard
2. Customize colors, typography, border radius, and logo
3. Live preview shows changes in real-time
4. Save to apply theme to tenant

## 💳 Payment Integration

### Booking Flow
1. User selects room and dates
2. Clicks "Proceed to Payment"
3. Redirects to Stripe Checkout
4. On success, booking status updates to CONFIRMED

## 👥 User Roles & Permissions

- **USER**: Browse and book hotels
- **ADMIN**: Manage rooms, bookings, and customers
- **SUPER_ADMIN**: Platform-wide management and customization

### Demo Accounts (from seed)
```
Super Admin: superadmin@hms.com
Admin: admin@demo.com
User: user@demo.com
```

## 🏗️ Deployment

Deploy to Vercel, Docker, or any VPS. Configure DNS for subdomains:
```
*.yourdomain.com  →  Your server IP
```

## 📊 Scripts

```bash
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all apps
pnpm lint         # Run ESLint

# Database
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed demo data
pnpm db:studio    # Open Prisma Studio
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: ShadCN UI, Radix UI
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js
- **Payments**: Stripe
- **State**: Zustand
- **Monorepo**: Turborepo
- **Package Manager**: pnpm

## 📝 Future Enhancements

- Email notifications
- PDF invoice generation
- Advanced analytics with charts
- Image upload functionality
- Calendar view for bookings
- Multi-language support
- Mobile apps

## 📄 License

MIT License

---

**Ready to launch your hotel management platform!** 🚀
