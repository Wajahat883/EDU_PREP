# EduPrep Platform - UWorld-Style Exam Preparation SaaS

A comprehensive, full-stack exam preparation platform built with modern technologies for high-stakes exam preparation (USMLE, NCLEX, SAT, ACT, CPA, etc.).

## 📋 Project Overview

**Architecture:** Microservices with Next.js frontend, Express.js services, MongoDB database  
**Tech Stack:** Next.js, React, Express.js, MongoDB, Tailwind CSS, Docker, GitHub Actions  
**Timeline:** 8 months to MVP  
**Budget:** $90k-$150k

## 🏗️ Architecture

```
eduprep-platform/
├── frontend/                 # Next.js + React + Tailwind CSS
├── services/
│   ├── auth-service/        # JWT authentication, OAuth
│   ├── qbank-service/       # Question Bank management
│   ├── test-engine-service/ # Test execution, scoring
│   ├── analytics-service/   # Performance tracking, reports
│   └── payment-service/     # Stripe integration, subscriptions
├── shared/                  # Shared utilities, types
├── docker-compose.yml
├── .github/workflows/       # CI/CD pipelines
└── docs/
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- MongoDB (local or Atlas)
- Stripe account (for payments)

### Setup Development Environment

```bash
# Clone repository
git clone <repo-url>
cd eduprep-platform

# Install dependencies
npm install

# Start services with Docker Compose
docker-compose up -d

# Run migrations
npm run migrate

# Start frontend dev server
cd frontend && npm run dev

# Start services (in separate terminals)
cd services/auth-service && npm run dev
cd services/qbank-service && npm run dev
# ... etc
```

### Environment Variables

Create `.env.local` in each service:

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_KEY=pk_test_...

# Services
DATABASE_URL=mongodb://localhost:27017/eduprep
JWT_SECRET=your-secret-key
STRIPE_SECRET=sk_test_...
REDIS_URL=redis://localhost:6379
```

## 📦 Core Features

### Phase 1: Foundation (Weeks 1-8)

- [x] Authentication & User Management
- [x] Question Bank (1000+ questions)
- [x] Dashboard & User Interface
- [x] Test Engine (Tutor & Timed modes)
- [x] Payment Integration

### Phase 2: Enhancement (Weeks 9-16)

- [ ] Rich Explanations with Media
- [ ] Flashcard System
- [ ] Study Planner
- [ ] Analytics Dashboard
- [ ] Mobile Responsive Design

### Phase 3: Intelligence (Weeks 17-22)

- [ ] Adaptive Learning Algorithm
- [ ] Advanced Analytics
- [ ] Mock Exams
- [ ] Admin CMS

### Phase 4: Scale (Weeks 23-32)

- [ ] Multi-exam Support
- [ ] Institutional Dashboard
- [ ] Mobile App (React Native)
- [ ] Community Features

## 🏢 Microservices

### Auth Service

- User registration & login
- JWT token management
- OAuth integration (Google, Apple)
- Role-based access control

**Port:** 3001

### QBank Service

- Question management
- Subject/topic organization
- Full-text search
- Media handling

**Port:** 3002

### Test Engine Service

- Session management
- Question delivery
- Answer scoring
- Timer management

**Port:** 3003

### Analytics Service

- Performance tracking
- Progress calculation
- Trend analysis
- Peer comparison

**Port:** 3004

### Payment Service

- Subscription management
- Stripe integration
- Invoice generation
- Billing workflows

**Port:** 3005

## 🗄️ Database Schema

### Collections

- **users** - User accounts, profiles
- **subscriptions** - Subscription management
- **exam_types** - Exam definitions
- **questions** - Question bank
- **study_sessions** - User study history
- **user_progress** - Answer tracking
- **flashcards** - Spaced repetition
- **performance_analytics** - Aggregated metrics
- **invoices** - Billing records

## 🔐 Security

- JWT authentication with refresh tokens
- Argon2id password hashing
- HTTPS enforcement
- Rate limiting per IP
- SQL injection protection (parameterized queries)
- XSS protection (CSP headers)
- CSRF token validation
- Data encryption at rest

## 🚢 Deployment

### Local Development

```bash
docker-compose up
```

### Staging

```bash
docker-compose -f docker-compose.staging.yml up
```

### Production

- AWS ECS/Kubernetes
- RDS PostgreSQL (Multi-AZ)
- ElastiCache Redis
- CloudFront CDN
- Route 53 DNS

## 📊 Monitoring & Logging

- **APM:** New Relic / Datadog
- **Logging:** ELK Stack
- **Error Tracking:** Sentry
- **Uptime:** Pingdom
- **Alerts:** PagerDuty integration

## 📈 Key Metrics

| Metric                               | Target  |
| ------------------------------------ | ------- |
| API Response Time (p99)              | < 500ms |
| Error Rate                           | < 0.5%  |
| Test Completion Rate                 | 80%+    |
| Conversion Rate (Free→Paid)          | 15-20%  |
| Monthly Active Users (Month 12)      | 3,000+  |
| Monthly Recurring Revenue (Month 12) | $150k+  |

## 📚 API Documentation

See [API_DOCS.md](./docs/API_DOCS.md) for complete endpoint documentation.

## 🤝 Contributing

1. Create feature branch (`git checkout -b feature/feature-name`)
2. Commit changes (`git commit -am 'Add feature'`)
3. Push to branch (`git push origin feature/feature-name`)
4. Create Pull Request

## 📝 License

Proprietary - All rights reserved

## 📞 Support

- Email: support@eduprep.io
- Discord: [Join Community](https://discord.gg/eduprep)
- Docs: [https://docs.eduprep.io](https://docs.eduprep.io)

---

**Version:** 1.0.0  
**Last Updated:** January 28, 2025  
**Maintainer:** EduPrep Platform Team
