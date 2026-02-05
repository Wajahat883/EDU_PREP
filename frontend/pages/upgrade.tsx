/**
 * Upgrade/Premium Page
 * For logged-in users to purchase or upgrade their subscription
 * Redirects here if user already has subscription and wants to upgrade
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Container,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Header from "../components/Header";
import { useAuthStore } from "../lib/store";

interface UpgradeTier {
  id: string;
  name: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const upgradeTiers: UpgradeTier[] = [
  {
    id: "basic",
    name: "Basic",
    price: 49,
    interval: "/month",
    description: "Great for beginners",
    features: [
      "Unlimited question access",
      "Basic analytics dashboard",
      "Practice exams (limited)",
      "Mobile access",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: 129,
    interval: "/3 months",
    description: "Most popular for serious preparation",
    features: [
      "All Basic features",
      "Advanced analytics & trends",
      "Flashcard system with spaced repetition",
      "AI-powered study recommendations",
      "Priority email support",
      "Mock exams (limited)",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 299,
    interval: "/year",
    description: "Everything included, best value",
    features: [
      "All Standard features",
      "Lifetime access to content",
      "Unlimited mock exams",
      "Video explanations",
      "1-on-1 tutoring sessions",
      "Certificate of completion",
      "Priority support 24/7",
      "Offline mode",
    ],
  },
];

interface CheckoutData {
  tierId: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

const UpgradePage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [openCheckout, setOpenCheckout] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null,
  );

  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    tierId: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      router.push("/login");
      return;
    }

    // Fetch current subscription from MongoDB
    const fetchSubscription = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/subscription`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.subscription?.tierId) {
            setCurrentPlan(data.subscription.tierId);
          }
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    fetchSubscription();
  }, [user, router]);

  const handleUpgrade = (tierId: string) => {
    setSelectedTier(tierId);
    setCheckoutData((prev) => ({ ...prev, tierId }));
    setOpenCheckout(true);
  };

  const handleCheckoutChange = (field: keyof CheckoutData, value: string) => {
    setCheckoutData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProcessPayment = async () => {
    if (
      !checkoutData.cardNumber ||
      !checkoutData.expiryDate ||
      !checkoutData.cvv
    ) {
      setMessage({ type: "error", text: "Please fill in all payment fields" });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/upgrade`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tierId: checkoutData.tierId,
            paymentMethod: {
              card: {
                number: checkoutData.cardNumber.replace(/\s/g, ""),
                exp_month: parseInt(checkoutData.expiryDate.split("/")[0]),
                exp_year: parseInt(
                  "20" + checkoutData.expiryDate.split("/")[1],
                ),
                cvc: checkoutData.cvv,
              },
            },
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Payment failed");
      }

      const result = await response.json();

      setMessage({
        type: "success",
        text: `Successfully upgraded to ${selectedTier}! Saving to profile...`,
      });

      // Save subscription to MongoDB
      try {
        const subscriptionResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/subscription`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              tierId: checkoutData.tierId,
              status: "active",
              startDate: new Date().toISOString(),
            }),
          },
        );

        if (subscriptionResponse.ok) {
          setOpenCheckout(false);
          setCurrentPlan(checkoutData.tierId);

          // Redirect after 2 seconds
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        }
      } catch (err) {
        console.error("Error saving subscription:", err);
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setMessage({
        type: "error",
        text: `Payment failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div>
        <Header />
        <Container sx={{ py: 4, textAlign: "center" }}>
          <CircularProgress />
        </Container>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <h1>Upgrade Your Plan</h1>
          <p>
            Get the most out of your EduPrep experience with our premium
            features
          </p>
          {currentPlan && (
            <Chip
              label={`Current Plan: ${currentPlan.toUpperCase()}`}
              color="primary"
              variant="outlined"
              sx={{ mt: 2 }}
            />
          )}
        </Box>

        {message && (
          <Alert
            severity={message.type as "success" | "error" | "info" | "warning"}
            onClose={() => setMessage(null)}
            sx={{ mb: 3 }}
          >
            {message.text}
          </Alert>
        )}

        {/* Pricing Cards */}
        <Grid container spacing={3}>
          {upgradeTiers.map((tier) => (
            <Grid item xs={12} md={4} key={tier.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  border: tier.popular ? "2px solid #1976d2" : "1px solid #ddd",
                  position: "relative",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: 4,
                  },
                }}
              >
                {tier.popular && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: -16,
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "#1976d2",
                      color: "white",
                      padding: "6px 16px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}
                  >
                    Most Popular
                  </Box>
                )}

                {currentPlan === tier.id && (
                  <Box
                    sx={{
                      backgroundColor: "#e8f5e9",
                      padding: "8px 0",
                      textAlign: "center",
                      borderBottom: "2px solid #4caf50",
                    }}
                  >
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Your Current Plan"
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                )}

                <CardContent sx={{ flexGrow: 1, pt: tier.popular ? 4 : 2 }}>
                  <h3 style={{ marginTop: 0 }}>{tier.name}</h3>
                  <Box sx={{ mb: 3 }}>
                    <span style={{ fontSize: "40px", fontWeight: "bold" }}>
                      ${tier.price}
                    </span>
                    <span style={{ color: "#666", fontSize: "14px" }}>
                      {tier.interval}
                    </span>
                  </Box>
                  <p style={{ color: "#666", marginBottom: "24px" }}>
                    {tier.description}
                  </p>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    {tier.features.map((feature, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1,
                        }}
                      >
                        <CheckCircleIcon
                          sx={{ color: "#4caf50", fontSize: "20px", mt: 0.5 }}
                        />
                        <span style={{ fontSize: "14px", color: "#333" }}>
                          {feature}
                        </span>
                      </Box>
                    ))}
                  </Box>
                </CardContent>

                <CardActions>
                  <Button
                    fullWidth
                    variant={tier.popular ? "contained" : "outlined"}
                    disabled={currentPlan === tier.id}
                    onClick={() => handleUpgrade(tier.id)}
                  >
                    {currentPlan === tier.id ? "Current Plan" : "Choose Plan"}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Benefits Section */}
        <Box sx={{ mt: 6, backgroundColor: "#f5f5f5", p: 4, borderRadius: 2 }}>
          <h2 style={{ textAlign: "center", marginTop: 0 }}>Why Upgrade?</h2>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: "center" }}>
                <h4>📊 Advanced Analytics</h4>
                <p>
                  Track your progress with detailed performance metrics and
                  personalized insights.
                </p>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: "center" }}>
                <h4>🎯 AI-Powered Learning</h4>
                <p>
                  Get intelligent study recommendations based on your
                  performance and learning patterns.
                </p>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: "center" }}>
                <h4>🏆 Complete Preparation</h4>
                <p>
                  Access all features including flashcards, mock exams, and
                  unlimited practice questions.
                </p>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Checkout Dialog */}
      <Dialog
        open={openCheckout}
        onClose={() => !loading && setOpenCheckout(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Upgrade to {selectedTier?.charAt(0).toUpperCase()}
          {selectedTier?.slice(1)}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <Alert severity="info">
              Upgrade your plan to unlock premium features instantly.
            </Alert>
            <TextField
              fullWidth
              label="Card Number"
              placeholder="1234 5678 9012 3456"
              value={checkoutData.cardNumber}
              onChange={(e) =>
                handleCheckoutChange("cardNumber", e.target.value)
              }
            />
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <TextField
                label="Expiry Date"
                placeholder="MM/YY"
                value={checkoutData.expiryDate}
                onChange={(e) =>
                  handleCheckoutChange("expiryDate", e.target.value)
                }
              />
              <TextField
                label="CVV"
                type="password"
                placeholder="123"
                value={checkoutData.cvv}
                onChange={(e) => handleCheckoutChange("cvv", e.target.value)}
              />
            </Box>
            <Alert severity="info">
              Your payment is secure and encrypted with industry-standard SSL
              encryption.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCheckout(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleProcessPayment}
            disabled={loading}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} /> Processing...
              </>
            ) : (
              "Complete Upgrade"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UpgradePage;
