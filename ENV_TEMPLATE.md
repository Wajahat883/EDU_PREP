# Environment Variables Template for Deployment

## Frontend Environment (.env.production in frontend/)
NEXT_PUBLIC_API_URL=https://auth-service-xxxxx.railway.app
NEXT_PUBLIC_CONTENT_URL=https://content-service-xxxxx.railway.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://eduprep.vercel.app

## Auth Service Environment
MONGODB_URI=mongodb+srv://eduprep_user:PASSWORD@cluster.mongodb.net/eduprep?retryWrites=true&w=majority
JWT_SECRET=<random-secret-key-min-32-chars>
JWT_EXPIRE=7d
NODE_ENV=production
AUTH_SERVICE_PORT=3001
CORS_ORIGIN=https://eduprep.vercel.app
LOG_LEVEL=info

## Content Service Environment
MONGODB_URI=mongodb+srv://eduprep_user:PASSWORD@cluster.mongodb.net/eduprep?retryWrites=true&w=majority
AUTH_SERVICE_URL=https://auth-service-xxxxx.railway.app
CONTENT_SERVICE_PORT=3005
NODE_ENV=production
CORS_ORIGIN=https://eduprep.vercel.app
LOG_LEVEL=info

## Test Engine Service Environment
MONGODB_URI=mongodb+srv://eduprep_user:PASSWORD@cluster.mongodb.net/eduprep?retryWrites=true&w=majority
AUTH_SERVICE_URL=https://auth-service-xxxxx.railway.app
TEST_ENGINE_PORT=3002
NODE_ENV=production
CORS_ORIGIN=https://eduprep.vercel.app
LOG_LEVEL=info

## QBank Service Environment
MONGODB_URI=mongodb+srv://eduprep_user:PASSWORD@cluster.mongodb.net/eduprep?retryWrites=true&w=majority
AUTH_SERVICE_URL=https://auth-service-xxxxx.railway.app
ELASTICSEARCH_URL=https://elasticsearch-xxxxx.railway.app
QBANK_PORT=3003
NODE_ENV=production
CORS_ORIGIN=https://eduprep.vercel.app
LOG_LEVEL=info

## Payment Service Environment
MONGODB_URI=mongodb+srv://eduprep_user:PASSWORD@cluster.mongodb.net/eduprep?retryWrites=true&w=majority
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
PAYMENT_SERVICE_PORT=3004
NODE_ENV=production
CORS_ORIGIN=https://eduprep.vercel.app
NOTIFICATION_SERVICE_URL=https://notification-service-xxxxx.railway.app
LOG_LEVEL=info

## Analytics Service Environment
MONGODB_URI=mongodb+srv://eduprep_user:PASSWORD@cluster.mongodb.net/eduprep?retryWrites=true&w=majority
AUTH_SERVICE_URL=https://auth-service-xxxxx.railway.app
ANALYTICS_PORT=3007
NODE_ENV=production
CORS_ORIGIN=https://eduprep.vercel.app
LOG_LEVEL=info

---

# Secrets Generation Commands

## Generate NextAuth Secret
```bash
openssl rand -base64 32
```

## Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Generate Stripe Test/Live Keys
- Visit: https://dashboard.stripe.com/apikeys
- Copy test/live keys from dashboard

---

# Deployment Checklist

## Pre-Deployment
- [ ] All code committed to GitHub
- [ ] .gitignore properly configured
- [ ] Environment variables template created
- [ ] Database backup completed
- [ ] All tests passing locally

## Vercel Frontend Deployment
- [ ] Vercel account created
- [ ] GitHub repository connected to Vercel
- [ ] Root directory set to `/frontend`
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Environment variables added to Vercel
- [ ] Domain configured (optional)
- [ ] Frontend accessible at vercel.app domain
- [ ] SSL certificate auto-configured

## MongoDB Atlas Setup
- [ ] Atlas account created
- [ ] Cluster created (M0 free tier for dev)
- [ ] Database user created
- [ ] IP whitelist configured (0.0.0.0/0 or specific IPs)
- [ ] Connection string generated
- [ ] Initial collections created (if needed)

## Railway Backend Deployment
- [ ] Railway account created
- [ ] Project created in Railway
- [ ] Auth Service deployed
  - [ ] Environment variables set
  - [ ] Health check passing
  - [ ] Database connected
- [ ] Content Service deployed
  - [ ] Environment variables set
  - [ ] Auth service URL correct
  - [ ] Database connected
- [ ] Test Engine Service deployed
- [ ] QBank Service deployed
- [ ] Payment Service deployed
  - [ ] Stripe keys configured
  - [ ] Webhooks configured
- [ ] Analytics Service deployed
- [ ] All services healthy and running

## Integration Testing
- [ ] Frontend loads successfully
- [ ] Login flow works
- [ ] API calls from frontend to backend working
- [ ] Database reads/writes verified
- [ ] File uploads working (if applicable)
- [ ] Payment processing working (test mode)
- [ ] Analytics data being collected

## Post-Deployment
- [ ] Domain SSL certificate installed
- [ ] CDN configured (optional)
- [ ] Monitoring and alerts set up
- [ ] Log aggregation configured
- [ ] Backup schedule configured
- [ ] Documentation updated with new URLs
- [ ] Team notified of deployment

## Security Verification
- [ ] HTTPS enforced on all endpoints
- [ ] CORS properly configured
- [ ] API authentication working
- [ ] Database credentials secured
- [ ] Stripe API keys are live (not test)
- [ ] Environment variables not exposed
- [ ] Rate limiting configured
- [ ] Input validation active

## Performance Verification
- [ ] Frontend load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Database queries optimized
- [ ] CDN caching working
- [ ] Monitoring shows healthy metrics

---

# Quick Reference URLs

## Dashboards
- Vercel: https://vercel.com/dashboard
- Railway: https://railway.app/dashboard
- MongoDB Atlas: https://cloud.mongodb.com
- Stripe: https://dashboard.stripe.com

## Application URLs (After Deployment)
- Frontend: https://eduprep.vercel.app
- Auth API: https://auth-service-xxxxx.railway.app
- Content API: https://content-service-xxxxx.railway.app
- QBank API: https://qbank-service-xxxxx.railway.app
- Payment API: https://payment-service-xxxxx.railway.app
- Test Engine API: https://test-engine-service-xxxxx.railway.app

---

# Troubleshooting Commands

```bash
# Check Vercel deployment logs
vercel logs

# Check Railway service logs
railway logs -s auth-service

# Test backend service health
curl https://auth-service-xxxxx.railway.app/api/health

# Check database connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/eduprep"

# View Railway events
railway status

# Redeploy a service
railway redeploy
```

---

# Support & Documentation

- **Vercel**: https://vercel.com/docs
- **Railway**: https://docs.railway.app
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Stripe API**: https://stripe.com/docs/api
