# DevOps & Deployment Guide

## Overview

This guide covers containerization, Kubernetes deployment, CI/CD setup, monitoring, and disaster recovery for the EduPrep platform.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker & Containerization](#docker--containerization)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Monitoring & Observability](#monitoring--observability)
6. [Backup & Disaster Recovery](#backup--disaster-recovery)
7. [Security Hardening](#security-hardening)

---

## Local Development

### Prerequisites

- Docker Desktop (20.10+)
- kubectl (1.24+)
- Node.js 18.x
- npm 8.x or yarn

### Starting Local Environment

```bash
# Clone repository
git clone https://github.com/eduprep/platform.git
cd platform

# Start all services with Docker Compose
docker-compose up -d

# Services will be available at:
# - Frontend: http://localhost:3006
# - API Gateway: http://localhost:3000
# - Auth Service: http://localhost:3001
# - QBank Service: http://localhost:3002
# - Test Engine: http://localhost:3003
# - Analytics Service: http://localhost:3004
# - Payment Service: http://localhost:3005
# - Grafana: http://localhost:3100 (admin/admin)
# - Kibana: http://localhost:5601
```

### Environment Setup

```bash
# Copy development environment template
cp .env.development .env.local

# Configure local environment variables
# Edit .env.local with your local settings
```

### Running Tests Locally

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test
```

---

## Docker & Containerization

### Multi-Stage Build Strategy

Each service uses a multi-stage Docker build to minimize image size:

1. **Builder Stage**: Compiles TypeScript and installs dependencies
2. **Runtime Stage**: Copies only necessary files, adds non-root user

### Image Build

```bash
# Build all images
docker-compose build

# Build specific service
docker build -f services/auth-service/Dockerfile -t eduprep/auth-service:1.0.0 .

# Push to registry
docker tag eduprep/auth-service:1.0.0 ghcr.io/your-org/eduprep-auth-service:1.0.0
docker push ghcr.io/your-org/eduprep-auth-service:1.0.0
```

### Image Optimization

- **Base Image**: node:18-alpine (100MB)
- **Multi-stage builds**: Reduce final image size by 70%
- **Minimal dependencies**: Only production packages in final image
- **Non-root user**: Security hardening
- **Health checks**: Automatic restart on failure

### Image Size Reference

```
Auth Service:        ~200MB
QBank Service:       ~220MB
Test Engine Service: ~210MB
Analytics Service:   ~200MB
Payment Service:     ~200MB
API Gateway:         ~180MB
Frontend:            ~150MB
```

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- Storage class available
- Ingress controller installed (NGINX recommended)

### Namespace Setup

```bash
# Create namespace
kubectl create namespace eduprep

# Set as default
kubectl config set-context --current --namespace=eduprep
```

### Secrets Management

```bash
# Create secrets from environment variables
kubectl create secret generic eduprep-secrets \
  --from-literal=JWT_SECRET=your-jwt-secret \
  --from-literal=REFRESH_TOKEN_SECRET=your-refresh-secret \
  --from-literal=STRIPE_SECRET_KEY=your-stripe-key \
  --from-literal=STRIPE_WEBHOOK_SECRET=your-webhook-secret \
  --from-literal=MONGODB_USER=admin \
  --from-literal=MONGODB_PASSWORD=your-secure-password \
  -n eduprep

# Verify secrets created
kubectl get secrets -n eduprep
```

### Deploy Manifests

```bash
# Apply all manifests
kubectl apply -f kubernetes/deployment.yaml

# Verify resources
kubectl get all -n eduprep

# Check pod status
kubectl get pods -n eduprep

# View logs
kubectl logs -f deployment/auth-service -n eduprep
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment auth-service --replicas=5 -n eduprep

# View HPA status
kubectl get hpa -n eduprep

# HPA automatically scales based on CPU/memory usage
# Auth Service: 2-10 replicas
# API Gateway: 2-15 replicas
```

### Rolling Updates

```bash
# Update image
kubectl set image deployment/auth-service \
  auth-service=ghcr.io/your-org/eduprep-auth-service:1.1.0 \
  -n eduprep

# Check rollout status
kubectl rollout status deployment/auth-service -n eduprep

# Rollback if needed
kubectl rollout undo deployment/auth-service -n eduprep
```

### Persistent Storage

```bash
# MongoDB uses StatefulSet with persistent volumes
kubectl get pvc -n eduprep

# Check storage status
kubectl describe pvc mongodb-storage-mongodb-0 -n eduprep

# Backup MongoDB
kubectl exec -it mongodb-0 -n eduprep -- \
  mongodump --uri "mongodb://admin:password@localhost:27017" --out /backup
```

### Networking

```bash
# Verify Ingress
kubectl get ingress -n eduprep

# Test internal service communication
kubectl run -it --rm debug --image=busybox:1.28 --restart=Never -- sh
# Inside pod:
wget -q -O- http://auth-service:3001/health
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Located in `.github/workflows/ci-cd.yml`

### Pipeline Stages

1. **Test** (on all branches)
   - Lint code
   - Run unit tests
   - Run integration tests
   - Upload coverage

2. **Build** (on push to main/develop)
   - Build Docker images
   - Push to container registry
   - Cache layers for faster builds

3. **Deploy** (on push to main)
   - Update Kubernetes secrets
   - Apply manifests
   - Set image tags
   - Wait for rollout

4. **E2E Tests** (on deploy success)
   - Run full user flow tests
   - Upload reports
   - Notify on failure

5. **Security Scan**
   - Snyk vulnerability scan
   - Trivy image scan
   - SARIF report upload

6. **Performance Test** (on PRs)
   - Run performance benchmarks
   - Compare with baseline
   - Comment on PR

### Manual Deployments

```bash
# Deploy specific version
gh workflow run ci-cd.yml -f version=1.2.0

# View workflow status
gh run list --workflow=ci-cd.yml

# Trigger rollback
gh workflow run rollback.yml
```

### Environment Variables in CI/CD

Set these in GitHub repository secrets:

```
JWT_SECRET
REFRESH_TOKEN_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
MONGODB_USER
MONGODB_PASSWORD
KUBE_CONFIG (base64 encoded)
SLACK_WEBHOOK
SNYK_TOKEN
```

---

## Monitoring & Observability

### Prometheus Metrics

Access at `http://prometheus:9090`

Key metrics:

- `http_request_duration_seconds` - API response times
- `db_query_duration_seconds` - Database performance
- `cache_hits_total` / `cache_misses_total` - Cache effectiveness
- `errors_total` - Error tracking
- `active_subscriptions` - Business metric
- `tests_completed_total` - User engagement

### Grafana Dashboards

Access at `http://grafana:3100` (admin/admin)

Pre-built dashboards:

- **System Overview**: CPU, memory, disk usage
- **API Performance**: Request rates, latencies, errors
- **Database Performance**: Query duration, connection pool
- **Business Metrics**: Registrations, subscriptions, revenue
- **Error Tracking**: Error rates by service and type

### ELK Stack Logging

Access at `http://kibana:5601`

Log indices:

- `logs-auth-service-*`
- `logs-qbank-service-*`
- `logs-test-engine-service-*`
- `logs-analytics-service-*`
- `logs-payment-service-*`

### Alerting

Prometheus alert rules defined in `kubernetes/deployment.yaml`

Critical alerts:

- High error rate (>5% of requests failing)
- Database latency (>1s for 95th percentile)
- Pod restart storms (>0.5 restarts/minute)
- Database connection exhaustion

### Sentry Error Tracking

Configure `SENTRY_DSN` to enable error tracking

Features:

- Real-time error notifications
- Stack traces and breadcrumbs
- Release tracking
- Performance monitoring

---

## Backup & Disaster Recovery

### Database Backup

```bash
# Automated daily backups to S3
kubectl apply -f kubernetes/backup-cronjob.yaml

# Manual backup
kubectl exec -it mongodb-0 -n eduprep -- \
  mongodump --uri "mongodb://admin:password@localhost:27017" --archive > backup.archive

# Restore from backup
kubectl exec -it mongodb-0 -n eduprep -- \
  mongorestore --uri "mongodb://admin:password@localhost:27017" --archive < backup.archive
```

### Disaster Recovery Procedures

```bash
# Restore from backup
kubectl create -f kubernetes/deployment.yaml
kubectl set image deployment/auth-service \
  auth-service=ghcr.io/your-org/eduprep-auth-service:stable \
  -n eduprep

# Verify services
kubectl get pods -n eduprep
kubectl run smoke-test --image=curlimages/curl --rm -it -- \
  curl -f http://api-gateway:3000/health
```

### RTO/RPO Targets

- **RTO (Recovery Time Objective)**: 15 minutes
- **RPO (Recovery Point Objective)**: 1 hour
- **Backup Retention**: 30 days

---

## Security Hardening

### Network Policies

NetworkPolicies enforce service-to-service communication restrictions:

```bash
# Verify network policies
kubectl get networkpolicy -n eduprep

# Test communication
kubectl exec -it pod-name -n eduprep -- \
  curl http://blocked-service:3000
```

### RBAC (Role-Based Access Control)

```bash
# Create service account for deployments
kubectl create serviceaccount eduprep-app -n eduprep

# Bind to role
kubectl create rolebinding app-reader \
  --clusterrole=view \
  --serviceaccount=eduprep:eduprep-app \
  -n eduprep
```

### Secrets Management

- Never commit secrets to git
- Use Kubernetes Secrets with encryption at rest
- Rotate secrets regularly
- Audit secret access

### SSL/TLS

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.yaml

# Ingress automatically issues certificates via Let's Encrypt
kubectl get certificate -n eduprep
```

### Image Scanning

```bash
# Scan for vulnerabilities
trivy image ghcr.io/your-org/eduprep-auth-service:1.0.0

# Block insecure images in policy
kubectl apply -f kubernetes/image-policy.yaml
```

### Pod Security Standards

```bash
# Enable Pod Security Standards
kubectl label namespace eduprep \
  pod-security.kubernetes.io/enforce=baseline \
  pod-security.kubernetes.io/audit=restricted
```

---

## Troubleshooting

### Pod Crash Loop

```bash
# Check logs
kubectl logs deployment/auth-service -n eduprep --tail=50

# Describe pod for events
kubectl describe pod <pod-name> -n eduprep

# Check resource limits
kubectl top pod -n eduprep
```

### Database Connection Issues

```bash
# Test MongoDB connectivity
kubectl run -it --rm debug --image=mongo:6.0 --restart=Never -- \
  mongosh "mongodb://admin:password@mongodb:27017"

# Check connection pool
kubectl exec -it mongodb-0 -n eduprep -- \
  mongosh --eval "db.serverStatus().connections"
```

### High Memory Usage

```bash
# Check pod memory
kubectl top pod -n eduprep

# Increase limits
kubectl set resources deployment auth-service \
  -c auth-service \
  --limits=memory=1Gi,cpu=1 \
  --requests=memory=512Mi,cpu=500m \
  -n eduprep

# Restart pods
kubectl rollout restart deployment/auth-service -n eduprep
```

### Slow API Responses

```bash
# Check Prometheus for bottlenecks
# Query: histogram_quantile(0.95, http_request_duration_seconds)

# Check database performance
# Query: histogram_quantile(0.95, db_query_duration_seconds)

# Scale up affected service
kubectl scale deployment qbank-service --replicas=5 -n eduprep
```

---

## Best Practices

1. **Always test in development first** before production changes
2. **Use health checks** for automatic pod restarts
3. **Monitor resource usage** and set appropriate limits
4. **Implement gradual rollouts** with canary deployments
5. **Keep secrets rotated** and audit access
6. **Backup regularly** and test restore procedures
7. **Document changes** and maintain runbooks
8. **Automate operations** where possible
9. **Plan for scale** and test load scenarios
10. **Implement observability** from day one

---

## Support & Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [ELK Stack](https://www.elastic.co/what-is/elk-stack)
- [GitHub Actions](https://docs.github.com/en/actions)
