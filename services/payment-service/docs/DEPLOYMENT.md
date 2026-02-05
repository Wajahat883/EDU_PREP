/\*\*

- Payment Service Deployment Guide
- Location: services/payment-service/docs/DEPLOYMENT.md
-
- Production deployment procedures and best practices
  \*/

# Payment Service Deployment Guide

## Overview

This guide covers deploying the Payment Service to production environments.

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database backups configured
- [ ] Monitoring/alerting setup
- [ ] SSL certificates ready
- [ ] Stripe live keys obtained
- [ ] Webhook URL updated
- [ ] Load testing completed
- [ ] Security audit passed

## Deployment Environments

### Development

- Database: MongoDB local/docker
- Stripe: Test keys
- URL: `http://localhost:3005`

### Staging

- Database: MongoDB Atlas M10
- Stripe: Test keys
- URL: `https://staging-payment.eduprep.com`
- TLS: Self-signed or staging certificate

### Production

- Database: MongoDB Atlas M30+ with replicas
- Stripe: Live keys
- URL: `https://api.eduprep.com/api/payments`
- TLS: Valid SSL certificate

## Build & Package

### 1. Build Docker Image

```bash
cd services/payment-service

# Build
docker build -t eduprep/payment-service:1.0.0 .

# Tag for registry
docker tag eduprep/payment-service:1.0.0 \
  registry.example.com/eduprep/payment-service:1.0.0

# Push to registry
docker push registry.example.com/eduprep/payment-service:1.0.0
```

### 2. Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY src ./src
COPY tsconfig.json ./

# Compile TypeScript
RUN npm run build

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start
CMD ["npm", "start"]
```

### 3. Environment Configuration

Create `deployment.env`:

```bash
# Stripe - LIVE KEYS ONLY
STRIPE_SECRET_KEY=sk_live_your_live_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
STRIPE_WEBHOOK_SECRET=whsec_live_your_webhook_secret_here

# Database - Production MongoDB
DATABASE_URL=mongodb+srv://admin:password@cluster.mongodb.net/eduprep_payment?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_production_jwt_secret_key

# Email
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDER_EMAIL=billing@eduprep.com

# URLs
APP_URL=https://eduprep.com
DASHBOARD_URL=https://eduprep.com/dashboard

# Security
NODE_ENV=production
LOG_LEVEL=info
```

## Kubernetes Deployment

### 1. Create ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: payment-service-config
  namespace: eduprep
data:
  NODE_ENV: production
  LOG_LEVEL: info
  PORT: "3005"
  DATABASE_URL: "mongodb+srv://admin:***@cluster.mongodb.net/eduprep_payment?retryWrites=true&w=majority"
  STRIPE_BASIC_PRICE_ID: "price_basic_monthly"
  STRIPE_STANDARD_PRICE_ID: "price_standard_quarterly"
  STRIPE_PREMIUM_PRICE_ID: "price_premium_annual"
  APP_URL: "https://eduprep.com"
```

### 2. Create Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: payment-service-secrets
  namespace: eduprep
type: Opaque
stringData:
  STRIPE_SECRET_KEY: sk_live_...
  STRIPE_WEBHOOK_SECRET: whsec_live_...
  JWT_SECRET: your_jwt_secret_here
  SENDGRID_API_KEY: SG.xxx...
```

### 3. Deploy Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: payment-service
  namespace: eduprep
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 3005
      protocol: TCP
  selector:
    app: payment-service
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
  namespace: eduprep
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: payment-service
  template:
    metadata:
      labels:
        app: payment-service
    spec:
      containers:
        - name: payment-service
          image: registry.example.com/eduprep/payment-service:1.0.0
          ports:
            - containerPort: 3005
          envFrom:
            - configMapRef:
                name: payment-service-config
            - secretRef:
                name: payment-service-secrets
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3005
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: 3005
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          securityContext:
            runAsNonRoot: true
            runAsUser: 1000
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
      securityContext:
        fsGroup: 1000
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: payment-service-hpa
  namespace: eduprep
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: payment-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### 4. Deploy Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: payment-service-ingress
  namespace: eduprep
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.eduprep.com
      secretName: payment-service-tls
  rules:
    - host: api.eduprep.com
      http:
        paths:
          - path: /api/payments
            pathType: Prefix
            backend:
              service:
                name: payment-service
                port:
                  number: 80
```

