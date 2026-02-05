/\*\*

- Payment Service Testing Guide
- Location: services/payment-service/docs/TESTING_GUIDE.md
-
- Complete testing procedures for payment flows
  \*/

# Payment Service Testing Guide

## Overview

This guide covers testing all payment flows including subscriptions, upgrades, cancellations, and webhook handling.

## Prerequisites

- Node.js 18+
- MongoDB running locally or Docker
- Stripe test account and API keys
- Stripe CLI installed
- Postman or similar API testing tool (optional)

## Setup for Testing

### 1. Install Dependencies

```bash
cd services/payment-service
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env

# Edit .env with test values
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret
```

### 3. Start MongoDB

```bash
# Using local MongoDB
mongod

# Or Docker
docker run -d -p 27017:27017 mongo:7.0
```

### 4. Start Payment Service

```bash
npm run dev
```

## Test Scenarios

### Scenario 1: Create Subscription

#### Setup

```bash
# Get JWT token (from auth service)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Test Request

```bash
curl -X POST http://localhost:3005/api/payments/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tierId": "basic",
    "paymentMethodId": "pm_card_visa"
  }'
```

#### Expected Response

- Status: `201 Created`
- Contains: `subscription` object with `stripeSubscriptionId`
- No errors in server logs

#### Verification

```bash
# Check subscription created in MongoDB
mongo --eval "db.subscriptions.findOne({userId: 'user-id'})"

# Verify in Stripe Dashboard
# - Customers > Find customer
# - Subscriptions > Should see "Basic" subscription active
```

---

### Scenario 2: Upgrade Subscription

#### Setup

- User must have active subscription (from Scenario 1)

#### Test Request

```bash
curl -X POST http://localhost:3005/api/payments/upgrade \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newTierId": "premium"
  }'
```

#### Expected Response

- Status: `200 OK`
- Updated `subscription` with new `planId: "premium"`

#### Verification

```bash
# Verify upgrade in database
mongo --eval "db.subscriptions.findOne({userId: 'user-id'})"

# Check in Stripe Dashboard
# - Subscription should show Premium plan
# - Old plan should have prorated credit
```

---

### Scenario 3: Cancel Subscription

#### Setup

- User must have active subscription

#### Test Request (Graceful Cancel)

```bash
curl -X POST http://localhost:3005/api/payments/cancel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "immediate": false
  }'
```

#### Expected Response

- Status: `200 OK`
- Message: "Subscription will be canceled at the end of the billing period"
- `cancelAtPeriodEnd: true`

#### Test Request (Immediate Cancel)

```bash
curl -X POST http://localhost:3005/api/payments/cancel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "immediate": true
  }'
```

#### Expected Response

- Status: `200 OK`
- Message: "Subscription canceled immediately"
- `status: "canceled"`

#### Verification

```bash
# Check cancellation date
mongo --eval "db.subscriptions.findOne({userId: 'user-id'})"

# Verify in Stripe
# - Subscription status should be "Canceled"
```

---

### Scenario 4: Get Current Subscription

#### Test Request

```bash
curl -X GET http://localhost:3005/api/payments/subscription \
  -H "Authorization: Bearer $TOKEN"
```

#### Expected Response

- Status: `200 OK`
- Returns current subscription details

#### Edge Cases

- User has no subscription → `404 Not Found`
- User canceled subscription → Status should be "canceled"

---

### Scenario 5: Get Invoices

#### Setup

- At least one successful payment must exist

#### Test Request

```bash
curl -X GET http://localhost:3005/api/payments/invoices \
  -H "Authorization: Bearer $TOKEN"
```

#### Expected Response

- Status: `200 OK`
- Array of invoices with correct details
- Each invoice has `pdfUrl` for downloading

#### Verification

```bash
# Check invoices in database
mongo --eval "db.invoices.find({userId: 'user-id'}).pretty()"

# Verify in Stripe Dashboard
# - Go to Customers > Select customer
# - View invoices section
```

---

### Scenario 6: Webhook Processing

#### Setup

Start Stripe CLI listener:

```bash
stripe listen --forward-to localhost:3005/api/payments/webhook
```

#### Trigger Events

**Test subscription.created:**

```bash
stripe trigger customer.subscription.created
```

**Test invoice.payment_succeeded:**

```bash
stripe trigger invoice.payment_succeeded
```

**Test invoice.payment_failed:**

```bash
stripe trigger invoice.payment_failed
```

#### Expected Behavior

- Webhook should be received and processed
- Database should be updated accordingly
- Emails should be sent (check logs)
- No errors in server output

#### Verification

```bash
# Check webhook events in Stripe Dashboard
# Developers > Webhooks > View details

