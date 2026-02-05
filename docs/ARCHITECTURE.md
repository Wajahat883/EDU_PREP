# System Architecture

## Overview

EduPrep Platform is a microservices-based exam preparation system with the following architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                    Next.js Frontend (Port 3000)                   │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐                │
│  │  Dashboard │  │  QBank     │  │  Analytics  │                │
│  │   Pages    │  │  Browser   │  │ Dashboards  │                │
│  └────────────┘  └────────────┘  └─────────────┘                │
│  - React Components (TypeScript)                                 │
│  - Zustand State Management                                      │
│  - React Query Data Fetching                                     │
│  - Tailwind CSS Styling                                          │
│  - Stripe Payment Integration                                    │
└──────────┬──────────────────────────────────────────────────────┘
           │
           │ HTTPS REST API Calls
           │ (JWT Bearer Token Auth)
           │
┌──────────┴──────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                            │
│                  (NGINX Reverse Proxy / ALB)                     │
│                                                                   │
│  - Request routing to microservices                              │
│  - SSL/TLS termination                                           │
│  - Rate limiting                                                 │
│  - CORS headers                                                  │
└──┬─────┬─────┬─────┬─────┬────────────────────────────────────┘
   │     │     │     │     │
   │     │     │     │     │
┌──▼──┐┌─▼──┐┌─▼──┐┌─▼──┐┌─▼──┐
│AUTH ││QBNK││TEST││ALNC││PAYM│
│SVC  ││SVC ││SVC ││SVC ││SVC │
│3001 ││3002││3003││3004││3005│
└──┬──┘└─┬──┘└─┬──┘└─┬──┘└─┬──┘
   │     │     │     │     │
   └──────┴─────┴─────┴─────┘
           │
┌──────────┴────────────────────────────────────┐
│        MICROSERVICES COMMUNICATION LAYER       │
│         (HTTP REST / Service Mesh)             │
│                                                │
│  Service-to-service communication via network │
│  Docker network in local, K8s network in prod │
└──────────┬────────────────────────────────────┘
           │
