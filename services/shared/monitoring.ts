/**
 * Monitoring and Observability Setup
 *
 * Implements comprehensive monitoring using:
 * - Prometheus for metrics collection
 * - Grafana for visualization
 * - ELK Stack for logging
 * - Sentry for error tracking
 */

import * as prometheus from "prom-client";
import winston from "winston";
import ElasticsearchTransport from "winston-elasticsearch";
import Sentry from "@sentry/node";

// ============================================
// Prometheus Metrics Setup
// ============================================

export const createMetricsCollector = () => {
  // Default metrics (CPU, memory, etc.)
  prometheus.collectDefaultMetrics();

  // HTTP Request metrics
  const httpRequestDuration = new prometheus.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.1, 0.5, 1, 2, 5],
  });

  const httpRequestTotal = new prometheus.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
  });

  const httpRequestSize = new prometheus.Histogram({
    name: "http_request_size_bytes",
    help: "HTTP request size in bytes",
    labelNames: ["method", "route"],
    buckets: [100, 1000, 10000, 100000, 1000000],
  });

  const httpResponseSize = new prometheus.Histogram({
    name: "http_response_size_bytes",
    help: "HTTP response size in bytes",
    labelNames: ["method", "route", "status_code"],
    buckets: [100, 1000, 10000, 100000, 1000000],
  });

  // Database metrics
  const dbQueryDuration = new prometheus.Histogram({
    name: "db_query_duration_seconds",
    help: "Duration of database queries in seconds",
    labelNames: ["operation", "collection", "status"],
    buckets: [0.01, 0.05, 0.1, 0.5, 1],
  });

  const dbConnections = new prometheus.Gauge({
    name: "db_connections_active",
    help: "Active database connections",
    labelNames: ["pool"],
  });

  const dbErrors = new prometheus.Counter({
    name: "db_errors_total",
    help: "Total number of database errors",
    labelNames: ["operation", "collection", "error_type"],
  });

  // Cache metrics
  const cacheHits = new prometheus.Counter({
    name: "cache_hits_total",
    help: "Total number of cache hits",
    labelNames: ["cache_name"],
  });

  const cacheMisses = new prometheus.Counter({
    name: "cache_misses_total",
    help: "Total number of cache misses",
    labelNames: ["cache_name"],
  });

  const cacheSize = new prometheus.Gauge({
    name: "cache_size_bytes",
    help: "Current cache size in bytes",
    labelNames: ["cache_name"],
  });

  // Business metrics
  const questionsCreated = new prometheus.Counter({
    name: "questions_created_total",
    help: "Total questions created",
    labelNames: ["subject"],
  });

  const testsCompleted = new prometheus.Counter({
    name: "tests_completed_total",
    help: "Total tests completed",
    labelNames: ["subject"],
  });

  const testAverageScore = new prometheus.Gauge({
    name: "test_average_score",
    help: "Average test score",
    labelNames: ["subject"],
  });

  const usersRegistered = new prometheus.Counter({
    name: "users_registered_total",
    help: "Total users registered",
  });

  const activeSubscriptions = new prometheus.Gauge({
    name: "active_subscriptions",
    help: "Number of active subscriptions",
    labelNames: ["plan_type"],
  });

  const revenueTotal = new prometheus.Counter({
    name: "revenue_total_cents",
    help: "Total revenue in cents",
    labelNames: ["currency"],
  });

  // Error tracking
  const errorTotal = new prometheus.Counter({
    name: "errors_total",
    help: "Total errors",
    labelNames: ["service", "error_type", "severity"],
  });

  return {
    httpRequestDuration,
    httpRequestTotal,
    httpRequestSize,
    httpResponseSize,
    dbQueryDuration,
    dbConnections,
    dbErrors,
    cacheHits,
    cacheMisses,
    cacheSize,
    questionsCreated,
    testsCompleted,
    testAverageScore,
    usersRegistered,
    activeSubscriptions,
    revenueTotal,
    errorTotal,
  };
};

// ============================================
// Logging Setup with Winston
// ============================================

