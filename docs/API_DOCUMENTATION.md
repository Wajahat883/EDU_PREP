# EduPrep Platform - API Documentation

## Overview

Complete API reference for the EduPrep platform. The platform uses RESTful APIs across 5 microservices with JWT-based authentication.

## Base URLs

- **Development**: `http://localhost:3000`
- **Production**: `https://api.eduprep.com`
- **API Gateway**: Routes all requests to appropriate microservices

## Authentication

All endpoints require JWT token in Authorization header:

```bash
Authorization: Bearer {jwt_token}
```

### Token Generation

**POST** `/api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):

```json
{
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 86400,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "student"
  }
}
```

## Authentication Service API

### User Registration

**POST** `/api/auth/register`

**Request**:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "student"
}
```

**Response** (201):

```json
{
  "message": "User registered successfully",
  "userId": "user_123",
  "email": "john@example.com"
}
```

### Token Refresh

**POST** `/api/auth/refresh`

**Request**:

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response** (200):

```json
{
  "token": "eyJhbGc...",
  "expiresIn": 86400
}
```

### Logout

**POST** `/api/auth/logout`

**Response** (200):

```json
{
  "message": "Logged out successfully"
}
```

## Question Bank Service API

### Get Questions

**GET** `/api/questions?subject=Math&difficulty=medium&limit=20&skip=0`

**Query Parameters**:

- `subject` (string): Filter by subject
- `difficulty` (string): easy, medium, hard
- `limit` (number): Results per page (default: 20)
- `skip` (number): Pagination offset
- `topic` (string): Filter by topic
- `tags` (string[]): Filter by tags

**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "q_123",
      "questionText": "What is 2+2?",
      "subject": "Math",
      "topic": "Arithmetic",
      "difficulty": "easy",
      "options": [
        { "text": "3", "isCorrect": false },
        { "text": "4", "isCorrect": true },
        { "text": "5", "isCorrect": false }
      ],
      "explanation": "2+2=4",
      "timeEstimate": 1
    }
  ],
  "total": 145,
  "limit": 20,
  "skip": 0
}
```

### Get Single Question

**GET** `/api/questions/{questionId}`

**Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "q_123",
    "questionText": "What is 2+2?",
    "subject": "Math",
    "difficulty": "easy",
    "options": [...],
    "explanation": "2+2=4",
    "timeEstimate": 1,
    "tags": ["fundamentals"],
    "createdBy": "instructor_456",
    "difficulty": "easy"
  }
}
```

### Create Question (Admin/Instructor)

**POST** `/api/questions`

**Request**:

```json
{
  "questionText": "What is the capital of France?",
  "subject": "Geography",
  "topic": "Capital Cities",
  "difficulty": "easy",
  "options": [
    { "text": "Paris", "isCorrect": true },
    { "text": "Lyon", "isCorrect": false },
    { "text": "Marseille", "isCorrect": false }
  ],
  "explanation": "Paris is the capital of France",
  "timeEstimate": 2,
  "tags": ["geography", "capitals"]
}
```

**Response** (201):

```json
{
  "success": true,
  "data": {
    "_id": "q_789",
    "questionText": "What is the capital of France?",
    "status": "pending",
    "createdAt": "2026-01-28T10:00:00Z"
  }
}
```

## Test Engine Service API

### Get Tests

**GET** `/api/tests?subject=Math&limit=10`

**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "test_123",
      "name": "Math Fundamentals Quiz",
      "subject": "Math",
      "duration": 30,
      "totalQuestions": 20,
      "passingScore": 60,
      "difficulty": "medium",
      "createdAt": "2026-01-25T09:00:00Z"
    }
  ],
  "total": 5
}
```

### Get Test Details

**GET** `/api/tests/{testId}`

**Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "test_123",
    "name": "Math Fundamentals Quiz",
    "subject": "Math",
    "duration": 30,
    "totalQuestions": 20,
    "passingScore": 60,
    "questions": [
      { "_id": "q_1", "questionText": "..." },
      { "_id": "q_2", "questionText": "..." }
    ],
    "instructions": "Answer all questions within 30 minutes",
    "createdAt": "2026-01-25T09:00:00Z"
  }
}
```

### Start Test

**POST** `/api/tests/{testId}/start`

**Response** (201):

```json
{
  "success": true,
  "data": {
    "attemptId": "attempt_456",
    "testId": "test_123",
    "startedAt": "2026-01-28T10:15:00Z",
    "expiresAt": "2026-01-28T10:45:00Z",
    "timeRemaining": 1800
  }
}
```

### Submit Answer

**POST** `/api/tests/{testId}/attempts/{attemptId}/answer`

**Request**:

```json
{
  "questionId": "q_123",
  "selectedOption": 1,
  "timeSpent": 15
}
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "questionId": "q_123",
    "isCorrect": true,
    "score": 5,
    "explanation": "Correct answer!"
  }
}
```

### End Test

**POST** `/api/tests/{testId}/attempts/{attemptId}/end`

**Response** (200):

```json
{
  "success": true,
  "data": {
    "attemptId": "attempt_456",
    "totalQuestions": 20,
    "correctAnswers": 16,
    "score": 80,
    "passingScore": 60,
    "passed": true,
    "completedAt": "2026-01-28T10:45:00Z"
  }
}
```

