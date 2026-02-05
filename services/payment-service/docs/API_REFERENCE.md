/\*\*

- Payment Service API Documentation
- Location: services/payment-service/docs/API_REFERENCE.md
-
- Complete API endpoint reference for payment operations
  \*/

# Payment Service API Reference

## Base URL

```
Development: http://localhost:3005/api/payments
Production: https://api.eduprep.com/api/payments
```

## Authentication

All endpoints (except `/plans` and `/webhook`) require JWT authentication via `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

---

## Endpoints

### 1. Get Available Plans

**Endpoint:** `GET /plans`

**Authentication:** Not required

**Description:** Get all subscription plans and pricing

**Query Parameters:** None

**Response:**

```json
{
  "plans": [
    {
      "id": "basic",
      "name": "Basic",
      "description": "Get started with essential features",
      "price": 49,
      "interval": "month",
      "stripePriceId": "price_basic_monthly",
      "features": [
        {
          "name": "2,000 practice questions",
          "included": true
        },
        {
          "name": "Basic analytics",
          "included": true
        },
        {
          "name": "Flashcard system",
          "included": false
        }
      ]
    },
    ...
  ]
}
```

**Status Codes:**

- `200 OK`

---

### 2. Create Subscription

**Endpoint:** `POST /subscribe`

**Authentication:** Required

**Description:** Create a new subscription for the authenticated user

**Request Body:**

```json
{
  "tierId": "basic",
  "paymentMethodId": "pm_card_visa"
}
```

**Parameters:**

- `tierId` (string, required): One of `basic`, `standard`, `premium`
- `paymentMethodId` (string, required): Stripe payment method ID

**Response:**

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

**Status Codes:**

- `201 Created`: Subscription created successfully
- `400 Bad Request`: Missing or invalid parameters
- `401 Unauthorized`: Missing or invalid authentication
- `409 Conflict`: User already has active subscription
- `500 Internal Server Error`: Server error

**Errors:**

```json
{
  "error": "Missing required fields: tierId, paymentMethodId",
  "code": "MISSING_FIELDS"
}
```

---

### 3. Upgrade Subscription

**Endpoint:** `POST /upgrade`

**Authentication:** Required

**Description:** Upgrade existing subscription to higher tier

**Request Body:**

```json
{
  "newTierId": "standard"
}
```

**Parameters:**

- `newTierId` (string, required): Target tier (`basic`, `standard`, `premium`)

**Response:**

```json
{
  "success": true,
  "subscription": {
    "id": "507f1f77bcf86cd799439011",
    "stripeSubscriptionId": "sub_1234567890",
    "status": "active",
    "planId": "standard",
    "currentPeriodStart": "2026-02-04T10:30:00Z",
    "currentPeriodEnd": "2026-05-04T10:30:00Z"
  }
}
```

**Status Codes:**

- `200 OK`: Subscription upgraded
- `400 Bad Request`: Invalid tier or already on that tier
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: No active subscription
- `500 Internal Server Error`: Server error

**Errors:**

```json
{
  "error": "Already subscribed to this tier",
  "code": "SAME_TIER"
}
```

---

### 4. Get Current Subscription

**Endpoint:** `GET /subscription`

**Authentication:** Required

**Description:** Retrieve authenticated user's current subscription

**Query Parameters:** None

**Response:**

```json
{
  "subscription": {
    "id": "507f1f77bcf86cd799439011",
    "planId": "standard",
    "status": "active",
    "currentPeriodStart": "2026-02-04T10:30:00Z",
    "currentPeriodEnd": "2026-05-04T10:30:00Z",
    "cancelAtPeriodEnd": false
  }
}
```

**Possible Statuses:**

- `active`: Subscription is active
- `past_due`: Payment failed, retry in progress
- `unpaid`: Payment unpaid
- `canceled`: Subscription canceled
- `incomplete`: Incomplete setup
- `incomplete_expired`: Incomplete setup expired

**Status Codes:**

- `200 OK`: Subscription retrieved
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: No subscription found
- `500 Internal Server Error`: Server error

---

### 5. Cancel Subscription

**Endpoint:** `POST /cancel`

**Authentication:** Required

**Description:** Cancel user's subscription

**Request Body:**

```json
{
  "immediate": false
}
```

**Parameters:**

- `immediate` (boolean, optional, default: `false`)
  - `false`: Cancel at end of billing period (graceful)
  - `true`: Cancel immediately

**Response:**

```json
{
  "success": true,
  "message": "Subscription will be canceled at the end of the billing period",
  "subscription": {
    "id": "507f1f77bcf86cd799439011",
    "status": "canceled",
    "canceledAt": "2026-02-04T10:35:00Z"
  }
}
```

**Status Codes:**

- `200 OK`: Cancellation initiated
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: No active subscription
- `500 Internal Server Error`: Server error

---

### 6. Get Invoices

**Endpoint:** `GET /invoices`

**Authentication:** Required

**Description:** Get user's payment invoices

**Query Parameters:**

- `limit` (number, optional, default: `10`): Max results to return
- `offset` (number, optional, default: `0`): Pagination offset

**Response:**

```json
{
  "invoices": [
    {
      "id": "in_1234567890",
      "amount": 4900,
      "currency": "usd",
      "status": "paid",
      "createdAt": "2026-02-04T10:30:00Z",
      "pdfUrl": "https://invoices.stripe.com/...",
      "number": "INV-001",
      "periodStart": "2026-02-04T10:30:00Z",
      "periodEnd": "2026-03-04T10:30:00Z"
    },
    ...
  ],
  "total": 5
}
```

**Status Codes:**

- `200 OK`: Invoices retrieved
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: No subscription found
- `500 Internal Server Error`: Server error

---

### 7. Stripe Webhook

**Endpoint:** `POST /webhook`

**Authentication:** Webhook signature verification

**Description:** Handles Stripe webhook events

**Headers:**

```
stripe-signature: t=timestamp,v1=signature
```

**Supported Events:**

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end`