## Deploy to Kubernetes

```bash
# Apply configurations
kubectl apply -f kubernetes/payment-service-config.yaml
kubectl apply -f kubernetes/payment-service-secrets.yaml
kubectl apply -f kubernetes/payment-service-deployment.yaml
kubectl apply -f kubernetes/payment-service-ingress.yaml

# Verify deployment
kubectl get pods -n eduprep -l app=payment-service
kubectl logs -n eduprep -l app=payment-service --tail=50

# Test endpoint
curl https://api.eduprep.com/api/payments/health
```

## Docker Compose Deployment

For single-server deployments:

```yaml
version: "3.8"

services:
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  payment-service:
    build: .
    ports:
      - "3005:3005"
    environment:
      DATABASE_URL: mongodb://admin:password@mongodb:27017/eduprep_payment
      STRIPE_SECRET_KEY: sk_live_your_key
      JWT_SECRET: your_secret
      NODE_ENV: production
    depends_on:
      mongodb:
        condition: service_healthy
    healthcheck:
      test: curl -f http://localhost:3005/health || exit 1
      interval: 30s
      timeout: 3s
      retries: 3

volumes:
  mongodb_data:
```

Deploy:

```bash
docker-compose up -d
docker-compose logs -f payment-service
```

## Manual Deployment (VPS)

### 1. Connect to Server

```bash
ssh user@server.example.com
```

### 2. Install Dependencies

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB (if not using cloud database)
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get install -y mongodb-org

# Install Nginx
sudo apt-get install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### 3. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/your-org/eduprep-platform.git
cd eduprep-platform/services/payment-service
sudo chown -R $USER:$USER .
```

### 4. Setup Environment

```bash
cp .env.example .env

# Edit .env with production values
nano .env
```

### 5. Install Dependencies & Build

```bash
npm install
npm run build
```

### 6. Configure PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "payment-service",
      script: "./dist/index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3005,
      },
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
```

Start service:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. Configure Nginx

Create `/etc/nginx/sites-available/payment-service`:

```nginx
server {
    listen 80;
    server_name api.eduprep.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.eduprep.com;

    ssl_certificate /etc/letsencrypt/live/api.eduprep.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.eduprep.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location /api/payments {
        proxy_pass http://localhost:3005/api/payments;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Rate limiting
        limit_req zone=api burst=100 nodelay;
    }
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/payment-service /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Post-Deployment Verification

```bash
# Check service status
curl https://api.eduprep.com/api/payments/health

# View logs
pm2 logs payment-service

# Monitor memory/CPU
pm2 monit
```

## Rolling Deployment

```bash
# Build new version
docker build -t payment-service:2.0.0 .

# Deploy to Kubernetes
kubectl set image deployment/payment-service \
  payment-service=registry.example.com/eduprep/payment-service:2.0.0

# Monitor rollout
kubectl rollout status deployment/payment-service

# Rollback if needed
kubectl rollout undo deployment/payment-service
```

## Monitoring & Alerts

### Setup Prometheus Metrics

Add to `index.ts`:

```typescript
import promClient from "prom-client";

app.get("/metrics", (req, res) => {
  res.set("Content-Type", promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

### Setup AlertManager

Configure alerts for:

- Service down
- High error rate (>5%)
- High latency (p99 > 1s)
- Database connection errors
- Payment failures

## Backup Strategy

- **Frequency**: Daily automated backups
- **Retention**: 30 days
- **Location**: Offsite (S3, GCS)
- **Recovery Time**: < 1 hour

## Incident Response

### Service Down

1. Check server status
2. Review logs: `pm2 logs payment-service`
3. Check database connectivity
4. Restart service: `pm2 restart payment-service`
5. Notify support team

### High Error Rate

1. Check recent deployments
2. Review error logs
3. Check external dependencies (Stripe, MongoDB)
4. Rollback if needed

### Database Issues

1. Check MongoDB status
2. Review slow queries
3. Check disk space
4. Scale up if needed

## Documentation

- [API Reference](./API_REFERENCE.md)
- [Database Setup](./DATABASE_SETUP.md)
- [Stripe Integration](./STRIPE_SETUP.md)
- [Testing Guide](./TESTING_GUIDE.md)
