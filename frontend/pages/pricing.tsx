import React from "react";
import Link from "next/link";
import { Button, Card, CardContent, Badge } from "@/components/ui";

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      description: "Perfect for getting started",
      price: "$0",
      period: "forever",
      icon: "🎓",
      features: [
        "500 practice questions",
        "Basic flashcard sets",
        "Limited analytics",
        "Community support",
        "Mobile app access",
      ],
      limitations: [
        "No mock exams",
        "Ads included",
        "Limited to 10 questions/day",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      description: "For serious exam preparation",
      price: "$9.99",
      period: "per month",
      icon: "⭐",
      features: [
        "10,000+ questions",
        "AI-powered flashcards",
        "Complete analytics",
        "Unlimited questions",
        "Full mock exams",
        "Priority support",
        "Offline access",
        "Custom study plans",
      ],
      cta: "Start 7-Day Free Trial",
      highlighted: true,
      badge: "Most Popular",
      savings: "Save 20% on yearly",
    },
    {
      name: "Premium+",
      description: "For maximum preparation",
      price: "$14.99",
      period: "per month",
      icon: "🏆",
      features: [
        "Everything in Pro",
        "Personalized coaching",
        "Anatomy videos",
        "Live sessions",
        "Expert Q&A",
        "Extended support",
        "Early access to new content",
        "Certificate of completion",
      ],
      cta: "Start 14-Day Free Trial",
      highlighted: false,
      savings: "Save 25% on yearly",
    },
  ];

  const faqs = [
    {
      q: "Can I switch plans anytime?",
      a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
    },
    {
      q: "Do you offer refunds?",
      a: "We offer a 7-day money-back guarantee for all paid plans. No questions asked.",
    },
    {
      q: "Is my data secure?",
      a: "Yes, we use bank-level encryption and comply with HIPAA standards for all user data.",
    },
    {
      q: "Can I share my account?",
      a: "Each plan is for individual use. Family and team plans are available upon request.",
    },
  ];

  return (
    <div className="w-full">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm z-50 border-b border-neutral-200 dark:border-neutral-800">
        <div className="container-responsive flex items-center justify-between h-16 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold">EduPrep</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Choose the plan that fits your study needs. All plans include
              7-day free trial.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className="relative transform transition-transform hover:scale-105"
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge variant="primary" className="px-4 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <Card
                  elevated={plan.highlighted}
                  className={
                    plan.highlighted ? "ring-2 ring-primary-500 scale-105" : ""
                  }
                >
                  <CardContent className="p-8">
                    <div className="text-3xl mb-4">{plan.icon}</div>

                    <h3 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-6">
                      {plan.description}
                    </p>

                    {/* Pricing */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-neutral-900 dark:text-white">
                          {plan.price}
                        </span>
                        {plan.period !== "forever" && (
                          <span className="text-neutral-600 dark:text-neutral-400">
                            /{plan.period}
                          </span>
                        )}
                      </div>
                      {plan.savings && (
                        <p className="text-sm text-success-600 dark:text-success-400 mt-2">
                          {plan.savings}
                        </p>
                      )}
                    </div>

                    {/* CTA */}
                    <Button
                      fullWidth
                      variant={plan.highlighted ? "primary" : "outline"}
                      className="mb-6"
                    >
                      {plan.cta}
                    </Button>

                    {/* Features */}
                    <div className="space-y-3">
                      {plan.features.map((feature, fidx) => (
                        <div key={fidx} className="flex items-start gap-3">
                          <svg
                            className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            />
                          </svg>
                          <span className="text-neutral-700 dark:text-neutral-300 text-sm">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Limitations */}
                    {plan.limitations && (
                      <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                        {plan.limitations.map((limit, lidx) => (
                          <div key={lidx} className="flex items-start gap-3">
                            <svg
                              className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              />
                            </svg>
                            <span className="text-neutral-600 dark:text-neutral-400 text-sm">
                              {limit}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Comparison */}
          <Card elevated className="mb-16">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-8">Feature Comparison</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                      <th className="px-4 py-3 text-left font-semibold">
                        Feature
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Free
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Pro
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Premium+
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        feature: "Questions",
                        free: "500",
                        pro: "10,000+",
                        premium: "Unlimited",
                      },
                      {
                        feature: "Mock Exams",
                        free: "❌",
                        pro: "✅",
                        premium: "✅",
                      },
                      {
                        feature: "Analytics",
                        free: "Basic",
                        pro: "Full",
                        premium: "Advanced",
                      },
                      {
                        feature: "Support",
                        free: "Community",
                        pro: "Priority Email",
                        premium: "24/7 Chat",
                      },
                      {
                        feature: "Offline Access",
                        free: "❌",
                        pro: "✅",
                        premium: "✅",
                      },
                      {
                        feature: "Custom Plans",
                        free: "❌",
                        pro: "❌",
                        premium: "✅",
                      },
                    ].map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      >
                        <td className="px-4 py-3 font-medium">{row.feature}</td>
                        <td className="px-4 py-3 text-center">{row.free}</td>
                        <td className="px-4 py-3 text-center">{row.pro}</td>
                        <td className="px-4 py-3 text-center">{row.premium}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold mb-8 text-center">
              Frequently Asked Questions
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {faqs.map((faq, idx) => (
                <Card key={idx} elevated>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                      {faq.q}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {faq.a}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 dark:bg-neutral-950 text-white py-12">
        <div className="container-responsive text-center text-neutral-400">
          <p>&copy; 2026 EduPrep. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
