# Complete Payment Flow Documentation

## Overview

This document provides step-by-step details of the complete payment flow implemented for the EduPrep platform.

---

## Feature 1: Landing Page Pricing Section

### Location: `frontend/pages/index.tsx`

### What's Displayed:

- **Section Title**: "Simple, Transparent Pricing"
- **Section Subtitle**: "Choose the plan that works best for your exam preparation needs"
- **Three Pricing Cards**:

#### Basic Plan

- **Price**: $49/month
- **Description**: "Perfect for exploring the platform"
- **Features**:
  - ✓ Unlimited question access
  - ✓ Basic analytics
  - ✓ Practice exams
  - ✓ Mobile access
  - ✗ Advanced analytics (grayed out)
  - ✗ Flashcard system (grayed out)
  - ✗ AI study recommendations (grayed out)
  - ✗ Priority support (grayed out)

#### Standard Plan (MOST POPULAR)

- **Price**: $129/3 months
- **Description**: "Best for serious exam preparation"
- **Badge**: "Most Popular" (highlighted in blue)
- **Visual**: Larger shadow, slightly scaled up
- **Features**:
  - ✓ All Basic features
  - ✓ Advanced analytics & trends
  - ✓ Flashcard system with spaced repetition
  - ✓ AI-powered study recommendations
  - ✓ Priority support
  - ✓ Mock exams (limited)
  - ✗ Video explanations (grayed out)
  - ✗ 1-on-1 tutoring (grayed out)

#### Premium Plan

- **Price**: $299/year
- **Description**: "Complete study solution with support"
- **Features**:
  - ✓ All Standard features
  - ✓ Lifetime access to content
  - ✓ Unlimited mock exams
  - ✓ Video explanations
  - ✓ 1-on-1 tutoring sessions
  - ✓ Certificate of completion
  - ✓ Offline mode

### CTA Button:

- **Text**: "Get Started"
- **Link Destination**: `/pricing`
- **Styling**:
  - Basic & Premium: Outlined button (gray background)
  - Standard: Filled button (blue background)

### Hover Effects:

- Cards lift slightly (transform: translateY(-4px))
- Shadow increases
- Scale effect on Standard plan to make it stand out

---

## Feature 2: Pricing Page

### Location: `frontend/pages/pricing.tsx`

### When User Clicks "Get Started":

#### If User NOT Logged In:

1. Redirect to `/signup`
2. After signup, user can proceed to checkout
3. Email field is auto-filled from user account

#### If User IS Logged In:

1. Open checkout dialog
2. Email field is pre-filled and disabled
3. User fills in card details
4. Payment processed

### Checkout Dialog Contents:

```
┌─────────────────────────────────────┐
│ Complete Your Subscription - BASIC  │
├─────────────────────────────────────┤
│                                     │
│ 📧 Email                            │
│ [user@example.com] (disabled)       │
│                                     │
│ 💳 Card Number                      │
│ [4111 1111 1111 1111]               │
│                                     │
│ MM/YY          CVV                  │
│ [12/25]        [123]                │
│                                     │
│ 🔒 Your payment is secure and       │
│    encrypted. We do not store full  │
│    credit card details.             │
│                                     │
├─────────────────────────────────────┤
│           [Cancel]  [Subscribe]     │
└─────────────────────────────────────┘
```

### Payment Processing:

1. **Validation**:
   - Email: Required
   - Card Number: Required (16 digits)
   - Expiry: Required (MM/YY format)
   - CVV: Required (3 digits)

2. **On Submit**:
   - Show loading spinner
   - Disable all buttons
   - Send POST request to `/api/payments/subscribe`

3. **Request Body**:

```json
{
  "tierId": "basic",
  "email": "user@example.com",
  "paymentMethod": {
    "card": {
      "number": "4111111111111111",
      "exp_month": 12,
      "exp_year": 2025,
      "cvc": "123"
    }
  }
}
```

4. **Success Response**:
   - Close dialog
   - Show success message: "Successfully subscribed to [TIER]! Redirecting to dashboard..."
   - Store in localStorage:

```json
{
  "tierId": "basic",
  "startDate": "2024-01-15T10:30:00Z",
  "status": "active"
}
```

- Wait 2 seconds
- Redirect to `/dashboard`

5. **Error Response**:
   - Show error message with details
   - Keep dialog open
   - Allow user to retry

