# COMPREHENSIVE DETAILED PLAN: UWorld-Style Exam Preparation Platform

---

## EXECUTIVE SUMMARY

Build a **subscription-based SaaS platform** for high-stakes exam preparation (USMLE, NCLEX, SAT, ACT, CPA, etc.) featuring:

- Massive question banks (10,000+ per exam type)
- Rich explanations with multimedia
- Real-time performance analytics
- Adaptive learning algorithms
- Mobile and web access
- Institutional licensing options

**Total Timeline:** 6-12 months (MVP in 4-6 months)
**Estimated Budget:** $70k-$150k development + $20k+ content

---

## PART 1: PLANNING PHASE (Weeks 1-2)

### 1.1 Project Scope & Requirements Definition

**Objectives:**

- Identify all features and constraints
- Define Minimum Viable Product (MVP)
- Validate market fit

**Core Features to Include:**

- Question Banks (QBanks) with 1000+ questions per exam
- Customizable quizzes (by subject, difficulty, mode)
- Detailed explanations with visuals and references
- Performance analytics and trending
- User dashboards and progress tracking
- Payment integration for subscriptions
- Institutional tools for schools/educators
- Mobile app capability

**Target Users:**

- Medical students (USMLE Step 1, 2, 3)
- Nursing students (NCLEX-RN, NCLEX-PN)
- Finance professionals (CPA, CFA)
- Law students (Bar exam)
- College entrance exam takers (SAT, ACT)
- High school students

**MVP Definition (First Release):**

- Single exam type focus (recommend: USMLE Step 1)
- Core QBank with 1,000+ questions
- Basic test creation (random selection)
- Tutor mode (immediate feedback)
- Simple dashboard
- User authentication
- Payment system (Stripe integration)

**Success Metrics:**

- 50+ beta users within 3 months
- 70%+ question completion rate
- 4.5+ star rating
- $5k+ monthly recurring revenue by month 6

**Tools for Requirements:**

- Google Docs or Notion for requirement documentation
- Miro or Figma for user flow mapping
- Jira or Asana for requirement tracking

**Timeline:** 3-4 days
**Owner:** Project Manager + Content Experts

---

### 1.2 Market Research & Competitive Analysis

**Competitive Landscape:**

- **UWorld (Leader):** High-quality questions, realistic simulations, expensive ($300/year+)
- **Kaplan:** Strong content but outdated interface, expensive
- **Khan Academy:** Free but limited depth, not exam-focused
- **Quizlet:** Student-generated, unreliable quality
- **Amboss:** Growing player, strong content
- **PassitNow:** Niche players in specific exams

**Strengths to Replicate:**

- UWorld's quality: rigorous vetting of SMEs, detailed explanations
- Realistic simulations: exam-like interface and timing
- High-yield content: focused on commonly tested topics
- Performance tracking: granular analytics by subject/topic

**Weaknesses in Market (Opportunities):**

- Pricing: $300-500/year for complete access (gap for budget learners)
- Mobile experience: Limited offline functionality
- Adaptive learning: Minimal personalization
- Community: Weak discussion/social features
- Marketing: Limited free content

**Unique Selling Points (USPs):**

- AI-driven adaptive learning (recommend difficult questions based on performance)
- Superior mobile app (offline mode, better UX)
- Lower pricing ($99-199/year vs $300+)
- Institutional tools (school dashboards, class assignments)
- Open API for partners
- Transparency in question statistics (show how many got it right globally)

**Research Methods:**

- Survey 50+ target users on pain points
- Analyze competitor reviews (Trustpilot, G2, AppStore)
- Use Ahrefs/SEMrush for competitor keyword strategy
- Interview 5-10 experts in each exam category
- Research regulatory requirements (GDPR, HIPAA, FERPA)

**Tools:**

- SurveyMonkey or Typeform for user surveys
- Google Alerts for competitor news
- Ahrefs/SEMrush for competitive insights
- LinkedIn for expert interviews

**Timeline:** 2-3 days
**Owner:** Project Manager

---

### 1.3 Team Assembly & Resource Planning

**Required Team for MVP (8 people):**

| Role                | Count | Responsibilities                                 | Salary/Cost                      |
| ------------------- | ----- | ------------------------------------------------ | -------------------------------- |
| Project Manager     | 1     | Strategy, roadmap, stakeholder management        | $80k/year                        |
| Product Manager     | 1     | Feature prioritization, user stories             | $85k/year                        |
| Backend Developer   | 2     | APIs, database, payment integration, test engine | $90k/year each                   |
| Frontend Developer  | 1     | React UI, dashboard, exam interface              | $80k/year                        |
| UI/UX Designer      | 1     | Wireframes, mockups, accessibility               | $75k/year                        |
| DevOps Engineer     | 1     | Infrastructure, CI/CD, monitoring                | $95k/year                        |
| Content Creator/SME | 1-2   | Question writing, explanation vetting            | $60k/year + per-question payment |
| QA Tester           | 1     | Testing, bug reporting, UAT coordination         | $50k/year                        |

**Hiring Channels:**

- LinkedIn for full-time hires
- Upwork for freelance support
- EdTech-focused job boards (AngelList)
- University networks for SME recruitment
- Fiverr/Toptal for specialized contractors

**Budget Estimation:**
| Item | Cost |
|------|------|
| Salaries (8 people × 6 months) | $45,000 |
| Development tools (GitHub, Jira, Figma) | $2,000 |
| Cloud infrastructure (AWS, etc.) | $6,000 |
| Domain, SSL, hosting | $500 |
| Testing tools (BrowserStack, Postman) | $1,500 |
| Content creation (1000 questions × $30-50) | $30,000-50,000 |
| Legal/Compliance (GDPR, HIPAA review) | $5,000 |
| **Total MVP Budget** | **$90,000-110,000** |

**Ongoing Monthly Costs (Post-Launch):**
| Item | Cost |
|------|------|
| Server costs (AWS) | $1,000-2,000 |
| Payment processing (Stripe fees) | Variable (2.9% + $0.30) |
| CDN (CloudFront) | $200-500 |
| Monitoring (New Relic, Sentry) | $500 |
| Customer support tools | $300 |
| Marketing | $2,000-5,000 |
| **Total Monthly** | **$4,000-8,300** |

**Compliance & Legal:**

- GDPR: Data residency, right to deletion, consent forms
- HIPAA: If handling medical student data (encrypt, audit logs)
- PCI DSS: Payment card security (use Stripe to minimize exposure)
- Copyright: Ensure all questions are original or properly licensed
- Terms of Service: Intellectual property, acceptable use, liability
- Privacy Policy: Data collection, retention, third-party sharing

**Timeline:** 1 week
**Owner:** Project Manager

---

### 1.4 Project Roadmap & Timeline

**Agile Methodology:** 2-week sprints with weekly standups

**High-Level Timeline (26 Weeks / 6 Months):**

**Phase 1: Foundation (Weeks 1-8)**

- Sprint 1-2: Environment setup, database schema, auth system
- Sprint 3-4: Backend APIs (questions, tests, progress tracking)
- Sprint 5: Frontend pages (login, dashboard, QBank)
- Sprint 6-7: Test engine (timing, scoring, navigation)
- Sprint 8: Payment integration, basic monitoring

**Phase 2: Enhancement (Weeks 9-16)**

- Sprint 9-10: Rich explanations, media uploads, LaTeX support
- Sprint 11: Tutor vs Test mode refinement
- Sprint 12: Flashcard system
- Sprint 13: Study planner and scheduler
- Sprint 14: Analytics dashboard v1
- Sprint 15-16: Mobile responsive design, performance optimization

**Phase 3: Intelligence (Weeks 17-22)**

- Sprint 17-18: Adaptive learning algorithm
- Sprint 19: Advanced analytics (heatmaps, trends)
- Sprint 20: Mock exams, full-length simulations
- Sprint 21: Admin CMS for content management
- Sprint 22: Beta testing setup

**Phase 4: Launch (Weeks 23-26)**

- Sprint 23: Security audit, penetration testing
- Sprint 24: Load testing, scale verification
- Sprint 25: Beta user recruitment, soft launch
- Sprint 26: Marketing setup, production launch

