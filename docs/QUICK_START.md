# Quick Start Guide

## 5-Minute Setup

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Step 1: Clone & Install (1 minute)

```bash
git clone <repo-url>
cd eduprep-platform
npm install
```

### Step 2: Configure (1 minute)

```bash
cp .env.example .env.local
# No changes needed for local development - defaults work!
```

### Step 3: Start Services (1 minute)

```bash
npm start
# Or manually:
npm run docker:up && npm run dev
```

### Step 4: Access Application (2 minutes)

```
Frontend:        http://localhost:3000
Auth Service:    http://localhost:3001
QBank Service:   http://localhost:3002
Test Engine:     http://localhost:3003
Analytics Svc:   http://localhost:3004
Payment Svc:     http://localhost:3005
MongoDB:         mongodb://localhost:27017
```

## Test the Application

### Create Test Account

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Get Questions

```bash
# Get all questions (requires auth token from registration)
curl http://localhost:3002/api/questions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Exam Session

```bash
curl -X POST http://localhost:3003/api/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "examTypeId": "MCAT",
    "questionCount": 10,
    "mode": "timed"
  }'
```

## Frontend Testing

### 1. Visit Landing Page

```
http://localhost:3000
```

### 2. Register Account

- Click "Sign Up"
- Fill in test credentials
- Submit

### 3. View Dashboard

- After login, you're on the dashboard
- See sample analytics (hardcoded for now)
- Click navigation items to explore

## Database Access

### MongoDB Shell

```bash
docker-compose exec mongodb mongosh

# Inside shell:
use auth-service
db.users.find()

use qbank-service
db.questions.find().limit(1)
```

### MongoDB Compass (GUI)

```
Connection String: mongodb://admin:password@localhost:27017/?authSource=admin
```

## Service Health Check

```bash
# Check all services
npm run health-check

# Or manually check each:
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
```

## Stop Services

```bash
npm run docker:down
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Or restart Docker
npm run docker:reset
```

### MongoDB Connection Failed

```bash
# Check if MongoDB is running
docker-compose ps

# View MongoDB logs
docker-compose logs mongodb

# Restart
docker-compose restart mongodb
```

### Can't Access Services

```bash
# Check if all containers are healthy
docker-compose ps

# View all logs
npm run docker:logs

# Restart everything
npm run docker:reset
```

## Default Credentials (Test Data)

After running `npm run seed`:

**Student Account**

- Email: student1@example.com
- Password: Password123!

**Instructor Account**

- Email: instructor1@example.com
- Password: Password123!

**Admin Account**

- Email: admin@example.com
- Password: AdminPass123!

## What's Next?

### Learn the Architecture

```bash
# Read these docs in order:
1. README.md - Project overview
2. docs/PROJECT_SUMMARY.md - What's implemented
3. docs/ARCHITECTURE.md - How it's structured
4. docs/API_DOCS.md - Available APIs
5. docs/DEVELOPMENT.md - How to develop
```

### Start Development

#### Frontend Development

```bash
# Frontend only
npm run dev:frontend

# Frontend will auto-reload on changes
# Edit files in: frontend/pages, frontend/components
```

#### Backend Development

```bash
# Work on Auth Service
npm run dev:auth

# Edit files in: services/auth-service/src
# Server will auto-reload via nodemon
```

### Make Your First Change

#### Add a Message to Landing Page

1. Open `frontend/pages/index.tsx`
2. Change line in the "Features" section
3. Save - page auto-updates!

#### Create a New API Endpoint

1. Open `services/auth-service/src/routes/auth.routes.ts`
2. Add new route:

```typescript
router.get("/test", authenticate, (req, res) => {
  res.json({ message: "Hello World" });
});
```

3. Test: `curl http://localhost:3001/api/auth/test -H "Authorization: Bearer TOKEN"`

### Run Tests

```bash
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

### Check Code Quality

```bash
npm run lint             # Check for issues
npm run lint:fix         # Auto-fix
npm run format           # Format code
```

## Common Tasks

### Database Backup

```bash
npm run db:backup
# Creates backup in ./backups/
```

### Seed Test Data

```bash
npm run seed
# Populates with sample users, questions, plans
```

### View Service Logs

```bash
npm run docker:logs      # All logs
docker-compose logs auth-service -f  # Just auth service
```

### Access Database

```bash
# MongoDB
docker-compose exec mongodb mongosh

# Redis
docker-compose exec redis redis-cli

# Check data
curl http://localhost:9200/_cat/indices  # Elasticsearch
```

## Architecture At A Glance

```
┌─────────────────────────────────────────┐
│  Frontend (Next.js on Port 3000)        │
├─────────────────────────────────────────┤
│  Pages: Landing, Login, Dashboard       │
│  State: Zustand + React Query           │
│  Styling: Tailwind CSS                  │
└────────────────┬────────────────────────┘
                 │ REST API (JWT Auth)
┌────────────────┴────────────────────────┐
│  5 Microservices (Ports 3001-3005)      │
├──────────┬──────────┬──────────┬────────┤
│ Auth     │ QBank    │ Test     │ Admin  │
│ Service  │ Service  │ Engine   │ etc..  │
└──────────┴──────────┴──────────┴────────┘
           │
┌──────────┴────────────┬─────────┬───────┐
│ MongoDB  │ Redis      │ Elastic │ S3    │
│ (Data)   │ (Cache)    │ (Search)│(Files)│
└──────────┴────────────┴─────────┴───────┘
```

## Useful Docs

| Document                  | Purpose                     |
| ------------------------- | --------------------------- |
| `README.md`               | Project overview            |
| `docs/PROJECT_SUMMARY.md` | What's implemented & status |
| `docs/ARCHITECTURE.md`    | System design               |
| `docs/API_DOCS.md`        | API reference               |
| `docs/DEVELOPMENT.md`     | How to develop              |
| `docs/DEPLOYMENT.md`      | Production setup            |
| `docs/REQUIREMENTS.md`    | Full specifications         |

## Getting Help

1. **Check Documentation**: `/docs` folder has guides
2. **Check README**: Root `README.md` has overview
3. **Check Logs**: `npm run docker:logs`
4. **Check Status**: `npm run health-check`
5. **Read Code**: Services have clear structure

## Next Steps

1. ✅ Setup complete - services running
2. → Explore the API (try curl commands above)
3. → Make a small change (landing page text)
4. → Create a test account and login
5. → Read `docs/DEVELOPMENT.md` for deeper learning
6. → Start implementing features from roadmap

---

**Time to First Running Code**: ~5 minutes  
**Time to First Change**: ~10 minutes  
**Time to First Test**: ~15 minutes

Happy coding! 🚀
