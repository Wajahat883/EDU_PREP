# Phase 2: Core Features Implementation Plan

## Overview

**Timeline**: 6-8 weeks (2-3 developers)  
**Goal**: Implement all core features from document.md to make MVP production-ready  
**Status**: Starting January 28, 2026

---

## Task 1: QBank Service Complete Routes

### Priority: HIGH (Critical Path)

### Duration: 3-4 days

### Prerequisites: None (Foundation complete)

#### 1.1 Question Filtering & Pagination

**File**: `services/qbank-service/src/routes/questions.routes.ts`

```typescript
// GET /api/questions?exam_type=MCAT&subject=Biology&difficulty=5&tags=chapter-1&limit=20&offset=0
router.get("/", async (req: Request, res: Response) => {
  const {
    exam_type,
    subject,
    difficulty_min,
    difficulty_max,
    tags,
    bloom_level,
    limit = 20,
    offset = 0,
  } = req.query;

  // Build MongoDB query
  // Apply indexes for performance
  // Return paginated results
});
```

**Requirements**:

- [ ] Filter by exam type
- [ ] Filter by subject
- [ ] Filter by difficulty range (1-10)
- [ ] Filter by tags (multiple)
- [ ] Filter by Bloom's level
- [ ] Pagination with limit/offset
- [ ] Cache results in Redis (1-hour TTL)
- [ ] Response includes total count

**Test Cases**:

- [ ] Valid filters return correct questions
- [ ] Invalid filters return error
- [ ] Pagination works correctly
- [ ] Cache hit/miss
- [ ] Performance < 500ms (P95)

#### 1.2 Full-Text Search with Elasticsearch

**File**: `services/qbank-service/src/services/search.service.ts` (new)

```typescript
export class SearchService {
  async indexQuestion(question: IQuestion): Promise<void> {
    // Index to Elasticsearch
  }

  async searchQuestions(
    query: string,
    filters?: SearchFilters,
  ): Promise<SearchResult[]> {
    // Full-text search on stem and explanations
    // Apply filters
    // Return ranked results
  }

  async bulkIndex(questions: IQuestion[]): Promise<void> {
    // Batch index for performance
  }
}
```

**Requirements**:

- [ ] Create Elasticsearch index mapping
- [ ] Index questions on creation
- [ ] Update index on edit
- [ ] Search on question stem
- [ ] Search on explanation text
- [ ] Highlight matching terms
- [ ] Rank by relevance
- [ ] Apply filters to search results
- [ ] Handle special characters

**Endpoint**: `GET /api/questions/search?q=mitosis&exam_type=MCAT`

#### 1.3 Bulk Question Import

**File**: `services/qbank-service/src/routes/admin.routes.ts` (new)

```typescript
// POST /api/admin/questions/bulk
// Body: CSV or JSON array of questions
router.post(
  "/questions/bulk",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    // Parse upload (CSV/JSON)
    // Validate each question
    // Check for duplicates
    // Insert into database
    // Index to Elasticsearch
    // Return import report
  },
);
```

**Requirements**:

- [ ] Accept CSV format (with headers)
- [ ] Accept JSON format
- [ ] Validate required fields
- [ ] Detect and prevent duplicates
- [ ] Transaction for atomicity
- [ ] Batch insert (1000 at a time)
- [ ] Index to Elasticsearch
- [ ] Generate detailed report
- [ ] Handle errors gracefully
- [ ] Maximum 10,000 questions per import

**Test Cases**:

- [ ] Valid CSV import succeeds
- [ ] Valid JSON import succeeds
- [ ] Invalid rows are reported
- [ ] Duplicate detection works
- [ ] Large imports (10k questions)
- [ ] Error handling

#### 1.4 Question Statistics & Performance Tracking

**File**: `services/qbank-service/src/models/Question.ts` (extend)

```typescript
statistics: {
  attempts: Number,          // Total times answered
  averageTime: Number,       // Average seconds
  correctPercentage: Number, // % answered correctly
  reportedIssues: Number,    // Flagged by users
  lastAttemptDate: Date,
  studentAccuracy: Map<String, Number> // Per-student tracking
}
```

**Updates needed**:

- [ ] Track each answer submission
- [ ] Calculate statistics after each submission
- [ ] Update in batch (Redis queue)
- [ ] Expose via API endpoint

**Endpoint**: `GET /api/questions/:id/statistics`

#### 1.5 Question Flagging & Errata System

**File**: `services/qbank-service/src/routes/questions.routes.ts`

