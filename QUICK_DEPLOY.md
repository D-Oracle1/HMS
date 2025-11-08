# 🚀 Quick Vercel Deployment

## Fix for pnpm Error

The build is failing because Vercel doesn't handle pnpm workspace dependencies well. Here's the fixed approach:

## ✅ Solution: Deploy via Vercel Dashboard

### Step 1: Create Database

Choose one (FREE options available):

**Supabase (Recommended - Free Tier)**
1. Go to https://supabase.com
2. Create new project
3. Settings > Database > Copy connection string
4. Format: `postgresql://postgres:[password]@[host]:5432/postgres?sslmode=require`

**OR Neon (Free Serverless)**
1. Go to https://neon.tech
2. Create project
3. Copy connection string

### Step 2: Deploy Frontend

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Configure:
   - **Project Name**: `hms-frontend`
   - **Root Directory**: `apps/frontend`
   - **Framework**: Next.js (auto-detected)
   - **Build Command**: Leave blank (uses default)
   - **Install Command**: `npm install`

4. **Add Environment Variables**:
   ```
   DATABASE_URL = your-database-connection-string
   NEXTAUTH_SECRET = run: openssl rand -base64 32
   NEXTAUTH_URL = will be your-app.vercel.app (add after deployment)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_...
   STRIPE_SECRET_KEY = sk_test_...
   ```

5. Click **Deploy**

6. After deployment, go back to Settings > Environment Variables
   - Update `NEXTAUTH_URL` with your actual URL: `https://hms-frontend-xxx.vercel.app`
   - Redeploy

### Step 3: Deploy Admin

Repeat process:
1. Import repo again
2. Configure:
   - **Project Name**: `hms-admin`
   - **Root Directory**: `apps/admin`
3. Add same environment variables (update NEXTAUTH_URL to admin URL)
4. Deploy

### Step 4: Deploy Super Admin

One more time:
1. Import repo
2. Configure:
   - **Project Name**: `hms-super-admin`
   - **Root Directory**: `apps/super-admin`
3. Add environment variables
4. Deploy

### Step 5: Run Database Migrations

After apps are deployed, initialize the database:

```bash
# Clone your repo locally if not done
git clone <your-repo>
cd HMS

# Install dependencies
npm install

# Create .env file with your DATABASE_URL
echo 'DATABASE_URL="your-connection-string"' > .env

# Run migrations
cd packages/db
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

Alternatively, connect to your Supabase/Neon database via their SQL editor and run the schema manually.

### Step 6: Configure Stripe Webhook

1. Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-frontend-url.vercel.app/api/webhooks/stripe`
3. Select event: `checkout.session.completed`
4. Copy webhook secret (whsec_...)
5. Add to Vercel environment variables:
   - Variable: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...`
6. Redeploy frontend

## 🎉 Done!

Your apps should now be live at:
- Frontend: `https://hms-frontend-xxx.vercel.app`
- Admin: `https://hms-admin-xxx.vercel.app`
- Super Admin: `hms-super-admin-xxx.vercel.app`

## Troubleshooting

**Build still failing?**

Check these in Vercel dashboard:

1. **Root Directory** is set correctly (apps/frontend, apps/admin, or apps/super-admin)
2. **Framework Preset** is Next.js
3. **Install Command** is `npm install`
4. **Build Command** is blank (default)
5. All **Environment Variables** are added

**Database connection error?**

- Ensure `?sslmode=require` or `?ssl=true` is in DATABASE_URL
- Check database allows connections from 0.0.0.0/0
- Verify connection string is correct

**Prisma not generating?**

The postinstall script should handle this automatically. If not:
1. Check `prisma` is in devDependencies
2. Verify schema path in postinstall script
3. Check build logs for errors

## Next Steps

1. Test each app
2. Add custom domains (optional)
3. Set up monitoring
4. Configure email service
5. Switch to production Stripe keys

---

**Your hotel management platform is now live!** 🚀