## AI Service API

### Get Question Recommendations

**GET** `/api/ai/recommendations?count=5&subject=Math&focusOnWeakness=true`

**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "questionId": "q_789",
      "relevanceScore": 92,
      "reason": "Strengthen your weak area: Trigonometry",
      "estimatedDifficulty": "medium",
      "estimatedDuration": 5
    }
  ],
  "count": 5
}
```

### Create Learning Path

**POST** `/api/ai/learning-paths`

**Request**:

```json
{
  "subject": "Mathematics",
  "targetLevel": "advanced"
}
```

**Response** (201):

```json
{
  "success": true,
  "data": {
    "pathId": "path_789",
    "userId": "user_123",
    "subject": "Mathematics",
    "progress": 0,
    "milestones": [
      { "id": "m_1", "name": "Master Fundamentals", "progress": 0 }
    ]
  }
}
```

### Predict Test Score

**POST** `/api/ai/predictions/test-score`

**Request**:

```json
{
  "testId": "test_123"
}
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "predictedScore": 78,
    "confidence": 0.85,
    "scoreRange": { "min": 68, "max": 88 },
    "successProbability": 0.92,
    "strugglingTopics": ["Calculus"],
    "interventionNeeded": false
  }
}
```

### Check Plagiarism

**POST** `/api/ai/plagiarism/check`

**Request**:

```json
{
  "essayId": "essay_123",
  "essayText": "Long essay text here...",
  "sources": ["source1", "source2"]
}
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "overallSimilarity": 15,
    "plagiarismRisk": "low",
    "originalityScore": 85,
    "matches": [],
    "flaggedSections": []
  }
}
```

## Payment Service API

### Get Subscription Plans

**GET** `/api/payments/plans`

**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "planId": "plan_basic",
      "name": "Basic",
      "price": 9.99,
      "currency": "USD",
      "billingPeriod": "month",
      "features": ["Unlimited practice", "5 tests/month"]
    },
    {
      "planId": "plan_premium",
      "name": "Premium",
      "price": 19.99,
      "currency": "USD",
      "billingPeriod": "month",
      "features": ["Unlimited everything", "AI coaching"]
    }
  ]
}
```

### Create Subscription

**POST** `/api/payments/subscribe`

**Request**:

```json
{
  "planId": "plan_premium",
  "paymentMethodId": "pm_123"
}
```

**Response** (201):

```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_456",
    "planId": "plan_premium",
    "status": "active",
    "nextBillingDate": "2026-02-28T00:00:00Z",
    "amount": 19.99,
    "currency": "USD"
  }
}
```

## Analytics Service API

### Get User Statistics

**GET** `/api/analytics/users/{userId}/stats`

**Response** (200):

```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "totalQuestionsAttempted": 156,
    "correctAnswers": 118,
    "accuracy": 75.6,
    "averageScore": 76,
    "timeSpent": 12.5,
    "lastActivityAt": "2026-01-28T10:15:00Z"
  }
}
```

### Get Subject Performance

**GET** `/api/analytics/users/{userId}/performance/by-subject`

**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "subject": "Mathematics",
      "questionsAttempted": 45,
      "accuracy": 82,
      "averageScore": 82
    },
    {
      "subject": "English",
      "questionsAttempted": 40,
      "accuracy": 68,
      "averageScore": 70
    }
  ]
}
```

## Error Responses

All errors follow standard format:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2026-01-28T10:00:00Z"
}
```

### Common Error Codes

| Code | Message      | Cause                    |
| ---- | ------------ | ------------------------ |
| 400  | Bad Request  | Invalid parameters       |
| 401  | Unauthorized | Missing/invalid token    |
| 403  | Forbidden    | Insufficient permissions |
| 404  | Not Found    | Resource doesn't exist   |
| 409  | Conflict     | Resource already exists  |
| 500  | Server Error | Internal server error    |

## Rate Limiting

- **Default**: 100 requests per 15 minutes
- **Premium**: 500 requests per 15 minutes
- **Admin**: Unlimited

Headers returned:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1643356800
```

## Pagination

List endpoints support pagination:

```bash
GET /api/questions?limit=20&skip=0&sort=-createdAt
```

**Response includes**:

```json
{
  "data": [...],
  "total": 1450,
  "limit": 20,
  "skip": 0,
  "pages": 73
}
```

## Webhooks

Subscribe to events via `/api/webhooks/subscribe`

**Supported Events**:

- `test.completed`: When user finishes test
- `question.submitted`: When answer submitted
- `subscription.renewed`: When payment processed
- `user.registered`: When new user joins

## SDK & Client Libraries

### JavaScript/TypeScript

```bash
npm install @eduprep/sdk
```

```typescript
import { EduPrepClient } from "@eduprep/sdk";

const client = new EduPrepClient({
  apiKey: "your-api-key",
  baseURL: "https://api.eduprep.com",
});

const questions = await client.questions.list({ subject: "Math" });
```

### Python

```bash
pip install eduprep-sdk
```

```python
from eduprep import EduPrepClient

client = EduPrepClient(api_key='your-api-key')
questions = client.questions.list(subject='Math')
```
