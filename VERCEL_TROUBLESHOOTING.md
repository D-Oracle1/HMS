# Vercel Deployment Troubleshooting

## Common Issues and Solutions

### Issue 1: Workspace Dependencies Not Found

**Error:** `Cannot find module 'ui'` or `Cannot find module 'db'`

**Solution:** The apps reference workspace packages. We need to ensure they're properly bundled.

Add these to each app's `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ui', 'db'],
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
  },
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
```

---

### Issue 2: Prisma Client Not Generated

**Error:** `@prisma/client did not initialize yet`

**Solution:** Ensure postinstall runs. Add to package.json:

```json
{
  "scripts": {
    "postinstall": "prisma generate --schema=../../packages/db/schema.prisma || echo 'Prisma generation failed'"
  }
}
```

---

### Issue 3: Build Command Issues

**Vercel Settings:**
- Build Command: (leave empty)
- Install Command: `npm install`
- Output Directory: (leave empty)

---

### Issue 4: Missing Dependencies

If getting module errors, we may need to copy shared packages into each app.

---

## Alternative: Standalone Deployments

If workspace dependencies are causing issues, we can convert each app to standalone mode.

Would you like me to:
1. Fix the current monorepo setup for Vercel?
2. Convert to standalone apps (easier deployment)?
3. See the specific error first?
