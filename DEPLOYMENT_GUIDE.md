# EduPrep Deployment Guide

## Overview

EduPrep is a full-stack application with:

- **Frontend**: Next.js (Deploy on Vercel) ✅
- **Backend Services**: Express microservices (Deploy on Railway/Render)
- **Database**: MongoDB (Use MongoDB Atlas)

---

## Part 1: Frontend Deployment on Vercel ✅

### Prerequisites

- Vercel Account (https://vercel.com)
- GitHub repository connected

### Steps

#### 1. Connect GitHub Repository

```bash
# Already pushed to: https://github.com/Wajahat883/EDU_PREP.git
```

#### 2. Deploy via Vercel CLI (Local)

```bash
# Install Vercel CLI
npm i -g vercel

# From frontend directory
cd frontend

# Deploy
vercel deploy --prod
```

#### 3. Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import Git Repository: `Wajahat883/EDU_PREP`
4. Select "frontend" as the root directory
5. Configure build settings:
   - **Framework**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://api-backend.herokuapp.com
   NEXT_PUBLIC_CONTENT_URL=https://content-service.herokuapp.com
   NEXTAUTH_SECRET=<generate-random-secret>
   NEXTAUTH_URL=https://eduprep-<your-name>.vercel.app
   ```
7. Click "Deploy"

#### 4. Custom Domain (Optional)

1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain (e.g., app.eduprep.com)
3. Follow DNS configuration instructions

---

## Part 2: Backend Services Deployment

### Option A: Railway (Recommended - Easiest)

#### Deploy Auth Service on Railway

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Navigate to services/auth-service
cd services/auth-service

# 4. Create new Railway project
railway init

# 5. Add environment variables
# Go to Railway dashboard and add:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/eduprep
JWT_SECRET=<random-secret>
AUTH_SERVICE_PORT=3001
CORS_ORIGIN=https://eduprep.vercel.app

# 6. Deploy
railway up
```

#### Deploy Content Service on Railway

```bash
cd services/content-service

# Repeat same steps as above:
railway init
# Add environment variables:
# MONGODB_URI, AUTH_SERVICE_URL, etc.
railway up
```

#### Deploy other services similarly:

- Test Engine Service: `services/test-engine-service`
- QBank Service: `services/qbank-service`
- Payment Service: `services/payment-service`
- Analytics Service: `services/analytics-service`

### Option B: Heroku (Traditional but Paid)

```bash
# 1. Install Heroku CLI
# 2. Login
heroku login

# 3. Create app
heroku create eduprep-auth-service

# 4. Set environment variables
heroku config:set MONGODB_URI=<your-mongodb-uri> -a eduprep-auth-service

# 5. Add Procfile to service root:
# web: node dist/index.js

# 6. Deploy
git push heroku main
```

### Option C: Docker Containers on AWS/DigitalOcean

```bash
# Build Docker images
docker build -t eduprep-auth-service services/auth-service/
docker build -t eduprep-content-service services/content-service/

# Push to Docker Hub
docker push <your-username>/eduprep-auth-service
docker push <your-username>/eduprep-content-service

# Deploy to AWS ECR, DigitalOcean App Platform, or similar
```

---

## Part 3: Database Setup (MongoDB Atlas)

### Steps

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a Cluster:
   - Cloud Provider: AWS
   - Region: Choose closest to users
   - Tier: M0 (Free for development)
4. Create Database User:
   - Username: `eduprep_user`
   - Password: Generate strong password
5. Whitelist IP addresses or allow all (0.0.0.0/0) for development
6. Get connection string:
   ```
   mongodb+srv://eduprep_user:PASSWORD@cluster.mongodb.net/eduprep?retryWrites=true&w=majority
   ```
7. Use this in all backend services as `MONGODB_URI`

---

## Part 4: Environment Variables Summary

### Frontend (Vercel)

```
NEXT_PUBLIC_API_URL=https://auth-api-xyz.railway.app
NEXT_PUBLIC_CONTENT_URL=https://content-api-xyz.railway.app
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=https://eduprep.vercel.app
```

### Auth Service (Railway)

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/eduprep
JWT_SECRET=<random-secret>
AUTH_SERVICE_PORT=3001
CORS_ORIGIN=https://eduprep.vercel.app
```

### Content Service (Railway)

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/eduprep
AUTH_SERVICE_URL=https://auth-api-xyz.railway.app
CONTENT_SERVICE_PORT=3005
CORS_ORIGIN=https://eduprep.vercel.app
```

### Payment Service (Railway)

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/eduprep
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
PAYMENT_SERVICE_PORT=3004
CORS_ORIGIN=https://eduprep.vercel.app
```

---

## Part 5: Testing Deployment

### Test Frontend

```bash
# Visit your Vercel domain
https://eduprep-<your-name>.vercel.app

# Check console for any API errors
```

### Test Backend Services

```bash
# Test auth service health
curl https://auth-api-xyz.railway.app/api/health

# Test content service
curl https://content-api-xyz.railway.app/api/health

# Login and verify tokens work with frontend
```

### Test Database

```bash
# From MongoDB Atlas dashboard, check:
- Collections created
- Data being written
- Network tab shows no connection errors
```

---

## Part 6: CI/CD Pipeline Setup (Optional but Recommended)

### GitHub Actions for Auto-Deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy Frontend to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
          prod: true
```

---

## Part 7: Monitoring & Logging

### Vercel Analytics

- Dashboard automatically shows performance metrics
- View error logs in Vercel dashboard

### Railway/Render Logs

```bash
# View logs in real-time
railway logs

# or in dashboard Logs tab
```

### MongoDB Atlas

- Connection activity in Atlas dashboard
- Query performance insights

---

## Part 8: Troubleshooting

### Common Issues

#### 1. CORS Errors

**Fix**: Update CORS_ORIGIN in backend services to include Vercel domain

#### 2. Database Connection Failed

**Fix**: Check MongoDB Atlas whitelist includes backend service IPs or is set to 0.0.0.0/0

#### 3. 502 Bad Gateway

**Fix**: Check backend service is running:

```bash
curl https://api-service.railway.app/api/health
```

#### 4. Slow Performance

**Fix**:

- Enable Redis caching on Railway
- Upgrade MongoDB to M10+ for production
- Enable CDN for static assets (Vercel does this automatically)

---

## Quick Start Commands

```bash
# 1. Deploy Frontend to Vercel
cd frontend
vercel deploy --prod

# 2. Deploy Services to Railway
cd ../services/auth-service
railway init && railway up

cd ../content-service
railway init && railway up

# 3. Get your deployment URLs and update frontend env vars
# Update NEXT_PUBLIC_API_URL and NEXT_PUBLIC_CONTENT_URL in Vercel

# 4. Redeploy frontend with new env vars
vercel deploy --prod --env NEXT_PUBLIC_API_URL=<new-url>
```

---

## Success Checklist ✅

- [ ] Frontend deployed on Vercel
- [ ] Auth service running on Railway
- [ ] Content service running on Railway
- [ ] MongoDB Atlas database created and connected
- [ ] Environment variables set correctly
- [ ] API calls from frontend working
- [ ] Database reads/writes verified
- [ ] Custom domain configured (optional)
- [ ] Monitoring setup complete

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Next.js Deployment**: https://nextjs.org/learn/basics/deploying-nextjs-app

---

**Questions?** Check the dashboard logs or contact support for the respective platform.