```typescript
// POST /api/questions/:id/flags
router.post("/:id/flags", authenticate, async (req, res) => {
  // Create flag with reason
  // Store in database
  // Notify instructors
});

// GET /api/questions/:id/flags (instructor)
// PUT /api/questions/:id/flags/:flagId (instructor)
```

**Database Model**: `QuestionFlag`

```typescript
{
  _id: ObjectId,
  questionId: ObjectId,
  userId: ObjectId,
  reason: String, // "incorrect_answer", "unclear", "outdated", etc
  description: String,
  status: Enum, // "open", "under_review", "resolved"
  resolution: String,
  createdAt: Date
}
```

**Requirements**:

- [ ] Students can flag questions
- [ ] Instructors can view and respond
- [ ] Flag reasons (dropdown + custom)
- [ ] Resolution notes
- [ ] Notification system
- [ ] Flag count tracking
- [ ] Archive resolved flags

---

## Task 2: Test Engine Advanced Features

### Priority: HIGH

### Duration: 3-4 days

#### 2.1 Multiple Exam Modes

**Current**: Basic session support  
**Needed**: Three distinct modes

**Mode 1: Timed (Exam Mode)**

- Timer starts on first question
- Time limit enforced
- No pause option (strict)
- Show only question count (not answers)
- Results only after completion

**Mode 2: Tutor (Learning Mode)**

- No time limit
- Pause/resume allowed
- Show explanation after each answer
- Can revisit previous questions
- Adaptive difficulty

**Mode 3: Untimed (Review Mode)**

- No time limit
- Pause allowed
- Show explanations immediately
- Take notes
- Save for review

**Implementation**:

```typescript
interface Session {
  mode: "timed" | "tutor" | "untimed";
  timerDuration?: number; // minutes for timed mode
  isPaused: boolean;
  pausedAt?: Date;
  allowReview: boolean;
  showExplanations: boolean;
  showTimer: boolean;
}
```

**Endpoints**:

- [ ] `POST /api/sessions` - support mode parameter
- [ ] `GET /api/sessions/:id` - return mode-specific data
- [ ] `POST /api/sessions/:id/pause` - pause/resume
- [ ] `POST /api/sessions/:id/hint` - tutor mode hint

#### 2.2 Real-Time Timer with WebSocket

**File**: `services/test-engine-service/src/websocket.ts` (new)

```typescript
// WebSocket updates for timer
// broadcast(/sessions/:id/timer) every second
// Stop at 0 for timed mode
// Auto-submit if time expires
```

**Requirements**:

- [ ] Timer updates every second
- [ ] Sync across multiple tabs
- [ ] Auto-submit on time expiry
- [ ] Warning at 5/1 minute remaining
- [ ] Pause pauses timer
- [ ] Resume resumes timer

#### 2.3 Session Pause & Resume

```typescript
router.post("/:id/pause", authenticate, async (req, res) => {
  // Mark session as paused
  // Save state
  // Notify client
});

router.post("/:id/resume", authenticate, async (req, res) => {
  // Resume session
  // Restore state
  // Restart timer if needed
});
```

**Requirements**:

- [ ] Pause saves all state
- [ ] Resume restores exactly
- [ ] Can pause multiple times
- [ ] Pause limits (time before session expires)
- [ ] Database transaction safety

#### 2.4 Adaptive Difficulty

```typescript
// If user gets > 80% correct: increase difficulty
// If user gets < 40% correct: decrease difficulty
// Track difficulty changes in session
```

**Requirements**:

- [ ] Difficulty adjustment algorithm
- [ ] Progressive difficulty increase
- [ ] Dynamic question selection
- [ ] Track difficulty changes
- [ ] Report difficulty progression

#### 2.5 Hint System

**File**: `services/test-engine-service/src/routes/sessions.routes.ts`

```typescript
router.post("/:id/hint", authenticate, async (req, res) => {
  // In tutor mode only
  // Return hint for current question
  // Track hint usage
});
```

**Database Model**: Add to Question

```typescript
hints: [
  { level: 1, text: "First hint" },
  { level: 2, text: "More specific hint" },
  { level: 3, text: "Near answer" },
];
```

**Requirements**:

- [ ] 3-level hint system
- [ ] Track hints used per session
- [ ] Only in tutor mode
- [ ] Reveal progressively

---

## Task 3: Analytics Dashboard & Calculations

### Priority: HIGH

### Duration: 2-3 days

#### 3.1 Performance Calculations

**File**: `services/analytics-service/src/services/analytics.service.ts`

