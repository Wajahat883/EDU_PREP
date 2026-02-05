# Visual Payment Flow Guide

## Complete User Journey Map

```
START
  │
  ├──────────────────────────────────────────────────────────────┐
  │                    UNAUTHENTICATED USER                      │
  └──────────────────────────────────────────────────────────────┘
  │
  ├─→ Landing Page
  │   │
  │   ├─→ Scroll to Pricing Section
  │   │   │
  │   │   ├─→ Basic ($49/mo)
  │   │   ├─→ Standard ($129/3mo) [Most Popular]
  │   │   └─→ Premium ($299/yr)
  │   │
  │   └─→ Click "Get Started" on any plan
  │       │
  │       └─→ Redirect to Sign Up Page
  │           │
  │           ├─→ Enter email, password
  │           ├─→ Verify email
  │           │
  │           └─→ Account Created
  │               │
  │               └─→ Redirect to Pricing Page
  │                   │
  │                   ├─→ Email field pre-filled
  │                   ├─→ Click "Get Started" again
  │                   │
  │                   └─→ Checkout Dialog Opens
  │                       │
  │                       ├─→ Card Number: 4111 1111 1111 1111
  │                       ├─→ Expiry: 12/25
  │                       ├─→ CVV: 123
  │                       │
  │                       └─→ Click "Subscribe"
  │                           │
  │                           ├─→ Payment Processing... ⏳
  │                           │
  │                           ├─→ Success! ✅
  │                           ├─→ Store subscription in localStorage
  │                           │
  │                           └─→ Redirect to Dashboard
  │                               │
  │                               └─→ Subscription Active! 🎉
  │                                   ├─ Plan info displayed
  │                                   ├─ Days remaining shown
  │                                   ├─ Features unlocked
  │                                   └─ Quick actions enabled
  │
  ├──────────────────────────────────────────────────────────────┐
  │                    AUTHENTICATED USER                        │
  └──────────────────────────────────────────────────────────────┘
  │
  ├─→ Pricing Page
  │   │
  │   ├─→ View pricing plans
  │   │   ├─→ Basic ($49/mo)
  │   │   ├─→ Standard ($129/3mo) [Most Popular]
  │   │   └─→ Premium ($299/yr)
  │   │
  │   └─→ Click "Get Started"
  │       │
  │       └─→ Checkout Dialog Opens
  │           │
  │           ├─→ Email: user@example.com [disabled]
  │           ├─→ Card Number: [enter]
  │           ├─→ Expiry: [enter]
  │           ├─→ CVV: [enter]
  │           │
  │           └─→ Click "Subscribe"
  │               │
  │               ├─→ Payment Processing... ⏳
  │               │
  │               ├─→ Success! ✅
  │               ├─→ Store in localStorage
  │               │
  │               └─→ Redirect to Dashboard
  │                   │
  │                   └─→ Subscription Active! 🎉
  │
  ├──────────────────────────────────────────────────────────────┐
  │                    UPGRADE FLOW                              │
  └──────────────────────────────────────────────────────────────┘
  │
  ├─→ Dashboard (Current Plan: Basic)
  │   │
  │   └─→ Click "Upgrade Plan"
  │       │
  │       └─→ Redirect to /upgrade
  │           │
  │           ├─→ Current Plan Badge
  │           │   └─→ Basic [Your Current Plan]
  │           │
  │           ├─→ Available Plans
  │           │   ├─→ Basic [Current Plan]
  │           │   ├─→ Standard [Most Popular] [Choose Plan]
  │           │   └─→ Premium [Choose Plan]
  │           │
  │           └─→ Click "Choose Plan" (Standard)
  │               │
  │               └─→ Checkout Dialog Opens
  │                   │
  │                   ├─→ Card Number: [enter]
  │                   ├─→ Expiry: [enter]
  │                   ├─→ CVV: [enter]
  │                   │
  │                   └─→ Click "Complete Upgrade"
  │                       │
  │                       ├─→ Payment Processing... ⏳
  │                       │
  │                       ├─→ Success! ✅
  │                       ├─→ Update localStorage
  │                       ├─→ Apply proration credit
  │                       │
  │                       └─→ Redirect to Dashboard
  │                           │
  │                           └─→ Upgraded! 🎉
  │                               └─ Standard Plan now active
  │                               └─ Features unlocked
  │
  └──────────────────────────────────────────────────────────────
```

---

## Payment Form Flows

### Pricing Page - Checkout Dialog

