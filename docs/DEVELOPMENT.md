# Development Guide

## Getting Started

### Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **npm**: 9+
- **Docker & Docker Compose**: Latest versions
- **Git**: For version control
- **MongoDB**: 7.0+ (via Docker)
- **Redis**: 7+ (via Docker)
- **MongoDB Compass** (optional): Visual database explorer

### Initial Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd eduprep-platform

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# 4. Start Docker services
npm run docker:up

# 5. Run migrations and seed data
npm run migrate
npm run seed

# 6. Start development servers
npm run dev
```

### Quick Start

```bash
npm start
```

This runs `docker:up && npm run dev`, starting all services and databases.

## Project Structure

```
eduprep-platform/
├── frontend/                      # Next.js React application
│   ├── pages/                     # Route pages
│   ├── components/                # React components
│   ├── lib/                       # Utilities, API clients, state management
│   ├── styles/                    # Global styles and Tailwind config
│   ├── public/                    # Static assets
│   ├── package.json
│   └── tsconfig.json
│
├── services/                      # Microservices
│   ├── auth-service/              # Authentication & User Management
│   │   ├── src/
│   │   │   ├── index.ts           # Express server
│   │   │   ├── models/            # MongoDB schemas
│   │   │   ├── routes/            # API endpoints
│   │   │   ├── middleware/        # Auth, logging, error handling
│   │   │   └── __tests__/         # Jest test files
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── qbank-service/             # Question Bank & Content
│   ├── test-engine-service/       # Exam Sessions & Scoring
│   ├── analytics-service/         # Performance Analytics
│   └── payment-service/           # Subscriptions & Billing
│
├── scripts/                       # Automation scripts
│   ├── migrations.ts              # Database index creation
│   ├── seed.ts                    # Test data seeding
│   └── health-check.ts            # Service health verification
│
├── docs/                          # Documentation
│   ├── API_DOCS.md               # API reference
│   ├── ARCHITECTURE.md           # System architecture
│   ├── DEPLOYMENT.md             # Deployment guide
│   └── DEVELOPMENT.md            # This file
│
├── .github/workflows/             # CI/CD pipelines
│   └── ci-cd.yml                 # GitHub Actions workflow
│
├── docker-compose.yml             # Docker orchestration
├── .env.example                   # Environment variables template
├── package.json                   # Root workspace configuration
└── README.md                      # Project overview
```

## Technology Stack

### Frontend

- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.3
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Forms**: React Hook Form
- **Validation**: Zod
- **Charts**: Chart.js
- **Payments**: Stripe
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint
- **Formatting**: Prettier

### Backend Services

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB 7.0
- **Cache**: Redis 7
- **Search**: Elasticsearch 8.10
- **Auth**: JWT + OAuth
- **Validation**: Joi
- **Testing**: Jest
- **Logging**: Winston

### DevOps

- **Containerization**: Docker
- **Orchestration**: Docker Compose (local), Kubernetes (production)
- **CI/CD**: GitHub Actions
- **Container Registry**: GitHub Container Registry (GHCR)
- **Cloud**: AWS (ECS, RDS, ElastiCache, S3, CloudFront, CloudWatch)

## Development Workflows

### Running Services Locally

```bash
# Start all services (Docker + dev servers)
npm start

# Or separately:
npm run docker:up
npm run dev

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Reset everything (careful!)
npm run docker:reset
```

### Working with a Specific Service

```bash
# Frontend
npm run dev:frontend    # Port 3000
npm run build:frontend
npm run test:frontend

# Auth Service
npm run dev:auth        # Port 3001
npm run test:auth

# QBank Service
npm run dev:qbank       # Port 3002

# Test Engine Service
npm run dev:test-engine # Port 3003

# Analytics Service
npm run dev:analytics   # Port 3004

# Payment Service
npm run dev:payment     # Port 3005
```

### Database Operations

```bash
# Create indexes for optimal queries
npm run migrate

# Seed with test data
npm run seed

# Backup database
npm run db:backup

# Restore from backup
npm run db:restore

# Check service health
npm run health-check
```

## Testing

### Run All Tests

```bash
npm run test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Watch Mode (Auto-rerun on changes)

```bash
npm run test:watch
```

### Test Specific Service

```bash
npm run test --workspace=services/auth-service
npm run test --workspace=frontend
```

### Example: Writing Tests

```typescript
// services/auth-service/src/__tests__/auth.test.ts
import request from "supertest";
import app from "../index";

describe("Auth Service", () => {
  it("should register a new user", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      password: "Password123!",
      firstName: "Test",
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("accessToken");
  });
});
```

## Code Quality

### Linting

```bash
# Check for issues
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Code Formatting

```bash
# Check formatting
npm run format:check

