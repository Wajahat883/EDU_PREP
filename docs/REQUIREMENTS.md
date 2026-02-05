# Implementation Requirements & Specifications

## Project Overview

**EduPrep Platform** is a comprehensive exam preparation system modeled after UWorld, featuring:

- Adaptive learning based on performance
- Question bank with 10,000+ questions
- Practice exams and custom test sessions
- Real-time analytics and progress tracking
- Spaced repetition flashcards
- Peer review system for quality control
- Subscription-based revenue model

## 1. Functional Requirements

### 1.1 User Management

#### FR-1.1.1: User Registration

- **Description**: New users can create accounts
- **Input**: Email, password, first name, last name
- **Validation**:
  - Email must be unique and valid format
  - Password minimum 8 characters, 1 uppercase, 1 number, 1 special char
  - Names must be 2-50 characters
- **Output**: JWT tokens (access + refresh)
- **Auth Service**: POST /api/auth/register

#### FR-1.1.2: User Login

- **Description**: Existing users can authenticate
- **Input**: Email, password
- **Validation**: Credentials match stored record
- **Output**: JWT tokens (access: 15min, refresh: 7 days)
- **Rate Limit**: 5 attempts per 15 minutes
- **Auth Service**: POST /api/auth/login

#### FR-1.1.3: User Profile Management

- **Description**: Users can view and update profile information
- **Allowed Updates**: First name, last name, phone, timezone, avatar
- **Restrictions**: Cannot change email or role via API
- **Auth Service**: GET/PUT /api/auth/profile

#### FR-1.1.4: Role-Based Access Control

- **Roles**: Student, Instructor, Admin
- **Permissions**:
  - **Student**: Take exams, view own analytics
  - **Instructor**: Create questions, review submissions, view student progress
  - **Admin**: System administration, user management, financial reporting

### 1.2 Question Bank

#### FR-1.2.1: Question Management

- **Supported Question Types**: MCQ, True/False, Multiple Select
- **Question Metadata**:
  - Stem (text + optional media)
  - Options (4-5 per question)
  - Explanation (LaTeX support for equations)
  - Difficulty level (1-10 scale)
  - Bloom's level (Remember, Understand, Apply, Analyze, Evaluate, Create)
  - Subject and topic classification
  - Learning objectives
  - Tags (for categorization)
- **Operations**:
  - View questions with filters (exam, subject, difficulty, tags)
  - Search questions via Elasticsearch
  - Access explanations after answer submission
- **QBank Service**: GET /api/questions, GET /api/questions/:id

#### FR-1.2.2: Bulk Question Import

- **Input Format**: CSV/JSON with question data
- **Process**: Validate, deduplicate, import
- **Output**: Import report with success/failure counts
- **Admin Only**: Yes
- **QBank Service**: POST /api/questions/bulk

#### FR-1.2.3: Question Flagging & Errata

- **Functionality**: Users can flag questions with issues
- **Instructor Review**: Instructors review and resolve flags
- **Status Tracking**: Flagged, Under Review, Resolved
- **QBank Service**: POST/GET /api/questions/:id/flags

### 1.3 Exam Sessions

#### FR-1.3.1: Session Creation

- **Input**: Exam type, subject filters, question count, mode (timed/tutor/untimed)
- **Process**:
  - Select questions matching filters
  - Initialize timer if timed mode
  - Return first question batch
- **Output**: Session ID, questions array
- **Test Engine Service**: POST /api/sessions

#### FR-1.3.2: Answer Submission

- **Input**: Session ID, question ID, selected option, time spent
- **Validation**:
  - Question exists in session
  - Option is valid
  - Session is still active
- **Process**:
  - Record answer with timestamp
  - In tutor mode: provide explanation immediately
  - In timed mode: show only question count
- **Output**: Confirmation, optionally explanation
- **Test Engine Service**: POST /api/sessions/:sessionId/answer

#### FR-1.3.3: Session Completion

- **Input**: Session ID
- **Process**:
  - Calculate score (correct/total)
  - Calculate accuracy per subject
  - Generate detailed report
  - Update user statistics
  - Send to Analytics Service
- **Output**: Score, breakdown by subject, comparison to peers
- **Test Engine Service**: POST /api/sessions/:sessionId/complete