```
┌───────────────────────────────────────┐
│ Complete Your Subscription - STANDARD │
├───────────────────────────────────────┤
│                                       │
│ EMAIL (Pre-filled if logged in)       │
│ ┌─────────────────────────────────┐  │
│ │ user@example.com                │  │
│ └─────────────────────────────────┘  │
│                                       │
│ CARD NUMBER                           │
│ ┌─────────────────────────────────┐  │
│ │ 4111 1111 1111 1111             │  │
│ └─────────────────────────────────┘  │
│                                       │
│ EXPIRY DATE         CVV              │
│ ┌──────────────┐  ┌────────────┐    │
│ │ 12/25        │  │ 123        │    │
│ └──────────────┘  └────────────┘    │
│                                       │
│ 🔒 Your payment is secure and        │
│    encrypted. We do not store full   │
│    credit card details.              │
│                                       │
├───────────────────────────────────────┤
│                                       │
│        [Cancel]    [Subscribe]       │
│                                       │
└───────────────────────────────────────┘
```

### State Transitions

**Initial State**:

```
Email: [] (empty if not logged in)
Card: []
Expiry: []
CVV: []
Loading: false
Error: null
```

**User Fills Form**:

```
Email: [user@example.com]
Card: [4111 1111 1111 1111]
Expiry: [12/25]
CVV: [123]
Loading: false
Error: null
```

**Submitting**:

```
Loading: true ⏳
Submit button: disabled
All inputs: disabled
Error: null
```

**Success**:

```
Success message: "Successfully subscribed!"
Dialog closes after 2 seconds
Redirect to /dashboard
```

**Error**:

```
Loading: false
Error: "Your card was declined. Please check your card details."
Submit button: enabled
Inputs: enabled
```

---

## Component Hierarchy & Data Flow

```
Landing Page
├─ Props: none
├─ State: none (static)
└─ Children:
   ├─ Pricing Section
   │  ├─ BasicCard
   │  │  └─ CTA: /pricing
   │  ├─ StandardCard
   │  │  └─ CTA: /pricing
   │  └─ PremiumCard
   │     └─ CTA: /pricing

Pricing Page
├─ Props: none
├─ State:
│  ├─ user (from auth store)
│  ├─ openCheckout: boolean
│  ├─ selectedTier: string | null
│  ├─ checkoutData: {tierId, email, cardNumber, expiryDate, cvv}
│  ├─ loading: boolean
│  └─ message: {type, text} | null
├─ Effects:
│  └─ useEffect(() => {update email when user changes})
└─ Handlers:
   ├─ handleSelectTier()
   │  └─ if (!user) → router.push("/signup")
   │  └─ else → setOpenCheckout(true)
   └─ handleProcessPayment()
      └─ POST /api/payments/subscribe
      └─ Save to localStorage
      └─ Redirect to /dashboard

Dashboard
├─ Props: none
├─ State:
│  ├─ user (from auth store)
│  ├─ subscription (from localStorage)
│  ├─ daysRemaining: number
│  └─ planInfo: PlanFeatures
├─ Effects:
│  └─ useEffect(() => {
│       if (!user) router.push("/login")
│       if (subscription) setDaysRemaining(...)
│     })
└─ Renders:
   ├─ Subscription Status Card
   ├─ Progress Metrics
   ├─ Plan Features (if subscribed)
   ├─ Quick Actions (disabled if not subscribed)
   └─ Study Plan (if subscribed)

Upgrade Page
├─ Props: none
├─ State:
│  ├─ user (from auth store)
│  ├─ currentPlan (from localStorage)
│  ├─ selectedTier: string | null
│  ├─ checkoutData: {tierId, cardNumber, expiryDate, cvv}
│  ├─ loading: boolean
│  └─ message: {type, text} | null
├─ Effects:
│  └─ useEffect(() => {
│       if (!user) router.push("/login")
│       setCurrentPlan(from localStorage)
│     })
└─ Handlers:
   ├─ handleUpgrade()
   └─ handleProcessPayment()
      └─ POST /api/payments/upgrade
```

---

## Data Storage Architecture

### localStorage

```
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  },
  "currentSubscription": {
    "tierId": "standard",
    "startDate": "2024-01-15T10:30:00Z",
    "status": "active",
    "expiryDate": "2024-04-15T10:30:00Z"
  }
}
```

### Backend Database (Required)

**user_subscriptions**

```
id: UUID
user_id: UUID (FK)
tier_id: string
status: string (active|cancelled|expired)
start_date: timestamp
end_date: timestamp
stripe_subscription_id: string
created_at: timestamp
```

**payment_methods**

```
id: UUID
user_id: UUID (FK)
stripe_payment_method_id: string
brand: string (visa|mastercard)
last_four: string
exp_month: integer
exp_year: integer
is_default: boolean
```

**invoices**

```
id: UUID
user_id: UUID (FK)
subscription_id: UUID (FK)
amount: decimal
status: string (paid|pending|failed)
invoice_date: timestamp
paid_at: timestamp
pdf_url: string
```

---

## API Request/Response Flow

### Subscribe Flow

