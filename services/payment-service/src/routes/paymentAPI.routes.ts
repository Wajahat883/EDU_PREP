/**
 * Payment API Routes
 * Location: services/payment-service/src/routes/paymentAPI.routes.ts
 *
 * RESTful API endpoints for payment and subscription management
 */

import { Router, Request, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth.middleware";
import paymentController from "../controllers/paymentController";
import stripeWebhookHandler from "../webhooks/stripeWebhookHandler";
import logger from "../utils/logger";

const router = Router();

/**
 * POST /api/payments/subscribe
 * Create a new subscription
 * Requires: Authentication
 * Body: { tierId: string, paymentMethodId: string }
 */
router.post(
  "/subscribe",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    await paymentController.subscribe(req, res);
  },
);

/**
 * POST /api/payments/upgrade
 * Upgrade existing subscription to higher tier
 * Requires: Authentication
 * Body: { newTierId: string }
 */
router.post(
  "/upgrade",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    await paymentController.upgrade(req, res);
  },
);

/**
 * GET /api/payments/subscription
 * Get user's current subscription details
 * Requires: Authentication
 */
router.get(
  "/subscription",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    await paymentController.getSubscription(req, res);
  },
);

/**
 * POST /api/payments/cancel
 * Cancel user's subscription
 * Requires: Authentication
 * Body: { immediate?: boolean } - if true, cancel immediately; if false, cancel at period end
 */
router.post(
  "/cancel",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    await paymentController.cancelSubscription(req, res);
  },
);

/**
 * GET /api/payments/invoices
 * Get user's payment invoices
 * Requires: Authentication
 */
router.get(
  "/invoices",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    await paymentController.getInvoices(req, res);
  },
);

/**
 * POST /api/payments/webhook
 * Stripe webhook endpoint for payment events
 * Public (webhook signature verified)
 */
router.post("/webhook", async (req: Request, res: Response) => {
  await stripeWebhookHandler.handleWebhook(req, res);
});

/**
 * GET /api/payments/plans
 * Get all available subscription plans
 * Public endpoint
 */
router.get("/plans", (req: Request, res: Response) => {
  const plans = [
    {
      id: "basic",
      name: "Basic",
      description: "Get started with essential features",
      price: 49,
      interval: "month",
      stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
      features: [
        {
          name: "2,000 practice questions",
          included: true,
        },
        {
          name: "Basic analytics",
          included: true,
        },
        {
          name: "Mobile app access",
          included: true,
        },
        {
          name: "Flashcard system",
          included: false,
        },
        {
          name: "Mock exams",
          included: false,
        },
        {
          name: "AI-powered recommendations",
          included: false,
        },
        {
          name: "Live tutoring",
          included: false,
        },
        {
          name: "Certificate of completion",
          included: false,
        },
        {
          name: "Offline mode",
          included: false,
        },
      ],
    },
    {
      id: "standard",
      name: "Standard",
      description: "Most popular - expand your learning",
      price: 129,
      interval: "3 months",
      stripePriceId: process.env.STRIPE_STANDARD_PRICE_ID,
      features: [
        {
          name: "5,000 practice questions",
          included: true,
        },
        {
          name: "Advanced analytics",
          included: true,
        },
        {
          name: "Mobile app access",
          included: true,
        },
        {
          name: "Flashcard system",
          included: true,
        },
        {
          name: "Mock exams",
          included: true,
        },
        {
          name: "AI-powered recommendations",
          included: true,
        },
        {
          name: "Live tutoring",
          included: false,
        },
        {
          name: "Certificate of completion",
          included: false,
        },
        {
          name: "Offline mode",
          included: false,
        },
      ],
    },
    {
      id: "premium",
      name: "Premium",
      description: "Ultimate prep experience",
      price: 299,
      interval: "year",
      stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
      features: [
        {
          name: "All 10,000+ practice questions",
          included: true,
        },
        {
          name: "Advanced analytics",
          included: true,
        },
        {
          name: "Mobile app access",
          included: true,
        },
        {
          name: "Flashcard system",
          included: true,
        },
        {
          name: "Mock exams",
          included: true,
        },
        {
          name: "AI-powered recommendations",
          included: true,
        },
        {
          name: "Live tutoring",
          included: true,
        },
        {
          name: "Certificate of completion",
          included: true,
        },
        {
          name: "Offline mode",
          included: true,
        },
      ],
    },
  ];

  res.status(200).json({ plans });
});

export default router;