# Verify processing in MongoDB
mongo --eval "db.webhookevents.findOne({}, {sort: {createdAt: -1}})"
```

---

### Scenario 7: Error Handling

#### Test Missing Token

```bash
curl -X GET http://localhost:3005/api/payments/subscription
```

Expected:

- Status: `401 Unauthorized`
- Error: "Access token required"

#### Test Invalid Token

```bash
curl -X GET http://localhost:3005/api/payments/subscription \
  -H "Authorization: Bearer invalid_token"
```

Expected:

- Status: `403 Forbidden`
- Error: "Invalid or expired token"

#### Test Duplicate Subscription

```bash
# Create subscription twice without canceling first
curl -X POST http://localhost:3005/api/payments/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tierId": "basic", "paymentMethodId": "pm_card_visa"}'

# Run again immediately
curl -X POST http://localhost:3005/api/payments/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tierId": "basic", "paymentMethodId": "pm_card_visa"}'
```

Expected:

- First: `201 Created`
- Second: `409 Conflict`
- Error: "User already has an active subscription"

#### Test Invalid Tier

```bash
curl -X POST http://localhost:3005/api/payments/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tierId": "invalid", "paymentMethodId": "pm_card_visa"}'
```

Expected:

- Status: `400 Bad Request`
- Error: "Invalid subscription tier"

---

## Test Card Numbers

Use these cards in test mode:

| Scenario           | Card Number         | Expiry | CVC |
| ------------------ | ------------------- | ------ | --- |
| Success            | 4242 4242 4242 4242 | 12/25  | 123 |
| Visa (debit)       | 4012 0010 3714 1234 | 12/25  | 123 |
| Mastercard         | 5555 5555 5555 4444 | 12/25  | 123 |
| Declined           | 4000 0000 0000 0002 | 12/25  | 123 |
| Insufficient Funds | 4000 0000 0000 9995 | 12/25  | 123 |
| Lost/Stolen        | 4000 0000 0000 9979 | 12/25  | 123 |
| 3D Secure          | 4000 0025 0000 3155 | 12/25  | 123 |

---

## Automated Testing

### Unit Tests

Create `tests/payment.test.ts`:

```typescript
import { PaymentController } from "../controllers/paymentController";
import { SubscriptionModel } from "../models/Subscription";

describe("Payment Controller", () => {
  describe("subscribe", () => {
    it("should create subscription for valid user", async () => {
      const req = {
        user: { id: "user-123", email: "test@example.com" },
        body: { tierId: "basic", paymentMethodId: "pm_card_visa" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await PaymentController.subscribe(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it("should reject duplicate subscriptions", async () => {
      // Test implementation
    });

    it("should reject invalid tier", async () => {
      // Test implementation
    });
  });
});
```

Run tests:

```bash
npm run test
```

### Integration Tests

Create `tests/integration/payment.integration.ts`:

```typescript
describe("Payment Integration", () => {
  it("should complete full subscription flow", async () => {
    // 1. Create subscription
    // 2. Verify in database
    // 3. Verify in Stripe
    // 4. Upgrade subscription
    // 5. Verify upgrade
    // 6. Cancel subscription
    // 7. Verify cancellation
  });
});
```

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# Test GET /subscription endpoint
ab -n 1000 -c 10 \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3005/api/payments/subscription
```

### Load Testing with k6

Create `tests/load.js`:

```javascript
import http from "k6/http";
import { check } from "k6";

export let options = {
  vus: 10,
  duration: "30s",
};

export default function () {
  let response = http.get("http://localhost:3005/api/payments/subscription", {
    headers: {
      Authorization: "Bearer " + __ENV.TOKEN,
    },
  });

  check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });
}
```

Run:

```bash
k6 run tests/load.js --env TOKEN=$TOKEN
```

---

## Debugging

### Enable Verbose Logging

```bash
# In .env
NODE_ENV=development
LOG_LEVEL=debug
```

### Monitor Database

```bash
# Watch database changes
mongo --eval "
  while(true) {
    db.subscriptions.find().pretty();
    sleep(5000);
  }
"
```

### Check Stripe Logs

```bash
# Tail webhook logs
stripe logs tail

# View API logs
stripe logs list --api-logs
```

### Use Stripe Debugger

In Stripe Dashboard:

- Developers > Events > View specific event details
- See request/response details
- Replay webhook events

---

## Test Coverage

Target coverage:

- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

Run coverage:

```bash
npm run test:coverage
```

---

## Checklist Before Production

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing completed
- [ ] Load testing successful (< 500ms response time)
- [ ] Webhook handling verified
- [ ] Error cases handled
- [ ] Email notifications working
- [ ] Database backups automated
- [ ] Logging configured
- [ ] Security audit completed
- [ ] Stripe live keys configured
- [ ] Webhook URL updated to production
- [ ] Rate limiting tested
- [ ] CORS configured correctly
