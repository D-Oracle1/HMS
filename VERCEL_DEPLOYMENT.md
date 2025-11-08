# 🚀 Vercel Deployment Guide

Complete guide to deploying the Multi-Tenant Hotel Management System to Vercel.

## Prerequisites

- ✅ GitHub repository with your code
- ✅ Vercel account (free tier works)
- ✅ PostgreSQL database (see database options below)
- ✅ Stripe account

---

## Step 1: Setup Database

Choose one of these managed PostgreSQL providers:

### Option A: Vercel Postgres (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login and create Postgres database
vercel login
vercel postgres create hms-db
```

### Option B: Supabase (Free Tier Available)
1. Go to https://supabase.com
2. Create new project
3. Go to Settings > Database
4. Copy connection string (starts with `postgresql://`)

### Option C: Neon (Serverless Postgres)
1. Go to https://neon.tech
2. Create new project
3. Copy connection string

### Option D: Railway (Simple Setup)
1. Go to https://railway.app
2. New Project > PostgreSQL
3. Copy connection string from Variables tab

---

## Step 2: Prepare Environment Variables

You'll need these for all three apps:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-random-secret-key-here"

# Stripe Keys (from https://dashboard.stripe.com)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # You'll get this after setting up webhooks

# App URLs (update these after deployment)
FRONTEND_URL="https://your-frontend.vercel.app"
ADMIN_URL="https://your-admin.vercel.app"
SUPER_ADMIN_URL="https://your-superadmin.vercel.app"
NEXTAUTH_URL="https://your-frontend.vercel.app"
```

---

## Step 3: Deploy Frontend App

### Via Vercel Dashboard:

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Project Name:** `hms-frontend`
   - **Root Directory:** `apps/frontend`
   - **Framework Preset:** Next.js
   - **Build Command:** Leave default (uses vercel.json)
   - **Output Directory:** Leave default

4. **Environment Variables** - Add these:
   ```
   DATABASE_URL
   NEXTAUTH_SECRET
   NEXTAUTH_URL
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   STRIPE_SECRET_KEY
   STRIPE_WEBHOOK_SECRET
   ```

5. Click **Deploy**

### Via Vercel CLI:

```bash
cd apps/frontend
vercel

# Follow prompts:
# - Link to existing project? N
# - Project name: hms-frontend
# - Directory: ./
# - Override settings? N

# Add environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... add all other variables

# Deploy to production
vercel --prod
```

---

## Step 4: Deploy Admin App

Repeat the same process:

1. Import repository again in Vercel
2. Configure:
   - **Project Name:** `hms-admin`
   - **Root Directory:** `apps/admin`
   - **Framework Preset:** Next.js

3. Add same environment variables (update NEXTAUTH_URL to admin URL)

4. Deploy

---

## Step 5: Deploy Super Admin App

One more time:

1. Import repository
2. Configure:
   - **Project Name:** `hms-super-admin`
   - **Root Directory:** `apps/super-admin`
   - **Framework Preset:** Next.js

3. Add environment variables

4. Deploy

---

## Step 6: Initialize Database

After first deployment, run migrations:

```bash
# Install dependencies locally (if not done)
pnpm install

# Set DATABASE_URL in your local .env
echo 'DATABASE_URL="your-database-url"' > .env

# Generate Prisma Client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed
```

Alternatively, use Vercel CLI:
```bash
vercel env pull .env.local
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

---

## Step 7: Configure Stripe Webhooks

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. **Endpoint URL:** `https://your-frontend.vercel.app/api/webhooks/stripe`
4. **Events to send:**
   - `checkout.session.completed`
5. Copy **Signing secret** (starts with `whsec_`)
6. Add to Vercel environment variables:
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET production
   ```
7. Redeploy frontend

---

## Step 8: Update Environment Variables

After all apps are deployed, update URLs:

### Frontend Project:
```bash
cd apps/frontend
vercel env add NEXTAUTH_URL production
# Enter: https://your-frontend.vercel.app

vercel env add FRONTEND_URL production
# Enter: https://your-frontend.vercel.app

vercel env add ADMIN_URL production
# Enter: https://your-admin.vercel.app