**Key Milestones:**

- Week 8: Alpha release (internal testing)
- Week 16: Feature complete for MVP
- Week 22: Beta testing begins
- Week 26: Production launch

**Tools:**

- Jira or Asana for sprint management
- GitHub Projects for code tracking
- Confluence for documentation
- Slack for team communication

**Owner:** Project Manager
**Timeline:** 2 days

---

## PART 2: DESIGN PHASE (Weeks 3-6)

### 2.1 User Experience (UX) Design

**User Personas:**

**Persona 1: Medical Student (Primary)**

- Age: 24-28
- Goal: Pass USMLE Step 1 with 250+ score
- Pain point: Time pressure, overwhelming content volume
- Behavior: Studies 3-4 hours daily, needs mobile access
- Preferred learning: Active recall, spaced repetition

**Persona 2: Working Professional**

- Age: 30-45
- Goal: Pass CPA exam while working
- Pain point: Limited study time, need flexibility
- Behavior: Weekends, evening study, preference for short sessions
- Preferred learning: Efficient, high-yield questions

**Persona 3: High School Student**

- Age: 17-18
- Goal: Improve SAT score for college admission
- Pain point: Anxiety, lack of study structure
- Behavior: Heavy mobile use, needs guidance
- Preferred learning: Gamification, progress feedback

**Persona 4: Educator/Admin**

- Role: School administrator or instructor
- Goal: Track student progress, assign materials
- Pain point: Manual grade tracking, no centralized data
- Behavior: Desktop-focused, monthly reporting needs
- Preferred: Bulk operations, class-level analytics

**Key User Flows:**

**Flow 1: Discover → Purchase → Study**

```
Landing Page
    ↓ (Click "See Plans")
Pricing Page
    ↓ (Select plan)
Checkout
    ↓ (Enter payment)
Payment Confirmation
    ↓ (Click "Start")
Welcome/Onboarding
    ↓ (Set exam date, study hours)
Dashboard
    ↓ (Click "Create Test")
QBank
    ↓ (Select filters, start)
Question Viewer
    ↓ (Answer, submit)
Explanation/Rationale
    ↓ (Next question)
Results Summary
```

**Flow 2: Dashboard → Test → Review → Analytics**

```
Dashboard (Home)
    ↓ (See progress, recommendations)
Create Custom Test
    ↓ (Select mode, filters)
Test Configuration
    ↓ (Number, difficulty, subject)
Start Test
    ↓ (Timed or Tutor mode)
Question Interface
    ↓ (Flag, highlight, answer)
Submit Answer
    ↓ (If Tutor mode → show explanation)
Continue or Finish
    ↓ (Review or Analytics)
Performance Report
```

**Flow 3: Admin → Create Content → Distribute**

```
Admin Login
    ↓ (CMS dashboard)
Create Question
    ↓ (Write stem, options, explanation)
Upload Media
    ↓ (Images, diagrams)
Tag & Organize
    ↓ (Subject, difficulty, topics)
Submit for Review
    ↓ (Peer review workflow)
Approve & Publish
    ↓ (Questions live)
Analytics View
    ↓ (Monitor performance)
```

**Wireframes (Pages):**

**Page 1: Landing Page**

- Hero section: Value proposition
- Feature highlights: QBank size, explanations, analytics
- Pricing comparison table
- Social proof: reviews, testimonials
- CTA buttons: "Start Free Trial", "Learn More"

**Page 2: Dashboard (Post-Login)**

- Header: User name, subscription days remaining
- Left sidebar: Menu (Resume, Create Test, My Progress, Analytics, Flashcards, Notebook)
- Main content:
  - Progress circle (% of QBank completed)
  - Study streak counter
  - Recommended next actions
  - Recent test scores chart
  - Study plan calendar

**Page 3: QBank (Question Listing)**

- Top filters: Subject, Difficulty, Status (Unused/Incorrect/Flagged/All)
- Sorting: By difficulty, by performance, by topic
- List view: Question preview, correct rate, average time
- Actions: Open, flag, create flashcard

**Page 4: Question Viewer (Core Interface)**

- Top: Progress indicator (Question 15 of 40)
- Main area: Question stem (with LaTeX, images, tables)
- Below: Multiple choice options (A, B, C, D)
- Right sidebar:
  - Timer (if timed mode)
  - Flag button
  - Notes area
- Bottom buttons: Previous, Next, Submit, End Test

**Page 5: Explanation Page**

- Question stem (read-only)
- Selected answer highlighted
- Correct answer highlighted
- Explanation sections:
  - Why correct? (main rationale)
  - Why others wrong? (per option)
  - Key takeaway
  - References
- Related questions link
- "Add to Flashcard" button

**Page 6: Performance Dashboard**

- Overview cards:
  - Total questions answered
  - Accuracy %
  - Avg time per question
  - Subject-wise breakdown
- Charts:
  - Performance trend (line chart over time)
  - Subject heatmap (green = strong, red = weak)
  - Difficulty distribution
  - Comparison to peer average

**Page 7: Admin CMS**

- Question list (with status badges)
- Search/filter by subject, author, status
- Create new question button
- Bulk import from CSV
- Review queue (pending approval)
- Statistics dashboard

**Accessibility Requirements:**

- WCAG 2.1 Level AA compliance
- Keyboard navigation (Tab, Enter, Escape)
- Alt text for all images
- High contrast mode support
- Screen reader compatible
- Focus indicators visible
- Logical heading hierarchy (H1, H2, H3)

**Tools:**

- Figma: Wireframes and mockups
- Adobe XD: Interactive prototypes
- Maze or UsabilityHub: User testing

**Timeline:** 1 week
**Owner:** UX Designer

---

### 2.2 User Interface (UI) Design

**Design System:**

**Color Palette:**

