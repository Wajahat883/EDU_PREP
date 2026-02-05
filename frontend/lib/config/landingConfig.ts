/**
 * Landing Page Configuration
 * All content is centralized here for easy updates and localization
 */

export interface HeroConfig {
  headline: string;
  subheadline: string;
  primaryCTA: {
    text: string;
    href: string;
  };
  secondaryCTA: {
    text: string;
    href: string;
  };
  trustBanner: string;
  stats: Array<{
    value: string;
    label: string;
  }>;
}

export interface FeatureConfig {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

export interface TestimonialConfig {
  id: string;
  name: string;
  role: string;
  avatar: string;
  text: string;
  rating: number;
}

export interface PricingPlanConfig {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted: boolean;
  badge?: string;
}

export interface FAQConfig {
  id: string;
  question: string;
  answer: string;
}

export interface ExamSimulatorConfig {
  title: string;
  description: string;
  modes: Array<{
    name: string;
    description: string;
    icon: string;
  }>;
}

export interface AnalyticsPreviewConfig {
  title: string;
  description: string;
  metrics: Array<{
    name: string;
    description: string;
    icon: string;
  }>;
}

export interface FooterConfig {
  company: {
    name: string;
    description: string;
    logo: string;
  };
  links: Array<{
    title: string;
    items: Array<{
      label: string;
      href: string;
    }>;
  }>;
  social: Array<{
    name: string;
    href: string;
    icon: string;
  }>;
  legal: {
    copyright: string;
    badges: string[];
  };
}

interface ILandingPageConfig {
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
  hero: HeroConfig;
  valueProposition: {
    title: string;
    subtitle: string;
    description: string;
    highlights: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
  };
  features: FeatureConfig[];
  examSimulator: ExamSimulatorConfig;
  analyticsPreview: AnalyticsPreviewConfig;
  testimonials: TestimonialConfig[];
  pricing: {
    title: string;
    subtitle: string;
    plans: PricingPlanConfig[];
    activationNote: string;
  };
  faq: {
    title: string;
    subtitle: string;
    items: FAQConfig[];
  };
  cta: {
    title: string;
    description: string;
    buttonText: string;
    buttonHref: string;
  };
  footer: FooterConfig;
}

// Default configuration - can be overridden by API
export const defaultLandingConfig: LandingPageConfig = {
  meta: {
    title: "EduPrep - Master Your Exams with AI-Powered Learning",
    description:
      "Join 500,000+ students using EduPrep's AI-powered question bank, detailed rationales, and performance analytics to pass their exams on the first attempt.",
    keywords: [
      "exam prep",
      "USMLE",
      "NCLEX",
      "medical education",
      "question bank",
      "flashcards",
      "test prep",
    ],
  },

  hero: {
    headline: "Master Your Exams with the Gold Standard in Active Learning",
    subheadline:
      "Stop memorizing and start understanding. Our high-yield QBank, realistic simulations, and industry-leading rationales are engineered to ensure you pass on your first attempt.",
    primaryCTA: {
      text: "Start Your Free Trial",
      href: "/signup",
    },
    secondaryCTA: {
      text: "Watch Demo",
      href: "#demo",
    },
    trustBanner:
      "Join 500,000+ students who trusted our data-driven analytics to reach their target score.",
    stats: [
      { value: "500K+", label: "Active Students" },
      { value: "50K+", label: "Questions" },
      { value: "98%", label: "Pass Rate" },
      { value: "4.9", label: "App Rating" },
    ],
  },

  valueProposition: {
    title: "The Deepest Explanations in the Industry",
    subtitle: "Why Students Choose EduPrep",
    description:
      "Every question includes a comprehensive rationale that doesn't just tell you why an answer is correct—it explains why the distractors are wrong. Our experts use high-resolution medical and technical illustrations to make complex concepts stick.",
    highlights: [
      {
        title: "Rich Explanations",
        description:
          "Deep-dive feedback for every single answer choice with evidence-based reasoning.",
        icon: "book",
      },
      {
        title: "High-Yield Visuals",
        description:
          "Flowcharts, diagrams, and images designed for rapid retention and recall.",
        icon: "image",
      },
      {
        title: "Key Takeaways",
        description:
          "A summary 'Bottom Line' for every question to reinforce essential concepts.",
        icon: "lightbulb",
      },
    ],
  },

  features: [
    {
      id: "qbank",
      icon: "book-open",
      title: "Extensive Question Bank",
      description:
        "Access 50,000+ carefully curated questions with detailed explanations, references, and high-yield visuals.",
      color: "blue",
    },
    {
      id: "ai",
      icon: "cpu",
      title: "AI-Powered Adaptive Learning",
      description:
        "Smart algorithms adapt to your performance, identifying weak areas and optimizing your study sessions.",
      color: "amber",
    },
    {
      id: "analytics",
      icon: "chart-bar",
      title: "Advanced Analytics Dashboard",
      description:
        "Track your progress with peer comparison, weakness heatmaps, and score prediction models.",
      color: "green",
    },
    {
      id: "flashcards",
      icon: "layers",
      title: "Smart Flashcards",
      description:
        "One-click creation from any rationale, powered by spaced-repetition algorithms for maximum retention.",
      color: "purple",
    },
    {
      id: "simulator",
      icon: "monitor",
      title: "Realistic Exam Simulator",
      description:
        "Pixel-perfect replica of the official testing environment with timed blocks and interactive tools.",
      color: "red",
    },
    {
      id: "mobile",
      icon: "smartphone",
      title: "Study Anywhere",
      description:
        "Seamless experience across web, iOS, and Android with offline access and sync.",
      color: "cyan",
    },
  ],

  examSimulator: {
    title: "Experience the Real Exam Before Test Day",
    description:
      "Our interface is a pixel-perfect replica of the official testing environment. Build your 'testing stamina' with timed blocks, strike-through options, and lab-value references.",
    modes: [
      {
        name: "Tutor Mode",
        description:
          "Real-time feedback and rationales as you practice each question.",
        icon: "graduation-cap",
      },
      {
        name: "Timed Mode",
        description:
          "Full-screen, distraction-free simulation of the actual exam.",
        icon: "clock",
      },
      {
        name: "Interactive Tools",
        description:
          "Highlight text, strike out options, and use on-screen calculator.",
        icon: "tools",
      },
    ],
  },

  analyticsPreview: {
    title: "Stop Guessing. Start Improving.",
    description:
      "Our advanced analytics dashboard tracks your progress across every subject and system, identifying your weakest areas before they cost you points on the exam.",
    metrics: [
      {
        name: "Peer Comparison",
        description:
          "See exactly how your score stacks up against the global average.",
        icon: "users",
      },
      {
        name: "Weakness Heatmaps",
        description:
          "Visual reports that prioritize what you need to study next.",
        icon: "map",
      },
      {
        name: "Score Predictor",
        description:
          "Data-backed insights into your readiness for the actual test.",
        icon: "trending-up",
      },
    ],
  },

  testimonials: [
    {
      id: "t1",
      name: "Dr. Sarah Chen",
      role: "Medical Resident, Johns Hopkins",
      avatar: "SC",
      text: "EduPrep's detailed rationales helped me understand concepts I'd struggled with for years. Passed Step 1 with a 250+!",
      rating: 5,
    },
    {
      id: "t2",
      name: "James Wilson",
      role: "Medical Student, Harvard",
      avatar: "JW",
      text: "The analytics dashboard showed me exactly where I was weak. I improved my practice scores by 30% in just 6 weeks.",
      rating: 5,
    },
    {
      id: "t3",
      name: "Emily Rodriguez",
      role: "NCLEX Candidate",
      avatar: "ER",
      text: "Best study platform I've ever used. The flashcard system and spaced repetition made memorization so much easier.",
      rating: 5,
    },
    {
      id: "t4",
      name: "Michael Park",
      role: "IMG, Passed Step 2 CK",
      avatar: "MP",
      text: "As an IMG, I needed extra support. EduPrep's comprehensive explanations were exactly what I needed to succeed.",
      rating: 5,
    },
    {
      id: "t5",
      name: "Dr. Amanda Foster",
      role: "Residency Program Director",
      avatar: "AF",
      text: "We recommend EduPrep to all our students. The institutional analytics help us track cohort performance effectively.",
      rating: 5,
    },
  ],

  pricing: {
    title: "Flexible Plans for Your Study Schedule",
    subtitle: "Choose the plan that fits your timeline. No hidden fees.",
    activationNote:
      "Purchase now, activate later. Your subscription timer only starts when you click 'Activate'.",
    plans: [
      {
        id: "basic",
        name: "Self-Study",
        price: "Free",
        period: "",
        description: "Perfect for getting started",
        features: [
          "500 practice questions",
          "Basic explanations",
          "Progress tracking",
          "Mobile access",
          "Community forum",
        ],
        cta: "Get Started Free",
        ctaHref: "/signup?plan=basic",
        highlighted: false,
      },
      {
        id: "pro-30",
        name: "Pro 30 Days",
        price: "$49",
        period: "/30 days",
        description: "Intensive short-term prep",
        features: [
          "50,000+ questions",
          "Detailed rationales",
          "Full analytics dashboard",
          "Unlimited mock exams",
          "Smart flashcards",
          "Study planner",
          "Priority support",
        ],
        cta: "Start Free Trial",
        ctaHref: "/signup?plan=pro-30",
        highlighted: false,
      },
      {
        id: "pro-90",
        name: "Pro 90 Days",
        price: "$99",
        period: "/90 days",
        description: "Most popular for dedicated learners",
        badge: "Most Popular",
        features: [
          "Everything in Pro 30",
          "Score prediction",
          "Weakness heatmaps",
          "Peer comparison",
          "Custom study plans",
          "Offline access",
          "1-on-1 onboarding call",
        ],
        cta: "Start Free Trial",
        ctaHref: "/signup?plan=pro-90",
        highlighted: true,
      },
      {
        id: "pro-365",
        name: "Pro 365 Days",
        price: "$199",
        period: "/year",
        description: "Best value for long-term prep",
        features: [
          "Everything in Pro 90",
          "Readiness assessments",
          "Extended question bank",
          "Early access to new features",
          "Dedicated success manager",
          "Institution discount eligible",
        ],
        cta: "Start Free Trial",
        ctaHref: "/signup?plan=pro-365",
        highlighted: false,
      },
    ],
  },

  faq: {
    title: "Frequently Asked Questions",
    subtitle: "Everything you need to know about EduPrep",
    items: [
      {
        id: "faq1",
        question: "How does the free trial work?",
        answer:
          "Start with 25 high-yield questions instantly. No credit card required. Upgrade anytime to unlock the full question bank and all features.",
      },
      {
        id: "faq2",
        question: "Can I use EduPrep on multiple devices?",
        answer:
          "Yes! Your account syncs across web, iOS, and Android. Study on your computer at home and continue on your phone during commutes.",
      },
      {
        id: "faq3",
        question: "What exams does EduPrep cover?",
        answer:
          "We offer comprehensive question banks for USMLE Step 1, Step 2 CK, Step 3, NCLEX-RN, NCLEX-PN, COMLEX, and more. New exam types are added regularly.",
      },
      {
        id: "faq4",
        question: "How are the questions created?",
        answer:
          "All questions are written and reviewed by subject matter experts including physicians, educators, and testing specialists. Each question undergoes rigorous quality control.",
      },
      {
        id: "faq5",
        question: "Can I pause my subscription?",
        answer:
          "Yes! You can purchase a subscription and activate it when you're ready. Once activated, you can also pause for up to 30 days if needed.",
      },
      {
        id: "faq6",
        question: "Do you offer institutional licenses?",
        answer:
          "Yes, we offer special pricing for medical schools, nursing programs, and other institutions. Contact our sales team for a custom quote.",
      },
      {
        id: "faq7",
        question: "What's your refund policy?",
        answer:
          "We offer a 7-day money-back guarantee. If you're not satisfied with EduPrep within your first week, we'll refund your purchase in full.",
      },
      {
        id: "faq8",
        question: "How does the Score Predictor work?",
        answer:
          "Our AI analyzes your performance across thousands of data points, comparing you to past test-takers with known outcomes to predict your likely score range.",
      },
    ],
  },

  cta: {
    title: "Don't Leave Your Career to Chance",
    description:
      "Join 500,000+ students who are already mastering their exams with EduPrep's proven methodology.",
    buttonText: "Start Your Free Trial Today",
    buttonHref: "/signup",
  },

  footer: {
    company: {
      name: "EduPrep",
      description:
        "Empowering students worldwide with AI-powered learning tools to achieve their academic and professional goals.",
      logo: "/logo.svg",
    },
    links: [
      {
        title: "Product",
        items: [
          { label: "Question Bank", href: "/qbank" },
          { label: "Flashcards", href: "/flashcards" },
          { label: "Analytics", href: "/analytics" },
          { label: "Mock Exams", href: "/test" },
          { label: "Study Planner", href: "/planner" },
        ],
      },
      {
        title: "Exams",
        items: [
          { label: "USMLE Step 1", href: "/exams/usmle-step1" },
          { label: "USMLE Step 2 CK", href: "/exams/usmle-step2" },
          { label: "NCLEX-RN", href: "/exams/nclex-rn" },
          { label: "COMLEX", href: "/exams/comlex" },
          { label: "All Exams", href: "/exams" },
        ],
      },
      {
        title: "Company",
        items: [
          { label: "About Us", href: "/about" },
          { label: "Careers", href: "/careers" },
          { label: "Blog", href: "/blog" },
          { label: "Press", href: "/press" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        title: "Support",
        items: [
          { label: "Help Center", href: "/help" },
          { label: "Community", href: "/community" },
          { label: "Institutions", href: "/institutions" },
          { label: "API Docs", href: "/docs/api" },
        ],
      },
    ],
    social: [
      { name: "Twitter", href: "https://twitter.com/eduprep", icon: "twitter" },
      {
        name: "LinkedIn",
        href: "https://linkedin.com/company/eduprep",
        icon: "linkedin",
      },
      {
        name: "Instagram",
        href: "https://instagram.com/eduprep",
        icon: "instagram",
      },
      { name: "YouTube", href: "https://youtube.com/eduprep", icon: "youtube" },
      { name: "GitHub", href: "https://github.com/eduprep", icon: "github" },
    ],
    legal: {
      copyright: `© ${new Date().getFullYear()} EduPrep. All rights reserved.`,
      badges: ["GDPR Compliant", "HIPAA Compliant", "SOC 2 Certified"],
    },
  },
};

export type LandingPageConfig = ILandingPageConfig;