---

## Feature 3: Upgrade Page

### Location: `frontend/pages/upgrade.tsx`

### Access:

- **URL**: `/upgrade`
- **Auth Required**: Yes
- **Unauthenticated users**: Redirected to `/login`

### Display:

#### Current Plan Display:

- Shows current plan with green checkmark
- Displays "Your Current Plan" badge
- Prevents selecting same plan

#### All Plans Available:

- Shows all three plans (Basic, Standard, Premium)
- Standard marked as "Most Popular"
- Cards are interactive and hoverable

#### Benefits Section:

Shows 3-column layout:

1. 📊 Advanced Analytics
2. 🎯 AI-Powered Learning
3. 🏆 Complete Preparation

### Upgrade Flow:

1. **User selects new tier**: "Choose Plan" button
2. **Dialog opens**:

```
┌──────────────────────────────────┐
│ Upgrade to Standard              │
├──────────────────────────────────┤
│                                  │
│ ℹ️ Upgrade your plan to unlock   │
│    premium features instantly.   │
│                                  │
│ 💳 Card Number                   │
│ [4111 1111 1111 1111]            │
│                                  │
│ MM/YY          CVV               │
│ [12/25]        [123]             │
│                                  │
│ 🔒 Your payment is secure...     │
│                                  │
├──────────────────────────────────┤
│      [Cancel]  [Upgrade]         │
└──────────────────────────────────┘
```

3. **API Call**: POST `/api/payments/upgrade`
4. **Success**:
   - Update localStorage subscription
   - Show success message
   - Redirect to dashboard after 2 seconds
5. **Note**: Pricing shows monthly equivalent on upgrade page

---

## Feature 4: Dashboard Subscription Display

### Location: `frontend/pages/dashboard.tsx`

### Subscription Status Card (Top of Page):

#### If Subscribed:

```
┌──────────────────────────────────────────────┐
│                                              │
│ 📊 Standard Plan                             │
│ Standard subscription active                 │
│                                              │
│ ✓ All Basic features                        │
│ ✓ Advanced analytics & trends               │
│ ✓ Flashcard system with spaced... (4 total) │
│                                              │
│ 87 days remaining in your subscription       │
│                                              │
│         [Upgrade Plan]  [Manage]            │
│                                              │
└──────────────────────────────────────────────┘
```

#### If No Subscription:

```
┌──────────────────────────────────────────────┐
│ ⚠️  No Active Subscription                   │
│                                              │
│ Upgrade to unlock premium features and      │
│ unlimited question access.                   │
│                                  [Choose Plan]
└──────────────────────────────────────────────┘
```

### Progress Overview Section:

Shows 3 cards:

1. **Total Questions Answered**: 4,320 (if subscribed) / 0 (if not)
2. **Overall Accuracy**: 72.5% (if subscribed) / N/A (if not)
3. **Current Streak**: 5 days (if subscribed) / 0 days (if not)

### Plan Features Display:

Only shows if user has active subscription:

```
┌────────────────────────┐
│ ✓ Unlimited question   │
│ ✓ Basic analytics      │
│ ✓ Practice exams       │
│ ✓ Mobile access        │
└────────────────────────┘
```

### Quick Actions Section:

Buttons are:

- **ENABLED** if user has subscription
- **DISABLED** if user doesn't have subscription
- Disabled buttons have 50% opacity

### Study Plan Section:

Only visible if user has subscription
Shows daily study targets and progress

---

## Feature 5: Content Access Control

### Dashboard:

```typescript
// Quick actions disabled if no subscription
<button disabled={!subscription} className={!subscription ? "opacity-50" : ""}>
  Create New Test
</button>

// Study plan only shows if subscribed
{subscription && (
  <section>
    <h2>Today's Study Plan</h2>
    {/* Content */}
  </section>
)}
```

### Question Bank (Future):

- Free: Sample questions (50)
- Basic: Tier-specific questions
- Standard: All Basic + Standard exclusive
- Premium: All questions including exclusive

### Features by Tier:

**BASIC ($49/month)**:

- ✓ 5,000 questions (tier-limited)
- ✓ Basic analytics (basic charts only)
- ✓ Practice exams (3 per month)
- ✓ Mobile access
- ✓ Email support

**STANDARD ($129/3 months)**:

- ✓ 8,000 questions (tier-limited)
- ✓ Advanced analytics (heatmaps, trends)
- ✓ Flashcard system (unlimited)
- ✓ AI study recommendations
- ✓ Practice exams (10 per month)
- ✓ Priority email support

**PREMIUM ($299/year)**:

- ✓ 10,000+ questions (all)
- ✓ Advanced analytics + custom reports
- ✓ Flashcard system (advanced)
- ✓ AI learning path
- ✓ Unlimited mock exams
- ✓ Video explanations
- ✓ 1-on-1 tutoring (10 hrs/month)
- ✓ 24/7 priority support
- ✓ Offline mode
- ✓ Certificate of completion

---

## localStorage Schema

### currentSubscription

```json
{
  "tierId": "standard",
  "startDate": "2024-01-15T10:30:00Z",
  "status": "active",
  "expiryDate": "2024-04-15T10:30:00Z"
}
```

### User Auth Data

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

## Error Handling

### Network Errors:

```
"Payment failed: Network error. Please check your connection and try again."
```

### Payment Declined:

```
"Payment failed: Your card was declined. Please check your card details and try again."
```

### Invalid Card:

```
"Please fill in all fields"
```

### Server Errors:

```
"Payment failed: [error message from server]"
```

---

## Email Templates (Required Backend)

### New Subscription:

```
Subject: Welcome to EduPrep [TIER] Plan!

Hi [NAME],

Your subscription to the [TIER] plan is now active.

Plan Details:
- Tier: [TIER]
- Price: $[PRICE]/[INTERVAL]
- Expires: [DATE]

You now have access to:
- [Feature 1]
- [Feature 2]
- ...

Start studying: https://eduprep.com/dashboard

Questions? Contact support@eduprep.com

Thank you,
EduPrep Team
```

### Upgrade Confirmation:

```
Subject: Your EduPrep Plan Has Been Upgraded!

Hi [NAME],

You've successfully upgraded to the [NEW_TIER] plan.

Previous Plan: [OLD_TIER]
New Plan: [NEW_TIER]
Upgrade Date: [DATE]
Prorated Credit: $[AMOUNT]

Your new features include:
- [Feature 1]
- [Feature 2]
- ...

Explore your new features: https://eduprep.com/dashboard

Thank you,
EduPrep Team
```

---

## Testing Scenarios

### Scenario 1: First-time Purchase (Not Logged In)

1. User lands on homepage
2. Scrolls to pricing section
3. Clicks "Get Started" on Standard plan
4. Redirected to /signup
5. Completes signup
6. Back to pricing page (automatically redirected)
7. Email field auto-filled
8. Enters card info
9. Clicks "Subscribe"
10. Success message shown
11. Redirected to dashboard
12. Dashboard shows Standard plan with all features

### Scenario 2: Upgrade Existing Subscription

1. User with Basic subscription logs in
2. Goes to /upgrade
3. Current plan (Basic) shows with checkmark
4. Clicks "Choose Plan" on Standard
5. Checkout dialog opens
6. Enters new card (or uses saved one)
7. Clicks "Complete Upgrade"
8. Success message
9. Dashboard updates to show Standard
10. New features now accessible

### Scenario 3: View Subscription Status

1. User with subscription logs in
2. Goes to dashboard
3. Top card shows:
   - Current plan name
   - Days remaining
   - Plan features (first 4 listed)
   - Upgrade/Manage buttons
4. Features section shows all included features
5. Progress cards show data

### Scenario 4: No Subscription

1. User logs in (no subscription)
2. Goes to dashboard
3. Orange alert shows "No Active Subscription"
4. "Choose Plan" button redirects to /pricing
5. Progress cards show "N/A" or "0"
6. Quick action buttons disabled
7. Study plan section hidden

---

## Summary

The complete payment flow provides:

✅ **Transparent Pricing**: Same pricing shown everywhere
✅ **Smart Routing**: Different flows for auth/non-auth users
✅ **Secure Checkout**: Form validation and error handling
✅ **Subscription Management**: View, upgrade, cancel subscriptions
✅ **Feature Access Control**: Content gated by subscription tier
✅ **User-Friendly**: Clear messaging and visual feedback
✅ **Mobile Responsive**: Works on all device sizes
✅ **Error Handling**: Comprehensive error messages
✅ **Data Persistence**: localStorage for offline support

All components are ready for backend integration with your Stripe payment processor and subscription management system.
