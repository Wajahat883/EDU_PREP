# MongoDB Data Persistence Guide

## Overview

All user personal data is now properly stored in MongoDB when users sign up, login, and interact with the platform.

## User Registration Flow

### 1. Frontend (Login & Signup)

- **File**: `frontend/pages/signup.tsx` and `frontend/pages/login.tsx`
- User enters credentials (email, password, name)
- Frontend sends data to backend API endpoint

### 2. Backend Authentication Service

- **Service**: `services/auth-service`
- **Port**: 3001
- **Database**: MongoDB (`eduprep_auth`)

#### Key Endpoints:

**POST /api/auth/register**

```
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}

MongoDB Storage:
- Email: unique, case-insensitive
- Password: bcrypt hashed (NOT stored in plaintext)
- First Name: plain text
- Last Name: plain text
- Created At: timestamp
- Updated At: timestamp
- Role: "student" (default)
- Email Verified: false (default)
- Is Active: true (default)
```

**POST /api/auth/login**

```
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response:
{
  "userId": "ObjectId",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "accessToken": "JWT_TOKEN",
  "refreshToken": "REFRESH_TOKEN"
}
```

**GET /api/auth/me** (Protected)

```
Headers:
{
  "Authorization": "Bearer JWT_TOKEN"
}

Response:
{
  "userId": "ObjectId",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "emailVerified": false
}
```

**PUT /api/auth/profile** (Protected)

```
Request:
{
  "firstName": "John",
  "lastName": "Doe",
  "timezone": "Asia/Karachi"
}

Updates user record in MongoDB
```

### 3. Data Model (MongoDB Schema)

**User Collection** (`eduprep_auth.users`)

```typescript
{
  _id: ObjectId,
  email: String (unique, lowercase, trimmed),
  passwordHash: String (bcrypt hashed),
  firstName: String,
  lastName: String,
  role: String (enum: ["student", "instructor", "admin"]),
  emailVerified: Boolean (default: false),
  phone: String (optional),
  timezone: String (optional),
  avatarUrl: String (optional),
  lastLogin: Date,
  isActive: Boolean (default: true),
  createdAt: Date (timestamp),
  updatedAt: Date (timestamp)
}
```

### 4. Storage in MongoDB

**Database**: `eduprep_auth`
**Container**: `eduprep-mongodb` (Docker)
**Port**: 27017

Connection String:

```
mongodb://admin:password123@mongodb:27017/eduprep_auth?authSource=admin
```

### 5. Frontend Data Management

**Auth Store** (`frontend/lib/store.ts`)

- Uses Zustand for client-side state
- Stores: `user` object, `accessToken`, `refreshToken`
- Persists tokens in localStorage
- User data fetched from `/api/auth/me` endpoint

**API Client** (`frontend/lib/api.ts`)

- Axios instance with baseURL to auth service (port 3001)
- Automatically attaches JWT token to all requests
- Handles authentication errors

## Security Features

✅ **Password Security**

- Hashed with bcrypt (salt rounds: 12)
- Never stored in plaintext
- Never returned in API responses

✅ **Token Management**

- Access Token: 15-minute expiration
- Refresh Token: 7-day expiration
- JWT tokens signed with environment variables

✅ **Database Security**

- MongoDB authentication enabled
- Connection requires credentials
- Unique email constraint prevents duplicates

✅ **API Protection**

- `authenticate` middleware protects protected routes
- Bearer token validation on every protected request
- User ID extracted from JWT claims

## Data Flow Diagram

```
┌─────────────┐
│   Browser   │
│  Frontend   │
└──────┬──────┘
       │ 1. POST /api/auth/register
       │    (email, password, name)
       │
       ▼
┌─────────────────────────┐
│  API Gateway / Docker   │
│     Port: 3001          │
└──────┬──────────────────┘
       │ 2. Validate data
       │ 3. Hash password with bcrypt
       │ 4. Create user document
       │
       ▼
┌──────────────────────────┐
│   MongoDB Container      │
│   Port: 27017            │
│   Database: eduprep_auth │
│   Collection: users      │
└──────────────────────────┘
```

## Verification

To verify user data in MongoDB:

```bash
# Login to MongoDB container
docker exec -it eduprep-mongodb mongosh -u admin -p password123

# Use database
use eduprep_auth

# View all users
db.users.find().pretty()

# View specific user
db.users.findOne({ email: "user@example.com" })
```

## Login Flow

1. User submits email/password on login page
2. Frontend calls `POST /api/auth/login`
3. Backend validates credentials against MongoDB
4. Backend returns `accessToken` and `refreshToken`
5. Frontend stores tokens in localStorage
6. Frontend stores user object in Zustand auth store
7. Redirect to dashboard

## Updates & Persistence

When users update their profile:

1. Frontend calls `PUT /api/auth/profile` with new data
2. Backend validates JWT token
3. MongoDB updates user document
4. Response sent to frontend
5. Frontend updates auth store

## Environment Variables

**Backend (.env)**

```
NODE_ENV=development
PORT=3001
DATABASE_URL=mongodb://admin:password123@mongodb:27017/eduprep_auth?authSource=admin
JWT_SECRET=your-jwt-secret-key-change-in-production
REFRESH_SECRET=your-refresh-secret-key-change-in-production
REDIS_URL=redis://redis:6379
```

**Frontend (.env.local)**

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Summary

✅ **All user personal data is persisted in MongoDB**

- Email, name, timezone, avatar, role, etc.
- Secure password hashing
- Automatic timestamps (createdAt, updatedAt)
- Track last login

✅ **Frontend properly integrated**

- Makes real API calls to backend
- Stores user data in auth store
- Manages JWT tokens

✅ **Docker deployment ready**

- MongoDB running in container
- Auth service connected to MongoDB
- All data persisted across container restarts