```
Frontend                          Backend                 Stripe
   │                                │                        │
   ├─ POST /api/payments/subscribe  │                        │
   ├─ {tierId, email, card}  ──────>│                        │
   │                                 ├─ Validate card  ────>│
   │                                 │                        │
   │                                 │<─ Card valid ────────┤
   │                                 │                        │
   │                                 ├─ Create customer ────>│
   │                                 │<─ customer_id ───────┤
   │                                 │                        │
   │                                 ├─ Create subscription ─>│
   │                                 │<─ sub_id ────────────┤
   │                                 │                        │
   │                                 ├─ Save to DB           │
   │                                 │                        │
   │<─ Success + subscription ──────┤                        │
   │  {id, status, startDate}        │                        │
   │                                │
   ├─ Store in localStorage
   ├─ Show success message
   └─ Redirect to /dashboard
```

### Webhook Flow

```
Stripe                    Backend                   Frontend
  │                          │                          │
  ├─ Subscription created    │                          │
  ├─ Webhook POST ────────>  │                          │
  │                          ├─ Verify signature
  │                          ├─ Update subscription
  │                          ├─ Send confirmation email
  │                          ├─ Log event
  │                          │
  │<─ Webhook received ──────┤
  │     (200 OK)             │
  │                          ├─ Notify frontend (optional)
  │                          │  push notification, email
  │                          └─ Update analytics
```

---

## Error Handling Flows

### Payment Error

```
User fills form
   ↓
Click "Subscribe"
   ↓
Payment Processing... ⏳
   ↓
Error: "card_declined"
   ↓
Show error message: "Your card was declined.
                     Please check your details."
   ↓
User retries
   ↓
Success ✅
```

### Validation Error

```
User clicks "Subscribe"
   ↓
Check: Email filled? ❌
   ↓
Show error: "Please fill in all fields"
   ↓
Form stays open
   ↓
User enters email
   ↓
Click "Subscribe" again
   ↓
Success ✅
```

### Network Error

```
Click "Subscribe"
   ↓
POST request fails ❌
   ↓
Show error: "Network error. Check connection
             and try again."
   ↓
User checks connection
   ↓
Click "Subscribe" again
   ↓
Success ✅
```

---

## Responsive Design Breakdown

### Mobile (< 640px)

```
┌─────────────────┐
│  Landing Page   │
│                 │
│ ┌─────────────┐ │
│ │ Basic Card  │ │
│ │ $49/month   │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Standard    │ │
│ │ $129/3mo    │ │
│ │ [Most Pop]  │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Premium     │ │
│ │ $299/year   │ │
│ └─────────────┘ │
│                 │
└─────────────────┘
```

### Tablet (640px - 1024px)

```
┌─────────────────────────────┐
│     Landing Page            │
│                             │
│ ┌──────────┐ ┌──────────┐  │
│ │ Basic    │ │ Standard │  │
│ │ $49/mo   │ │ $129/3mo │  │
│ └──────────┘ └──────────┘  │
│                             │
│ ┌──────────┐                │
│ │ Premium  │                │
│ │ $299/yr  │                │
│ └──────────┘                │
│                             │
└─────────────────────────────┘
```

### Desktop (> 1024px)

```
┌───────────────────────────────────────┐
│        Landing Page                   │
│                                       │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ Basic   │ │Standard │ │ Premium │ │
│ │$49/month│ │$129/3mo │ │$299/year│ │
│ │         │ │[Most]   │ │         │ │
│ │[Button] │ │[Button] │ │[Button] │ │
│ └─────────┘ └─────────┘ └─────────┘ │
│                                       │
└───────────────────────────────────────┘
```

---

## Key State Transitions

### Pricing Page State Machine

```
[LOADING_PLANS]
     │
     ├─ User NOT logged in
     │  │
     │  └──> Click "Get Started"
     │       └─> [REDIRECT_TO_SIGNUP]
     │
     ├─ User logged in
     │  │
     │  └──> Click "Get Started"
     │       └─> [CHECKOUT_OPEN]
     │           │
     │           ├─ User fills form
     │           │  └─> [FORM_FILLED]
     │           │
     │           ├─ User clicks "Subscribe"
     │           │  └─> [PROCESSING] ⏳
     │           │
     │           ├─ Payment succeeds
     │           │  └─> [SUCCESS] ✅
     │           │      └─> [REDIRECT_TO_DASHBOARD]
     │           │
     │           └─ Payment fails
     │              └─> [ERROR_SHOWN]
     │                 └─> [CHECKOUT_OPEN] (retry)
     │
     └─> [CLOSED]
```

---

## Summary

This visual guide shows:

- Complete user journey from landing to subscription
- Component hierarchy and data flow
- Form states and transitions
- Error handling flows
- Responsive design layouts
- API communication patterns
- localStorage structure
- Payment processing flow

All components are interconnected and follow React best practices for state management and side effects.