#### FR-1.3.4: Session History

- **Functionality**: Users can view past session results
- **Data**: Date, exam type, score, time spent, subject breakdown
- **Filtering**: By date range, exam type, score range
- **Test Engine Service**: GET /api/sessions

### 1.4 Analytics & Progress Tracking

#### FR-1.4.1: Performance Summary

- **Metrics**:
  - Total questions answered
  - Overall accuracy
  - Questions per day trend
  - Accuracy by subject
  - Streak (current + best)
  - Predicted pass probability
- **Update Frequency**: Real-time after each session
- **Analytics Service**: GET /api/progress/summary

#### FR-1.4.2: Performance Trends

- **Time Period**: Last 7/30/90/365 days
- **Data Points**: Date, accuracy, questions answered
- **Visualization**: Chart-ready format
- **Analytics Service**: GET /api/progress/trends?days=30

#### FR-1.4.3: Weak Area Identification

- **Process**: Analyze accuracy by subject and topic
- **Threshold**: Areas with <60% accuracy marked as weak
- **Recommendations**: Suggest focused practice
- **Analytics Service**: GET /api/progress/recommendations

#### FR-1.4.4: Comparative Analytics

- **Comparison**: User vs class average vs all users
- **Percentile Ranking**: Show user percentile
- **Privacy**: Anonymized comparison data
- **Analytics Service**: GET /api/progress/comparison

### 1.5 Learning Tools

#### FR-1.5.1: Flashcard System

- **Creation**: Auto-created from missed questions
- **Spaced Repetition**: SM-2 algorithm
- **States**: Learning, Review, Mastered
- **Daily Review Queue**: Personalized schedule
- **Test Engine Service**: GET/POST /api/flashcards

#### FR-1.5.2: Study Sessions

- **Modes**:
  - **Focused**: By specific topic/subject
  - **Adaptive**: Difficulty adjusts based on performance
  - **Untimed**: For learning without pressure
  - **Timed**: With exam-like timer
- **Features**:
  - Progress indicator
  - Pause/resume capability
  - Hint system
  - Notes functionality
- **Test Engine Service**: POST /api/sessions with mode parameter

### 1.6 Subscription & Payments

#### FR-1.6.1: Subscription Plans

- **Basic** ($49/month): 5 exams/month, basic analytics
- **Plus** ($129/3 months): 20 exams, advanced analytics, flashcards
- **Ultimate** ($299/year): Unlimited, coaching, priority support
- **Free Trial**: 7 days full access
- **Payment Service**: GET /api/plans

#### FR-1.6.2: Payment Processing

- **Provider**: Stripe
- **Process**:
  1. Get subscription plan
  2. Create Stripe checkout session
  3. User completes payment
  4. Webhook updates subscription status
  5. Grant access to features
- **Payment Service**: POST /api/checkout, POST /webhooks/stripe

#### FR-1.6.3: Subscription Management

- **Operations**: Upgrade, downgrade, cancel
- **Billing Cycle**: Aligned with subscription period
- **Cancellation**: Effective at period end
- **Payment Service**: PUT /api/subscriptions/:id

#### FR-1.6.4: Invoice Generation

- **Trigger**: Payment received
- **Content**: Plan details, amount, period, tax
- **Delivery**: Email to user
- **Storage**: Database for download
- **Payment Service**: GET /api/invoices

### 1.7 Content Management (Admin)

#### FR-1.7.1: Question Creation Workflow

- **Steps**:
  1. Content creator drafts question
  2. Peer review (2 instructors)
  3. Admin approval
  4. Publication
- **Status Tracking**: Draft → Review → Approved → Published
- **QBank Service**: POST /api/admin/questions

#### FR-1.7.2: Question Editing

- **Allowed Changes**:
  - Options and correct answer
  - Explanation
  - Tags and metadata
- **Restriction**: Cannot change difficulty after 100+ attempts
- **Version Control**: Keep edit history
- **QBank Service**: PUT /api/admin/questions/:id

#### FR-1.7.3: Bulk Operations

- **Operations**: Import, update, publish, archive
- **Validation**: Check for duplicates, missing fields
- **Report**: Success/failure summary
- **QBank Service**: POST /api/admin/questions/bulk

#### FR-1.7.4: Content Analytics