┌──────────┴────────────────────────────────────┐
│          DATA PERSISTENCE LAYER                │
├────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────┐  ┌────────┐ │
│  │  MongoDB     │  │  Redis     │  │ Elastic│ │
│  │  (Primary DB)│  │  (Cache)   │  │ search │ │
│  │              │  │            │  │ (Search)│ │
│  └──────────────┘  └────────────┘  └────────┘ │
└────────────────────────────────────────────────┘
```

## Microservices

### 1. Authentication Service (Port 3001)

**Responsibilities:**

- User registration and login
- JWT token generation and validation
- OAuth integration
- Role-based access control (RBAC)
- User profile management

**Technology Stack:**

- Express.js
- MongoDB for user storage
- JWT for tokens
- Bcrypt for password hashing
- Redis for token blacklisting

**Endpoints:**

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- GET /api/auth/me
- PUT /api/auth/profile

### 2. Question Bank Service (Port 3002)

**Responsibilities:**

- Manage exam questions and metadata
- Full-text search capabilities
- Question categorization
- Question statistics tracking
- Bulk question import

**Technology Stack:**

- Express.js
- MongoDB for question storage
- Elasticsearch for full-text search
- Redis for caching popular questions
- Cloudinary for media storage

**Endpoints:**

- GET /api/questions (with filters)
- GET /api/questions/:id
- GET /api/questions/:id/explanation
- POST /api/questions/bulk (admin)
- PUT /api/questions/:id (admin)
- DELETE /api/questions/:id (admin)

### 3. Test Engine Service (Port 3003)

**Responsibilities:**

- Create and manage exam sessions
- Accept student answers
- Calculate scores and feedback
- Manage time constraints
- Generate detailed results

**Technology Stack:**

- Express.js
- MongoDB for session storage
- Redis for active session caching
- WebSocket for real-time updates

**Endpoints:**

- POST /api/sessions
- GET /api/sessions/:id
- POST /api/sessions/:id/answer
- POST /api/sessions/:id/complete
- GET /api/sessions/:id/results

### 4. Analytics Service (Port 3004)

**Responsibilities:**

- Track student performance metrics
- Generate performance trends
- Identify weak areas
- Predict exam success probability
- Generate reports

**Technology Stack:**

- Express.js
- MongoDB for analytics data
- Redis for caching calculations
- Time-series data analysis

**Endpoints:**

- GET /api/progress/summary
- GET /api/progress/trends
- GET /api/performance/by-subject
- GET /api/performance/comparison
- GET /api/reports/custom

### 5. Payment Service (Port 3005)

**Responsibilities:**

- Manage subscription plans
- Process payments via Stripe
- Handle billing cycles
- Generate invoices
- Manage refunds

**Technology Stack:**

- Express.js
- MongoDB for subscription storage
- Stripe API integration
- SendGrid for email notifications

**Endpoints:**

- GET /api/plans
- POST /api/checkout
- POST /api/webhooks/stripe
- GET /api/subscriptions/:id
- PUT /api/subscriptions/:id/cancel

## Data Model

### Collections Structure

```
┌─────────────────────────────────────────────────────┐
│  auth-service-db                                    │
├─────────────────────────────────────────────────────┤
│  - users (userId, email, passwordHash, role...)     │
│  - refresh_tokens (tokenId, userId, expiresAt)      │
│  - oauth_tokens (tokenId, userId, provider, token)  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  qbank-service-db                                   │
├─────────────────────────────────────────────────────┤
│  - questions (questionId, examType, difficulty...)  │
│  - exam_types (examTypeId, name, format...)         │
│  - question_tags (tagId, questions[], name)         │
│  - learning_objectives (objId, subject, content)    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  test-engine-db                                     │
├─────────────────────────────────────────────────────┤
│  - sessions (sessionId, userId, status, answers)    │
│  - answers (answerId, sessionId, questionId, time)  │
│  - submissions (submissionId, sessionId, result)    │
│  - flashcards (cardId, userId, questionId, status)  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  analytics-service-db                               │
├─────────────────────────────────────────────────────┤
│  - performance_data (dataId, userId, metrics...)    │
│  - subject_performance (recordId, userId, subject)  │
│  - daily_stats (statId, date, userId, stats)       │
│  - predictions (predictionId, userId, probability)  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  payment-service-db                                 │
├─────────────────────────────────────────────────────┤
│  - subscriptions (subId, userId, plan, status)      │
│  - invoices (invoiceId, userId, amount, date)       │
│  - billing_history (recordId, userId, transaction)  │
│  - stripe_events (eventId, type, timestamp)         │
└─────────────────────────────────────────────────────┘
```

## Deployment Architecture

### Local Development

```
Docker Host
├── MongoDB Container (Port 27017)
├── Redis Container (Port 6379)
├── Elasticsearch Container (Port 9200)
├── Auth Service Container (Port 3001)
├── QBank Service Container (Port 3002)
├── Test Engine Service Container (Port 3003)
├── Analytics Service Container (Port 3004)
├── Payment Service Container (Port 3005)
└── Next.js Frontend Dev Server (Port 3000)
```

### Production (AWS ECS)

```
AWS Region (us-east-1)
├── ALB (Load Balancer)
│   ├── Listener 80 → 443
│   └── Target Groups
│       ├── Auth Service (Port 3001)
│       ├── QBank Service (Port 3002)
│       ├── Test Engine Service (Port 3003)
│       ├── Analytics Service (Port 3004)
│       └── Payment Service (Port 3005)
│
├── ECS Cluster
│   ├── Auth Service Tasks (Desired: 2, Min: 1, Max: 10)
│   ├── QBank Service Tasks (Desired: 2, Min: 1, Max: 10)
│   ├── Test Engine Service Tasks (Desired: 3, Min: 2, Max: 20)
│   ├── Analytics Service Tasks (Desired: 2, Min: 1, Max: 5)
│   └── Payment Service Tasks (Desired: 2, Min: 1, Max: 5)
│
├── RDS (Managed MongoDB Atlas)
│   ├── 3 Replica Set
│   ├── Automatic Backups
│   └── Multi-AZ Deployment
│
├── ElastiCache (Redis)
│   ├── Redis Cluster Mode Enabled
│   └── 3 Shards for high availability
│
├── Elasticsearch Service
│   ├── 3 Nodes
│   ├── Auto-scaling enabled
│   └── Index snapshots to S3
│
├── S3 Buckets
│   ├── Static assets
│   ├── Question media
│   ├── Elasticsearch backups
│   └── Logs
│
├── CloudFront Distribution
│   └── Static assets caching
│
└── CloudWatch
    ├── Metrics & Alarms
    ├── Logs
    └── Dashboards
```

### Production (Kubernetes)

```
Kubernetes Cluster
├── Namespace: eduprep
│
├── Deployments
│   ├── auth-service (Replicas: 3)
│   ├── qbank-service (Replicas: 3)
│   ├── test-engine-service (Replicas: 4)
│   ├── analytics-service (Replicas: 2)
│   ├── payment-service (Replicas: 2)
│   └── frontend (Replicas: 2)
│
├── Services (Headless/NodePort)
│   ├── auth-service-svc (Port 3001)
│   ├── qbank-service-svc (Port 3002)
│   ├── test-engine-service-svc (Port 3003)
│   ├── analytics-service-svc (Port 3004)
│   └── payment-service-svc (Port 3005)
│
├── Ingress (NGINX Ingress Controller)
│   └── Routes to services via domain
│
├── StatefulSets
│   ├── MongoDB Replica Set
│   ├── Redis Cluster
│   └── Elasticsearch Cluster
│
├── ConfigMaps
│   ├── service-endpoints
│   ├── database-config
│   └── feature-flags
│
├── Secrets
│   ├── jwt-secret
│   ├── database-credentials
│   ├── stripe-keys
│   └── oauth-credentials
│
├── PersistentVolumes & PersistentVolumeClaims
│   ├── MongoDB data
│   ├── Elasticsearch data
│   └── Redis data
│
└── HorizontalPodAutoscalers (HPA)
    ├── Auth Service (min: 2, max: 10)
    ├── QBank Service (min: 2, max: 10)
    ├── Test Engine Service (min: 3, max: 20)
    ├── Analytics Service (min: 2, max: 8)
    └── Payment Service (min: 2, max: 5)