```typescript
export class AnalyticsService {
  async calculatePerformance(
    userId: string,
    timeframe: "week" | "month" | "year",
  ) {
    // Accuracy calculation
    // Streak calculation
    // Performance by subject
    // Performance by difficulty
    // Performance by type (MCQ, T/F, etc)
    // Predicted pass probability
  }
}
```

**Metrics to Calculate**:

- [ ] Total questions answered
- [ ] Overall accuracy (%)
- [ ] Current streak
- [ ] Best streak
- [ ] Accuracy by subject
- [ ] Accuracy by difficulty
- [ ] Accuracy by question type
- [ ] Average time per question
- [ ] Questions per day
- [ ] Improvement rate
- [ ] Weak subjects (< 60% accuracy)
- [ ] Predicted exam score

#### 3.2 Trend Analysis

**Endpoints**:

- `GET /api/progress/trends?days=7` - 7-day trend
- `GET /api/progress/trends?days=30` - 30-day trend
- `GET /api/progress/trends?days=90` - 90-day trend
- `GET /api/progress/trends?days=365` - 1-year trend

**Response Format**:

```typescript
[
  {
    date: "2026-01-28",
    questionsAnswered: 25,
    accuracy: 78.5,
    avgTime: 120,
    bySubject: {
      Biology: 85,
      Chemistry: 72,
      Physics: 75,
    },
  },
];
```

**Requirements**:

- [ ] Daily aggregation
- [ ] Weekly aggregation
- [ ] Monthly aggregation
- [ ] Subject-wise trends
- [ ] Difficulty-wise trends
- [ ] Cache results (1-hour TTL)
- [ ] Chart.js compatible format

#### 3.3 Comparative Analytics

**Endpoint**: `GET /api/progress/comparison`

**Returns**:

```typescript
{
  userAccuracy: 78.5,
  classAverage: 72.3,
  topPerformer: 95.0,
  percentile: 78, // vs all users
  strengths: ['Biology', 'Physics'],
  weaknesses: ['Chemistry'],
  recommendations: [
    'Focus on Chemistry fundamentals',
    'Practice more difficult questions'
  ]
}
```

**Requirements**:

- [ ] Compare to class average
- [ ] Percentile ranking
- [ ] Identify strengths
- [ ] Identify weaknesses
- [ ] Generate recommendations
- [ ] Privacy (anonymized data)

#### 3.4 Predictive Analytics

**Calculate**:

- [ ] Pass probability (based on accuracy + improvement)
- [ ] Estimated exam score
- [ ] Days needed to reach target
- [ ] Recommended daily study hours

**Formula**:

```
PassProbability = (CurrentAccuracy * 0.6) + (ImproementRate * 0.4)
```

---

## Task 4: Frontend Pages Expansion

### Priority: HIGH

### Duration: 4-5 days

#### 4.1 QBank Browser Page

**File**: `frontend/pages/qbank.tsx`

**Features**:

- [ ] Question list with filters
- [ ] Search bar with auto-complete
- [ ] Filter sidebar (exam, subject, difficulty, tags)
- [ ] Sort options (newest, difficulty, flags)
- [ ] Question card preview
- [ ] Click to view full question
- [ ] Pagination (20 per page)
- [ ] "Practice" button to start session
- [ ] Responsive design

**Components**:

- `components/QBankFilter.tsx` - Filter panel
- `components/QuestionCard.tsx` - Question preview
- `components/SearchBar.tsx` - Search with suggestions

#### 4.2 Analytics Dashboard Page

**File**: `frontend/pages/analytics.tsx`

**Sections**:

- [ ] Summary cards (accuracy, streak, questions)
- [ ] Performance trend chart (Chart.js)
- [ ] Subject-wise accuracy (pie chart)
- [ ] Difficulty distribution (bar chart)
- [ ] Time trends (line chart)
- [ ] Weak areas section
- [ ] Recommendations section
- [ ] Detailed metrics table

**Charts**:

- [ ] Line chart for accuracy trend
- [ ] Pie chart for subject breakdown
- [ ] Bar chart for difficulty levels
- [ ] Heat map for study consistency

#### 4.3 Pricing Page

**File**: `frontend/pages/pricing.tsx`

**Features**:

- [ ] 3 plan cards (Basic, Plus, Ultimate)
- [ ] Feature comparison table
- [ ] Pricing toggle (monthly/yearly)
- [ ] CTA buttons for each plan
- [ ] Free trial badge
- [ ] FAQ section
- [ ] Testimonials
- [ ] Security/guarantee badges