**Response:**

```json
{
  "received": true
}
```

**Status Codes:**

- `200 OK`: Event processed
- `400 Bad Request`: Invalid signature
- `500 Internal Server Error`: Processing error

---

## Error Codes Reference

| Code                  | HTTP Status | Description                           |
| --------------------- | ----------- | ------------------------------------- |
| `MISSING_FIELDS`      | 400         | Required fields missing               |
| `INVALID_TIER`        | 400         | Invalid subscription tier             |
| `SAME_TIER`           | 400         | Attempting to upgrade to current tier |
| `UNAUTHORIZED`        | 401         | Missing or invalid authentication     |
| `NO_SUBSCRIPTION`     | 404         | No subscription found                 |
| `SUBSCRIPTION_EXISTS` | 409         | User already has active subscription  |
| `SUBSCRIPTION_ERROR`  | 500         | Subscription creation failed          |
| `UPGRADE_ERROR`       | 500         | Subscription upgrade failed           |
| `CANCEL_ERROR`        | 500         | Subscription cancellation failed      |
| `INVOICES_ERROR`      | 500         | Failed to retrieve invoices           |
| `INTERNAL_ERROR`      | 500         | Internal server error                 |

---

## Request Examples

### Create Subscription with cURL

```bash
curl -X POST http://localhost:3005/api/payments/subscribe \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "tierId": "standard",
    "paymentMethodId": "pm_1234567890"
  }'
```

### Upgrade Subscription with JavaScript

```javascript
const response = await fetch("http://localhost:3005/api/payments/upgrade", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    newTierId: "premium",
  }),
});

const data = await response.json();
```

### Get Invoices with Python

```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.get(
    'http://localhost:3005/api/payments/invoices',
    headers=headers
)

data = response.json()
print(data['invoices'])
```

---

## Rate Limiting

- **Limit**: 100 requests per minute per user
- **Header**: `X-RateLimit-Remaining`
- **Exceeded**: Returns `429 Too Many Requests`

---

## Pagination

For endpoints returning multiple items (invoices):

```
GET /invoices?limit=20&offset=0
```

- `limit`: Items per page (max 100)
- `offset`: Starting position

---

## Changelog

### v1.0.0 (2026-02-04)

- Initial release
- Subscription creation, upgrade, cancellation
- Invoice retrieval
- Webhook handling
