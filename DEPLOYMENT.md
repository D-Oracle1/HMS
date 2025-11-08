# 🚀 Deployment Guide

This guide covers deploying the Multi-Tenant Hotel Management System to various platforms.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Environment Variables](#environment-variables)
4. [Deployment Options](#deployment-options)
   - [Vercel](#vercel-recommended)
   - [Docker](#docker)
   - [VPS/Cloud Server](#vps-cloud-server)
5. [DNS Configuration](#dns-configuration)
6. [Post-Deployment](#post-deployment)

---

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (hosted or local)
- Stripe account for payments
- Domain name for production
- Git repository (GitHub, GitLab, etc.)

---

## Database Setup

### Option 1: Managed PostgreSQL (Recommended)

Use a managed database service:

**Vercel Postgres**
```bash
vercel postgres create
# Copy DATABASE_URL from dashboard
```

**Supabase**
1. Create project at https://supabase.com
2. Go to Settings > Database
3. Copy connection string

**Railway**
1. Create PostgreSQL instance
2. Copy DATABASE_URL from variables

**Neon, PlanetScale, or AWS RDS** are also excellent options.

### Option 2: Self-Hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE hms;
CREATE USER hmsuser WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE hms TO hmsuser;
\q
```

---

## Environment Variables

Create `.env` files for each environment:

### Production `.env`

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/hms?schema=public"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.com"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Application URLs
FRONTEND_URL="https://your-domain.com"
ADMIN_URL="https://admin.your-domain.com"
SUPER_ADMIN_URL="https://superadmin.your-domain.com"

# Optional
NODE_ENV="production"
```

### Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

---

## Deployment Options

### Vercel (Recommended)

Vercel offers the best Next.js experience with zero configuration.

#### Step 1: Prepare Repository

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### Step 2: Deploy Each App

1. Go to https://vercel.com/new
2. Import your repository

**Deploy Frontend:**
- Root Directory: `apps/frontend`
- Framework Preset: Next.js
- Build Command: `cd ../.. && pnpm install && pnpm run build --filter=frontend`
- Output Directory: `apps/frontend/.next`

**Deploy Admin:**
- Root Directory: `apps/admin`
- Build Command: `cd ../.. && pnpm install && pnpm run build --filter=admin`

**Deploy Super Admin:**
- Root Directory: `apps/super-admin`
- Build Command: `cd ../.. && pnpm install && pnpm run build --filter=super-admin`

#### Step 3: Configure Environment Variables

In each Vercel project:
1. Go to Settings > Environment Variables
2. Add all variables from `.env`
3. Redeploy

#### Step 4: Configure Domains

1. Add custom domain in Vercel dashboard
2. Update DNS (see DNS Configuration section)

---

### Docker

Deploy using Docker Compose for easy orchestration.

#### Create `Dockerfile` for each app

**apps/frontend/Dockerfile:**
```dockerfile
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/ui/package.json ./packages/ui/
COPY packages/db/package.json ./packages/db/
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build --filter=frontend

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["pnpm", "start", "--filter=frontend"]
```

#### `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: hmsuser
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: hms
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://hmsuser:secure_password@postgres:5432/hms
    depends_on:
      - postgres

  admin:
    build:
      context: .
      dockerfile: apps/admin/Dockerfile
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://hmsuser:secure_password@postgres:5432/hms
    depends_on:
      - postgres

  super-admin:
    build:
      context: .
      dockerfile: apps/super-admin/Dockerfile
    ports:
      - "3002:3002"
    environment:
      DATABASE_URL: postgresql://hmsuser:secure_password@postgres:5432/hms
    depends_on:
      - postgres

volumes:
  postgres_data:
```

#### Deploy

```bash
docker-compose up -d
```

---

### VPS (Cloud Server)

Deploy to DigitalOcean, AWS EC2, Linode, etc.

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 (Process Manager)
npm install -g pm2

# Install Nginx
sudo apt install nginx
```

#### Step 2: Clone and Build

```bash
# Clone repository
git clone <your-repo-url>
cd hotel-management-system

# Install dependencies
pnpm install

# Build all apps
pnpm build

# Setup database
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

#### Step 3: Configure PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'hms-frontend',
      script: 'pnpm',
      args: 'start --filter=frontend',
      cwd: '/path/to/hotel-management-system',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'hms-admin',
      script: 'pnpm',
      args: 'start --filter=admin',
      cwd: '/path/to/hotel-management-system',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'hms-super-admin',
      script: 'pnpm',
      args: 'start --filter=super-admin',
      cwd: '/path/to/hotel-management-system',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
    },
  ],
};
```

Start services:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Step 4: Configure Nginx

Create `/etc/nginx/sites-available/hms`:

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com *.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Super Admin
server {
    listen 80;
    server_name superadmin.yourdomain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/hms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 5: SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d *.yourdomain.com
```

---

## DNS Configuration

### For Multi-Tenant Subdomains

Add these DNS records:

```
Type    Name                Value               TTL
A       @                   YOUR_SERVER_IP      3600
A       *                   YOUR_SERVER_IP      3600
A       admin               YOUR_SERVER_IP      3600
A       superadmin          YOUR_SERVER_IP      3600
```

This allows:
- `yourdomain.com` → Frontend
- `*.yourdomain.com` → Multi-tenant subdomains
- `admin.yourdomain.com` → Admin dashboard
- `superadmin.yourdomain.com` → Super admin

---

## Post-Deployment

### 1. Configure Stripe Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 2. Create Super Admin Account

```bash
# SSH into server or use database GUI
psql $DATABASE_URL

INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'super-admin-id',
  'admin@yourdomain.com',
  'Super Admin',
  '$2a$10$YourHashedPassword', -- Use bcrypt to hash
  'SUPER_ADMIN',
  NOW(),
  NOW()
);
```

### 3. Monitor & Logs

**Vercel:**
- View logs in Vercel dashboard

**Docker:**
```bash
docker-compose logs -f
```

**PM2:**
```bash
pm2 logs
pm2 monit
```

### 4. Backups

**Database backups:**
```bash
# Automated daily backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20251108.sql
```

---

## Troubleshooting

### Build Failures

```bash
# Clear cache
pnpm store prune
rm -rf node_modules .next

# Reinstall
pnpm install
pnpm build
```

### Database Connection Issues

- Check `DATABASE_URL` format
- Verify database is accessible from server
- Check firewall rules

### Subdomain Not Working

- Verify DNS propagation: `nslookup subdomain.yourdomain.com`
- Check middleware configuration
- Verify Nginx/proxy configuration

---

## Security Checklist

- [ ] Use strong `NEXTAUTH_SECRET`
- [ ] Use production Stripe keys
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure firewall (UFW)
- [ ] Use environment variables (never commit secrets)
- [ ] Enable rate limiting
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Hash passwords with bcrypt
- [ ] Sanitize user inputs

---

## Monitoring & Analytics

**Recommended tools:**
- **Vercel Analytics** - Built-in for Vercel deployments
- **Sentry** - Error tracking
- **Google Analytics** - User analytics
- **Uptime Robot** - Uptime monitoring
- **Grafana + Prometheus** - Server metrics

---

**Deployment complete! Your hotel management platform is now live!** 🎉