vercel env add SUPER_ADMIN_URL production
# Enter: https://your-superadmin.vercel.app
```

Repeat for Admin and Super Admin apps.

Then redeploy all three apps:
```bash
vercel --prod
```

---

## Step 9: Configure Custom Domains (Optional)

### Add Custom Domain to Each App:

1. In Vercel Dashboard, go to Project Settings > Domains
2. Add your domain:
   - **Frontend:** `yourdomain.com` and `*.yourdomain.com`
   - **Admin:** `admin.yourdomain.com`
   - **Super Admin:** `superadmin.yourdomain.com`

3. Update DNS records at your domain registrar:
   ```
   Type    Name        Value
   A       @           76.76.21.21 (Vercel IP)
   CNAME   *           cname.vercel-dns.com
   CNAME   admin       cname.vercel-dns.com
   CNAME   superadmin  cname.vercel-dns.com
   ```

4. Update environment variables with new URLs

---

## Step 10: Test Deployment

### Test Frontend:
- Visit your frontend URL
- Browse hotels at `/hotels`
- Try booking flow at `/book/[roomId]`
- Check profile at `/profile`

### Test Admin:
- Visit admin URL
- Check dashboard at `/dashboard`
- Manage rooms at `/rooms`
- View bookings at `/bookings`

### Test Super Admin:
- Visit super admin URL
- Check platform dashboard
- Test theme editor at `/theme-editor`
- Manage tenants at `/hotels`

---

## Troubleshooting

### Build Fails

**Error: Cannot find module 'ui'**
- Check that `transpilePackages: ['ui', 'db']` is in next.config.js
- Verify workspace packages are properly linked

**Prisma Generate Error:**
```bash
# Add postinstall script to each app's package.json
"scripts": {
  "postinstall": "cd ../../packages/db && prisma generate"
}
```

### Database Connection Issues

- Ensure `?sslmode=require` or `?ssl=true` is in DATABASE_URL
- Check database is accessible from internet
- Verify connection pooling settings

### Environment Variables Not Working

- Make sure variables are added to **Production** environment
- Redeploy after adding variables
- Check variable names match exactly

---

## Production Checklist

Before going live:

- [ ] Database migrations completed
- [ ] Demo data seeded (or real data imported)
- [ ] All environment variables set
- [ ] Stripe webhooks configured
- [ ] Custom domains configured (if using)
- [ ] SSL certificates active
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] Use production Stripe keys
- [ ] Test payment flow end-to-end
- [ ] Test user registration/login
- [ ] Test admin functions
- [ ] Test theme editor
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Configure error tracking (Sentry)

---

## Monitoring & Maintenance

### Vercel Dashboard Features:
- **Analytics:** Track page views and performance
- **Logs:** View runtime logs for debugging
- **Deployments:** Roll back if needed
- **Edge Config:** For feature flags

### Recommended Tools:
- **Sentry:** Error tracking
- **LogRocket:** Session replay
- **Vercel Analytics:** Web vitals
- **Uptime Robot:** Uptime monitoring

---

## Scaling Considerations

### Database:
- Use connection pooling (Prisma Data Proxy or PgBouncer)
- Enable read replicas for high traffic
- Regular backups with pg_dump

### Vercel:
- Free tier: 100GB bandwidth/month
- Pro tier: 1TB bandwidth/month
- Enterprise: Custom limits

### Caching:
- Use Vercel Edge Caching for static assets
- Implement ISR (Incremental Static Regeneration)
- Add Redis for session storage

---

## Cost Estimates

### Minimal Setup (Testing):
- Vercel: Free tier
- Database: Supabase Free tier
- Stripe: Free (pay per transaction)
- **Total: $0/month**

### Production Setup:
- Vercel Pro (3 projects): $60/month
- Database (Neon/Supabase): $25/month
- Stripe: Free + transaction fees
- **Total: ~$85/month**

### Scale (1000+ bookings/month):
- Vercel Enterprise: $150/month
- Database: $100/month
- CDN/Storage: $50/month
- **Total: ~$300/month**

---

## Next Steps After Deployment

1. **Set up Email Service:**
   - SendGrid, Resend, or AWS SES
   - Booking confirmations
   - Password resets

2. **Add Monitoring:**
   - Sentry for errors
   - Google Analytics for users
   - Vercel Analytics for performance

3. **Implement Backups:**
   - Automated daily database backups
   - Store in S3 or similar

4. **Security Enhancements:**
   - Rate limiting
   - CAPTCHA on registration
   - CSP headers

5. **Performance Optimization:**
   - Image optimization with Next/Image
   - Code splitting
   - Edge caching

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs

---

**Your hotel management platform is now live on Vercel!** 🎉
