# Deployment Guide

## Local Development

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git
- MongoDB (local or Docker)
- Redis (local or Docker)

### Setup

1. **Clone repository**

   ```bash
   git clone <repo-url>
   cd eduprep-platform
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start Docker services**

   ```bash
   docker-compose up -d
   ```

5. **Start development servers**

   ```bash
   npm run dev
   ```

   This starts all services concurrently:
   - Frontend: http://localhost:3000
   - Auth Service: http://localhost:3001
   - QBank Service: http://localhost:3002
   - Test Engine: http://localhost:3003
   - Analytics Service: http://localhost:3004
   - Payment Service: http://localhost:3005

## Production Deployment

### AWS ECS Deployment

1. **Build and push Docker images**

   ```bash
   # Authenticate with ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY

   # Build images
   docker-compose build

   # Tag and push
   docker tag eduprep-platform_auth-service:latest $ECR_REGISTRY/eduprep/auth-service:latest
   docker push $ECR_REGISTRY/eduprep/auth-service:latest
   ```

2. **Create ECS cluster**

   ```bash
   aws ecs create-cluster --cluster-name eduprep-prod
   ```

3. **Register task definitions**

   ```bash
   aws ecs register-task-definition --cli-input-json file://task-definitions/auth-service.json
   aws ecs register-task-definition --cli-input-json file://task-definitions/qbank-service.json
   # ... etc
   ```

4. **Create services**
   ```bash
   aws ecs create-service \
     --cluster eduprep-prod \
     --service-name auth-service \
     --task-definition auth-service:1 \
     --desired-count 2 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
   ```

### Kubernetes Deployment

1. **Create namespace**

   ```bash
   kubectl create namespace eduprep
   ```

2. **Create ConfigMaps and Secrets**

   ```bash
   kubectl create configmap eduprep-config --from-literal=DATABASE_URL=... -n eduprep
   kubectl create secret generic eduprep-secrets --from-literal=JWT_SECRET=... -n eduprep
   ```

3. **Deploy services**

   ```bash
   kubectl apply -f k8s/auth-service-deployment.yaml -n eduprep
   kubectl apply -f k8s/qbank-service-deployment.yaml -n eduprep
   # ... etc
   ```

4. **Expose services**
   ```bash
   kubectl expose deployment auth-service --port=3001 --target-port=3001 -n eduprep
   # ... etc
   ```

## CI/CD Pipeline

### GitHub Actions

The CI/CD pipeline automatically:

1. Runs linter and tests on every push
2. Builds Docker images for develop/main branches
3. Deploys to staging on develop branch
4. Deploys to production on main branch
5. Sends Slack notifications

### Manual Deployment

```bash
# Staging
git checkout develop
git push origin develop  # Triggers GitHub Actions

# Production
git checkout main
git merge develop
git push origin main  # Triggers GitHub Actions
```

## Database Migrations

### MongoDB

```bash
# Run migrations
npm run migrate

# Seed test data
npm run seed
```

### Backup & Restore

```bash
# Backup
mongodump --uri="mongodb://localhost:27017/eduprep" --out=./backup

# Restore
mongorestore --uri="mongodb://localhost:27017" ./backup
```

## Monitoring & Logging

### New Relic

1. Sign up at [New Relic](https://newrelic.com)
2. Add license key to environment variables
3. View dashboards at newrelic.com

### Sentry

1. Sign up at [Sentry](https://sentry.io)
2. Create projects for each service
3. Add DSN to environment variables

### CloudWatch

AWS CloudWatch automatically collects logs from ECS/Lambda. Access via AWS Console.

## Health Checks

Each service exposes a health check endpoint:

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
```

## Scaling

### Horizontal Scaling

For Docker Compose:

```bash
docker-compose up --scale auth-service=3 -d
```

For Kubernetes:

```bash
kubectl scale deployment auth-service --replicas=3 -n eduprep
```

### Auto-scaling (AWS)

```bash
# Set up auto-scaling policy
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/eduprep-prod/auth-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10
```

## Troubleshooting

### Service won't start

1. Check logs

   ```bash
   docker-compose logs auth-service
   ```

2. Verify environment variables

   ```bash
   docker-compose config
   ```

3. Check MongoDB connection
   ```bash
   docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
   ```

### High memory usage

1. Check service memory limits
2. Review Redis cache size
3. Optimize database queries

### Database connection errors

1. Verify DATABASE_URL
2. Check MongoDB is running
3. Verify credentials
4. Check network connectivity

## Security

### SSL/TLS

For production, enable HTTPS:

```nginx
# nginx.conf
server {
  listen 443 ssl;
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
}
```

### Secrets Management

Use AWS Secrets Manager or Kubernetes Secrets:

```bash
# AWS
aws secretsmanager create-secret --name eduprep/jwt-secret --secret-string "..."

# Kubernetes
kubectl create secret generic eduprep-secrets --from-literal=JWT_SECRET=... -n eduprep
```

## Disaster Recovery

### Backup Strategy

- Database: Daily automated backups
- Code: GitHub (multi-region)
- Configuration: Version controlled

### Recovery Procedures

1. Restore from latest backup
2. Verify data integrity
3. Run health checks
4. Monitor for 1 hour

## Costs Optimization

- Use spot instances for non-critical services
- Enable auto-scaling to right-size infrastructure
- Use CloudFront CDN for static assets
- Implement caching strategies
- Archive old logs

---

**Last Updated**: January 28, 2025