- **Metrics**: Questions created, reviewed, approved
- **Performance**: Question difficulty accuracy, flag rates
- **Contributors**: Top creators by count and quality
- **QBank Service**: GET /api/admin/analytics

### 1.8 Notifications

#### FR-1.8.1: Email Notifications

- **Events**:
  - Account creation welcome email
  - Payment receipt
  - Subscription renewal reminder
  - Weekly performance summary
  - Weak area alerts
- **Provider**: SendGrid
- **Frequency**: Configurable per user

#### FR-1.8.2: In-App Notifications

- **Types**: Achievements, recommendations, messages
- **Storage**: Real-time via WebSocket + persistent in DB
- **Mark as Read**: User can dismiss

## 2. Non-Functional Requirements

### 2.1 Performance

| Metric                  | Target  | Threshold |
| ----------------------- | ------- | --------- |
| Page Load Time (P95)    | < 2s    | < 3s      |
| API Response Time (P95) | < 500ms | < 1s      |
| Search Response (P95)   | < 500ms | < 1s      |
| Question Load           | < 100ms | < 200ms   |
| Database Query          | < 50ms  | < 100ms   |
| Concurrent Users        | 10,000+ | 5,000+    |
| Requests/sec            | 1,000+  | 500+      |

### 2.2 Availability & Reliability

- **Uptime SLA**: 99.9% (excluding planned maintenance)
- **RTO**: 1 hour (Recovery Time Objective)
- **RPO**: 15 minutes (Recovery Point Objective)
- **Maintenance Window**: Sundays 2-4 AM (US Eastern)
- **Data Backup**: Daily automated snapshots
- **Failover**: Automatic with < 5 minute recovery

### 2.3 Security

#### FR-2.3.1: Authentication

- **Method**: JWT with RS256 signing
- **Access Token**: 15 minutes expiration
- **Refresh Token**: 7 days expiration
- **OAuth**: Google and GitHub integration
- **Multi-Factor Auth**: Email OTP on login

#### FR-2.3.2: Authorization

- **Model**: Role-Based Access Control (RBAC)
- **Policy Enforcement**: Per-endpoint checks
- **Resource-Level**: Verify ownership before access

#### FR-2.3.3: Data Protection

- **Encryption in Transit**: TLS 1.3
- **Encryption at Rest**: AES-256 for sensitive fields
- **PII Handling**: Minimal collection, encrypted storage
- **Data Retention**: Delete after 365 days if requested

#### FR-2.3.4: API Security

- **Rate Limiting**: 100 req/min per user, 1000/min per IP
- **CORS**: Whitelist specific origins
- **CSRF**: Token-based protection on state-changing requests
- **Input Validation**: Server-side validation required
- **Output Encoding**: Prevent XSS attacks

#### FR-2.3.5: Infrastructure Security

- **Network**: VPC isolation, security groups
- **DDoS Protection**: AWS WAF
- **Vulnerability Scanning**: Weekly automated scans
- **Secrets Management**: AWS Secrets Manager
- **Audit Logging**: All access attempts logged

### 2.4 Scalability

#### FR-2.4.1: Horizontal Scaling

- **Stateless Services**: All microservices stateless
- **Load Balancing**: Round-robin with health checks
- **Database Sharding**: By userId for analytics
- **Cache Distribution**: Redis cluster

#### FR-2.4.2: Vertical Optimization

- **Database Indexing**: Optimal query performance
- **Query Caching**: Redis with 1-hour TTL
- **Connection Pooling**: 50 connections per service
- **Compression**: gzip for API responses

### 2.5 Usability

- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile Responsive**: Works on all devices (320px+)
- **Browser Support**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Load Time**: < 3 seconds on 4G
- **Dark Mode**: Supported with preference detection

### 2.6 Maintainability

- **Code Standards**: TypeScript strict mode, ESLint
- **Documentation**: Inline comments for complex logic
- **Testing**: Minimum 70% code coverage
- **CI/CD**: Automated tests before merge
- **Monitoring**: Structured logging, error tracking

## 3. Technical Specifications

### 3.1 Architecture

- **Pattern**: Microservices with API Gateway
- **Communication**: HTTP REST + WebSocket
- **Containerization**: Docker + Kubernetes
- **Database**: MongoDB per service (database per service pattern)
- **Cache**: Redis cluster
- **Search**: Elasticsearch for full-text search