```

## Data Flow Examples

### User Registration Flow

```
1. Client submits registration form
   └─> POST /api/auth/register (Name, Email, Password)

2. Auth Service validates input
   └─> Check if email exists
   └─> Hash password with bcrypt
   └─> Create user document in MongoDB

3. Return response with JWT tokens
   └─> accessToken (15 min)
   └─> refreshToken (7 days)

4. Client stores tokens in localStorage
   └─> All subsequent requests include JWT in Authorization header
```

### Exam Session Flow

```
1. User starts exam
   └─> POST /api/sessions
       ├─> examTypeId, subjectFilters, questionCount
       └─> Test Engine creates session in MongoDB
       └─> Returns sessionId + first question batch

2. User selects answer and submits
   └─> POST /api/sessions/{sessionId}/answer
       ├─> questionId, selectedOption, timeSpent
       └─> Test Engine validates answer
       └─> Updates session in MongoDB
       └─> Sends analytics event to Analytics Service

3. User completes exam
   └─> POST /api/sessions/{sessionId}/complete
       ├─> Test Engine calculates score
       ├─> Stores results in MongoDB
       └─> Triggers Analytics Service to update performance metrics

4. Frontend displays results
   └─> Accuracy percentage, correct count, breakdown by subject
```

### Search Flow

```
1. User searches for questions
   └─> GET /api/questions?query=DNA&exam=MCAT&difficulty=hard

2. QBank Service receives request
   └─> Elasticsearch query on question index
   └─> Applies filters (exam type, difficulty)
   └─> Returns matching questions with relevance score

3. Results cached in Redis
   └─> 1 hour TTL
   └─> Subsequent similar requests served from cache
```

## Security Architecture

### Authentication

- **JWT-based authentication**
- Access tokens: 15 minutes
- Refresh tokens: 7 days
- Token rotation on refresh
- Token blacklisting for logout

### Authorization

- Role-based access control (RBAC)
- Roles: Student, Instructor, Admin
- Permission checking on protected endpoints
- Resource-level authorization

### Data Security

- HTTPS/TLS encryption in transit
- MongoDB encryption at rest
- Sensitive data encrypted in database
- PII masking in logs

### Network Security

- Service-to-service communication via secure channels
- VPC isolation in cloud
- Security groups/Network policies
- DDoS protection via WAF

## Performance Architecture

### Caching Strategy

1. **Browser Cache**
   - Static assets: 1 year
   - API responses: variable

2. **Redis Cache**
   - Popular questions: 24 hours
   - Search results: 1 hour
   - User sessions: Session duration
   - Analytics data: 1 hour

3. **CDN Cache**
   - Static assets via CloudFront
   - TTL: 1 month

### Database Optimization

- Indexes on frequently queried fields
- Connection pooling
- Query optimization
- Data pagination
- Denormalization where appropriate

### API Optimization

- Response compression (gzip)
- Request/response caching headers
- Pagination for large datasets
- Field filtering (select specific fields)
- Rate limiting to prevent abuse

## Monitoring & Observability

### Metrics

- Request latency (p50, p95, p99)
- Error rates by endpoint
- CPU/Memory usage per service
- Database connection pool status
- Cache hit/miss ratios

### Logging

- Structured JSON logging
- Centralized log aggregation (ELK Stack)
- Log retention: 30 days
- Sensitive data redaction

### Tracing

- Distributed tracing (Jaeger)
- Trace context propagation across services
- End-to-end request tracking

### Alerting

- High error rate (>5%)
- High latency (p95 > 500ms)
- Service down (health check failed)
- Database connection issues
- Payment processing failures

## Disaster Recovery

### RTO & RPO Targets

- **RTO (Recovery Time Objective)**: 1 hour
- **RPO (Recovery Point Objective)**: 15 minutes

### Backup Strategy

- Database: Automated daily snapshots
- Code: GitHub multi-region
- Artifacts: S3 with versioning
- Configuration: Version controlled

### Failover Strategy

- Load balancer health checks
- Service auto-restart on failure
- Database replica failover
- Cache warming procedures

---

**Last Updated**: January 28, 2025
