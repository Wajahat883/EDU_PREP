/\*\*

- Database Configuration Setup
- Location: services/payment-service/docs/DATABASE_SETUP.md
-
- Instructions for setting up and managing the payment service database
  \*/

# Payment Service Database Setup

## Overview

The Payment Service uses MongoDB to store subscription, invoice, payment, and payment method data. This document covers database setup, schema design, and management.

## Database Schema

### Collections

#### 1. subscriptions

Stores subscription information for users

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  stripePriceId: String,
  planId: String,
  status: String, // "active", "past_due", "unpaid", "canceled", "incomplete", "incomplete_expired"
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean,
  canceledAt: Date,
  trialStart: Date,
  trialEnd: Date,
  metadata: Map,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- userId
- stripeCustomerId
- stripeSubscriptionId
- planId
- status
- createdAt

#### 2. invoices

Stores payment invoices

```javascript
{
  _id: ObjectId,
  stripeInvoiceId: String,
  stripeCustomerId: String,
  subscriptionId: ObjectId,
  amount: Number, // in cents
  currency: String,
  status: String, // "paid", "pending", "failed", "void"
  createdAt: Date,
  paidAt: Date,
  dueDate: Date,
  periodStart: Date,
  periodEnd: Date,
  pdfUrl: String,
  metadata: Map
}
```

**Indexes:**

- stripeInvoiceId
- stripeCustomerId
- status
- createdAt
- paidAt

#### 3. payments

Stores individual payment records

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  stripePaymentIntentId: String,
  amount: Number, // in cents
  currency: String,
  status: String, // "succeeded", "processing", "requires_action", "requires_payment_method", "canceled"
  paymentMethod: String,
  description: String,
  metadata: Map,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- stripePaymentIntentId
- userId
- status
- createdAt

#### 4. paymentmethods

Stores saved payment methods

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  stripePaymentMethodId: String,
  type: String, // "card", "bank_account"
  brand: String, // "visa", "mastercard", etc.
  lastFour: String,
  expMonth: Number,
  expYear: Number,
  isDefault: Boolean,
  billingDetails: {
    name: String,
    email: String,
    phone: String,
    address: {
      country: String,
      state: String,
      city: String,
      postalCode: String
    }
  },
  metadata: Map,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- stripePaymentMethodId
- userId
- isDefault

#### 5. webhookevents

Stores Stripe webhook event logs

```javascript
{
  _id: ObjectId,
  stripeEventId: String,
  eventType: String,
  eventData: Object,
  processed: Boolean,
  processedAt: Date,
  error: String,
  createdAt: Date
}
```

**Indexes:**

- stripeEventId
- eventType
- createdAt

## Setup Instructions

### 1. Local Development

```bash
# Start MongoDB locally
mongod

# Or using Docker
docker run -d \
  --name eduprep-mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -p 27017:27017 \
  mongo:7.0

# Connect to MongoDB
mongo -u admin -p password

# Create payment service database
use eduprep_payment
```

### 2. Run Migrations

```bash
cd services/payment-service

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Run migrations
npm run migrate

# Verify collections were created
npm run migrate:status
```

### 3. Database Backup

```bash
# Create backup
npm run db:backup

# Restore from backup
npm run db:restore
```

## Connection Strings

### Development

```
mongodb://admin:password@localhost:27017/eduprep_payment
```

### Production (Atlas)

```
mongodb+srv://username:password@cluster.mongodb.net/eduprep_payment?retryWrites=true&w=majority
```

## Performance Optimization

### 1. Index Strategy

All collections have appropriate indexes on:

- Query fields (userId, stripeIds)
- Filter fields (status, planId)
- Sort fields (createdAt)

### 2. Query Optimization

```javascript
// Good - uses indexes
db.subscriptions.find({ userId: "...", status: "active" })

// Bad - full collection scan
db.subscriptions.find({ metadata.planName: "basic" })
```

### 3. Connection Pooling

MongoDB driver automatically manages connection pools. Default settings:

- Min pool size: 10
- Max pool size: 100
- Max idle time: 45 seconds

## Maintenance

### Weekly Tasks

- Monitor slow query logs
- Verify backup completion
- Check disk space

### Monthly Tasks

- Analyze index performance
- Clean up old webhook events (older than 90 days)
- Review database statistics

### Quarterly Tasks

- Full database optimization (`db.collection.reIndex()`)
- Capacity planning
- Security audit

## Disaster Recovery

### Backup Strategy

- Daily automated backups to Atlas
- Weekly backups to S3
- Point-in-time restore capability (35 days)

### Recovery Procedures

```bash
# Check backup status
aws s3 ls s3://eduprep-backups/payment-service/

# Restore specific backup
npm run db:restore --backup=backup_2026_02_04
```

## Monitoring

### Key Metrics to Monitor

- Connection count
- Query latency (p99)
- Oplog lag (replication)
- Index efficiency
- Disk I/O

### Alerts to Configure

- Connection pool exhaustion
- Query latency > 500ms
- Replication lag > 10s
- Disk usage > 80%
- Failed backups

## Data Retention Policies

- **Subscriptions**: Keep permanently (audit trail)
- **Invoices**: Keep for 7 years (tax requirement)
- **Payments**: Keep for 7 years (audit trail)
- **Webhook Events**: Keep for 90 days (debugging)
- **Payment Methods**: Delete on request or 1 year after last use

## Compliance & Security

### Encryption

- TLS 1.2+ for transmission
- Encryption at rest (MongoDB Enterprise or Atlas M10+)

### Access Control

- Role-based authentication
- IP whitelist enabled
- Audit logging enabled

### Data Privacy

- PII encrypted in payment methods
- Stripe-hosted sensitive data (card numbers)
- GDPR compliance: Data export/deletion on request

## Troubleshooting

### Connection Issues

```bash
# Check connection string
mongostat --uri="mongodb://admin:password@localhost:27017/eduprep_payment"

# Check replica set status
rs.status()
```

### Slow Queries

```bash
# Enable profiling
db.setProfilingLevel(1, { slowms: 100 })

# View profiling data
db.system.profile.find({ millis: { $gt: 100 } }).sort({ ts: -1 })
```

### Disk Space Issues

```bash
# Check collection sizes
db.subscriptions.stats()

# Remove old webhook events
db.webhookevents.deleteMany({ createdAt: { $lt: new Date(Date.now() - 90*24*60*60*1000) } })
```

## References

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Mongoose Documentation](https://mongoosejs.com/)
