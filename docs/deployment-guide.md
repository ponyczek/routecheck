# Deployment Guide - RouteLog MVP

## Quick Deploy to Vercel (Recommended - 10 minutes)

Vercel offers the fastest deployment for Astro apps with automatic CI/CD.

### Step 1: Prepare Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "feat: add CI/CD, E2E tests, and mock AI"
git push origin master
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Select your `routecheck` repository
5. **Framework Preset**: Astro (auto-detected)
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`
8. **Install Command**: `npm install`

### Step 3: Configure Environment Variables

Add in Vercel project settings:

```env
# Required
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...
TOKEN_PEPPER=your-random-secret-min-32-chars

# Optional (for E2E tests in CI)
TEST_USER_EMAIL=test@routecheck.app
TEST_USER_PASSWORD=TestPassword123!
```

### Step 4: Deploy!

Click "Deploy" - done in ~2 minutes!

Your app will be live at: `https://routecheck-<random>.vercel.app`

### Step 5: Custom Domain (Optional)

1. In Vercel project settings → Domains
2. Add your domain (e.g., `routecheck.app`)
3. Follow DNS instructions
4. SSL certificate issued automatically

---

## Alternative: Netlify (10 minutes)

### Step 1: Connect Repository

1. Go to [netlify.com](https://netlify.com)
2. Sign in with GitHub
3. Click "Add new site" → "Import an existing project"
4. Choose GitHub → Select repository

### Step 2: Configure Build

```yaml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Step 3: Environment Variables

Add in Netlify site settings → Environment variables:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
TOKEN_PEPPER=random-secret
```

### Step 4: Deploy

Click "Deploy site" - live in ~3 minutes!

---

## Alternative: Railway.app (15 minutes)

Good for apps needing background jobs or cron.

### Setup

1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Railway auto-detects Astro
4. Add environment variables
5. Deploy

**Benefits:**

- Can run cron jobs (email sending)
- Postgres database included
- $5/month starter plan

---

## Alternative: DigitalOcean App Platform (20 minutes)

More control, great for production.

### Setup

1. Create DigitalOcean account
2. Go to App Platform
3. Connect GitHub repository
4. Configure:
   - **Environment**: Node.js 22
   - **Build Command**: `npm run build`
   - **Run Command**: `npm run preview`
   - **HTTP Port**: 4321

5. Add environment variables
6. Choose $5/month plan
7. Deploy

**Benefits:**

- More server control
- Can add managed Postgres
- Built-in monitoring

---

## Alternative: Docker + VPS (60 minutes)

For full control and custom infrastructure.

### Dockerfile

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 4321
CMD ["npm", "run", "preview"]
```

### docker-compose.yml

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "4321:4321"
    environment:
      - PUBLIC_SUPABASE_URL=${PUBLIC_SUPABASE_URL}
      - PUBLIC_SUPABASE_ANON_KEY=${PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - TOKEN_PEPPER=${TOKEN_PEPPER}
    restart: unless-stopped
```

### Deploy to VPS

```bash
# On VPS (Ubuntu 22.04)
sudo apt update
sudo apt install docker.io docker-compose -y

# Clone repo
git clone <your-repo>
cd routecheck

# Configure environment
cp .env.example .env
nano .env  # Add your variables

# Deploy
docker-compose up -d

# Setup nginx reverse proxy (optional)
sudo apt install nginx
# Configure nginx to proxy port 80 -> 4321
```

---

## Post-Deployment Checklist

### ✅ Verify Deployment

- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard displays
- [ ] Can create driver
- [ ] Can view reports
- [ ] Public form accessible (generate test token)

### ✅ Update GitHub Secrets

For CI/CD to work with deployed app:

1. Go to GitHub → Settings → Secrets → Actions
2. Add:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TEST_USER_EMAIL`
   - `TEST_USER_PASSWORD`

### ✅ Setup Custom Domain (Production)

1. Buy domain (Namecheap, Google Domains)
2. Add to hosting provider (Vercel/Netlify/DO)
3. Configure DNS records
4. Wait for SSL certificate

### ✅ Configure CORS (if needed)

Update Supabase project settings:

- Allowed domains: Add your production URL
- CORS origins: Add your domain

### ✅ Monitor Deployment

- Check Vercel/Netlify deployment logs
- Verify no build errors
- Test all critical paths
- Monitor error rates

---

## Deployment Comparison

| Platform         | Setup Time | Cost     | CI/CD     | Pros             | Cons            |
| ---------------- | ---------- | -------- | --------- | ---------------- | --------------- |
| **Vercel**       | 10 min     | Free/$20 | ✅ Auto   | Fastest, best DX | Limited backend |
| **Netlify**      | 10 min     | Free/$19 | ✅ Auto   | Great for static | No cron jobs    |
| **Railway**      | 15 min     | $5+      | ✅ Auto   | Cron support     | Newer platform  |
| **DigitalOcean** | 20 min     | $5+      | ✅ Auto   | More control     | More config     |
| **Docker VPS**   | 60 min     | $5+      | ❌ Manual | Full control     | Most complex    |

**Recommendation for MVP**: **Vercel** (fastest, free tier, auto-deploy)

---

## Troubleshooting

### Build Fails

**Error: "Module not found"**

- Check `package.json` dependencies
- Verify `npm ci` runs locally
- Clear cache and retry

**Error: "Supabase connection failed"**

- Verify environment variables are set
- Check Supabase project is active
- Ensure anon key is correct

### Runtime Errors

**500 errors on API routes**

- Check server logs (Vercel/Netlify dashboard)
- Verify SERVICE_ROLE_KEY is set
- Check RLS policies in Supabase

**CORS errors**

- Add production URL to Supabase CORS settings
- Verify middleware CORS headers

### Performance Issues

**Slow page loads**

- Enable Vercel Edge caching
- Optimize images
- Check Supabase query performance

---

## Production Checklist

Before going live:

- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Environment variables secured
- [ ] Error monitoring setup (Sentry/LogRocket)
- [ ] Analytics configured (PostHog/Google Analytics)
- [ ] Email sending automated (Resend)
- [ ] Daily cron job for links
- [ ] Database backups configured
- [ ] Security headers enabled
- [ ] Rate limiting configured

---

## Cost Breakdown (Monthly)

### Minimal Setup (Free Tier)

- Vercel: Free (Hobby plan)
- Supabase: Free (500MB DB)
- **Total: $0/month**

### Production Setup

- Vercel Pro: $20
- Supabase Pro: $25
- Resend emails: $20 (50k emails)
- Domain: $1/month
- **Total: $66/month**

### Scale (500 drivers)

- Vercel Pro: $20
- Supabase Pro: $25
- Resend: $20
- Monitoring (optional): $15
- **Total: $80/month**

Very affordable for SMB transport companies!

---

## Next Steps

1. Deploy to Vercel (10 min)
2. Test production deployment
3. Update README with live URL
4. Add deployment badge to README
5. Share with mentors! 🎉

**Deployment badge:**

```markdown
[![Deploy](https://img.shields.io/badge/deployed-vercel-black)](https://routecheck.vercel.app)
```
