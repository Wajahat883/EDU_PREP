/**
 * Checkout Form Component
 *
 * Stripe-based checkout form with:
 * - Tier selection
 * - Coupon code application
 * - Payment method handling (card)
 * - Trial period indication
 * - Subscription confirmation
 */

import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Box,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import {
  Check,
  Close,
  CreditCard,
  Lock,
  TrendingUp,
  Star,
} from "@mui/icons-material";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axios from "axios";
import { useRouter } from "next/router";

interface Tier {
  id: string;
  name: string;
  price: number;
  features: string[];
  icon: React.ReactNode;
  color: string;
}

const CheckoutForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [selectedTier, setSelectedTier] = useState<string>("starter");
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const tiers: Record<string, Tier> = {
    starter: {
      id: "starter",
      name: "Starter",
      price: 9,
      features: [
        "Unlimited questions",
        "Basic analytics",
        "Search functionality",
        "Community support",
      ],
      icon: <Star />,
      color: "#4CAF50",
    },
    professional: {
      id: "professional",
      name: "Professional",
      price: 29,
      features: [
        "All Starter features",
        "Advanced analytics",
        "Flashcard system",
        "AI recommendations",
        "Email support",
      ],
      icon: <TrendingUp />,
      color: "#2196F3",
    },
    premium: {
      id: "premium",
      name: "Premium",
      price: 49,
      features: [
        "All Professional features",
        "Priority support",
        "Custom analytics reports",
        "Advanced AI features",
        "API access",
      ],
      icon: <Lock />,
      color: "#FF9800",
    },
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponValid(null);
      setCouponDiscount(0);
      return;
    }

    try {
      const response = await axios.post(
        "/api/payments/validate-coupon",
        { couponCode },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (response.data.valid) {
        setCouponValid(true);
        // Calculate discount based on response
        const tier = tiers[selectedTier];
        const discountAmount = response.data.percentOff
          ? (tier.price * response.data.percentOff) / 100
          : response.data.amountOff;
        setCouponDiscount(discountAmount);
      } else {
        setCouponValid(false);
        setCouponDiscount(0);
      }
    } catch (error) {
      setCouponValid(false);
      setCouponDiscount(0);
    }
  };

  const handleCheckout = async () => {
    if (!stripe || !elements) {
      setErrorMessage("Payment system not ready");
      return;
    }

    if (!email) {
      setErrorMessage("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          email,
        },
      });

      if (error) {
        setErrorMessage(error.message || "Payment method creation failed");
        return;
      }

      // Create subscription
      const response = await axios.post(
        "/api/payments/subscribe",
        {
          tier: selectedTier,
          email,
          paymentMethodId: paymentMethod.id,
          couponCode: couponCode.trim() || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (response.data.success) {
        setSuccessMessage(
          `Successfully subscribed to ${tiers[selectedTier].name} plan!`,
        );
        setTimeout(() => {
          router.push("/subscription");
        }, 2000);
      }
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.error || "Subscription creation failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const tier = tiers[selectedTier];
  const subtotal = tier.price;
  const discount = couponValid ? couponDiscount : 0;
  const total = Math.max(0, subtotal - discount);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Messages */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Tier Selection */}
        <Grid item xs={12} lg={8}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Select Your Plan
          </Typography>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            {Object.values(tiers).map((plan) => (
              <Grid item xs={12} sm={6} md={4} key={plan.id}>
                <Card
                  onClick={() => setSelectedTier(plan.id)}
                  sx={{
                    cursor: "pointer",
                    height: "100%",
                    transition: "all 0.3s ease",
                    border:
                      selectedTier === plan.id
                        ? `2px solid ${plan.color}`
                        : "1px solid #e0e0e0",
                    backgroundColor:
                      selectedTier === plan.id ? "#f5f5f5" : "white",
                    transform:
                      selectedTier === plan.id ? "scale(1.02)" : "scale(1)",
                    "&:hover": {
                      boxShadow: 3,
                      transform: "scale(1.02)",
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box sx={{ color: plan.color, mr: 1 }}>{plan.icon}</Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {plan.name}
                      </Typography>
                    </Box>

                    <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                      ${plan.price}
                      <span style={{ fontSize: "0.5em", fontWeight: 400 }}>
                        /month
                      </span>
                    </Typography>

                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mb: 2 }}
                    >
                      14-day free trial
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <List dense>
                      {plan.features.map((feature, idx) => (
                        <ListItem key={idx} disableGutters>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Check
                              sx={{ color: "success.main", fontSize: 20 }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{
                              variant: "body2",
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    <Button
                      fullWidth
                      variant={
                        selectedTier === plan.id ? "contained" : "outlined"
                      }
                      sx={{
                        mt: 2,
                        backgroundColor:
                          selectedTier === plan.id ? plan.color : undefined,
                      }}
                    >
                      {selectedTier === plan.id ? "Selected" : "Select Plan"}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Coupon Code */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Have a Coupon Code?
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponValid(null);
                  }}
                  fullWidth
                  disabled={loading}
                />
                <Button
                  variant="outlined"
                  onClick={validateCoupon}
                  disabled={loading || !couponCode.trim()}
                >
                  Apply
                </Button>
              </Box>
              {couponValid === true && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Coupon applied! Save ${couponDiscount.toFixed(2)}
                </Alert>
              )}
              {couponValid === false && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Invalid coupon code
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Email */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Email Address
              </Typography>
              <TextField
                type="email"
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                disabled={loading}
                variant="outlined"
              />
            </CardContent>
          </Card>

          {/* Payment Form */}
          {showPaymentForm && (
            <Card sx={{ mb: 4, border: "2px solid #2196F3" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Payment Information
                </Typography>

                <Box
                  sx={{
                    p: 2,
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                    mb: 3,
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: "16px",
                          color: "#424242",
                        },
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Lock sx={{ fontSize: 20, color: "success.main" }} />
                  <Typography variant="caption" color="textSecondary">
                    Secure payment powered by Stripe
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Summary */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ position: "sticky", top: 20 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Order Summary
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">
                    {tier.name} Plan ({tier.price}% monthly)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ${subtotal.toFixed(2)}
                  </Typography>
                </Box>

                {discount > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="success.main">
                      Coupon Discount
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "success.main" }}
                    >
                      -${discount.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    First Month Total
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "#2196F3" }}
                  >
                    ${total.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="caption">
                  <strong>14-day free trial included.</strong> Your first charge
                  will occur after the trial period ends. Cancel anytime.
                </Typography>
              </Alert>

              {!showPaymentForm ? (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => setShowPaymentForm(true)}
                  disabled={!email}
                  sx={{ py: 1.5, fontWeight: 600 }}
                >
                  Continue to Payment
                </Button>
              ) : (
                <>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleCheckout}
                    disabled={!stripe || loading || !email}
                    sx={{ py: 1.5, fontWeight: 600, mb: 1 }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Processing...
                      </>
                    ) : (
                      "Complete Purchase"
                    )}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setShowPaymentForm(false)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Lock sx={{ fontSize: 16, color: "textSecondary" }} />
                <Typography variant="caption" color="textSecondary">
                  SSL Secure. We never store your card details.
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Trust Badges */}
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography
              variant="caption"
              color="textSecondary"
              display="block"
              sx={{ mb: 1 }}
            >
              Trusted by thousands of students
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              <Chip label="SSL Secure" variant="outlined" size="small" />
              <Chip label="Money-Back" variant="outlined" size="small" />
              <Chip label="No Setup Fee" variant="outlined" size="small" />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CheckoutForm;