export const createLogger = (serviceName: string) => {
  const elasticTransport = new ElasticsearchTransport({
    level: process.env.LOG_LEVEL || "info",
    clientOpts: {
      node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
    },
    index: `logs-${serviceName}`,
  });

  const logger = winston.createLogger({
    defaultMeta: {
      service: serviceName,
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION,
    },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, ...meta }) => {
            return `${timestamp} [${serviceName}] ${level}: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
            }`;
          }),
        ),
      }),
      new winston.transports.File({
        filename: `logs/${serviceName}-error.log`,
        level: "error",
      }),
      new winston.transports.File({
        filename: `logs/${serviceName}.log`,
      }),
      elasticTransport,
    ],
  });

  return logger;
};

// ============================================
// Sentry Error Tracking Setup
// ============================================

export const initSentry = (serviceName: string) => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    serviceName,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    attachStacktrace: true,
    maxBreadcrumbs: 50,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
  });

  return Sentry;
};

// ============================================
// Express Middleware for Metrics
// ============================================

export const createMetricsMiddleware = (
  metrics: ReturnType<typeof createMetricsCollector>,
) => {
  return (req: any, res: any, next: any) => {
    const start = Date.now();

    // Track request size
    if (req.headers["content-length"]) {
      metrics.httpRequestSize.observe(
        {
          method: req.method,
          route: req.route?.path || req.path,
        },
        parseInt(req.headers["content-length"], 10),
      );
    }

    // Wrap response
    const originalJson = res.json;
    let responseSize = 0;

    res.json = function (data: any) {
      responseSize = JSON.stringify(data).length;
      return originalJson.call(this, data);
    };

    res.on("finish", () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path;
      const method = req.method;
      const statusCode = res.statusCode;

      // Record metrics
      metrics.httpRequestDuration.observe(
        {
          method,
          route,
          status_code: statusCode,
        },
        duration,
      );

      metrics.httpRequestTotal.inc({
        method,
        route,
        status_code: statusCode,
      });

      if (responseSize > 0) {
        metrics.httpResponseSize.observe(
          {
            method,
            route,
            status_code: statusCode,
          },
          responseSize,
        );
      }
    });

    next();
  };
};

// ============================================
// Health Check Endpoint
// ============================================

export const createHealthCheckEndpoint = async (
  app: any,
  metrics: ReturnType<typeof createMetricsCollector>,
  checks: Record<string, () => Promise<boolean>>,
) => {
  app.get("/health", async (req: any, res: any) => {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {} as Record<string, boolean>,
    };

    // Run health checks
    for (const [name, check] of Object.entries(checks)) {
      try {
        health.checks[name] = await check();
      } catch (error) {
        health.checks[name] = false;
        health.status = "degraded";
      }
    }

    const statusCode = health.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(health);
  });

  // Prometheus metrics endpoint
  app.get("/metrics", async (req: any, res: any) => {
    res.set("Content-Type", prometheus.register.contentType);
    res.end(await prometheus.register.metrics());
  });
};

// ============================================
// Alert Rules Configuration
// ============================================

export const alertRules = `
groups:
- name: eduprep_alerts
  interval: 30s
  rules:
  # High error rate
  - alert: HighErrorRate
    expr: rate(errors_total[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ \$value }} errors/second"

  # High database query latency
  - alert: HighDatabaseLatency
    expr: histogram_quantile(0.95, db_query_duration_seconds) > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Database query latency is high"
      description: "95th percentile latency is {{ \$value }}s"

  # High HTTP response time
  - alert: HighResponseTime
    expr: histogram_quantile(0.95, http_request_duration_seconds) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "HTTP response time is high"
      description: "95th percentile response time is {{ \$value }}s"

  # High memory usage
  - alert: HighMemoryUsage
    expr: process_resident_memory_bytes / 1024 / 1024 > 512
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage"
      description: "Process is using {{ \$value }}MB of memory"

  # Pod restart rate
  - alert: HighPodRestartRate
    expr: rate(kube_pod_container_status_restarts_total[15m]) > 0.5
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High pod restart rate"
      description: "Pod restart rate is {{ \$value }} restarts/minute"

  # Low cache hit rate
  - alert: LowCacheHitRate
    expr: rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) < 0.7
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Low cache hit rate"
      description: "Cache hit rate is {{ \$value }}"

  # Database connection pool exhaustion
  - alert: DatabaseConnectionPoolExhaustion
    expr: db_connections_active > 90
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Database connection pool nearly exhausted"
      description: "Active connections: {{ \$value }}"
`;

export default {
  createMetricsCollector,
  createLogger,
  initSentry,
  createMetricsMiddleware,
  createHealthCheckEndpoint,
  alertRules,
};
