/\*\*

- Payment Service Backend Implementation Guide
-
- This file documents the required backend endpoints for the payment flow
- Implementation details for Node.js/Express with Stripe integration
  \*/

// ============================================================================
// PAYMENT SERVICE API ENDPOINTS
// ============================================================================

/\*\*

- POST /api/payments/subscribe
-
- Create a new subscription for an unauthenticated or newly registered user
- Called after user completes signup and selects a plan on pricing page
-
- Request:
- {
- tierId: "basic" | "standard" | "premium",
- email: "user@example.com",
- paymentMethod: {
-     card: {
-       number: "4111111111111111",
-       exp_month: 12,
-       exp_year: 2025,
-       cvc: "123"
-     }
- }
- }
-
- Response (Success):
- {
- success: true,
- subscription: {
-     id: "sub_123456",
-     userId: "user_uuid",
-     tierId: "basic",
-     status: "active",
-     startDate: "2024-01-15T10:30:00Z",
-     endDate: "2024-02-15T10:30:00Z",
-     priceId: "$49/month",
-     stripeSubscriptionId: "sub_stripe_123"
- },
- invoice: {
-     id: "inv_123",
-     amount: 49.00,
-     currency: "USD",
-     status: "paid",
-     pdfUrl: "https://..."
- }
- }
-
- Flow:
- 1.  Validate user has email verified OR send verification
- 2.  Create Stripe customer if not exists
- 3.  Create payment method in Stripe
- 4.  Create subscription in Stripe
- 5.  Save subscription record in DB
- 6.  Send confirmation email
- 7.  Return subscription details
      \*/

/\*\*

- POST /api/payments/upgrade
-
- Upgrade an existing subscription to a higher tier
- Only for authenticated users with existing subscription
-
- Headers:
- Authorization: Bearer {token}
-
- Request:
- {
- tierId: "standard" | "premium",
- paymentMethod: {
-     card: {
-       number: "4111111111111111",
-       exp_month: 12,
-       exp_year: 2025,
-       cvc: "123"
-     }
- }
- }
-
- Response (Success):
- {
- success: true,
- subscription: {
-     id: "sub_123456",
-     tierId: "standard",
-     status: "active",
-     upgradeDate: "2024-01-20T14:22:00Z",
-     prorationCredits: 12.50,
-     newPrice: "$129/3 months"
- },
- invoice: {
-     id: "inv_124",
-     amount: 116.50,
-     currency: "USD",
-     description: "Proration credit applied"
- }
- }
-
- Flow:
- 1.  Get user's current subscription
- 2.  Verify new tier is higher than current
- 3.  Calculate proration credits
- 4.  Update Stripe subscription
- 5.  Save new subscription record
- 6.  Send confirmation email
      \*/

/\*\*

- POST /api/payments/downgrade
-
- Downgrade subscription to lower tier
- Only for authenticated users
-
- Headers:
- Authorization: Bearer {token}
-
- Request:
- {
- tierId: "basic"
- }
-
- Response (Success):
- {
- success: true,
- subscription: {
-     tierId: "basic",
-     status: "active",
-     effectiveDate: "2024-02-15T10:30:00Z",
-     refundAmount: 25.00
- }
- }
-
- Flow:
- 1.  Get current subscription
- 2.  Verify user can downgrade
- 3.  Calculate refund/credit
- 4.  Update in Stripe
- 5.  Effective at next billing cycle
- 6.  Notify user
      \*/

/\*\*

- POST /api/payments/cancel
-
- Cancel user's active subscription
-
- Headers:
- Authorization: Bearer {token}
-
- Request:
- {
- reason: "too expensive", // optional
- immediate: false // if true, cancel immediately; if false, at period end
- }
-
- Response:
- {
- success: true,
- subscription: {
-     status: "cancelled",
-     cancelledAt: "2024-01-20T14:22:00Z",
-     effectiveAt: "2024-02-15T10:30:00Z" // if not immediate
- }
- }
  \*/

/\*\*

- GET /api/payments/subscription
-
- Get current subscription details for authenticated user
-
- Headers:
- Authorization: Bearer {token}
-
- Response:
- {
- id: "sub_123456",
- tierId: "standard",
- name: "Standard Plan",
- price: 129,
- interval: "3 months",
- status: "active",
- startDate: "2024-01-15T10:30:00Z",
- currentPeriodEnd: "2024-04-15T10:30:00Z",
- daysRemaining: 87,
- autoRenew: true,
- features: [
-     "Unlimited question access",
-     "Advanced analytics",
-     "Flashcard system",
-     ...
- ],
- paymentMethod: {
-     type: "card",
-     brand: "visa",
-     last4: "4242",
-     expMonth: 12,
-     expYear: 2025
- }
- }
  \*/

/\*\*

- GET /api/payments/invoices
-
- Get all invoices for authenticated user
-
- Headers:
- Authorization: Bearer {token}
-
- Query Parameters:
- - limit: 10 (default)
- - offset: 0
-
- Response:
- {
- invoices: [
-     {
-       id: "inv_123",
-       date: "2024-01-15T10:30:00Z",
-       amount: 49.00,
-       currency: "USD",
-       status: "paid",
-       pdfUrl: "https://...",
-       description: "Standard Plan - 3 months"
-     }
- ],
- total: 5,
- hasMore: false
- }
  \*/

/\*\*