**Plans**:

- Basic: $49/mo, 5 exams/month, basic analytics
- Plus: $129/3mo, 20 exams, advanced analytics, flashcards
- Ultimate: $299/yr, unlimited, coaching, priority support

#### 4.4 Flashcard Interface Page

**File**: `frontend/pages/flashcards.tsx`

**Features**:

- [ ] Daily review count
- [ ] Card display (question/answer flip)
- [ ] Response buttons (Easy/Good/Hard/Again)
- [ ] Progress indicator
- [ ] Next review date
- [ ] Mastery level indicator
- [ ] Batch actions (mark all easy, etc)
- [ ] Filter by mastery level

#### 4.5 Admin Dashboard Page

**File**: `frontend/pages/admin/dashboard.tsx` (new)

**Admin-only sections**:

- [ ] Question management (CRUD)
- [ ] Question approval workflow
- [ ] User management
- [ ] Content analytics
- [ ] Revenue dashboard
- [ ] System health

---

## Task 5: Flashcard System Implementation

### Priority: MEDIUM

### Duration: 2-3 days

#### 5.1 Flashcard Model & Spaced Repetition

**File**: `services/test-engine-service/src/models/Flashcard.ts`

```typescript
interface Flashcard {
  _id: ObjectId;
  userId: ObjectId;
  questionId: ObjectId;
  sourceSession: ObjectId; // Where it came from

  // Spaced Repetition Data (SM-2 Algorithm)
  interval: number; // Days until next review
  easeFactor: number; // 1.3 - 2.5 (starts at 2.5)
  repetition: number; // How many times reviewed
  nextReviewDate: Date;

  // Performance
  masteryLevel: 0 | 1 | 2 | 3; // 0=Learning, 1=Reviewing, 2=Mastering, 3=Mastered
  correctStreak: number;
  lastReviewDate: Date;

  status: "active" | "suspended" | "retired";
  createdAt: Date;
}
```

#### 5.2 SM-2 Algorithm Implementation

```typescript
class SM2Algorithm {
  calculateNextReview(
    currentEaseFactor: number,
    currentInterval: number,
    quality: 0 | 1 | 2 | 3 | 4 | 5, // User response
  ): { interval: number; easeFactor: number } {
    // SM-2 formula implementation
    // quality: 0-2 = repeat, 3 = ok, 4-5 = easy

    if (quality < 3) {
      // Restart learning
      return { interval: 1, easeFactor: currentEaseFactor };
    }

    // Calculate new EF
    const EF = Math.max(
      1.3,
      currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    );

    // Calculate interval
    const interval =
      currentInterval === 1 ? 3 : Math.round(currentInterval * EF);

    return { interval, easeFactor: EF };
  }
}
```

#### 5.3 Flashcard Endpoints

```typescript
// GET /api/flashcards/daily - Get today's cards to review
router.get("/daily", authenticate, async (req, res) => {
  // Return cards due for review
  // Sort by priority
});

// POST /api/flashcards/:id/review - Record review
router.post("/:id/review", authenticate, async (req, res) => {
  // Quality rating: 0-5
  // Calculate next review date using SM-2
  // Update card
});

// GET /api/flashcards/stats - User flashcard stats
router.get("/stats", authenticate, async (req, res) => {
  // Cards in each mastery level
  // Daily review count
  // Average ease factor
});
```

#### 5.4 Auto-Creation from Missed Questions

```typescript
// After session completion
async function createFlashcardsFromSession(sessionId: string) {
  const session = await Session.findById(sessionId);

  for (const answer of session.answers) {
    if (!answer.isCorrect) {
      // Create flashcard for this question
      await Flashcard.create({
        userId: session.userId,
        questionId: answer.questionId,
        sourceSession: sessionId,
        interval: 1,
        easeFactor: 2.5,
        nextReviewDate: tomorrow(),
      });
    }
  }
}
```

---

## Task 6: Stripe Payment Processing & Webhooks

### Priority: HIGH

### Duration: 2-3 days

#### 6.1 Stripe Webhook Handlers

**File**: `services/payment-service/src/webhooks/stripe.ts`

```typescript
router.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    switch (event.type) {
      case "charge.succeeded":
        // Payment successful
        // Create subscription record
        // Grant access
        break;

      case "charge.failed":
        // Payment failed
        // Notify user
        break;

      case "customer.subscription.deleted":
        // Subscription cancelled
        // Revoke access
        break;

      case "invoice.paid":
        // Invoice payment successful
        // Generate invoice
        // Send email
        break;
    }
  },
);
```

