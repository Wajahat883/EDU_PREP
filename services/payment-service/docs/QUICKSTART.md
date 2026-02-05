/\*\*

- Payment Service Quick Start
- Location: services/payment-service/docs/QUICKSTART.md
-
- Get started with the payment service in 15 minutes
  \*/

# Payment Service Quick Start

Get the payment service running in 15 minutes!

---

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB running (locally or Atlas)
- Stripe account (free test account available)
- JWT secret key (any string)

---

## ⚡ 5-Minute Setup

### 1. Install Dependencies (2 min)

```bash
cd services/payment-service
npm install
```

### 2. Configure Environment (2 min)

```bash
cp .env.example .env
```

Edit `.env` and update these fields:

```bash
# Minimum required for testing
DATABASE_URL=mongodb://localhost:27017/eduprep_payment
JWT_SECRET=your_jwt_secret_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret
```

### 3. Start Service (1 min)

```bash
npm run dev
```

Expected output:

```
Payment service running on port 3005
Environment: development
Health check: http://localhost:3005/health
```

---

## ✅ Verify Installation

### Test Health Check

```bash
curl http://localhost:3005/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "payment-service",
  "timestamp": "2026-02-04T10:30:00.000Z"
}
```

### Get Available Plans

```bash
curl http://localhost:3005/api/payments/plans
```

---

## 🧪 Test Payment Flow

### 1. Get a JWT Token

```bash
# From your auth service or use this test token format:
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE2MDAwMDAwMDB9.your_signed_token"
```

### 2. Create a Subscription

```bash
curl -X POST http://localhost:3005/api/payments/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tierId": "basic",
    "paymentMethodId": "pm_card_visa"
  }'
```

Expected response:

```json
{
  "success": true,
  "subscription": {
    "id": "507f1f77bcf86cd799439011",
    "stripeSubscriptionId": "sub_1234567890",
    "status": "active",
    "planId": "basic",
    "currentPeriodStart": "2026-02-04T10:30:00Z",
    "currentPeriodEnd": "2026-03-04T10:30:00Z"
  }
}
```

### 3. Get Current Subscription

```bash
curl http://localhost:3005/api/payments/subscription \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Upgrade Subscription

```bash
curl -X POST http://localhost:3005/api/payments/upgrade \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newTierId": "premium"
  }'
```

### 5. Get Invoices

```bash
curl http://localhost:3005/api/payments/invoices \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔌 Webhook Testing

### Start Stripe Webhook Listener

```bash
# In a new terminal, in the project root
stripe listen --forward-to localhost:3005/api/payments/webhook
```

You'll see:

```
Ready! Your webhook signing secret is: whsec_test_...
```

Copy this secret and update `.env`:

```
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### Trigger Test Events

In another terminal:

```bash
# Test subscription created event
stripe trigger customer.subscription.created

# Test payment succeeded event
stripe trigger invoice.payment_succeeded
```

Check your service logs - you should see webhook events processed!

---

## 📊 Verify Data in MongoDB

```bash
# Connect to MongoDB
mongo

# Switch to database
use eduprep_payment

# View subscriptions
db.subscriptions.find().pretty()

# View invoices
db.invoices.find().pretty()

