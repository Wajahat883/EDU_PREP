# EduPrep Platform - Deployment & Operations Guide

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Production Deployment](#production-deployment)
3. [Operations Runbook](#operations-runbook)
4. [Troubleshooting](#troubleshooting)
5. [Monitoring & Alerts](#monitoring--alerts)

---

## Local Development Setup

### Prerequisites

- **Docker Desktop**: [Download](https://www.docker.com/products/docker-desktop)
- **Node.js 18+**: [Download](https://nodejs.org/)
- **npm 8+**: Included with Node.js
- **Git**: [Download](https://git-scm.com/)
- **kubectl**: [Download](https://kubernetes.io/docs/tasks/tools/)
- **MongoDB Compass** (optional): [Download](https://www.mongodb.com/products/compass)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/eduprep/platform.git
cd eduprep-platform

# Install dependencies (root)
npm install

# Install service dependencies
npm run install:all

# Set up environment
cp .env.development .env.local

# Start development environment
docker-compose up -d

# Run database migrations
npm run migrate:dev

# Seed initial data
npm run seed:dev

# Start all services
npm run dev
```

### Access Points

- **Frontend**: http://localhost:3006
- **API Gateway**: http://localhost:3000
- **Auth Service**: http://localhost:3001
- **QBank Service**: http://localhost:3002
- **Test Engine**: http://localhost:3003
- **Analytics Service**: http://localhost:3004
- **Payment Service**: http://localhost:3005
- **AI Service**: http://localhost:3009
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

### Docker Compose Services

```bash
# View running containers
docker-compose ps

# View logs for specific service
docker-compose logs -f auth-service

# Stop all services
docker-compose down

# Stop and remove volumes (reset data)
docker-compose down -v

# Rebuild images
docker-compose build
```

### Development Commands

```bash
# Run tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format

# Check types
npm run type-check

# Build for production
npm run build
```

---

## Production Deployment

### Pre-deployment Checklist

- [ ] Code review and approval
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations prepared
- [ ] SSL certificates valid
- [ ] Backup created
- [ ] Runbook prepared
- [ ] Monitoring configured

### Using Azure DevOps (azd)

```bash
# Initialize new environment
azd init

# Provision infrastructure (first time)
azd provision

# Deploy application
azd deploy

# View status
azd status

# Clean up resources
azd down
```

### Manual Deployment with Kubernetes

#### 1. Build and Push Images

```bash
# Login to container registry
az acr login --name <registry-name>

# Build all services
docker build -t <registry>/auth-service:latest services/auth-service/
docker build -t <registry>/qbank-service:latest services/qbank-service/
docker build -t <registry>/test-engine:latest services/test-engine/
docker build -t <registry>/analytics:latest services/analytics-service/
docker build -t <registry>/payment:latest services/payment-service/
docker build -t <registry>/api-gateway:latest services/api-gateway/
docker build -t <registry>/ai-service:latest services/ai-service/

# Push to registry
docker push <registry>/auth-service:latest
docker push <registry>/qbank-service:latest
# ... push others
```

#### 2. Apply Kubernetes Manifests

```bash
# Create namespace
kubectl create namespace eduprep

# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=JWT_SECRET=$(openssl rand -base64 32) \
  --from-literal=MONGODB_PASSWORD=$(openssl rand -base64 32) \
  -n eduprep

# Apply manifests
kubectl apply -f kubernetes/deployment.yaml -n eduprep

# Verify deployments
kubectl get deployments -n eduprep
kubectl get pods -n eduprep

# Check service status
kubectl get services -n eduprep
```

#### 3. Configure Ingress

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml

# Apply ingress configuration
kubectl apply -f kubernetes/ingress.yaml -n eduprep

# Verify ingress
kubectl get ingress -n eduprep
```

### GitHub Actions CI/CD Pipeline

The pipeline automatically:

1. Runs tests on every push
2. Builds Docker images on main branch
3. Deploys to staging on develop branch
4. Deploys to production on main branch (after approval)

**Manual Deployment**:

```bash
# Trigger deployment workflow
gh workflow run deploy.yml -r main

# View workflow status
gh workflow view deploy.yml
gh run list --workflow=deploy.yml
```

### Database Setup

#### MongoDB

```bash
# Connect to MongoDB
mongosh "mongodb://admin:password@localhost:27017/eduprep"

# Create indexes
db.questions.createIndex({ subject: 1, difficulty: 1 })
db.questions.createIndex({ topic: 1 })
db.tests.createIndex({ createdBy: 1 })
db.studentPerformance.createIndex({ userId: 1 })

# Run migrations
npm run migrate:prod
```

#### PostgreSQL (Analytics)

```bash
# Connect
psql -h localhost -U postgres -d eduprep

# Run migrations
npm run migrate:analytics:prod

# Create indexes
CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_timestamp ON events(timestamp);
```

### Environment Configuration

#### Production Environment Variables

Create `.env.production`:

```bash
# Server
NODE_ENV=production
PORT=3000
API_URL=https://api.eduprep.com
FRONTEND_URL=https://eduprep.com

# Database
MONGODB_URI=mongodb://user:pass@mongo-prod:27017/eduprep
MONGODB_POOL_SIZE=10

# Redis
REDIS_URL=redis://redis-prod:6379

# Authentication
JWT_SECRET=$(openssl rand -base64 32)
REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)

# Payment
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...

# Email
SENDGRID_API_KEY=SG.xxxxx

# Logging
LOG_LEVEL=info
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Feature flags
ENABLE_ANALYTICS=true
ENABLE_PAYMENT=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_TWO_FACTOR=true
```

---

## Operations Runbook

### Daily Operations

#### Morning Checklist

```bash
# Check system health
curl https://api.eduprep.com/api/health

# View service status
kubectl get pods -n eduprep

# Check recent errors
kubectl logs -n eduprep -l app=api-gateway --tail=100 | grep ERROR

# Verify backups ran
aws s3 ls s3://eduprep-backups/ --recursive | head -5
```

#### Performance Monitoring

```bash
# Check resource usage
kubectl top nodes
kubectl top pods -n eduprep

# View Prometheus metrics
curl http://prometheus:9090/api/v1/query?query=container_cpu_usage_seconds_total

# Check database connections
mongo+srv://user:pass@cluster.mongodb.net/admin \
  --eval "db.serverStatus().connections"
```

### Common Tasks

#### Scaling Services

```bash
# Scale auth service to 5 replicas
kubectl scale deployment auth-service --replicas=5 -n eduprep

# View HPA status
kubectl get hpa -n eduprep

# Manually adjust HPA
kubectl patch hpa api-gateway \
  -p '{"spec":{"minReplicas":3}}' -n eduprep
```

#### Database Backups

```bash
# Manual MongoDB backup
mongodump --uri="mongodb://user:pass@mongo:27017/eduprep" \
  --out /backups/$(date +%Y%m%d_%H%M%S)

# Backup to S3
aws s3 sync /backups/eduprep s3://eduprep-backups/mongo/

# Schedule daily backups (in cronjob)
0 2 * * * mongodump --uri="..." --out /backups/$(date +\%Y\%m\%d)
```

#### Database Restore

```bash
# List available backups
ls -la /backups/

# Restore from backup
mongorestore --uri="mongodb://user:pass@mongo:27017" \
  --dir=/backups/20260128_020000

# Verify restore
db.questions.countDocuments()
```

#### Service Restart

```bash
# Restart single service
kubectl rollout restart deployment/auth-service -n eduprep

# Restart all services
kubectl rollout restart deployment -n eduprep

# Monitor rollout
kubectl rollout status deployment/auth-service -n eduprep
```

#### Logs Access

```bash
# Real-time logs
kubectl logs -f deployment/api-gateway -n eduprep

# View last 100 lines
kubectl logs deployment/api-gateway --tail=100 -n eduprep

# Logs from specific container
kubectl logs pod/api-gateway-xyz -c api-gateway -n eduprep

# Export logs
kubectl logs deployment/api-gateway -n eduprep > api-gateway.log
```

---

## Troubleshooting

### Pod Issues

#### Pod Won't Start

```bash
# Check pod status
kubectl describe pod <pod-name> -n eduprep

# View logs
kubectl logs <pod-name> -n eduprep

# Check events
kubectl get events -n eduprep --sort-by='.lastTimestamp'

# Common causes:
# - Resource limits exceeded: kubectl describe node
# - Image pull error: Check container registry access
# - Init container failure: kubectl logs <pod> -c init-<name>
```

#### CrashLoopBackOff

```bash
# View crash logs
kubectl logs <pod-name> -n eduprep --previous

# Check resource requests vs available
kubectl describe node <node-name>

# Increase resource limits in deployment
kubectl set resources deployment/<name> \
  --limits=cpu=1000m,memory=1Gi -n eduprep
```

### Database Issues

#### Connection Pool Exhausted

```bash
# View active connections
mongo --eval "db.serverStatus().connections"

# Kill long-running operations
mongo --eval "db.killOp(123)" # use opid from currentOp()

# Restart MongoDB pod
kubectl rollout restart statefulset/mongodb -n eduprep
```

#### High Latency

```bash
# Check database size
mongo --eval "db.stats()"

# Run explain on slow query
db.questions.find({subject: "Math"}).explain("executionStats")

# Create missing indexes
db.questions.createIndex({subject: 1, difficulty: 1})
```

### API Issues

#### High Response Time

```bash
# Check service logs for slowness
kubectl logs deployment/api-gateway -n eduprep | grep "duration"

# Check database query times
kubectl logs deployment/qbank-service -n eduprep | grep "slow"

# Scale up service
kubectl scale deployment/qbank-service --replicas=5 -n eduprep
```

#### 502 Bad Gateway

```bash
# Check if backend service is running
kubectl get pods -n eduprep | grep qbank-service

# Check service endpoints
kubectl get endpoints qbank-service -n eduprep

# Verify network policy isn't blocking
kubectl get networkpolicy -n eduprep

# Restart gateway
kubectl rollout restart deployment/api-gateway -n eduprep
```

#### Authentication Failures

```bash
# Check JWT secret is set
kubectl get secret app-secrets -n eduprep -o yaml | grep JWT

# Verify token format
jwt.verify(token, process.env.JWT_SECRET) # in code

# Check auth service logs
kubectl logs deployment/auth-service -n eduprep | grep "token"
```

### Performance Issues

#### High CPU Usage

```bash
# Identify heavy pod
kubectl top pods -n eduprep --sort-by=cpu

# Check what's consuming CPU
kubectl exec <pod-name> -n eduprep -- top -b -n1 | head -20

# Scale or increase limits
kubectl set resources deployment/<name> --limits=cpu=2000m -n eduprep
```

#### High Memory Usage

```bash
# Find memory-heavy pod
kubectl top pods -n eduprep --sort-by=memory

# Check memory leaks
kubectl logs deployment/<name> -n eduprep | grep "memory"

# Restart pod (temporary fix)
kubectl delete pod <pod-name> -n eduprep
```

---

## Monitoring & Alerts

### Prometheus Dashboards

Access at: `http://prometheus:9090`

**Key Metrics to Monitor**:

- `http_request_duration_seconds` - API latency
- `db_query_duration_seconds` - Database performance
- `errors_total` - Error rate
- `cache_hit_ratio` - Cache effectiveness

### Grafana Dashboards

Access at: `http://grafana:3000`

**Pre-built Dashboards**:

- System Overview (CPU, Memory, Disk)
- API Performance
- Database Performance
- Business Metrics
- Error Tracking

### Alert Rules

**Critical Alerts** (page on-call):

- Error rate > 5%
- API response time > 5s
- Database unavailable
- Pod restart storm

**Warning Alerts** (Slack notification):

- High CPU (>80%)
- High memory (>85%)
- Slow database queries (>1s p95)
- Low cache hit rate (<60%)

### Alert Handling

```bash
# Silence alert temporarily
kubectl patch alertmanager -n monitoring \
  -p '{"spec":{"silences":[...]}}' --type=merge

# View firing alerts
kubectl logs -n monitoring alertmanager

# Check alert history
# Via Prometheus: Alerts tab
```

### Health Checks

```bash
# API health endpoint
curl https://api.eduprep.com/api/health

# Service-specific health
curl http://api-gateway:3000/health
curl http://qbank-service:3002/health
curl http://mongo:27017/admin/ping

# Deep health check
kubectl exec deployment/qbank-service -n eduprep \
  -- npm run health:deep
```

### Regular Maintenance

#### Weekly

- Review error logs
- Check for slow queries
- Monitor disk usage
- Test backup/restore

#### Monthly

- Update dependencies
- Review security logs
- Analyze performance trends
- Plan capacity scaling

#### Quarterly

- Load testing
- Disaster recovery drill
- Security audit
- Architecture review
