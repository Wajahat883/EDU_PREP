/**
 * Admin Payment Dashboard Page
 *
 * Provides administrators with:
 * - Payment metrics and revenue tracking
 * - Subscription overview and filtering
 * - Invoice management
 * - Refund processing interface
 * - Failed payment tracking and recovery
 * - Subscription churn analysis
 */

import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  Download,
  Edit,
  MoneyOff,
  TrendingUp,
  Group,
  Warning,
  CheckCircle,
} from "@mui/icons-material";
import axios from "axios";

interface PaymentMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  pendingPayments: number;
  successRate: number;
}

interface SubscriptionData {
  id: string;
  userId: string;
  userEmail: string;
  tier: string;
  status: string;
  currentPeriodEnd: string;
  createdAt: string;
  amount: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  userId: string;
  userEmail: string;
  amount: number;
  status: string;
  createdAt: string;
  dueDate: string;
  paidAt?: string;
}

interface FailedPaymentData {
  invoiceId: string;
  userId: string;
  userEmail: string;
  amount: number;
  retryCount: number;
  maxRetries: number;
  nextRetryDate: string;
  failureReason: string;
}

const AdminPaymentDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [failedPayments, setFailedPayments] = useState<FailedPaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "subscriptions" | "invoices" | "failures"
  >("overview");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(
    null,
  );
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };

      // Load metrics
      const metricsRes = await axios.get("/api/admin/payments/metrics", {
        headers,
      });
      setMetrics(metricsRes.data.metrics);

      // Load subscriptions
      const subsRes = await axios.get("/api/admin/payments/subscriptions", {
        headers,
      });
      setSubscriptions(subsRes.data.subscriptions || []);

      // Load invoices
      const invRes = await axios.get("/api/admin/payments/invoices", {
        headers,
      });
      setInvoices(invRes.data.invoices || []);

      // Load failed payments
      const failRes = await axios.get("/api/admin/payments/failed-payments", {
        headers,
      });
      setFailedPayments(failRes.data.failedPayments || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setErrorMessage("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefundClick = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice);
    setRefundAmount(invoice.amount);
    setRefundDialogOpen(true);
  };

  const handleProcessRefund = async () => {
    if (!selectedInvoice) return;

    try {
      const response = await axios.post(
        `/api/admin/payments/invoices/${selectedInvoice.id}/refund`,
        {
          amount: refundAmount,
          reason: refundReason,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (response.data.success) {
        setSuccessMessage("Refund processed successfully");
        setRefundDialogOpen(false);
        loadDashboardData();
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.error || "Failed to process refund",
      );
    }
  };

  const handleRetryPayment = async (invoiceId: string) => {
    try {
      const response = await axios.post(
        `/api/admin/payments/failed-payments/${invoiceId}/retry`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (response.data.success) {
        setSuccessMessage("Payment retry initiated");
        loadDashboardData();
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || "Failed to retry payment");
    }
  };

  const handleExportData = async () => {
    try {
      const response = await axios.get("/api/admin/payments/export", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `payment-data-${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentElement?.removeChild(link);
    } catch (error) {
      setErrorMessage("Failed to export data");
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading dashboard...</Typography>
      </Container>
    );
  }

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (filterStatus !== "all" && sub.status !== filterStatus) return false;
    if (filterTier !== "all" && sub.tier !== filterTier) return false;
    return true;
  });

  const filteredInvoices = invoices.filter((inv) => {
    if (filterStatus !== "all" && inv.status !== filterStatus) return false;
    return true;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Payment Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExportData}
        >
          Export Data
        </Button>
      </Box>

      {/* Metrics Cards */}
      {metrics && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <TrendingUp sx={{ color: "#4CAF50", mr: 1, fontSize: 32 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Total Revenue
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "#4CAF50" }}
                >
                  $
                  {metrics.totalRevenue.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Lifetime total
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <TrendingUp sx={{ color: "#2196F3", mr: 1, fontSize: 32 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Monthly Revenue
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "#2196F3" }}
                >
                  $
                  {metrics.monthlyRevenue.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  This month
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Group sx={{ color: "#FF9800", mr: 1, fontSize: 32 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Active Subscriptions
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "#FF9800" }}
                >
                  {metrics.activeSubscriptions}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Currently active
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Warning sx={{ color: "#F44336", mr: 1, fontSize: 32 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Churn Rate
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "#F44336" }}
                >
                  {metrics.churnRate.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Monthly churn
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Subscriptions Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Subscriptions ({filteredSubscriptions.length})
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="past_due">Past Due</MenuItem>
                  <MenuItem value="canceled">Canceled</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Tier</InputLabel>
                <Select
                  value={filterTier}
                  label="Tier"
                  onChange={(e) => setFilterTier(e.target.value)}
                >
                  <MenuItem value="all">All Tiers</MenuItem>
                  <MenuItem value="starter">Starter</MenuItem>
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell>Email</TableCell>
                  <TableCell>Tier</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Renews</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id} hover>
                    <TableCell>{sub.userEmail}</TableCell>
                    <TableCell>
                      <Chip
                        label={sub.tier}
                        size="small"
                        color={
                          sub.tier === "starter"
                            ? "default"
                            : sub.tier === "professional"
                              ? "primary"
                              : "warning"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sub.status}
                        size="small"
                        color={sub.status === "active" ? "success" : "default"}
                        icon={
                          sub.status === "active" ? <CheckCircle /> : undefined
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      ${sub.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Invoices Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recent Invoices ({filteredInvoices.length})
            </Typography>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell sx={{ fontFamily: "monospace" }}>
                      {invoice.invoiceNumber.slice(-8)}
                    </TableCell>
                    <TableCell>{invoice.userEmail}</TableCell>
                    <TableCell align="right">
                      ${invoice.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        size="small"
                        color={
                          invoice.status === "paid"
                            ? "success"
                            : invoice.status === "open"
                              ? "warning"
                              : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<MoneyOff />}
                        onClick={() => handleRefundClick(invoice)}
                      >
                        Refund
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Failed Payments Section */}
      {failedPayments.length > 0 && (
        <Card>
          <CardContent>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="h6">
                {failedPayments.length} Failed Payments Requiring Attention
              </Typography>
            </Alert>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell>Invoice ID</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Retries</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Next Retry</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {failedPayments.map((payment) => (
                    <TableRow
                      key={payment.invoiceId}
                      hover
                      sx={{ backgroundColor: "#fff3cd" }}
                    >
                      <TableCell sx={{ fontFamily: "monospace" }}>
                        {payment.invoiceId.slice(-8)}
                      </TableCell>
                      <TableCell>{payment.userEmail}</TableCell>
                      <TableCell align="right">
                        ${payment.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${payment.retryCount}/${payment.maxRetries}`}
                          size="small"
                          color={
                            payment.retryCount >= payment.maxRetries
                              ? "error"
                              : "warning"
                          }
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {payment.failureReason}
                      </TableCell>
                      <TableCell>
                        {new Date(payment.nextRetryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={() => handleRetryPayment(payment.invoiceId)}
                          disabled={payment.retryCount >= payment.maxRetries}
                        >
                          Retry Now
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Refund Dialog */}
      <Dialog
        open={refundDialogOpen}
        onClose={() => setRefundDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Process Refund</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedInvoice && (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Invoice: {selectedInvoice.invoiceNumber}
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                Customer: {selectedInvoice.userEmail}
              </Typography>

              <TextField
                label="Refund Amount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
                fullWidth
                inputProps={{ step: "0.01", max: selectedInvoice.amount }}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Reason for Refund"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                fullWidth
                multiline
                rows={4}
                placeholder="Enter reason for refund..."
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleProcessRefund}
            disabled={!refundReason || refundAmount <= 0}
          >
            Process Refund
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPaymentDashboard;
