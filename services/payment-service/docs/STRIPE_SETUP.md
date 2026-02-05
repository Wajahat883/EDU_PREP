/\*\*

- Stripe Integration Setup & Configuration
- Location: services/payment-service/docs/STRIPE_SETUP.md
-
- Complete guide for setting up and configuring Stripe for EduPrep
  \*/

# Stripe Integration Guide

## Overview

This guide covers setting up Stripe for the EduPrep payment system, including account creation, API key configuration, product setup, and webhook configuration.

## 1. Create Stripe Account

### Steps

1. Go to [stripe.com](https://stripe.com)
2. Click "Start Now"
3. Fill in your business information
4. Verify email address
5. Complete KYC verification

### Account Types

- **Standard**: Stripe handles payment processing (recommended for simplicity)
- **Express**: Custom branding and control over customer experience
- **Custom**: Full integration control (most complex)

For EduPrep, use **Standard** account.

## 2. Obtain API Keys

### Finding Your Keys

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** > **API Keys**
3. You'll see:
   - **Publishable Key** (public, safe to expose to frontend)
   - **Secret Key** (confidential, never expose publicly)

### Key Types

```
Test Keys (Start with pk_test_ and sk_test_)
├─ Use for development and testing
├─ No real charges occur
└─ Test card numbers available

Live Keys (Start with pk_live_ and sk_live_)
├─ Use only in production
├─ Real charges occur
└─ Requires live account verification
```

### Add Keys to Environment

```bash
# services/payment-service/.env
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
```

## 3. Create Products and Prices

### Create Basic Plan

1. Go to **Products** in Stripe Dashboard
2. Click **Add product**
3. Fill in details:
   - **Name**: "Basic Plan"
   - **Description**: "2,000 practice questions, basic analytics"
   - **Price**: $49.00
   - **Billing period**: Monthly
4. Click **Create product**
5. Copy the **Price ID** (price\_...)

### Create Standard Plan

1. Click **Add product**
2. Fill in:
   - **Name**: "Standard Plan"
   - **Description**: "5,000 questions, flashcards, mock exams"
   - **Price**: $129.00
   - **Billing period**: Quarterly (3 months = 3 recurring)
3. Copy the **Price ID**

### Create Premium Plan

1. Click **Add product**
2. Fill in:
   - **Name**: "Premium Plan"
   - **Description**: "All features, live tutoring, certificates"
   - **Price**: $299.00
   - **Billing period**: Annual
3. Copy the **Price ID**

### Add Price IDs to Environment

```bash
# services/payment-service/.env
STRIPE_BASIC_PRICE_ID=price_basic_monthly
STRIPE_STANDARD_PRICE_ID=price_standard_quarterly
STRIPE_PREMIUM_PRICE_ID=price_premium_annual
```

## 4. Enable Payment Methods

### Configure Accepted Payments

1. Go to **Settings** > **Payment methods**
2. Enable:
   - ✓ Credit cards (Visa, Mastercard, Amex)
   - ✓ Digital wallets (Apple Pay, Google Pay)
   - ✓ Local methods (varies by region)

### Payment Processing Settings

1. Go to **Settings** > **Business settings**
2. Set **Payment collection**: "On-site" (customer payment page)
3. Enable **3D Secure**: For card authentication
4. Set **Fraud detection**: "Enabled"

## 5. Set Up Webhooks

### Create Webhook Endpoint

1. Go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Fill in:
   - **URL**: `https://api.eduprep.com/api/payments/webhook`
   - **Description**: "EduPrep Payment Webhook"

### Select Events to Listen

Required events:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end`

Click **Select events** > Check boxes above > **Add endpoint**

### Get Webhook Secret

1. View your endpoint details
2. Copy the **Signing secret** (whsec\_...)
3. Add to environment:

```bash
# services/payment-service/.env
STRIPE_WEBHOOK_SECRET=whsec_test_your_secret_here
```

### Test Webhook

```bash
# Use Stripe CLI to test locally
stripe listen --forward-to localhost:3005/api/payments/webhook

# Copy the webhook signing secret displayed
```

## 6. Test Payment Flow

### Test Card Numbers

| Card Type               | Number              | Expiry | CVC  |
| ----------------------- | ------------------- | ------ | ---- |
| Visa                    | 4242 4242 4242 4242 | 12/25  | 123  |
| Mastercard              | 5555 5555 5555 4444 | 12/25  | 123  |
| Amex                    | 3782 822463 10005   | 12/25  | 1234 |
| Declined                | 4000 0000 0000 0002 | 12/25  | 123  |
| Authentication Required | 4000 0025 0000 3155 | 12/25  | 123  |

### Test Flow

1. Start payment service:

```bash
cd services/payment-service
npm run dev
```

2. Test subscription creation:

```bash
curl -X POST http://localhost:3005/api/payments/subscribe \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tierId": "basic",
    "paymentMethodId": "pm_card_visa"
  }'
```

3. Check webhook processing:

```bash
stripe logs tail --limit 10
```

## 7. Configure Test Customers

### Create Test Customer

```bash
curl https://api.stripe.com/v1/customers \
  -u sk_test_your_key_here: \
  -d email="test@example.com" \
  -d name="Test User"
```

### Simulate Webhook Events

```bash
# Using Stripe CLI
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

## 8. Production Deployment

### Pre-Launch Checklist

- [ ] Switch to live API keys
- [ ] Update Stripe webhook URL to production
- [ ] Configure SSL certificate
- [ ] Enable fraud detection
- [ ] Set up payment receipt emails
- [ ] Test payment flow in production
- [ ] Monitor transaction logs

### Go-Live Steps

1. **Activate Live Keys**
   - Copy live keys from Stripe Dashboard
   - Update environment variables
   - Restart payment service

2. **Update Webhook URL**
   - Go to Webhooks in Stripe Dashboard
   - Update endpoint URL to production domain

3. **Enable Tax Collection** (optional)
   - Settings > Billing settings > Tax
   - Configure tax rates per region

4. **Set Up Reporting**
   - Enable automated payouts
   - Configure payout schedule (default: daily)
   - Set up reporting for accounting

## 9. Monitoring & Maintenance

### Monitor Transactions

```bash
# View recent transactions in Stripe Dashboard
# Go to Payments > Recent transactions

# Check subscription status
curl https://api.stripe.com/v1/subscriptions/sub_xyz \
  -u sk_test_your_key_here:
```

### Handle Failed Payments

1. **Automatic Retry**: Stripe automatically retries failed payments
2. **Manual Intervention**: Contact customer if retries fail
3. **Suspension**: Subscription marked as `past_due`
4. **Cancellation**: After 30 days, subscription canceled

### Regular Tasks

- **Weekly**: Check failed payments dashboard
- **Monthly**: Review churn rate, review revenue reports
- **Quarterly**: Audit webhook events, review security

## 10. Security Best Practices

### Secret Key Protection

- ✓ Never commit secret keys to version control
- ✓ Use environment variables only
- ✓ Rotate keys annually
- ✓ Use key restrictions (IP whitelist)

### PCI Compliance

- ✓ Never handle raw card data
- ✓ Use Stripe-hosted payment forms
- ✓ Use Payment Intents API
- ✓ Implement 3D Secure

### API Security

- ✓ Use HTTPS only
- ✓ Verify webhook signatures
- ✓ Implement rate limiting
- ✓ Log all API calls (without sensitive data)

## References

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Security](https://stripe.com/docs/security)
- [Stripe Dashboard](https://dashboard.stripe.com)