- Primary: Blue (#0052CC) - Trust, learning
- Secondary: Green (#28A745) - Success, correct answers
- Accent: Orange (#FFA500) - Alerts, important actions
- Neutral: Gray scale (#F8F9FA, #6C757D, #212529)
- Error: Red (#DC3545)

**Typography:**

- Headers: Inter or Poppins (Sans-serif)
- Body: Inter or Open Sans (Sans-serif)
- Code: Menlo or Monaco (Monospace)
- Sizes:
  - H1: 32px (bold)
  - H2: 24px (bold)
  - H3: 20px (semi-bold)
  - Body: 16px (regular)
  - Small: 14px (regular)

**Spacing:**

- Base unit: 8px
- Margin/Padding: 8px, 16px, 24px, 32px, 40px

**Components:**

**Buttons:**

- Primary (CTA): Blue background, white text, 40px height
- Secondary: Blue outline, blue text
- Danger: Red background, white text
- Disabled: Gray background, gray text
- States: Normal, Hover, Active, Disabled

**Cards:**

- Question card: White background, light gray border, 2px rounded corners
- Stats card: White background with icon, subtle shadow
- Shadow: 0 2px 8px rgba(0,0,0,0.1)

**Form Elements:**

- Input fields: 40px height, light blue border on focus
- Checkboxes/Radio: Custom styled, blue on selection
- Dropdown: Blue border on focus
- Error messages: Red text, 12px, below field

**Navigation:**

- Top nav: Horizontal menu, dropdown for account
- Sidebar (desktop): Fixed left sidebar, collapsible
- Mobile nav: Bottom tab bar (Home, QBank, Analytics, Profile)

**Icons:**

- Feather Icons or Heroicons
- Consistent 24px size
- Monochromatic (blue or gray)

**Charts & Visualizations:**

- Chart.js for line, bar, pie charts
- Heatmap.js for subject mastery visualization
- D3.js for complex custom visualizations

**Responsive Design:**

- Desktop (1440px+): Full layout, sidebar visible
- Tablet (768px-1439px): Collapsible sidebar
- Mobile (< 768px): Full-width, bottom navigation

**Mobile-Specific UI:**

- Larger touch targets (48px minimum)
- Swipe gestures (left/right for questions)
- Bottom sheet for explanations
- Floating action button for utilities

**Typography Hierarchy:**

```
Page Title (H1) - 32px
├─ Section Header (H2) - 24px
│  ├─ Subsection (H3) - 20px
│  └─ Body text - 16px
└─ Supporting text - 14px
```

**Dark Mode Support:**

- Background: #121212
- Text: #FFFFFF
- Surfaces: #1E1E1E
- Borders: #333333
- Should respect system preference

**Tools:**

- Figma for design
- Adobe XD for prototypes
- Zeplin for handoff to developers
- Storybook for component library

**Timeline:** 1 week
**Owner:** UI Designer

---

### 2.3 Database & Architecture Design

**Technology Stack Decision:**

**Frontend:**

- **Framework:** React.js with Next.js (for SSR, SEO, faster deployments)
- **State Management:** Zustand (lightweight) or Redux (if complex)
- **UI Library:** Tailwind CSS or Material-UI
- **HTTP Client:** Axios or Fetch API
- **Testing:** Jest + React Testing Library

**Backend:**

- **Language:** Node.js with TypeScript (type safety, better DX)
  - Alternative: Python/Django (if more ML/analytics focus)
- **Framework:** Express.js or Fastify (minimal, fast)
- **ORM:** Sequelize or TypeORM (database abstraction)
- **API Style:** RESTful with OpenAPI/Swagger documentation
- **Testing:** Jest + Supertest

**Database:**

- **Primary:** PostgreSQL (relational data)
  - Users, subscriptions, questions, test results
  - ACID compliance, strong consistency
- **Cache:** Redis (in-memory caching)
  - Active exam sessions, timers, frequently accessed questions
- **Search:** Elasticsearch (full-text search on questions)
  - Alternative: PostgreSQL full-text search (simpler)

**Storage:**

- **File Storage:** AWS S3
  - Question images, explanation PDFs
- **CDN:** CloudFront (S3 distribution)
- **Video:** S3 + CloudFront or YouTube/Vimeo embed

**Queue & Background Jobs:**

- **Message Queue:** AWS SQS or Redis Queue
- **Job Processor:** Node.js Bull or Python Celery
- **Use cases:**
  - Send email confirmations
  - Generate PDF reports
  - Calculate analytics (batch)
  - Process payment webhooks

**Analytics & Monitoring:**

- **Application Monitoring:** New Relic or Datadog
- **Error Tracking:** Sentry
- **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **APM:** Datadog or Honeycomb (optional)

**Architecture Diagram:**

```
┌──────────────────┐
│  CDN (CloudFront)│
└────────┬─────────┘
         │
┌────────▼──────────────┐
│  Load Balancer (ALB)  │
└────────┬──────────────┘
         │
┌────────┴──────────────────┐
│  Auto-scaling ECS/K8s     │
├──────────┬──────────┬─────┤
│API Server│Analytics │Admin│
│(Node.js) │Service   │API  │
└────┬─────┴────┬─────┴─────┘
     │          │
┌────▼──────────▼────┐
│   RDS PostgreSQL   │  Primary Database
│   (Multi-AZ)       │
└────┬────────────────┘
     │
     ├─ Redis Cache (ElastiCache)
     ├─ Elasticsearch (Search)
     ├─ S3 + CloudFront (Media)
     └─ SQS (Queue)
```

**Database Schema:**

```sql
-- Users & Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role ENUM('student', 'instructor', 'admin') DEFAULT 'student',
    email_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
    timezone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Subscriptions
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type_id UUID NOT NULL,
    subscription_tier ENUM('basic', 'plus', 'ultimate') DEFAULT 'basic',
    status ENUM('active', 'expired', 'cancelled', 'trial') DEFAULT 'trial',
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Exam Types
CREATE TABLE exam_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE, -- 'NCLEX-RN', 'USMLE-STEP1', 'CPA'
    name VARCHAR(100) NOT NULL,
    category ENUM('medical', 'nursing', 'finance', 'law', 'highschool'),
    description TEXT,
    total_questions INTEGER,
    passing_score DECIMAL(5,2),
    exam_duration_minutes INTEGER,
    status ENUM('active', 'draft', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subjects/Topics
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_type_id UUID NOT NULL REFERENCES exam_types(id),
    name VARCHAR(100) NOT NULL, -- 'Cardiology', 'Pathology'
    description TEXT,
    order_index INTEGER,
    parent_subject_id UUID REFERENCES subjects(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Questions (Core Content)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_type_id UUID NOT NULL REFERENCES exam_types(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    question_type ENUM('single', 'multiple', 'drag_drop', 'hotspot') DEFAULT 'single',
    stem_text TEXT NOT NULL, -- Question text
    stem_media JSONB, -- {images: [], videos: [], charts: []}
    options JSONB NOT NULL, -- [{id: 'A', text: '...', is_correct: true}, ...]
    explanation_text TEXT NOT NULL,
    explanation_media JSONB, -- {images: [], links: []}
    difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 10),
    bloom_level ENUM('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'),
    learning_objective TEXT,
    key_takeaway TEXT,
    references JSONB, -- {pubmed_ids: [], textbook_references: []}
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- User Progress (Tracking)
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    session_id VARCHAR(100) NOT NULL, -- Links to study session
    selected_answer VARCHAR(1), -- 'A', 'B', 'C', 'D'
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    flagged BOOLEAN DEFAULT FALSE,
    used_calculator BOOLEAN DEFAULT FALSE,
    used_highlight BOOLEAN DEFAULT FALSE,
    used_strikethrough BOOLEAN DEFAULT FALSE,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    mode ENUM('tutor', 'timed', 'untimed') DEFAULT 'tutor',
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Study Sessions
CREATE TABLE study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    exam_type_id UUID NOT NULL,
    session_type ENUM('quick_practice', 'custom_test', 'mock_exam', 'adaptive'),
    config JSONB, -- {filters, question_count, mode, etc}
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    total_questions INTEGER,
    correct_count INTEGER,
    score_percentage DECIMAL(5,2),
    status ENUM('in_progress', 'completed', 'abandoned'),
    metadata JSONB -- {avg_time_per_q, flags, etc}
);

-- Flashcards
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id),
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    mastery_level INTEGER CHECK (mastery_level >= 0 AND mastery_level <= 5) DEFAULT 0,
    next_review_date TIMESTAMP,
    review_count INTEGER DEFAULT 0,
    last_reviewed TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance Analytics (Aggregated)
CREATE TABLE performance_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    exam_type_id UUID NOT NULL,
    subject_id UUID REFERENCES subjects(id),
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2),
    avg_time_per_question DECIMAL(5,2),
    trend_direction ENUM('improving', 'declining', 'stable'),
    weakest_tags TEXT[],
    strongest_tags TEXT[],
    last_calculated TIMESTAMP DEFAULT NOW()
);

-- Payments & Billing
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type ENUM('card', 'paypal', 'apple_pay') DEFAULT 'card',
    last_four VARCHAR(4),
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT TRUE,
    stripe_customer_id VARCHAR(100),
    stripe_payment_method_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    subscription_id UUID REFERENCES user_subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    stripe_invoice_id VARCHAR(100),
    pdf_url TEXT,
    issued_at TIMESTAMP DEFAULT NOW()
);

-- Notes (User Notebook)
CREATE TABLE user_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_active ON user_subscriptions(user_id) WHERE status = 'active';
CREATE INDEX idx_progress_user_question ON user_progress(user_id, question_id);
CREATE INDEX idx_progress_timestamp ON user_progress(user_id, timestamp DESC);
CREATE INDEX idx_questions_exam_subject ON questions(exam_type_id, subject_id);
CREATE INDEX idx_sessions_user ON study_sessions(user_id, created_at DESC);
CREATE INDEX idx_flashcards_user ON flashcards(user_id, next_review_date);
CREATE INDEX idx_analytics_user ON performance_analytics(user_id, subject_id);
```

**API Design:**

**Core Endpoints:**

```
Authentication:
  POST   /api/v1/auth/register         -- User registration
  POST   /api/v1/auth/login            -- User login
  POST   /api/v1/auth/refresh          -- Refresh token
  POST   /api/v1/auth/logout           -- Logout
  POST   /api/v1/auth/forgot-password  -- Reset password request
  POST   /api/v1/auth/reset-password   -- Reset password

Questions:
  GET    /api/v1/questions             -- List questions (with filters)
  GET    /api/v1/questions/:id         -- Get single question
  POST   /api/v1/questions/bulk        -- Fetch batch for test
  GET    /api/v1/questions/:id/explanation -- Get explanation

Test Sessions:
  POST   /api/v1/sessions              -- Create new session
  GET    /api/v1/sessions/:id          -- Get session state
  POST   /api/v1/sessions/:id/answer   -- Submit answer
  POST   /api/v1/sessions/:id/complete -- Finish session
  GET    /api/v1/sessions/:id/review   -- Get review data

Progress:
  GET    /api/v1/progress/summary      -- Dashboard metrics
  GET    /api/v1/progress/by-subject   -- Subject breakdown
  GET    /api/v1/progress/trends       -- Performance trend

Payments:
  GET    /api/v1/plans                 -- Available subscriptions
  POST   /api/v1/checkout              -- Create payment intent
  POST   /api/v1/subscriptions/:id/cancel
  GET    /api/v1/invoices              -- Billing history

Admin:
  POST   /api/v1/admin/questions       -- Create question
  PUT    /api/v1/admin/questions/:id   -- Update question
  POST   /api/v1/admin/questions/import -- Bulk import
  GET    /api/v1/admin/analytics       -- Content analytics
  GET    /api/v1/admin/users           -- User management
```

**Authentication & Security:**

- **JWT Tokens:**
  - Access token: 15 minutes expiry
  - Refresh token: 7 days expiry
- **Password Hashing:** Argon2id
- **HTTPS:** All endpoints
- **Rate Limiting:** 100 requests/minute per IP
- **CORS:** Whitelist specific domains
- **CSRF Protection:** Token-based for state-changing operations
- **Input Validation:** Zod or Joi schemas
- **Helmet.js:** Security headers

**Tools:**

- Draw.io for architecture diagrams
- Postman for API documentation
- Swagger/OpenAPI for specifications

**Timeline:** 1-2 weeks
**Owner:** Backend Lead Developer

---

### 2.4 Content Strategy & Planning

**Content Scope:**

**Exam Types (Phased Rollout):**

- **Phase 1 (MVP):** USMLE Step 1 (1500-2000 questions)
- **Phase 2:** USMLE Step 2 CK, NCLEX-RN (1000 questions each)
- **Phase 3:** CPA, MCAT, ACT, SAT (500-1000 each)
- **Phase 4:** Additional specialties (Psychiatry, Pediatrics, etc.)

**Question Distribution (per exam):**

- Basic concepts: 20% (Easy)
- Applied knowledge: 50% (Medium)
- Complex scenarios: 30% (Hard)

**Question Bank Features:**

**Question Types:**

1. **Single Best Answer (SBA):** 4 options, pick one correct
2. **Multiple Select:** Multiple correct answers
3. **Drag & Drop:** Match terms or arrange order
4. **Case-based:** One stem, 3-5 related questions
5. **Image-based/Hotspot:** Click on image area

**Explanation Components:**

1. **Why Correct** (300-500 words)
   - Pathophysiology/principle explanation
   - Clinical significance
   - When to use this concept

2. **Why Others Wrong** (100-200 words per option)
   - Common misconceptions
   - Similar conditions
   - Why appealing but incorrect

3. **Key Takeaway** (1-2 sentences)
   - Main learning point
   - Clinically relevant

4. **References**
   - PubMed/Medical journal links
   - Textbook chapters
   - Guideline citations

5. **Images/Diagrams**
   - Pathology images
   - ECG/imaging examples
   - Flowcharts
   - Molecular structures

**Content Production Workflow:**

**Step 1: Planning (Week 1)**

- Define question blueprint (coverage by topic/difficulty)
- Recruit subject matter experts (SMEs)
- Set quality standards and templates
- Create style guide for consistency

**Step 2: Question Writing (Weeks 2-4)**

- SMEs write 50-100 questions each
- Use Google Sheets for collaborative drafting
- Track progress in Jira
- Include source/reference for fact-checking

**Step 3: Peer Review (Weeks 5-6)**

- Second SME reviews for accuracy
- Check against current guidelines
- Verify explanations are complete
- Flag any concerns in shared document

**Step 4: Revision (Week 7)**

- Address reviewer feedback
- Update explanations for clarity
- Add/optimize images
- Final accuracy check

**Step 5: QA Testing (Week 8)**

- Load into test database
- Check formatting (LaTeX, images)
- Verify all options display correctly
- Test navigation/functionality

**Step 6: Publication (Week 9)**

- Move to production
- Set as active in QBank
- Begin collecting performance data

**Content Management Tools:**

- **Google Sheets:** Initial question drafting
- **Notion:** Content calendar, SME coordination
- **Jira:** Task tracking, peer review assignments
- **AWS S3:** Image storage during development
- **Git:** Version control for content updates

**SME Recruitment & Training:**

**Ideal SME Profile:**

- Board-certified physicians (for medical content)
- Current or recent exam takers
- Published authors (preferred)
- Teaching experience
- Availability: 20-40 hours over 8 weeks

**Compensation:**

- Flat fee: $2,000-5,000 per exam type
- Per-question bonus: $30-50 per approved question
- Royalty (optional): 10-20% of revenue if high performer

**Training:**

- 2-hour onboarding call (question format, standards)
- Example questions with feedback
- Style guide document
- Weekly check-ins

**Content Quality Metrics:**

**Post-Launch Monitoring:**

- % of users who flag question as unclear
- Accuracy of explanation (SME review of user feedback)
- Question discrimination index (does it differentiate high vs low performers?)
- Time-to-answer (outliers = confusing question)

**Targets:**

- 95% accuracy rate
- <5% "unclear" flag rate
- Avg discrimination index > 0.3

**Timeline:** Ongoing (plan 1 week)
**Owner:** Content Lead + SMEs

---

## PART 3: DEVELOPMENT PHASE (Weeks 7-18)

### 3.1 Development Environment Setup

**Version Control:**

- **Git Repository:** GitHub (private, with branch protection)
- **Branching Strategy:** Git Flow
  - `main`: Production-ready code
  - `develop`: Integration branch
  - `feature/*`: Individual feature branches
  - `hotfix/*`: Emergency fixes

**Development Tools:**

| Tool           | Purpose            | Setup Time |
| -------------- | ------------------ | ---------- |
| Node.js v18+   | JavaScript runtime | 30 min     |
| PostgreSQL 14+ | Database           | 1 hour     |
| Redis          | Cache/sessions     | 30 min     |
| Docker         | Containerization   | 1 hour     |
| Postman        | API testing        | 15 min     |
| VS Code        | Editor             | 30 min     |
| GitHub         | Code hosting       | 15 min     |

**CI/CD Pipeline:**

```yaml
# GitHub Actions Workflow

name: CI/CD Pipeline

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install
      - run: npm run lint
      - run: npm run test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  build-docker:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      - uses: aws-actions/configure-aws-credentials@v2
      - run: aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
      - run: docker build -t $IMAGE_URI:$COMMIT_SHA .
      - run: docker push $IMAGE_URI:$COMMIT_SHA

  deploy-staging:
    needs: build-docker
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - run: aws ecs update-service --cluster staging --service api --force-new-deployment

  deploy-production:
    needs: build-docker
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - run: aws ecs update-service --cluster production --service api --force-new-deployment
      - run: notify-slack "Deployment successful"
```

**Local Development Stack:**

```dockerfile
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://user:password@db:5432/platform_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: platform_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

**Secrets Management:**

- GitHub Secrets for API keys
- AWS Secrets Manager for production
- .env files (local development only, never committed)

**Code Quality Tools:**

- ESLint: Linting
- Prettier: Code formatting
- Jest: Unit testing
- SonarQube: Static analysis (optional)

**Testing Strategy:**

- Unit Tests: 70% coverage
- Integration Tests: APIs, database
- E2E Tests: Critical user flows
- Load Tests: 1000+ concurrent users

**Timeline:** 2-3 days
**Owner:** DevOps Engineer + Backend Lead

---

### 3.2 Backend Development (4 Weeks)

**Week 1: Authentication & User Management**

```javascript
// Example: JWT Token Generation
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Registration endpoint
POST /api/v1/auth/register
Body: {
  email: "user@example.com",
  password: "SecurePass123!",
  firstName: "John",
  lastName: "Doe"
}
Returns: { userId, accessToken, refreshToken }

// Login endpoint
POST /api/v1/auth/login
Body: { email, password }
Returns: { accessToken, refreshToken }
```

**Features:**

- User registration with email verification (24hr link)
- Secure login with password hashing (Argon2id)
- JWT token generation (15min access, 7day refresh)
- Password reset flow
- OAuth integration (Google, Apple)
- Role-based access control (Student, Instructor, Admin)

**Tests:**

- Successful registration
- Duplicate email rejection
- Invalid password format
- Login with wrong password
- Token refresh
- Logout (blacklist token)

**Week 2: Question & Content APIs**

```javascript
// Fetch questions with filters
GET /api/v1/questions?exam_type_id=uuid&subject_id=uuid&difficulty=5-8&limit=10

// Get single question
GET /api/v1/questions/:id
Returns: {
  id,
  stem_text,
  stem_media,
  options,
  difficulty,
  statistics: { correct_rate: 0.68, avg_time: 145 }
}

// Bulk fetch for test creation
POST /api/v1/questions/bulk
Body: {
  exam_type_id,
  filters: { subject_ids: [], difficulty: [5, 10], unused_only: true },
  count: 40
}
Returns: [{ id, stem, options }, ...]

// Get explanation (separate endpoint)
GET /api/v1/questions/:id/explanation
Returns: {
  rationale,
  why_others_wrong: { A: "...", B: "...", C: "...", D: "..." },
  key_takeaway,
  references: [{ title, url }],
  related_questions: [id1, id2]
}
```

**Features:**

- Efficient question retrieval with caching
- Filtering by subject, difficulty, status
- Full-text search (Elasticsearch integration)
- Media CDN URL generation
- Question statistics caching

**Tests:**

- Filter combinations work correctly
- Pagination works
- Search returns relevant results
- Explanations load separately

**Week 3: Test Session Engine**

```javascript
// Create study session
POST /api/v1/sessions
Body: {
  exam_type_id,
  session_type: "custom_test",
  config: {
    mode: "timed",
    subject_ids: ["uuid1", "uuid2"],
    difficulty: [5, 10],
    count: 40
  }
}
Returns: {
  session_id: "sess_abc123",
  questions: [{ id, stem, options, media }],
  timer_seconds: 3600,
  total_questions: 40
}

// Submit answer
POST /api/v1/sessions/:session_id/answer
Body: {
  question_id: "uuid",
  selected_option: "C",
  time_spent_seconds: 145,
  flagged: false,
  confidence: 3
}
Returns: { acknowledged: true }

// In Tutor mode, immediately return:
Returns: {
  acknowledged: true,
  is_correct: true,
  explanation: { rationale, ... }
}

// Complete session
POST /api/v1/sessions/:session_id/complete
Returns: {
  score_percentage: 72.5,
  correct_count: 29,
  total_questions: 40,
  by_subject: { cardiology: 85, pathology: 68 },
  time_analysis: { avg_per_q: 145 }
}
```

**Features:**

- Session creation with question randomization
- Server-side timer (prevent cheating)
- Answer submission with validation
- Real-time progress tracking
- Auto-save to prevent data loss
- Session abandonment handling

**Security:**

- Session validation (user owns session)
- One session per user
- Timer decrement server-side
- Prevent answer re-submission

**Tests:**

- Session creation with various filters
- Timer accuracy
- Answer submission and storage
- Score calculation correctness
- Concurrent session prevention

**Week 4: Progress Tracking & Analytics**

```javascript
// Get progress summary
GET /api/v1/progress/summary
Returns: {
  total_questions_answered: 4320,
  overall_accuracy: 72.5,
  accuracy_trend: "improving", // analyzing last 100 questions
  by_subject: {
    cardiology: { accuracy: 85, attempted: 450 },
    pathology: { accuracy: 68, attempted: 380 }
  },
  streaks: { current_day_streak: 5 },
  predicted_pass_probability: 0.87
}

// Get performance trends
GET /api/v1/progress/trends?exam_type_id=uuid&days=30
Returns: [
  { date: "2024-01-01", accuracy: 0.65, questions: 40 },
  { date: "2024-01-02", accuracy: 0.72, questions: 45 },
  ...
]

// Calculate subject-level analytics
GET /api/v1/progress/subjects
Returns: {
  subjects: [
    {
      id,
      name: "Cardiology",
      accuracy: 0.85,
      attempted: 450,
      trend: "improving",
      weakest_topics: ["Arrhythmias", "Valve disease"]
    }
  ]
}
```

**Features:**

- Aggregated accuracy calculation
- Subject-wise breakdown
- Performance trend analysis
- Weakness identification
- Peer comparison
- Pass probability estimation

**Database Aggregation:**

- Materialized views for historical data
- Caching frequent queries in Redis
- Batch calculation (run nightly)

**Tests:**

- Accuracy calculation correctness
- Trend detection accuracy
- Peer comparison logic
- Performance under load

**Deliverables (Week 1-4):**

- Authentication system ✓
- Question APIs ✓
- Test engine ✓
- Progress tracking ✓
- Payment webhook handlers ✓
- Admin panel APIs ✓

**Timeline:** 4 weeks
**Owner:** 2 Backend Developers

---

### 3.3 Frontend Development (4 Weeks)

**Week 1: Core Pages & Navigation**

```jsx
// App structure
<BrowserRouter>
  <AuthProvider>
    <SubscriptionProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/qbank" element={<QBank />} />
          <Route path="/test/:sessionId" element={<TestSession />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin/cms" element={<AdminCMS />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
        </Route>
      </Routes>
    </SubscriptionProvider>
  </AuthProvider>
</BrowserRouter>
```

**Features:**

- Responsive layout (desktop, tablet, mobile)
- Navigation bar with user menu
- Sidebar navigation (collapsible)
- Protected routes (subscription verification)
- Loading states and error boundaries

**Tests:**

- Page loads correctly
- Navigation works
- Protected routes redirect
- Mobile responsive

**Week 2: Question Viewer & Test Interface**

```jsx
<QuestionViewer
  question={questionData}
  mode="timed"
  onAnswer={handleAnswer}
  onFlag={handleFlag}
  showExplanation={false}
/>

// Component structure
QuestionViewer
├─ QuestionHeader (progress, timer)
├─ QuestionStem
│  ├─ RichTextRenderer (LaTeX, images)
│  └─ MediaGallery
├─ OptionsList
│  ├─ Option (A, B, C, D)
│  └─ SelectionHandler
├─ ToolBar
│  ├─ Calculator
│  ├─ Highlighter
│  ├─ StrikeThrough
│  ├─ Notes
│  └─ Flag Button
└─ NavigationButtons (Prev, Next, Submit)
```

**Features:**

- LaTeX equation rendering (KaTeX)
- Image display with zoom
- Option selection with keyboard shortcuts
- Timer display (countdown)
- Flag question functionality
- Progress indicator
- Previous/Next/Submit buttons

**State Management:**

```javascript
const [currentQuestion, setCurrentQuestion] = useState(0);
const [answers, setAnswers] = useState({}); // question_id -> selected_option
const [flags, setFlags] = useState(new Set());
const [timeRemaining, setTimeRemaining] = useState(sessionTimer);
```

**Tests:**

- Question renders correctly
- Answer submission works
- Timer decrements accurately
- Navigation between questions
- Flag functionality

**Week 3: Dashboard & Analytics**

```jsx
<Dashboard>
  <ProgressOverview />
  <SubjectHeatmap />
  <PerformanceChart />
  <QuickActions />
  <RecentActivity />
</Dashboard>
```

**Components:**

- Progress ring (% complete)
- Streak counter (consecutive days)
- Performance chart (trend over time)
- Subject heatmap (green = strong, red = weak)
- Recommended next steps
- Recent test scores
- Time spent this week

**Visualization Libraries:**

- Chart.js: Line, bar, pie charts
- Heatmap.js: Subject mastery heatmap
- Custom SVG: Progress rings

**Data Fetching:**

```javascript
const { data: progress } = useQuery(
  ["progress", userId],
  () => api.getProgressSummary(),
  { staleTime: 5 * 60 * 1000 }, // Cache 5 min
);
```

**Tests:**

- Data loads and displays
- Charts render correctly
- Responsive on mobile
- Error handling

**Week 4: Payment & Admin Panel**

**Checkout Flow:**

```jsx
<StripeCheckout>
  <PricingComparison />
  <PlanSelection />
  <CheckoutForm />
  <PromoCodeInput />
  <PaymentStatus />
</StripeCheckout>
```

**Admin CMS:**

```jsx
<AdminPanel>
  <QuestionEditor />
  <BulkImport />
  <ReviewQueue />
  <ContentAnalytics />
  <UserManagement />
</AdminPanel>
```

**Features:**

- Plan selection with comparison
- Secure payment form (Stripe Elements)
- Promo code support
- Invoice PDF download
- Question editor (rich text, LaTeX, image upload)
- Bulk import from CSV
- Review workflow (Draft → Review → Approved → Live)
- Content analytics (% correct, difficulty index)

**Tests:**

- Checkout flow completes
- Payment validation
- Invoice generation
- Admin operations
- Permission checks

**Deliverables (Week 1-4):**

- Landing & auth pages ✓
- Dashboard ✓
- Question viewer ✓
- Test session UI ✓
- Analytics dashboard ✓
- Payment checkout ✓
- Admin panel ✓

**Performance Optimization:**

- Code splitting by route
- Lazy load components
- Image optimization
- CSS minification
- Bundle size < 300KB

**Timeline:** 4 weeks
**Owner:** Frontend Developer + UI Designer

---

### 3.4 Feature Integration (2-3 Weeks)

**Features to Integrate:**

**1. Flashcard System**

```javascript
// Auto-generate from missed questions
POST /api/v1/flashcards/from-session/:sessionId
Returns: [{ front: "Question stem", back: "Explanation" }]

// Spaced repetition algorithm
GET /api/v1/flashcards/daily
- Returns cards due today based on SM-2 formula
- Updates interval after each review
```

**2. Study Planner**

```javascript
// Generate plan
POST /api/v1/study-plan
Body: {
  exam_date: "2024-03-15",
  hours_per_day: 4,
  preferred_days: ["Mon", "Tue", "Wed", "Thu", "Fri"]
}
Returns: {
  daily_targets: [
    { date: "2024-01-01", target_questions: 45, focus: ["Cardiology"] },
    ...
  ]
}
```

**3. Adaptive Learning**

```javascript
// Algorithm: If last 3 correct → increase difficulty
// If last 3 incorrect → decrease difficulty
// Target ~65% accuracy (optimal learning zone)

const selectNextQuestion = (userAbility, recentPerformance) => {
  let difficulty = calculateDifficulty(userAbility);

  if (recentPerformance.last3Correct > 2) {
    difficulty += 0.5; // Increase
  } else if (recentPerformance.last3Incorrect > 2) {
    difficulty -= 0.3; // Decrease
  }

  return fetchQuestion({
    difficulty: [difficulty - 0.5, difficulty + 0.5],
    unused: true,
    weakTopics: userAbility.weakAreas,
  });
};
```

**4. Notifications**

```javascript
// Email notifications
- Daily study reminder
- Weekly progress summary
- Test score achievement
- Subscription expiration warning

// In-app notifications
- Test completed
- New feature available
- Friend joined platform
- Performance improvement
```

**5. Mobile Responsiveness**

```css
/* Breakpoints */
@media (max-width: 768px) {
  /* Stack layout vertically */
  /* Bottom navigation instead of sidebar */
  /* Larger touch targets (48px min) */
  /* Swipe gestures for navigation */
}

@media (max-width: 480px) {
  /* Simplified UI */
  /* Hide secondary info */
  /* Floating action buttons */
}
```

**Timeline:** 2-3 weeks
**Owner:** Full-stack team

---

### 3.5 Content Integration (1 Week)

**Task:**

- Import 1000+ questions into database
- Verify formatting (LaTeX, images, options)
- Set active status
- Begin tracking statistics

**Process:**

```javascript
// CSV Import Script
const importQuestions = async (csvFile) => {
  const rows = parseCSV(csvFile);

  for (const row of rows) {
    const question = {
      exam_type_id: row.exam,
      subject_id: row.subject,
      stem_text: row.stem,
      options: parseOptions(row.options_a_b_c_d),
      explanation_text: row.explanation,
      difficulty: parseInt(row.difficulty),
      tags: row.tags.split(","),
    };

    await db.questions.create(question);
  }

  // Validate all imported questions
  await validateQuestions();

  // Set to active
  await db.questions.updateMany({ imported: true }, { is_active: true });
};
```

**QA Checklist:**

- [ ] All questions have stem text
- [ ] All questions have 4 options
- [ ] Exactly 1 correct option per question
- [ ] All explanations present
- [ ] Images render correctly
- [ ] LaTeX formulas render
- [ ] Subject tags are valid
- [ ] Difficulty ratings are 1-10
- [ ] No duplicate questions

**Timeline:** 1 week
**Owner:** Backend Dev + Content Team

---

## PART 4: TESTING PHASE (Weeks 19-22)

### 4.1 Unit & Integration Testing

**Coverage Goals:** 70%+ code coverage

**Backend Tests:**

```javascript
// Example: Question API test
describe("GET /api/v1/questions/:id", () => {
  it("should fetch a single question", async () => {
    const response = await request(app)
      .get(`/api/v1/questions/${questionId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("stem_text");
    expect(response.body.options).toHaveLength(4);
  });

  it("should return 404 for non-existent question", async () => {
    const response = await request(app)
      .get("/api/v1/questions/invalid-id")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});

// Example: Auth test
describe("POST /api/v1/auth/register", () => {
  it("should register new user", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "test@example.com",
      password: "ValidPass123!",
      firstName: "Test",
      lastName: "User",
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("accessToken");
  });

  it("should reject duplicate email", async () => {
    await registerUser("test@example.com");
    const response = await registerUser("test@example.com");

    expect(response.status).toBe(409); // Conflict
  });
});
```

**Frontend Tests:**

```javascript
// Example: Dashboard component test
describe("<Dashboard />", () => {
  it("should render progress overview", () => {
    const { getByText } = render(<Dashboard />);
    expect(getByText(/Progress/i)).toBeInTheDocument();
  });

  it("should display user progress data", async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText("72.5%")).toBeInTheDocument(); // accuracy
    });
  });
});

// Example: QuestionViewer test
describe("<QuestionViewer />", () => {
  it("should render all 4 options", () => {
    const { getAllByRole } = render(<QuestionViewer question={mockQuestion} />);
    const radioButtons = getAllByRole("radio");
    expect(radioButtons).toHaveLength(4);
  });

  it("should submit answer on button click", () => {
    const { getByText, getByLabelText } = render(
      <QuestionViewer question={mockQuestion} onAnswer={onAnswerMock} />,
    );

    fireEvent.click(getByLabelText("Option C"));
    fireEvent.click(getByText("Submit"));

    expect(onAnswerMock).toHaveBeenCalledWith({
      question_id: mockQuestion.id,
      selected_option: "C",
    });
  });
});
```

**Tools:**

- Jest: Unit testing framework
- Supertest: HTTP assertion library
- React Testing Library: Component testing
- Postman: API testing

**Timeline:** 1 week
**Owner:** QA Engineer + Developers

---

### 4.2 System & User Acceptance Testing (UAT)

**Test Scenarios:**

**User Flow 1: Complete Exam & Check Results**

1. Login as test user
2. Create 40-question custom test (Cardiology, Medium)
3. Answer each question (mix of correct/incorrect)
4. Submit test
5. Verify score calculation
6. Check results breakdown by subject
7. Verify explanations for missed questions

**User Flow 2: Subscription & Payment**

1. Open landing page
2. Select "Plus" plan
3. Complete checkout with test Stripe card
4. Verify payment confirmation email
5. Verify access granted to premium features
6. Attempt to cancel subscription
7. Verify downgrade or cancellation

**User Flow 3: Track Progress & Analytics**

1. Complete 5 test sessions
2. Navigate to Analytics dashboard
3. Verify performance chart shows trend
4. Check subject heatmap (accuracy by subject)
5. Review weakest areas recommendation
6. Verify peer comparison

**User Flow 4: Admin Create Question**

1. Login as admin
2. Create new question with:
   - Rich text stem (with LaTeX)
   - Upload image
   - Add 4 options (mark correct)
   - Write detailed explanation
3. Tag with subject, difficulty
4. Submit for review
5. Peer reviewer approves
6. Verify question is live in QBank
7. Take test with this question

**Beta Testing:**

- Invite 50-100 users for 2 weeks
- Collect feedback via surveys
- Monitor crash logs and errors
- Track feature usage
- Adjust based on feedback

**Tools:**

- TestRail: Test management
- BugHerd: Issue reporting
- Google Forms: User surveys
- Sentry: Error tracking

**Success Criteria:**

- 95%+ successful flows
- <5% test abandonment
- Average score calculation matches manual calculation
- All payment transactions successful
- No data loss on session end

**Timeline:** 1 week
**Owner:** QA Tester + Product Manager

---

### 4.3 Security & Performance Testing

**Security Testing:**

**Vulnerability Scans:**

- OWASP Top 10 checks
- SQL injection attempts
- XSS payload testing
- CSRF token validation
- Authentication bypass attempts
- Authorization checks (role-based)

**Tools:**

- Burp Suite: Penetration testing
- OWASP ZAP: Security scanner
- npm audit: Dependency vulnerabilities

**Checklist:**

- [ ] Passwords hashed with Argon2id
- [ ] JWT tokens validated on every protected endpoint
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (HTML escaping, CSP headers)
- [ ] CSRF tokens on POST/PUT/DELETE
- [ ] Rate limiting implemented
- [ ] HTTPS enforced
- [ ] Secrets not in logs

**Performance Testing:**

**Load Testing (Target: 1000+ concurrent users)**

```javascript
// JMeter test plan
- 100 users ramp up over 2 minutes
- Each user:
  - Logs in
  - Views dashboard
  - Takes 40-question test
  - Views results
  - Repeats 5 times
- Measure: Response time, error rate, throughput
```

**Performance Targets:**
| Endpoint | Target (p99) |
|----------|------------|
| /dashboard | 500ms |
| /questions (list) | 300ms |
| /questions/:id | 100ms |
| /sessions/:id/answer | 200ms |
| /analytics | 800ms |

**Optimization Techniques:**

- Database indexing
- Query caching (Redis)
- CDN for static assets
- Code splitting
- API response compression
- Image optimization

**Tools:**

- JMeter: Load testing
- New Relic: Performance monitoring
- Lighthouse: Frontend performance audit

**Timeline:** 3-5 days
**Owner:** Developers + QA

---

## PART 5: DEPLOYMENT PHASE (Week 23)

### 5.1 Production Environment Setup

**Infrastructure:**

**Cloud Provider:** AWS

**Components:**

- **Compute:** ECS Fargate or Kubernetes (auto-scaling)
- **Database:** RDS PostgreSQL (Multi-AZ, automated backups)
- **Cache:** ElastiCache Redis
- **Storage:** S3 + CloudFront (images, documents)
- **CDN:** CloudFront (static assets)
- **Load Balancer:** Application Load Balancer
- **Monitoring:** CloudWatch + New Relic
- **Logging:** ELK Stack or CloudWatch Logs
- **DNS:** Route 53

**Domain & SSL:**

- Domain: yourapp.com (register on GoDaddy or Route 53)
- SSL Certificate: AWS ACM (free)
- HTTPS enforcement: Redirect HTTP → HTTPS

**Database Migration:**

```sql
-- Migrate from development to production
-- Backup production before migration
BACKUP DATABASE production TO 's3://backups/prod-backup-2024-01-15.bak';

-- Run schema migrations
-- Seed with initial questions (1000+)
-- Verify data integrity
-- Test connectivity

-- Connection string:
DATABASE_URL: postgres://user:password@prod-db.amazonaws.com:5432/eduprep_prod
```

**Secrets Management:**

- Store in AWS Secrets Manager
- Rotate every 90 days
- Never commit secrets to Git

**CI/CD Configuration:**

```yaml
# Deployment steps:
1. Build Docker image
2. Push to ECR
3. Update ECS task definition
4. Deploy to staging
5. Run smoke tests
6. Deploy to production
7. Monitor error rates
```

**Timeline:** 2 days
**Owner:** DevOps Engineer

---

### 5.2 Launch & Go-Live

**Pre-Launch Checklist:**

- [ ] All tests passing
- [ ] Security audit complete
- [ ] Load testing successful
- [ ] Monitoring/alerts set up
- [ ] Backup strategy tested
- [ ] Incident response plan documented
- [ ] Customer support trained
- [ ] Marketing materials ready

**Soft Launch (Day 1-2):**

- Deploy to production
- Monitor error rates closely (target: <0.1%)
- Scale infrastructure if needed
- Beta testers access with promo code

**Public Launch (Day 3+):**

- Announce on social media
- Email beta users
- Offer limited-time launch discount (20% off first year)
- Set up customer support (email, chat)

**Marketing:**

- Reddit communities (r/medical, r/nursing, etc.)
- Student forums
- Twitter/LinkedIn posts
- Guest posts on education blogs
- YouTube tutorials
- Facebook ads

**Timeline:** 1 day
**Owner:** Product Manager + Marketing

---

### 5.3 Post-Launch Monitoring

**Metrics to Track:**

**Technical:**

- Error rate (target: <0.5%)
- API response time (p95 < 500ms)
- Database query time (p95 < 100ms)
- Server availability (target: 99.9%)
- CDN hit rate (target: >90%)

**Business:**

- User signups (daily)
- Conversion rate (free → paid)
- Churn rate (target: <5%/month)
- Monthly recurring revenue (MRR)
- Customer lifetime value (LTV)
- Net promoter score (NPS)

**Product:**

- Feature usage rates
- Session duration
- Test completion rate
- Explanation view rate
- Repeat usage frequency

**Tools:**

- New Relic: Performance monitoring
- Sentry: Error tracking
- Google Analytics: User analytics
- Mixpanel: Product analytics
- Intercom: Customer feedback
- PagerDuty: Incident alerts

**Alerting:**

```yaml
Alerts to set up:
  - Error rate > 1% → Page on-call
  - Response time > 1s → Warning
  - Database connection pool exhausted → Critical
  - Payment service down → Critical
  - Disk space > 80% → Warning
  - Memory usage > 85% → Warning
```

**Incident Response:**

1. Alert fires
2. On-call engineer notified (Slack + SMS)
3. Assess severity (P1/P2/P3)
4. Page additional team members if needed
5. Root cause analysis
6. Fix deployed
7. Post-mortem within 24 hours

**Timeline:** Ongoing
**Owner:** DevOps Engineer + Engineering Lead

---

## PART 6: MAINTENANCE & ITERATION (Ongoing)

### 6.1 Regular Updates & Improvements

**Monthly Sprints:**

- Add 500-1000 new questions
- Improve 10-20 existing questions based on feedback
- Deploy 2-3 small features
- Bug fixes
- Performance optimization

**Feature Backlog (Prioritized):**

1. **Week 1-4:** Mobile app (React Native)
2. **Week 5-8:** Video explanations (optional)
3. **Week 9-12:** Study groups/collaboration
4. **Week 13-16:** AI tutoring chatbot
5. **Week 17-20:** Advanced adaptive learning
6. **Week 21+:** Institutional dashboard expansion

**Content Expansion:**

- Month 1-2: USMLE Step 2 CK (1000 questions)
- Month 3-4: NCLEX-RN (1000 questions)
- Month 5-6: CPA prep (800 questions)
- Month 7-8: MCAT (1000 questions)

### 6.2 Scaling Infrastructure

**Horizontal Scaling:**

```
0-100 users: Single EC2 instance + RDS small
100-1000 users: Auto-scaling group (2-4 instances) + RDS medium
1000-10k users: Kubernetes cluster + RDS large + Redis cluster
10k+ users: Multi-region deployment + Read replicas
```

**Database Optimization:**

- Analyze slow query logs
- Add indexes as needed
- Archive old data (>1 year)
- Query optimization
- Connection pooling (PgBouncer)

**Caching Strategy:**

- Cache question stems (Redis, 1hr TTL)
- Cache user progress (Redis, 5min TTL)
- Cache analytics (Redis, 1hr TTL)
- Cache frequently accessed content (CloudFront, 24hr)

### 6.3 Compliance & Support

**Regulatory Compliance:**

- **GDPR:**
  - Data export functionality
  - Right to deletion
  - Privacy policy clarity
  - Consent management
- **HIPAA (if handling medical data):**
  - Encrypt patient data
  - Audit logs
  - Access controls
  - Business associate agreements
- **FERPA (if serving K-12):**
  - Educational records privacy
  - Parent consent
  - Data security

**Customer Support:**

- **Channels:** Email, in-app chat, email
- **Response time:** < 4 hours for critical issues
- **Team:** 1 support specialist initially, scale with users
- **Tools:** Zendesk or Intercom

**Tools:**

- Zendesk: Ticketing system
- Intercom: In-app messaging
- Help Scout: Email support
- Loom: Video tutorials

---

## PART 7: RISKS & MITIGATION

### Risk Assessment

| Risk                                | Likelihood | Impact   | Mitigation                                          |
| ----------------------------------- | ---------- | -------- | --------------------------------------------------- |
| Poor content quality                | Medium     | High     | Rigorous SME vetting, peer review, user feedback    |
| User acquisition slow               | Medium     | High     | Strong marketing, free trial, referral program      |
| Technical scaling issues            | Low        | High     | Load testing, auto-scaling, database optimization   |
| Payment processing failures         | Low        | High     | Stripe redundancy, multiple payment methods         |
| Data security breach                | Low        | Critical | Encryption, access controls, regular audits         |
| Key team member leaves              | Medium     | Medium   | Documentation, cross-training, backup resources     |
| Competitor launches similar product | High       | Medium   | Rapid iteration, unique features, community lock-in |
| Regulatory compliance issues        | Low        | High     | Legal review, compliance specialist, regular audits |

### Mitigation Strategies

**Content Quality:**

- 2-reviewer system for all content
- Monthly accuracy audits
- User feedback flag system
- SME incentive bonuses for high-quality content

**User Acquisition:**

- Free trial (50 questions, 7 days)
- Freemium tier (limited questions)
- University partnerships for discount access
- Referral program (20% discount for referrer + referee)
- Content marketing (blogs, YouTube)

**Technical Resilience:**

- Regular backups (daily, multi-region)
- Automated failover
- Load testing before launch
- Chaos engineering (fault injection testing)
- Redundant payment processors

**Security:**

- Annual penetration testing
- Bug bounty program
- Employee security training
- Incident response plan
- DLP (Data Loss Prevention) tools

---

## PART 8: FINANCIAL PROJECTIONS

### Revenue Model

**Pricing Tiers:**
| Tier | Price | Duration | Users | Revenue |
|------|-------|----------|-------|---------|
| Trial | Free | 7 days | 20% | $0 |
| Basic | $49 | 1 month | 40% | $19,600 |
| Plus | $129 | 3 months | 30% | $16,740 |
| Ultimate | $299 | 12 months | 10% | $8,970 |
| **TOTAL** | | | | **$45,310/month** |

**Growth Assumptions:**

**Year 1:**

- Months 1-3: 100 users ($5k MRR)
- Months 4-6: 500 users ($25k MRR)
- Months 7-9: 1,500 users ($75k MRR)
- Months 10-12: 3,000 users ($150k MRR)
- **Year 1 Total:** $450k revenue

**Year 2:**

- 10,000 active users
- Expansion to 3 new exam types
- Institutional sales ($50k/year per school, 5 institutions = $250k/year)
- **Year 2 Total:** $1.5M revenue

**Cost Breakdown (Year 1):**
| Item | Cost |
|------|------|
| Salaries (expanded team) | $400k |
| Infrastructure | $60k |
| Content creation | $100k |
| Marketing | $80k |
| Legal/Compliance | $20k |
| Miscellaneous | $40k |
| **TOTAL** | **$700k** |

**Year 1 Profit/Loss:** -$250k (expected, typical for startups)
**Year 2 Profit/Loss:** +$800k (expected breakeven Q3)

---

## PART 9: SUCCESS METRICS & KPIs

### Key Performance Indicators (First 12 months)

| Metric                          | Target    | Measurement                          |
| ------------------------------- | --------- | ------------------------------------ |
| User Signups                    | 3,000     | Monthly active users                 |
| Conversion Rate (Free→Paid)     | 15-20%    | (Paid users / Free users) × 100      |
| Churn Rate                      | <5%/month | (Cancelled / Total) × 100            |
| Monthly Recurring Revenue (MRR) | $150k     | Subscription revenue                 |
| Customer Lifetime Value (LTV)   | $300+     | Average revenue per user             |
| Net Promoter Score (NPS)        | 50+       | Survey question: "Recommend?"        |
| Feature Adoption                | 70%+      | % of users using flashcards, etc.    |
| Test Completion Rate            | 80%+      | (Completed / Started) × 100          |
| Average Session Duration        | 60+ min   | Time in app per session              |
| Question Accuracy Improvement   | +15%      | User accuracy end of month vs. start |

---

## PART 10: ROLLOUT TIMELINE SUMMARY

```
Month 1: Planning, Design, Team Building
├─ Requirements gathering
├─ Market research
├─ Competitor analysis
├─ Team hiring & onboarding
├─ Architecture design
└─ UI/UX design complete

Month 2-3: Foundation Development
├─ Database setup
├─ Authentication system
├─ Question bank API
├─ Basic frontend pages
├─ Payment integration (Stripe)
└─ Alpha testing

Month 4-5: Core Features
├─ Test engine (Timed + Tutor modes)
├─ Dashboard & analytics
├─ Question content (1000+)
├─ Mobile responsive design
├─ Study planner
└─ Feature integration

Month 6: Refinement & Testing
├─ Flashcard system
├─ Advanced analytics
├─ Admin CMS
├─ Security testing
├─ Load testing (1000+ concurrent)
└─ Beta recruitment

Month 7: Launch Preparation
├─ Final QA
├─ Marketing setup
├─ Customer support training
├─ Infrastructure hardening
├─ Soft launch with beta users
└─ Monitoring setup

Month 8+: Growth & Iteration
├─ Public launch
├─ Monitor metrics & user feedback
├─ Monthly sprints (new features, content)
├─ Expand exam types
├─ Mobile app development
└─ Institutional partnerships
```

---

## CONCLUSION

This comprehensive plan outlines the complete development of a **UWorld-style exam preparation platform** from concept to launch. Key success factors:

1. **Content Quality** (90% of value) - Rigorous SME vetting
2. **User Experience** - Clean, fast, exam-like interface
3. **Data-Driven Learning** - Rich analytics and adaptive algorithms
4. **Secure & Scalable** - Multi-AZ database, auto-scaling infrastructure
5. **Strong Go-to-Market** - Marketing, partnerships, referral program

**Timeline:** 8 months to launch MVP
**Budget:** $90k-$150k development
**Team:** 8-12 people (expandable)

The platform is designed to be **modular** (easily add exam types), **scalable** (handle 10k+ concurrent users), and **defensible** (high barrier to entry due to content quality).

---

**Document Version:** 1.0
**Last Updated:** January 28, 2025
**Owner:** Project Manager