# View webhook events
db.webhookevents.find().pretty()
```

---

## 🐛 Debugging

### Check Logs

Watch real-time logs:

```bash
# In service terminal (already running with npm run dev)
tail -f logs/*.log
```

### Check Service Status

```bash
curl http://localhost:3005/ready
```

Expected response when ready:

```json
{
  "ready": true,
  "service": "payment-service",
  "timestamp": "2026-02-04T10:30:00.000Z"
}
```

### Common Issues

**MongoDB connection error:**

```bash
# Start MongoDB if not running
docker run -d -p 27017:27017 mongo:7.0
```

**Stripe key error:**

- Get test keys from https://dashboard.stripe.com/apikeys
- Update `.env` with correct keys

**Port already in use:**

```bash
# Change port in .env
PORT=3006

# Or kill process on port 3005
lsof -ti:3005 | xargs kill -9
```

---

## 🚀 Next Steps

### 1. Integrate with Frontend

Connect your frontend to these endpoints:

| Action           | Endpoint                     | Method |
| ---------------- | ---------------------------- | ------ |
| Get plans        | `/api/payments/plans`        | GET    |
| Subscribe        | `/api/payments/subscribe`    | POST   |
| Get subscription | `/api/payments/subscription` | GET    |
| Upgrade          | `/api/payments/upgrade`      | POST   |
| Cancel           | `/api/payments/cancel`       | POST   |
| Get invoices     | `/api/payments/invoices`     | GET    |

### 2. Create Stripe Products

Go to https://dashboard.stripe.com/products

Create 3 products:

- Basic: $49/month
- Standard: $129/3 months
- Premium: $299/year

Copy the price IDs and update `.env`:

```bash
STRIPE_BASIC_PRICE_ID=price_xxx
STRIPE_STANDARD_PRICE_ID=price_yyy
STRIPE_PREMIUM_PRICE_ID=price_zzz
```

### 3. Configure Email

Update email provider in `.env`:

**SendGrid:**

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxx...
```

**AWS SES:**

```bash
EMAIL_PROVIDER=aws_ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=yyy
```

### 4. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment options:

- Docker Compose
- Kubernetes
- VPS with PM2

---

## 📚 More Documentation

| Document                                                   | Purpose                             |
| ---------------------------------------------------------- | ----------------------------------- |
| [API_REFERENCE.md](./API_REFERENCE.md)                     | Complete API documentation          |
| [DATABASE_SETUP.md](./DATABASE_SETUP.md)                   | Database configuration & management |
| [STRIPE_SETUP.md](./STRIPE_SETUP.md)                       | Stripe account & product setup      |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md)                     | Comprehensive testing procedures    |
| [DEPLOYMENT.md](./DEPLOYMENT.md)                           | Production deployment guide         |
| [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) | Implementation summary              |

---

## 💡 Tips & Tricks

### Test Different Scenarios

Use these test card numbers:

```bash
# Success
4242 4242 4242 4242

# Visa
4012 0010 3714 1234

# Mastercard
5555 5555 5555 4444

# Card Declined
4000 0000 0000 0002

# All with expiry: 12/25, CVC: 123
```

### Monitor Database in Real-time

```bash
# Watch subscriptions collection
mongosh
use eduprep_payment
watch(function() { return db.subscriptions.find().toArray(); }, {maxAwaitTimeMS: 1000})
```

### View Service Metrics

Add this to check service performance:

```bash
# Check response times
curl -w "\nTime: %{time_total}s\n" http://localhost:3005/health

# Check memory usage
ps aux | grep "node.*index.ts"
```

---

## ✨ You're Ready!

Your payment service is now running and ready for:

- ✅ Testing subscription flows
- ✅ Processing payments through Stripe
- ✅ Sending email confirmations
- ✅ Handling webhooks
- ✅ Managing invoices

### What to do next:

1. **Test all 7 endpoints** (use curl examples above)
2. **Review API documentation** (see API_REFERENCE.md)
3. **Run testing procedures** (see TESTING_GUIDE.md)
4. **Deploy to staging** (see DEPLOYMENT.md)
5. **Go to production** (get live Stripe keys)

---

## 📞 Need Help?

- Check [TESTING_GUIDE.md](./TESTING_GUIDE.md) for error scenarios
- Review [API_REFERENCE.md](./API_REFERENCE.md) for endpoint details
- See [STRIPE_SETUP.md](./STRIPE_SETUP.md) for Stripe configuration
- Check service logs: `npm run dev` output

---

## 🎉 Success Checklist

- [ ] Service running on port 3005
- [ ] Health check responding
- [ ] MongoDB connected
- [ ] JWT token working
- [ ] Stripe test keys configured
- [ ] Can create subscription
- [ ] Can upgrade subscription
- [ ] Can cancel subscription
- [ ] Webhooks processing
- [ ] Emails sending (check logs)

Once everything is checked, you're ready for the next phase! 🚀