# Format all code
npm run format
```

### Pre-commit Hooks

The project should include Husky hooks to:

1. Run ESLint on staged files
2. Run Prettier to format code
3. Run tests on critical files

Setup:

```bash
npm install husky --save-dev
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm run format"
npx husky add .husky/pre-push "npm run test"
```

## API Development

### Adding a New Endpoint

1. **Define the route** in `services/{service}/src/routes/{resource}.routes.ts`:

```typescript
import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// GET /api/users/:id
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    // Your logic here
    res.json({ userId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

2. **Register the route** in `services/{service}/src/index.ts`:

```typescript
import userRoutes from "./routes/users.routes";

app.use("/api/users", userRoutes);
```

3. **Add tests** in `services/{service}/src/__tests__/{resource}.test.ts`:

```typescript
describe("GET /api/users/:id", () => {
  it("should return user details", async () => {
    const response = await request(app)
      .get("/api/users/123")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("userId", "123");
  });
});
```

### API Documentation

Update `docs/API_DOCS.md` with:

- Endpoint path and method
- Description
- Required authentication
- Request body/query parameters
- Response examples
- Error codes

## Frontend Development

### Component Structure

```typescript
// components/Button.tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary'
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### Custom Hooks for API Integration

```typescript
// lib/api.ts
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetUser = (userId: string) => {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateUser = () => {
  return useMutation({
    mutationFn: async (userData) => {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        body: JSON.stringify(userData),
      });
      return response.json();
    },
  });
};
```

### State Management with Zustand

```typescript
// lib/store.ts
import { create } from "zustand";

interface AuthStore {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
}));
```

## Debugging

### Browser DevTools

1. Open your browser's developer tools (F12)
2. **React DevTools**: Install the React DevTools extension
3. **Network tab**: Monitor API requests
4. **Console**: Check for errors and logs

### Debug Backend Services

```bash
# Enable debug logging in a service
DEBUG=* npm run dev:auth

# Or set in .env.local
DEBUG=eduprep:*
```

### MongoDB Debugging

```bash
# Connect to MongoDB directly
docker-compose exec mongodb mongosh

# List databases
show dbs

# Switch to a database
use auth-service

# View collections
show collections

# Query a collection
db.users.findOne()
```

### Redis Debugging

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# List all keys
KEYS *

# Get a key
GET mykey

# Monitor all commands in real-time
MONITOR
```

## Common Issues & Solutions

### Port Already in Use

```bash
# Kill process on specific port (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### MongoDB Connection Error

```bash
# Check if MongoDB is running
docker-compose ps

# Restart MongoDB
docker-compose restart mongodb

# Check MongoDB logs
docker-compose logs mongodb
```

### Node Modules Issues

```bash
# Clear cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Docker Issues

```bash
# Check resource usage
docker stats

# Remove unused images/containers
docker system prune

# Rebuild all images
npm run docker:build
```

## Performance Optimization

### Frontend

1. **Code Splitting**: Use dynamic imports

   ```typescript
   const Dashboard = dynamic(() => import("../pages/dashboard"));
   ```

2. **Image Optimization**: Use Next.js Image component

   ```typescript
   import Image from 'next/image';
   <Image src="/logo.png" alt="Logo" width={100} height={100} />
   ```

3. **Lazy Loading**: Load non-critical components on demand
   ```typescript
   const useLazyQuery = () => useQuery({ enabled: false });
   ```

### Backend

1. **Database Indexing**: Run migrations for optimal queries

   ```bash
   npm run migrate
   ```

2. **Caching Strategy**: Use Redis for frequently accessed data

   ```typescript
   const cached = await redis.get(`user:${id}`);
   if (!cached) {
     const data = await User.findById(id);
     await redis.setex(`user:${id}`, 3600, JSON.stringify(data));
   }
   ```

3. **Query Optimization**: Use projections to fetch only needed fields
   ```typescript
   User.find({}, { email: 1, firstName: 1 });
   ```

## Environment Variables

Key variables in `.env.local`:

```bash
# Node
NODE_ENV=development

# Database
DATABASE_URL=mongodb://admin:password@localhost:27017/eduprep?authSource=admin
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_URL=http://localhost:9200

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key

# Services (for local development, use localhost)
AUTH_SERVICE_URL=http://localhost:3001
QBANK_SERVICE_URL=http://localhost:3002
TEST_ENGINE_SERVICE_URL=http://localhost:3003
ANALYTICS_SERVICE_URL=http://localhost:3004
PAYMENT_SERVICE_URL=http://localhost:3005

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/guide/routing.html)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [React Query Docs](https://tanstack.com/query/latest)

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Add feature"`
3. Run tests: `npm run test`
4. Push: `git push origin feature/your-feature`
5. Create a Pull Request

## Getting Help

- Check documentation in `/docs`
- Review existing issues on GitHub
- Ask in team discussions
- Check service logs: `npm run docker:logs`

---

**Last Updated**: January 28, 2025