- POST /api/webhooks/stripe
-
- Stripe webhook endpoint for handling async events
- Should be configured in Stripe dashboard to:
- - customer.subscription.created
- - customer.subscription.updated
- - customer.subscription.deleted
- - invoice.payment_succeeded
- - invoice.payment_failed
- - charge.succeeded
- - charge.failed
-
- This is not called by frontend but by Stripe servers
-
- Actions:
- - Create/update subscription records
- - Send email notifications
- - Handle payment failures
- - Process refunds
- - Log for audit trail
    \*/

// ============================================================================
// DATABASE MODELS
// ============================================================================

/\*\*

- user_subscriptions table
-
- CREATE TABLE user_subscriptions (
- id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
- tier_id VARCHAR(50) NOT NULL,
- status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired, past_due
- stripe_subscription_id VARCHAR(255) UNIQUE,
- stripe_customer_id VARCHAR(255),
- start_date TIMESTAMP NOT NULL,
- current_period_end TIMESTAMP NOT NULL,
- cancel_at_period_end BOOLEAN DEFAULT FALSE,
- cancelled_at TIMESTAMP,
- created_at TIMESTAMP DEFAULT NOW(),
- updated_at TIMESTAMP DEFAULT NOW(),
- metadata JSONB -- store additional info
- );
-
- CREATE INDEX idx_subscriptions_user_active ON user_subscriptions(user_id) WHERE status='active';
- CREATE INDEX idx_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);
  \*/

/\*\*

- payment_methods table
-
- CREATE TABLE payment_methods (
- id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
- stripe_payment_method_id VARCHAR(255) UNIQUE,
- type VARCHAR(50), -- card, paypal, apple_pay
- brand VARCHAR(50), -- visa, mastercard, amex
- last_four VARCHAR(4),
- exp_month INTEGER,
- exp_year INTEGER,
- is_default BOOLEAN DEFAULT TRUE,
- created_at TIMESTAMP DEFAULT NOW(),
- updated_at TIMESTAMP DEFAULT NOW()
- );
-
- CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
  \*/

/\*\*

- invoices table
-
- CREATE TABLE invoices (
- id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
- subscription_id UUID REFERENCES user_subscriptions(id),
- stripe_invoice_id VARCHAR(255) UNIQUE,
- amount DECIMAL(10, 2) NOT NULL,
- currency VARCHAR(3) DEFAULT 'USD',
- status VARCHAR(50), -- draft, open, paid, void, uncollectible
- description TEXT,
- pdf_url TEXT,
- hosted_invoice_url TEXT,
- invoice_date TIMESTAMP,
- due_date TIMESTAMP,
- paid_at TIMESTAMP,
- created_at TIMESTAMP DEFAULT NOW(),
- updated_at TIMESTAMP DEFAULT NOW()
- );
-
- CREATE INDEX idx_invoices_user ON invoices(user_id);
- CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
  \*/

// ============================================================================
// PRICING CONFIGURATION
// ============================================================================

const PRICING_PLANS = {
basic: {
name: "Basic",
price: 49,
interval: "month",
stripePriceId: "price_basic_monthly", // from Stripe
features: [
"Unlimited question access",
"Basic analytics",
"Practice exams",
"Mobile access",
],
},
standard: {
name: "Standard",
price: 129,
interval: "3 months",
stripePriceId: "price_standard_quarterly",
features: [
"All Basic features",
"Advanced analytics",
"Flashcard system",
"AI study recommendations",
"Priority support",
"Mock exams",
],
},
premium: {
name: "Premium",
price: 299,
interval: "year",
stripePriceId: "price_premium_annual",
features: [
"All Standard features",
"Lifetime access",
"Video explanations",
"1-on-1 tutoring",
"Unlimited mock exams",
"Certificate of completion",
],
},
};

// ============================================================================
// MIDDLEWARE EXAMPLES
// ============================================================================

/\*\*

- Middleware: Require active subscription
-
- Usage: router.get('/qbank', requireSubscription, getQuestions)
-
- This middleware checks if user has active subscription
- If not, returns 403 Forbidden with message to upgrade
  \*/

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Payment errors to handle:
// - card_declined
// - generic_decline
// - lost_card
// - stolen_card
// - expired_card
// - incorrect_cvc
// - processing_error
// - rate_limit
// - authentication_error

// ============================================================================
// FRONTEND INTEGRATION CHECKLIST
// ============================================================================

/\*
✓ Landing page shows pricing section with all 3 tiers
✓ "Get Started" button redirects to:

- /signup if not logged in
- /pricing (checkout) if logged in
  ✓ Pricing page shows full plan comparison
  ✓ Checkout dialog captures card info (via Stripe Elements)
  ✓ After purchase, subscription stored in localStorage
  ✓ Dashboard shows:
- Current plan info
- Days remaining
- Plan-specific features
- Upgrade button
  ✓ Upgrade page for logged-in users
- Shows current plan
- Shows upgrade options
- Prorated pricing
  ✓ Content access controlled by subscription tier
- Free content: visible to all
- Basic content: basic subscribers+
- Standard content: standard subscribers+
- Premium content: premium subscribers only

Required backend endpoints:
□ POST /api/payments/subscribe
□ POST /api/payments/upgrade
□ POST /api/payments/cancel
□ GET /api/payments/subscription
□ GET /api/payments/invoices
□ POST /api/webhooks/stripe (Stripe events)
□ Middleware to check subscription status
□ Content filtering by tier
\*/

export {};