#### 6.2 Subscription Model

```typescript
interface Subscription {
  _id: ObjectId;
  userId: ObjectId;
  planId: string; // "basic", "plus", "ultimate"
  stripeCustomerId: string;
  stripeSubscriptionId: string;

  status: "active" | "pending" | "past_due" | "cancelled";
  startDate: Date;
  expiryDate: Date;

  // Billing
  amount: number;
  currency: string;
  billingPeriod: "monthly" | "quarterly" | "yearly";

  // Auto-renew
  autoRenew: boolean;
  nextBillingDate: Date;

  // Cancellation
  cancelledAt?: Date;
  cancelReason?: string;
}
```

#### 6.3 Email Notifications

**File**: `services/payment-service/src/services/email.service.ts`

```typescript
class EmailService {
  async sendPaymentReceipt(userId: string, invoiceId: string) {
    // Get user email
    // Get invoice details
    // Send via SendGrid
  }

  async sendSubscriptionConfirmation(userId: string, plan: string) {
    // Subscription started email
  }

  async sendRenewalReminder(userId: string, expiryDate: Date) {
    // Renewal coming up
  }

  async sendCancellationConfirmation(userId: string) {
    // Subscription cancelled
  }
}
```

#### 6.4 Invoice Generation

```typescript
interface Invoice {
  _id: ObjectId;
  userId: ObjectId;
  subscriptionId: ObjectId;
  stripeInvoiceId: string;

  amount: number;
  currency: string;
  tax: number;
  total: number;

  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  issuedAt: Date;
  dueDate: Date;

  status: "draft" | "open" | "paid" | "uncollectible" | "void";

  pdfUrl?: string;
}
```

---

## Task 7: Email Notifications Integration

### Priority: MEDIUM

### Duration: 1-2 days

#### 7.1 SendGrid Integration

**File**: `services/payment-service/src/services/email.service.ts`

```typescript
import sgMail from "@sendgrid/mail";

class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async send(to: string, templateId: string, data: object) {
    await sgMail.send({
      to,
      from: "noreply@eduprep.com",
      templateId,
      dynamicTemplateData: data,
    });
  }
}
```

#### 7.2 Email Templates

Templates to create in SendGrid:

- [ ] Welcome email
- [ ] Payment receipt
- [ ] Subscription confirmation
- [ ] Weekly summary
- [ ] Weak area alert
- [ ] Renewal reminder
- [ ] Cancellation confirmation
- [ ] Password reset
- [ ] Account verification

#### 7.3 Notification Queue

**File**: `services/shared/src/queue/notification.queue.ts`

```typescript
import Queue from "bull";

const emailQueue = new Queue("emails", {
  redis: { url: process.env.REDIS_URL },
});

// Add to queue
await emailQueue.add({ to: email, templateId: "welcome" });

// Process queue
emailQueue.process(async (job) => {
  await emailService.send(job.data.to, job.data.templateId);
});
```

---

## Task 8: Admin CMS for Content Management

### Priority: MEDIUM

### Duration: 3-4 days

#### 8.1 Question Creation/Editing Interface

**File**: `frontend/pages/admin/questions/new.tsx`

**Features**:

- [ ] Form with question fields
- [ ] Rich text editor for stem
- [ ] Media upload
- [ ] Options editor (add/remove)
- [ ] Explanation editor with LaTeX
- [ ] Metadata (difficulty, tags, learning objectives)
- [ ] Preview before save
- [ ] Save as draft
- [ ] Submit for review

#### 8.2 Question Approval Workflow

**File**: `services/qbank-service/src/routes/admin.routes.ts`

```typescript
enum QuestionStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  IN_REVIEW = "in_review",
  APPROVED = "approved",
  PUBLISHED = "published",
  REJECTED = "rejected",
}

// GET /api/admin/questions/pending - Pending review
// PUT /api/admin/questions/:id/approve
// PUT /api/admin/questions/:id/reject
// PUT /api/admin/questions/:id/publish
```

#### 8.3 Content Analytics

**File**: `frontend/pages/admin/analytics.tsx`

**Metrics**:

- [ ] Questions created (by creator, over time)
- [ ] Questions reviewed (by reviewer)
- [ ] Approval rate
- [ ] Average time in review
- [ ] Question difficulty accuracy
- [ ] Most flagged questions
- [ ] Content quality score

#### 8.4 User Management

**File**: `frontend/pages/admin/users/index.tsx`

**Features**:

- [ ] List all users with filters
- [ ] View user details
- [ ] Search by email/name
- [ ] View user statistics
- [ ] Manually verify email
- [ ] Reset password
- [ ] Update subscription
- [ ] View activity log
- [ ] Ban/suspend user

---

## Task 9: Comprehensive Test Coverage

### Priority: MEDIUM (Throughout all tasks)

### Duration: Ongoing (2-3 days)

#### 9.1 Unit Tests

**For each service**:

- [ ] Service/business logic tests
- [ ] Middleware tests
- [ ] Model validation tests
- [ ] Utility function tests
- [ ] Error handling tests

**Example**: `services/analytics-service/src/__tests__/analytics.service.test.ts`

```typescript
describe("AnalyticsService", () => {
  describe("calculatePerformance", () => {
    it("should calculate accuracy correctly", async () => {
      const performance = await service.calculatePerformance(userId, "week");
      expect(performance.accuracy).toBeBetween(0, 100);
    });

    it("should handle no sessions", async () => {
      const performance = await service.calculatePerformance(
        "nonexistent",
        "week",
      );
      expect(performance.accuracy).toBe(0);
    });
  });
});
```

#### 9.2 Integration Tests

- [ ] End-to-end user flows
- [ ] API endpoint integration
- [ ] Database integration
- [ ] Service-to-service communication

**Example**: `services/payment-service/src/__tests__/payment.integration.test.ts`

#### 9.3 Frontend Component Tests

**Examples**:

- [ ] `frontend/__tests__/components/QBankFilter.test.tsx`
- [ ] `frontend/__tests__/components/AnalyticsChart.test.tsx`
- [ ] `frontend/__tests__/pages/pricing.test.tsx`

#### 9.4 Coverage Targets

- **Unit Tests**: 70%+ coverage
- **Integration Tests**: 50%+ coverage
- **E2E Tests**: Critical user flows (registration, exam, payment)

---

## Implementation Order & Dependencies

### Week 1-2: QBank & Test Engine

1. **Day 1-2**: QBank filtering & pagination (enables other features)
2. **Day 3-4**: Test Engine modes (needed for exams)
3. **Day 5**: Elasticsearch integration
4. **Day 6-7**: Question flagging & statistics

### Week 3-4: Analytics & Frontend

5. **Day 8-9**: Analytics calculations
6. **Day 10-11**: Frontend pages (QBank, Analytics, Pricing)
7. **Day 12**: Flashcards system
8. **Day 13-14**: Payment integration

### Week 5-6: Polish & Testing

9. **Day 15-16**: Admin CMS
10. **Day 17-18**: Email notifications
11. **Day 19-20**: Comprehensive tests
12. **Day 21**: Bug fixes & optimization

---

## Success Criteria

### Phase 2 Completion

- [ ] All 9 tasks completed
- [ ] 70%+ test coverage
- [ ] All endpoints functional
- [ ] 100+ feature requests handled
- [ ] Performance targets met:
  - API response < 500ms (P95)
  - Page load < 2s (P95)
  - Search < 500ms
- [ ] Zero critical bugs
- [ ] Documentation updated

### MVP Ready

- [ ] 5,000+ questions in bank
- [ ] 10+ exam sessions daily
- [ ] 100+ active users
- [ ] Payment processing live
- [ ] Analytics functional
- [ ] 99% uptime (30 days)

---

## Resource Requirements

### Development Team

- 2-3 backend developers
- 1-2 frontend developers
- 1 QA engineer
- 1 DevOps engineer (part-time)

### Infrastructure

- MongoDB Atlas (production)
- Redis Cloud
- Elasticsearch Cloud
- Stripe (payments)
- SendGrid (emails)
- GitHub Actions (CI/CD)
- AWS/GCP (deployment)

### Estimated Effort

- **Total Hours**: 400-500 hours
- **Cost**: $20,000-$30,000 (assuming $50-60/hour)
- **Duration**: 6-8 weeks (2-3 developers)

---

## Monitoring & Rollout

### Staging Deployment

- Deploy each feature to staging
- Run full test suite
- Performance testing
- Security testing

### Production Rollout

- Feature flags for gradual rollout
- Monitor error rates
- Monitor performance
- Monitor user adoption
- Gather feedback

### Feedback Loop

- Weekly metrics review
- User feedback incorporation
- Bug prioritization
- Performance optimization

---

**Phase 2 Start Date**: January 28, 2026  
**Phase 2 Target End**: March 15, 2026  
**MVP Launch Date**: March 31, 2026
