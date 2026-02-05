import React, { useState } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layouts";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Badge,
  Modal,
  ModalFooter,
  Input,
} from "@/components/ui";

export default function SubscriptionPage() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "premium" | null>(
    null,
  );

  const currentSubscription = {
    plan: "Pro",
    status: "active",
    price: 9.99,
    billing: "monthly",
    nextBillingDate: "2026-02-28",
    autoRenew: true,
    features: [
      "10,000+ questions",
      "AI flashcards",
      "Full analytics",
      "Unlimited questions",
      "Mock exams",
      "Offline access",
    ],
  };

  const billingHistory = [
    {
      date: "2026-01-28",
      amount: "$9.99",
      status: "paid",
      description: "Pro Monthly Subscription",
    },
    {
      date: "2025-12-28",
      amount: "$9.99",
      status: "paid",
      description: "Pro Monthly Subscription",
    },
    {
      date: "2025-11-28",
      amount: "$9.99",
      status: "paid",
      description: "Pro Monthly Subscription",
    },
    {
      date: "2025-10-28",
      amount: "$9.99",
      status: "paid",
      description: "Pro Monthly Subscription",
    },
  ];

  const upgradePlans = [
    {
      name: "Premium+",
      price: 14.99,
      billing: "monthly",
      newFeatures: [
        "Personalized coaching",
        "Anatomy videos",
        "Live sessions",
        "Expert Q&A",
      ],
      savings: "Save 25% on yearly",
    },
  ];

  return (
    <MainLayout
      navLinks={[
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/qbank", label: "Question Bank", icon: "📚" },
        { href: "/flashcards", label: "Flashcards", icon: "🧠" },
        { href: "/settings", label: "Settings", icon: "⚙️" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Subscription Management
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Manage your plan and billing information
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan */}
            <Card
              elevated
              className="border-primary-200 dark:border-primary-900"
            >
              <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Current Plan</h2>
                  <Badge variant="success">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Plan Details */}
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                      {currentSubscription.plan}
                    </h3>
                    <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                      ${currentSubscription.price}
                      <span className="text-base text-neutral-600 dark:text-neutral-400 ml-2">
                        /{currentSubscription.billing}
                      </span>
                    </span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Next billing date:{" "}
                    <strong>{currentSubscription.nextBillingDate}</strong>
                  </p>
                </div>

                {/* Features */}
                <div>
                  <h4 className="font-semibold mb-3">Included Features</h4>
                  <div className="space-y-2">
                    {currentSubscription.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-success-600 dark:text-success-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          />
                        </svg>
                        <span className="text-neutral-700 dark:text-neutral-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      setSelectedPlan("premium");
                      setShowUpgradeModal(true);
                    }}
                  >
                    Upgrade to Premium+
                  </Button>
                  <Button variant="outline" fullWidth>
                    Cancel Subscription
                  </Button>
                </div>

                {/* Auto-Renewal */}
                <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        Auto-renewal
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Your plan will automatically renew
                      </p>
                    </div>
                    <Badge
                      variant={
                        currentSubscription.autoRenew ? "success" : "warning"
                      }
                    >
                      {currentSubscription.autoRenew ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card elevated>
              <CardHeader>
                <h2 className="text-lg font-semibold">Billing History</h2>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700">
                        <th className="px-4 py-3 text-left font-semibold">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingHistory.map((invoice, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        >
                          <td className="px-4 py-3 text-neutral-900 dark:text-white">
                            {invoice.date}
                          </td>
                          <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                            {invoice.description}
                          </td>
                          <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">
                            {invoice.amount}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                invoice.status === "paid"
                                  ? "success"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {invoice.status.charAt(0).toUpperCase() +
                                invoice.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="outline" size="sm">
                              Invoice
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Method */}
            <Card elevated>
              <CardHeader>
                <h3 className="text-lg font-semibold">Payment Method</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">💳</div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        Visa
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        •••• •••• •••• 4242
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Expires 12/2026
                  </p>
                </div>

                <Button fullWidth variant="outline" size="sm">
                  Update Payment Method
                </Button>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card elevated>
              <CardHeader>
                <h3 className="text-lg font-semibold">Billing Address</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-neutral-700 dark:text-neutral-300 space-y-1">
                  <p>John Doe</p>
                  <p>123 Medical Street</p>
                  <p>New York, NY 10001</p>
                  <p>United States</p>
                </div>

                <Button fullWidth variant="outline" size="sm">
                  Edit Address
                </Button>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card elevated>
              <CardHeader>
                <h3 className="text-lg font-semibold">Need Help?</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button fullWidth variant="outline" size="sm">
                  📧 Contact Support
                </Button>
                <Button fullWidth variant="outline" size="sm">
                  ❓ View FAQs
                </Button>
                <Button fullWidth variant="outline" size="sm">
                  📄 Refund Policy
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <Modal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="Upgrade to Premium+"
          size="lg"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Your Plan</h3>

              {upgradePlans.map((plan, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border-2 border-primary-500 bg-primary-50 dark:bg-primary-950"
                >
                  <div className="flex items-baseline justify-between mb-3">
                    <h4 className="text-xl font-bold">{plan.name}</h4>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      ${plan.price}
                      <span className="text-base text-neutral-600 dark:text-neutral-400">
                        /{plan.billing}
                      </span>
                    </span>
                  </div>

                  <p className="text-sm text-success-600 dark:text-success-400 mb-3">
                    ✓ {plan.savings}
                  </p>

                  <h5 className="font-semibold text-sm mb-2">New Features:</h5>
                  <ul className="space-y-2">
                    {plan.newFeatures.map((feature, fidx) => (
                      <li
                        key={fidx}
                        className="flex items-center gap-2 text-sm"
                      >
                        <svg
                          className="w-4 h-4 text-success-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <Input
              label="Promo Code (optional)"
              placeholder="Enter promo code"
            />
          </div>

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpgradeModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary">Upgrade Now</Button>
          </ModalFooter>
        </Modal>
      )}
    </MainLayout>
  );
}