### 3.2 Technology Stack

**Frontend**

- Next.js 14, React 18, TypeScript
- Tailwind CSS, Zustand, React Query
- Stripe.js for payments

**Backend**

- Node.js 18+, Express.js, TypeScript
- MongoDB 7.0, Redis 7, Elasticsearch 8.10
- JWT, bcryptjs, Joi validation
- Jest for testing

**DevOps**

- Docker, Docker Compose, Kubernetes
- GitHub Actions for CI/CD
- AWS (ECS, RDS, ElastiCache, S3, CloudFront, CloudWatch)

### 3.3 Database Schema

#### Users Collection (auth-service)

```
{
  _id: ObjectId,
  email: String (unique),
  passwordHash: String,
  firstName: String,
  lastName: String,
  role: Enum [student, instructor, admin],
  emailVerified: Boolean,
  phone: String,
  timezone: String,
  avatar: String,
  preferences: {
    notifications: Boolean,
    darkMode: Boolean
  },
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Questions Collection (qbank-service)

```
{
  _id: ObjectId,
  examTypeId: String,
  subjectId: String,
  questionType: Enum [mcq, true_false, multi_select],
  stemText: String,
  stemMedia: String (URL),
  options: [{
    label: String,
    text: String,
    explanation: String,
    isCorrect: Boolean
  }],
  explanationText: String,
  difficulty: Number (1-10),
  bloomLevel: String,
  learningObjective: ObjectId,
  tags: [String],
  isActive: Boolean,
  createdBy: String,
  reviewedBy: String,
  version: Number,
  statistics: {
    attempts: Number,
    averageTime: Number,
    correctPercentage: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Sessions Collection (test-engine-service)

```
{
  _id: ObjectId,
  userId: ObjectId,
  examTypeId: String,
  mode: Enum [timed, tutor, untimed],
  status: Enum [active, completed, paused],
  startedAt: Date,
  completedAt: Date,
  duration: Number (minutes),
  questions: [ObjectId],
  answers: [{
    questionId: ObjectId,
    selectedOption: String,
    isCorrect: Boolean,
    timeSpent: Number (seconds)
  }],
  score: {
    correct: Number,
    total: Number,
    percentage: Number,
    bySubject: {}
  }
}
```

### 3.4 API Response Format

```typescript
// Success Response
{
  status: 'success' | 'error',
  data: T,
  pagination?: {
    page: number,
    limit: number,
    total: number
  },
  timestamp: ISO8601
}

// Error Response
{
  status: 'error',
  message: string,
  code: string,
  details?: object,
  path: string,
  timestamp: ISO8601
}
```

### 3.5 Authentication Flow

```
1. User submits email + password
2. Auth Service verifies credentials
3. JWT tokens generated (access + refresh)
4. Tokens sent to client
5. Client stores tokens in localStorage
6. Subsequent requests include Bearer token in Authorization header
7. API Gateway validates token with Auth Service
8. Token expiry: 15 min access, 7 day refresh
```

## 4. Acceptance Criteria

### Phase 1: MVP (Week 1-8)

- [ ] User registration and login
- [ ] Basic question bank (1,000+ questions)
- [ ] Single exam session type
- [ ] Basic analytics (accuracy, count)
- [ ] Free tier subscription
- [ ] Docker setup with 3+ services

### Phase 2: Feature Complete (Week 9-16)

- [ ] All question types supported
- [ ] Multiple exam modes (timed/tutor/untimed)
- [ ] Advanced analytics with trends
- [ ] Flashcard system with spaced repetition
- [ ] All subscription tiers
- [ ] Payment processing (Stripe)
- [ ] Elasticsearch integration
- [ ] Email notifications

### Phase 3: Polish & Scale (Week 17+)

- [ ] Admin CMS for content management
- [ ] Peer review system
- [ ] Mobile app (React Native/Flutter)
- [ ] Social features (leaderboards, groups)
- [ ] AI-powered recommendations
- [ ] Kubernetes deployment
- [ ] 99.9% uptime achieved

---

**Document Version**: 1.0  
**Last Updated**: January 28, 2025  
**Status**: Active Development
