# Adding Past Papers & Books to EduPrep Platform

## Overview

This plan outlines the strategy to add past papers (previous exam questions/papers) and books (study materials) to the EduPrep platform with the following critical requirements:

### **Key Requirements:**

1. **Content Protection** - Users CANNOT download content or take screenshots
2. **In-App Testing** - Users can take adaptive tests based on books/chapters studied
3. **Dynamic Everything** - NO hardcoded data; all content managed dynamically
4. **MongoDB-Only Storage** - All user data and progress stored in MongoDB, NOT localStorage
5. **Related Test Recommendations** - Automatically suggest relevant tests based on study material

---

## 1. Architecture & Database Design

### 1.1 New Collections/Models Needed

#### **PastPaper Model**

```typescript
interface IPastPaper {
  _id: ObjectId;
  title: string;
  examType: string; // e.g., "MCAT", "BOARD_EXAM", "ENTRANCE_TEST"
  year: number; // e.g., 2023, 2024
  month?: string; // e.g., "January", "June"
  difficulty: "easy" | "medium" | "hard";
  totalQuestions: number;
  duration: number; // in minutes
  subjects: string[]; // e.g., ["Biology", "Chemistry", "Physics"]
  description: string;
  pdfUrl: string; // S3/Cloud storage link
  solutionUrl?: string; // Solutions PDF link
  fileSize: number; // in MB
  uploadedBy: ObjectId; // Admin user ID
  downloadCount: number;
  rating: number; // 1-5 stars
  reviews: IReview[];
  tags: string[];
  questions?: ObjectId[]; // Reference to Question collection if parsed
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Book Model**

```typescript
interface IBook {
  _id: ObjectId;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  category: string; // e.g., "Biology", "Chemistry", "Physics", "General"
  subject: string;
  description: string;
  coverImageUrl: string; // S3/Cloud storage link
  pdfUrl?: string; // For free books
  chapters: IChapter[]; // Structured chapters
  totalPages: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  edition: number;
  publishDate: Date;
  language: string;
  rating: number; // 1-5 stars
  reviews: IReview[];
  tags: string[];
  isFree: boolean;
  price?: number; // For paid books
  downloadCount: number;
  viewCount: number;
  relatedTopics: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface IChapter {
  chapterId: string;
  title: string;
  pageStart: number;
  pageEnd: number;
  summary?: string;
  keywords: string[];
}
```

#### **Review Model** (for both)

```typescript
interface IReview {
  _id: ObjectId;
  userId: ObjectId;
  resourceId: ObjectId; // PastPaper or Book ID
  resourceType: "pastpaper" | "book";
  rating: number; // 1-5
  title: string;
  comment: string;
  helpful: number; // upvotes
  createdAt: Date;
  updatedAt: Date;
}
```

#### **UserLibrary Model** (Track user's reading activity and progress - NO downloads)

```typescript
interface IUserLibrary {
  _id: ObjectId;
  userId: ObjectId;
  savedPastPapers: ObjectId[];
  savedBooks: ObjectId[];
  readingProgress: {
    bookId: ObjectId;
    chapterId?: string;
    currentPage: number;
    percentageComplete: number;
    lastAccessedAt: Date;
    timeSpentMinutes: number;
    notes: string[];
  }[];
  testAttempts: {
    testId: ObjectId;
    sourceBook?: ObjectId; // Which book this test was taken from
    sourceChapter?: string; // Which chapter triggered this test
    attemptedAt: Date;
    score: number;
    totalQuestions: number;
    timeSpent: number;
  }[];
  readBooks: ObjectId[]; // Books user has opened
  createdAt: Date;
  updatedAt: Date;
}
```

#### **ChapterTest Model** (Dynamic tests mapped to chapters)

```typescript
interface IChapterTest {
  _id: ObjectId;
  bookId: ObjectId;
  chapterId: string;
  topicId: ObjectId; // Reference to topics in question bank
  title: string; // Auto-generated: "Chapter 5: Photosynthesis - Quiz"
  questions: ObjectId[]; // References to questions in QBank
  totalQuestions: number;
  duration: number; // in minutes
  difficulty: "easy" | "medium" | "hard";
  generatedAutomatically: boolean; // System-generated vs manually created
  createdAt: Date;
  updatedAt: Date;
}
```

#### **ContentSession Model** (In-app viewing sessions - replaces downloads)

```typescript
interface IContentSession {
  _id: ObjectId;
  userId: ObjectId;
  contentType: "book" | "pastpaper";
  contentId: ObjectId;
  chapterId?: string; // For book chapters
  startedAt: Date;
  endedAt?: Date;
  totalTimeMinutes: number;
  pagesViewed: number[];
  sessionToken: string; // Unique token for this session (expires after logout)
  ipAddress: string;
  deviceInfo: {
    userAgent: string;
    osType: string;
  };
  screenshotAttempts: number; // Track if user tries to screenshot
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 2. Backend Implementation (Express.js)

### 2.1 New Service: **content-service**

Create a dedicated microservice for managing past papers and books.

### 2.2 API Endpoints

#### **Past Papers**

```
GET    /api/content/pastpapers              - List all past papers (with pagination, filters)
GET    /api/content/pastpapers/:id          - Get specific past paper details
GET    /api/content/pastpapers/:id/view     - Open paper in protected viewer (creates session)
POST   /api/content/pastpapers              - Create past paper (Admin)
PUT    /api/content/pastpapers/:id          - Update past paper (Admin)
DELETE /api/content/pastpapers/:id          - Delete past paper (Admin)
GET    /api/content/pastpapers/:id/reviews  - Get reviews for past paper
POST   /api/content/pastpapers/:id/reviews  - Add review (Authenticated users)
POST   /api/content/session/end             - End viewing session (save progress)
```

Note: **NO Download endpoint** - All viewing is streamed in protected viewer only.

#### **Books**

```
GET    /api/content/books                   - List all books (with filters, search)
GET    /api/content/books/:id               - Get book details
GET    /api/content/books/:id/chapters      - Get book chapters/TOC
GET    /api/content/books/:id/read          - Open book in protected viewer (creates session)
GET    /api/content/books/:id/chapter/:cid/read - Open specific chapter in viewer
POST   /api/content/books                   - Create book (Admin)
PUT    /api/content/books/:id               - Update book (Admin)
DELETE /api/content/books/:id               - Delete book (Admin)
GET    /api/content/books/:id/reviews       - Get book reviews
POST   /api/content/books/:id/reviews       - Add review
GET    /api/content/books/:id/related-tests - Get tests for this book
GET    /api/content/books/:id/chapter/:cid/related-tests - Get tests for specific chapter
```

Note: **NO Download endpoint** - All viewing is streamed in protected viewer only.

#### **User Library & Tests**

```
GET    /api/content/library                 - Get user's library (reading progress, tests taken)
POST   /api/content/library/save-paper/:id  - Save past paper to library
POST   /api/content/library/save-book/:id   - Save book to library
DELETE /api/content/library/save-paper/:id  - Remove from saved papers
DELETE /api/content/library/save-book/:id   - Remove from saved books
PUT    /api/content/library/progress        - Update reading progress (saved in MongoDB)
GET    /api/content/tests/related            - Get tests related to currently read material
GET    /api/content/chapter-tests            - Get all chapter tests
GET    /api/content/chapter-tests/:testId    - Get specific chapter test details
POST   /api/content/chapter-tests/:testId/attempt - Attempt a chapter test (creates TestSession)
GET    /api/content/session/progress         - Get current reading/test session progress
```

### 2.3 Middleware & Services

- **FileUpload Service** - Handle PDF uploads to S3/Cloud storage (Admin only)
- **ContentProtectionService** - Enforce in-app viewing, prevent downloads/screenshots
- **SessionManagementService** - Create/manage protected viewing sessions
- **PaginationService** - For listing with filters
- **SearchService** - Full-text search for books and papers
- **ReviewService** - Rate and review functionality
- **DynamicTestGenerationService** - Auto-generate chapter tests from question bank
- **RecommendationService** - Suggest related tests based on reading progress
- **AnalyticsService** - Track views, reading time, test attempts (NO downloads tracked)
- **ScreenshotDetectionService** - Detect and log screenshot attempts

---

## 3. Database Optimization

### 3.1 Indexes

```typescript
// PastPaper
pastPaperSchema.index({ examType: 1, year: -1 });
pastPaperSchema.index({ subjects: 1 });
pastPaperSchema.index({ difficulty: 1 });
pastPaperSchema.index({ rating: -1 });
pastPaperSchema.index({ title: "text", description: "text" });

// Book
bookSchema.index({ category: 1 });
bookSchema.index({ subject: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ rating: -1 });
bookSchema.index({ title: "text", description: "text", author: "text" });
bookSchema.index({ isbn: 1, unique: true });

// UserLibrary
userLibrarySchema.index({ userId: 1, unique: true });

// ChapterTest
chapterTestSchema.index({ bookId: 1, chapterId: 1 });
chapterTestSchema.index({ topicId: 1 });
chapterTestSchema.index({ difficulty: 1 });

// ContentSession
contentSessionSchema.index({ userId: 1, contentId: 1 });
contentSessionSchema.index({ sessionToken: 1 });
contentSessionSchema.index({ userId: 1, startedAt: -1 });
```

---

## 4. Frontend Implementation

### 4.1 New Pages/Components

#### **PastPapers Section**

```
/pastpapers
├── /pastpapers
│   └── PastPapersListPage
│       ├── FilterSidebar (by exam type, year, difficulty, subject)
│       ├── SearchBar
│       └── PastPaperCard (with preview, rating, save button)
├── /pastpapers/:id
│   └── PastPaperDetailPage
│       ├── PaperInfo (title, year, difficulty, duration)
│       ├── ProtectedPDFViewer (in-app only, no download)
│       ├── ReadingProgressBar
│       ├── RatingSection
│       ├── ReviewsSection
│       ├── RelatedTests (tests based on subjects)
│       └── SaveButton (not download)
```

#### **Books Section**

```
/books
├── /books
│   └── BooksListPage
│       ├── FilterSidebar (by category, subject, difficulty, language)
│       ├── SearchBar
│       └── BookCard (with cover, author, rating, progress indicator)
├── /books/:id
│   └── BookDetailPage
│       ├── BookInfo (title, author, ISBN, edition)
│       ├── ChaptersSection (TOC with progress indicators)
│       ├── RatingSection
│       ├── ReviewsSection
│       ├── ReadButton (opens protected viewer)
│       └── RelatedBooks
├── /books/:id/read
│   └── BookReaderPage (Protected Viewer)
│       ├── PDF Viewer (in-app only, cannot be downloaded)
│       ├── Chapter navigation
│       ├── Reading progress bar (saved to MongoDB)
│       ├── Study notes section (stored in MongoDB)
│       ├── Highlights/bookmarks (stored in MongoDB)
│       └── "Take Test" buttons for each chapter
├── /books/:id/chapter/:chapterId/test
│   └── Chapter Test Page (Dynamically generated)
│       ├── Chapter-specific test questions
│       ├── Timer
│       ├── Submit test
│       └── Results with analytics
```

#### **User Library & Study Dashboard**

```
/library
├── /library/saved-papers
│   └── List of saved past papers
│       └── Quick access to open in viewer
├── /library/saved-books
│   └── List of saved books
│       ├── Progress indicator for each book
│       └── Quick access to resume reading
├── /library/reading-progress
│   └── Reading statistics
│       ├── Books in progress
│       ├── Chapters completed
│       ├── Total reading time
│       └── Time spent per chapter
├── /library/test-history
│   └── All tests attempted from studied material
│       ├── Chapter tests taken
│       ├── Scores and performance
│       ├── Time spent on each test
│       └── Recommended next topics
├── /library/recommendations
│   └── AI-suggested tests based on reading progress
│       ├── "You finished Chapter 5, try this test!"
│       └── "Related tests for Biology: Photosynthesis"
```

### 4.2 Components to Create

```
components/
├── PastPaperCard.tsx
├── BookCard.tsx
├── ProtectedPDFViewer.tsx (In-app only, DRM protected)
├── ChaptersList.tsx
├── ReviewSection.tsx
├── RatingStars.tsx
├── FilterSidebar.tsx
├── SearchBar.tsx
├── ReadingProgressBar.tsx
├── ChapterTestButton.tsx (Dynamic test for each chapter)
├── RelatedTestsPanel.tsx (Suggests tests based on content)
├── StudyNotesEditor.tsx (Notes stored in MongoDB)
├── BookmarkManager.tsx (Bookmarks/highlights stored in MongoDB)
└── ScreenshotBlocker.tsx (Prevents screenshots and screen capture)
```

### 4.3 State Management (Zustand) - NO localStorage

**IMPORTANT:** All state persists to MongoDB server-side. Zustand is ONLY for UI state during current session.

```typescript
interface ContentState {
  // Current session state only
  pastPapers: IPastPaper[];
  books: IBook[];
  currentReadingSession: {
    contentId: string;
    contentType: "book" | "pastpaper";
    currentPage: number;
    sessionToken: string;
  } | null;
  relatedTests: IChapterTest[];
  searchQuery: string;
  filters: {
    examType?: string;
    year?: number;
    difficulty?: string;
    subject?: string;
  };

  // Methods - all sync with MongoDB
  setSearchQuery: (query: string) => void;
  setFilters: (filters: any) => void;

  // Reading session management
  startReadingSession: (
    contentId: string,
    type: "book" | "pastpaper",
  ) => Promise<void>;
  updateReadingProgress: (page: number) => Promise<void>; // Saves to MongoDB
  endReadingSession: () => Promise<void>; // Saves to MongoDB

  // Library management - always syncs with MongoDB
  addToLibrary: (type: "paper" | "book", id: string) => Promise<void>;
  removeFromLibrary: (type: "paper" | "book", id: string) => Promise<void>;

  // Test management
  loadRelatedTests: (bookId: string, chapterId?: string) => Promise<void>;
}
```

**CRITICAL:** On page reload or session expiry:

- User state loaded from MongoDB (not from localStorage)
- Reading progress retrieved from MongoDB
- Session token validated against server
- User must re-authenticate if session expired

---

## 5. Content Protection & DRM (Digital Rights Management)

### 5.1 Download Prevention

**Methods to prevent downloads:**

- Stream PDFs only in protected viewer (no direct download links)
- Disable right-click context menu on PDF viewer
- Prevent HTML5 download attribute on viewer
- Use `X-Frame-Options` headers to prevent embedding
- Implement session token validation for each page view

```typescript
// Example: Protected PDF viewing endpoint
GET /api/content/books/:id/pages/:pageNumber?sessionToken=xxx
// Returns single page image instead of full PDF
// Session token validates user and expires after logout
```

### 5.2 Screenshot Prevention

**Methods to prevent screenshots:**

- Detect screenshot attempts via JavaScript
- Blur content on screenshot event (onCopy, onContextMenu, onKeyDown)
- Watermark pages with user ID and timestamp
- Log all screenshot attempts to MongoDB for audit
- Use CSS user-select: none to prevent text selection/copy
- On mobile: Disable copy-paste functionality

```typescript
// Example: Screenshot detection
window.addEventListener("keydown", (e) => {
  // Detect Print Screen, Cmd+Shift+4 (Mac), etc.
  if (isScreenshotKey(e)) {
    logScreenshotAttempt(userId);
    blurContent();
  }
});
```

### 5.3 Cloud Storage Setup

**Options:**

- **AWS S3** (Recommended) with CloudFront CDN for streaming
- **Google Cloud Storage** with signed URLs
- **Azure Blob Storage** with SAS tokens

**Upload Process:**

```
Admin Upload → Multer (validate PDF) → Cloud Storage → Generate Signed URL → Store URL in MongoDB
```

**Viewing Process:**

```
User Request → Authenticate & Create Session → Generate Temporary Signed URL → Stream Page Image → URL Expires after logout
```

### 5.4 PDF Handling

- Use **pdfjs-dist** for secure in-browser rendering
- Render PDFs as images (page-by-page) instead of full PDF
- Never expose direct file URLs to user
- Implement page-level access control
- Track page views in ContentSession model

---

## 6. Dynamic Test Generation Based on Study Material

### 6.1 Automatic Test Creation from Chapters

When a book chapter is created, the system automatically generates related tests:

```typescript
// Example: Auto-generate tests for new chapter
async function generateChapterTest(bookId, chapter) {
  // 1. Extract keywords from chapter
  const keywords = extractKeywords(chapter.content);

  // 2. Find related questions from QBank
  const relatedQuestions = await Question.find({
    topics: { $in: keywords },
    difficulty: book.difficulty,
  }).limit(30);

  // 3. Create ChapterTest automatically
  const test = new ChapterTest({
    bookId,
    chapterId: chapter.chapterId,
    title: `${chapter.title} - Practice Quiz`,
    questions: relatedQuestions.map((q) => q._id),
    difficulty: book.difficulty,
    generatedAutomatically: true,
  });

  await test.save();
  return test;
}
```

### 6.2 Dynamic Test Recommendations

As user reads content, system suggests related tests:

```typescript
// Example: Suggest tests while reading chapter
async function getSuggestedTests(userId, bookId, chapterId) {
  // Get current chapter being read
  const chapter = await Book.findById(bookId).select(`chapters[${chapterId}]`);

  // Find tests for this chapter
  const tests = await ChapterTest.find({
    bookId,
    chapterId,
    generatedAutomatically: true,
  });

  // Check which tests user hasn't taken yet
  const library = await UserLibrary.findOne({ userId });
  const takenTestIds = library.testAttempts.map((t) => t.testId);

  // Return suggested tests
  const suggested = tests.filter((t) => !takenTestIds.includes(t._id));
  return suggested;
}
```

### 6.3 Link Tests to Study Material

**In reading progress stored in MongoDB:**

```typescript
readingProgress: {
  bookId: ObjectId;
  chapterId: string;
  currentPage: number;
  relatedTestId: ObjectId; // Link to suggested test
  testSuggested: boolean;
  testSuggestedAt: Date;
}
```

### 6.4 Test Taking from Study Context

Users can take tests directly from book chapters:

```
/books/:id/chapter/:chapterId/read
  → User reads chapter
  → "Take Quiz" button appears
  → /books/:id/chapter/:chapterId/test
  → Test questions related to chapter
  → Results saved with reference to source chapter
```

---

## 7. Search & Filter Implementation

### 6.1 Full-Text Search

```typescript
// MongoDB text index search
db.books.find({ $text: { $search: "quantum physics" } });
db.pastpapers.find({ $text: { $search: "mcat 2023" } });
```

### 6.2 Advanced Filters

```typescript
{
  examType: ["MCAT", "BOARD"],
  year: [2023, 2024],
  difficulty: ["medium", "hard"],
  subject: ["Biology"],
  rating: { $gte: 4 },
  isFree: true
}
```

### 6.3 Sorting Options

- Latest
- Most Downloaded
- Highest Rated
- Most Reviewed
- Most Relevant (search)

---

## 7. Admin Panel Features

### 7.1 Admin Dashboard for Content

```
/admin/content
├── /admin/content/pastpapers
│   ├── Upload new past paper
│   ├── Edit past paper details
│   ├── View download statistics
│   └── Delete past paper
├── /admin/content/books
│   ├── Upload/add new book
│   ├── Edit book details
│   ├── Manage chapters
│   ├── View analytics
│   └── Delete book
└── /admin/content/reviews
    ├── Moderate reviews
    ├── Remove inappropriate reviews
    └── Flag spam
```

### 7.2 Bulk Operations

- Bulk upload past papers
- Batch edit metadata
- CSV import for books
- Categorization tools

---

## 8. User Features & Analytics

### 8.1 User Features

- **Save for Later** - Bookmark papers/books
- **Reading Progress** - Track where user is in a book
- **Notes & Highlights** - Annotate PDFs (future)
- **Download History** - View all downloads
- **Recommendations** - "Similar books/papers based on your history"

### 8.2 Analytics to Track

```
- Download count per resource
- Average rating
- Number of reviews
- Reading time spent
- Popular subjects/topics
- User engagement metrics
- Search trends
```

---

## 9. Implementation Phases

### **Phase 1: Core Infrastructure (Week 1-2)**

- [ ] Create PastPaper and Book models
- [ ] Create content-service microservice
- [ ] Implement basic CRUD endpoints
- [ ] Setup file upload to S3
- [ ] Create database indexes

### **Phase 2: Frontend UI (Week 2-3)**

- [ ] Create PastPapersListPage
- [ ] Create BooksListPage
- [ ] Implement PDF viewer
- [ ] Add filter and search functionality
- [ ] Create detail pages

### **Phase 3: User Features (Week 3-4)**

- [ ] UserLibrary functionality
- [ ] Save/bookmark resources
- [ ] Rating and reviews system
- [ ] Download tracking
- [ ] Reading progress

### **Phase 4: Admin & Analytics (Week 4-5)**

- [ ] Admin upload panel
- [ ] Content management dashboard
- [ ] Analytics/statistics view
- [ ] Bulk operations
- [ ] Review moderation

### **Phase 5: Polish & Optimization (Week 5-6)**

- [ ] Search optimization
- [ ] Performance tuning
- [ ] Recommendations engine
- [ ] Testing
- [ ] Documentation

---

## 10. Tech Stack for New Features

### Backend

- **Express.js** - API server
- **MongoDB** - Database
- **Mongoose** - ODM
- **AWS SDK** - S3 integration
- **Multer** - File upload middleware
- **Elasticsearch** (optional) - Advanced search

### Frontend

- **Next.js** - Framework
- **React** - UI
- **pdfjs-dist** - PDF viewer
- **React-PDF** (optional) - PDF rendering
- **Zustand** - State management
- **TailwindCSS** - Styling
- **Axios** - HTTP requests

---

## 11. Security Considerations

### 11.1 File Security

- Validate file types (only PDFs)
- Scan for malware
- Limit file size (max 100MB)
- Implement virus scanning

### 11.2 Access Control

- Only admins can upload
- Users can download only if authenticated
- Implement download quotas if needed
- Rate limiting on downloads

### 11.3 Content Moderation

- Review moderation system
- Flag inappropriate content
- Audit trail for admin actions
- DMCA/copyright compliance

### 11.4 DRM & Screenshot Protection

- Session tokens expire after logout
- IP address validation for sessions
- Screenshot attempt logging
- Watermarking of content with user ID/timestamp
- Page-level access control with authentication

---

## 12. MongoDB-Only Data Storage (NO localStorage)

### CRITICAL: All Data Stored Server-Side

**The following data must NEVER be stored in localStorage:**

```
❌ User authentication tokens
❌ User profile information
❌ Reading progress
❌ Test history
❌ Test answers
❌ Bookmarks and notes
❌ Study material metadata
❌ Session information
```

**All data must be stored in MongoDB collections:**

```typescript
// User Sessions (not localStorage)
interface ISession {
  _id: ObjectId;
  userId: ObjectId;
  sessionToken: string; // Generated, not stored client-side
  createdAt: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
}

// Reading Progress (not localStorage)
interface IReadingProgress {
  userId: ObjectId;
  bookId: ObjectId;
  chapterId: string;
  currentPage: number;
  timeSpentMinutes: number;
  lastAccessedAt: Date;
}

// Test Attempts (not localStorage)
interface ITestAttempt {
  userId: ObjectId;
  testId: ObjectId;
  answers: {
    questionId: ObjectId;
    selectedAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
  }[];
  score: number;
  attemptedAt: Date;
}

// Study Notes (not localStorage)
interface IStudyNote {
  userId: ObjectId;
  bookId: ObjectId;
  chapterId: string;
  pageNumber: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Bookmarks & Highlights (not localStorage)
interface IBookmark {
  userId: ObjectId;
  bookId: ObjectId;
  chapterId: string;
  pageNumber: number;
  type: "bookmark" | "highlight";
  content?: string;
  color?: string;
  createdAt: Date;
}
```

### 12.1 Data Sync Strategy

```typescript
// Frontend (React/Zustand)
- Temporary in-memory state during session
- NO persistence to localStorage

// Network Requests
- Every state change triggers API call to MongoDB
- Session token sent with headers (generated by server, not stored client)

// Server (Express/MongoDB)
- All data permanently stored
- Validates all requests server-side
- Returns fresh data on every query

// On Browser Reload
1. User session token sent to server
2. Server validates token
3. Server retrieves fresh user data from MongoDB
4. Frontend repopulates from server response
```

### 12.2 Implementation Example

```typescript
// WRONG ❌ - Storing in localStorage
const saveProgress = (progress) => {
  localStorage.setItem("readingProgress", JSON.stringify(progress));
  // This is INSECURE and VIOLATES requirements
};

// CORRECT ✅ - Storing in MongoDB only
const saveProgress = async (userId, bookId, page) => {
  // Request goes to server
  const response = await apiClient.put("/api/content/library/progress", {
    bookId,
    currentPage: page,
  });

  // Server saves to MongoDB
  // Server returns updated progress
  // Frontend updates Zustand state (temporary)
  // NO localStorage involved

  updateReadingState(response.data);
};

// On page reload
const loadProgress = async (userId) => {
  // Fetch from server (not localStorage)
  const response = await apiClient.get("/api/content/library/progress");

  // Server retrieves from MongoDB
  updateReadingState(response.data);
};
```

### 12.3 Session Management

```typescript
// Session token is NEVER stored in localStorage
// It's kept in HTTP-only cookie OR sent fresh each request

// API Header setup
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Sends HTTP-only cookies automatically
});

// Server validates every request
app.use(authenticate); // Middleware validates session token
```

---

## 13. Future Enhancements

- [ ] AI-powered search & recommendations
- [ ] OCR for past paper questions extraction
- [ ] Study notes feature (stored in MongoDB)
- [ ] Collaborative notes/highlighting (stored in MongoDB)
- [ ] Video explanations for solutions
- [ ] Timed mock tests from past papers
- [ ] Book chapters as separate study units
- [ ] Real-time test recommendations based on reading
- [ ] Integration with flashcard system
- [ ] Reading statistics and analytics
- [ ] Subscription tiers for premium content

---

## 13. Database Schema Summary

```
eduprep_content
├── pastpapers
├── books
├── reviews
├── chapters
└── user_libraries
```

---

## 14. API Response Examples

### Get Past Papers List

```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "title": "MCAT 2024 January",
      "examType": "MCAT",
      "year": 2024,
      "difficulty": "hard",
      "rating": 4.5,
      "downloadCount": 1250,
      "pdfUrl": "s3://..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### Get Book Details

```json
{
  "success": true,
  "data": {
    "id": "456",
    "title": "Organic Chemistry",
    "author": "John Smith",
    "isbn": "978-3-16-148410-0",
    "rating": 4.7,
    "chapters": [
      {
        "title": "Introduction",
        "pageStart": 1,
        "pageEnd": 25
      }
    ],
    "price": 9.99,
    "coverUrl": "s3://..."
  }
}
```

---

## 15. Getting Started Checklist

- [ ] Create `content-service` folder in `/services`
- [ ] Install MongoDB packages and set up models
- [ ] Set up AWS S3 credentials in `.env`
- [ ] Create API routes for past papers and books
- [ ] Design database schema and create indexes
- [ ] Build frontend pages and components
- [ ] Implement file upload functionality
- [ ] Create review and rating system
- [ ] Build user library feature
- [ ] Create admin panel
- [ ] Setup PDF viewer
- [ ] Implement search and filters
- [ ] Add analytics tracking
- [ ] Test end-to-end flow
- [ ] Documentation

---

## Conclusion

This plan provides a comprehensive roadmap for adding past papers and books to the EduPrep platform. The modular approach allows for incremental implementation while maintaining code quality and user experience.

**Estimated Timeline:** 5-6 weeks for full implementation (depending on team size and complexity)
