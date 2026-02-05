import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

/**
 * Seed script: Populate database with test data
 * Usage: npm run seed
 */

interface SeedConfig {
  mongoUri: string;
  environment: string;
  deleteExisting: boolean;
}

const config: SeedConfig = {
  mongoUri: process.env.DATABASE_URL || "mongodb://localhost:27017",
  environment: process.env.NODE_ENV || "development",
  deleteExisting: true,
};

// Sample exam types
const examTypes = [
  {
    name: "MCAT",
    description: "Medical College Admission Test",
    sections: [
      "Biological Sciences",
      "Physical Sciences",
      "Psychological Concepts",
      "Critical Analysis",
    ],
    totalQuestions: 230,
    duration: 7.5,
  },
  {
    name: "USMLE Step 1",
    description: "United States Medical Licensing Examination",
    sections: ["Basic Sciences", "Clinical Sciences", "Systems"],
    totalQuestions: 280,
    duration: 9,
  },
  {
    name: "IELTS",
    description: "International English Language Testing System",
    sections: ["Reading", "Writing", "Listening", "Speaking"],
    totalQuestions: 100,
    duration: 2.75,
  },
  {
    name: "GRE",
    description: "Graduate Record Examination",
    sections: [
      "Verbal Reasoning",
      "Quantitative Reasoning",
      "Analytical Writing",
    ],
    totalQuestions: 80,
    duration: 3.75,
  },
];

// Sample learning objectives
const learningObjectives = [
  {
    subject: "Biology",
    topic: "Cell Structure",
    objective: "Understand the structure and function of cell organelles",
  },
  {
    subject: "Chemistry",
    topic: "Thermodynamics",
    objective: "Apply first and second laws of thermodynamics",
  },
  {
    subject: "Physics",
    topic: "Mechanics",
    objective: "Solve problems involving forces and motion",
  },
  {
    subject: "English",
    topic: "Grammar",
    objective: "Identify and correct grammatical errors",
  },
  {
    subject: "Mathematics",
    topic: "Algebra",
    objective: "Solve linear and quadratic equations",
  },
];

// Sample questions
const generateQuestions = () => {
  const questionTemplates = [
    {
      stem: "Which of the following is a characteristic of {topic}?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct: 0,
      difficulty: 1,
    },
    {
      stem: "Based on {topic}, what would be the result of {scenario}?",
      options: ["Result A", "Result B", "Result C", "Result D"],
      correct: 2,
      difficulty: 2,
    },
    {
      stem: "Which of the following best explains {topic}?",
      options: [
        "Explanation A",
        "Explanation B",
        "Explanation C",
        "Explanation D",
      ],
      correct: 1,
      difficulty: 3,
    },
  ];

  const questions = [];
  const topics = [
    "Mitosis",
    "Photosynthesis",
    "Enzyme kinetics",
    "DNA replication",
    "Protein synthesis",
  ];

  for (let i = 0; i < 50; i++) {
    const template = questionTemplates[i % 3];
    const topic = topics[i % topics.length];

    questions.push({
      examTypeId: ["MCAT", "USMLE Step 1"][i % 2],
      subjectId: ["Biology", "Chemistry", "Physics"][i % 3],
      questionType: "MCQ",
      stemText: template.stem
        .replace("{topic}", topic)
        .replace("{scenario}", "a change occurs"),
      stemMedia: null,
      options: template.options.map((opt, idx) => ({
        label: String.fromCharCode(65 + idx),
        text: opt,
        isCorrect: idx === template.correct,
      })),
      explanationText: `This is the explanation for question ${i + 1}. ${topic} is important because...`,
      difficulty: template.difficulty,
      bloomLevel: ["Remember", "Understand", "Apply", "Analyze", "Evaluate"][
        i % 5
      ],
      learningObjective: learningObjectives[i % learningObjectives.length]._id,
      keyTakeaway: `Remember: Key point about ${topic}`,
      references: [
        { title: "Reference 1", url: "https://example.com/ref1" },
        { title: "Reference 2", url: "https://example.com/ref2" },
      ],
      tags: ["important", topic.toLowerCase(), "chapter-1"],
      isActive: true,
      createdBy: "seed-script",
      reviewedBy: "admin",
      version: 1,
      statistics: {
        attempts: Math.floor(Math.random() * 1000),
        averageTime: Math.floor(Math.random() * 300) + 30,
        correctPercentage: Math.floor(Math.random() * 100),
        reportedIssues: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return questions;
};

// Sample users
const generateUsers = async () => {
  const salt = await bcryptjs.genSalt(10);

  return [
    {
      email: "student1@example.com",
      passwordHash: await bcryptjs.hash("Password123!", salt),
      firstName: "John",
      lastName: "Student",
      role: "student",
      emailVerified: true,
      phone: "+1234567890",
      timezone: "America/New_York",
      avatar: "https://api.example.com/avatars/default.jpg",
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: "instructor1@example.com",
      passwordHash: await bcryptjs.hash("Password123!", salt),
      firstName: "Jane",
      lastName: "Instructor",
      role: "instructor",
      emailVerified: true,
      phone: "+1234567891",
      timezone: "America/Chicago",
      avatar: "https://api.example.com/avatars/default.jpg",
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: "admin@example.com",
      passwordHash: await bcryptjs.hash("AdminPass123!", salt),
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      emailVerified: true,
      phone: "+1234567892",
      timezone: "America/Los_Angeles",
      avatar: "https://api.example.com/avatars/default.jpg",
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
};

// Sample subscriptions
const subscriptions = [
  {
    name: "Basic",
    price: 4900, // $49.00
    currency: "USD",
    billingPeriod: "monthly",
    features: [
      "5 practice exams per month",
      "Basic analytics",
      "Email support",
    ],
    stripeProductId: "prod_basic",
    stripePriceId: "price_basic_monthly",
  },
  {
    name: "Plus",
    price: 12900, // $129.00
    currency: "USD",
    billingPeriod: "3months",
    features: [
      "20 practice exams",
      "Advanced analytics",
      "Flashcard system",
      "Priority support",
    ],
    stripeProductId: "prod_plus",
    stripePriceId: "price_plus_3months",
  },
  {
    name: "Ultimate",
    price: 29900, // $299.00
    currency: "USD",
    billingPeriod: "yearly",
    features: [
      "Unlimited practice exams",
      "Advanced analytics with AI insights",
      "Flashcard system with spaced repetition",
      "Video tutorials",
      "24/7 Priority support",
      "One-on-one coaching sessions",
    ],
    stripeProductId: "prod_ultimate",
    stripePriceId: "price_ultimate_yearly",
  },
];

/**
 * Seed auth-service database
 */
async function seedAuthService() {
  try {
    const authDb = mongoose.connection.useDb("auth-service");
    const usersCollection = authDb.collection("users");

    if (config.deleteExisting) {
      await usersCollection.deleteMany({});
    }

    const users = await generateUsers();
    const result = await usersCollection.insertMany(users);

    console.log(`✓ Seeded ${result.insertedCount} users to auth-service`);
  } catch (error) {
    console.error("Error seeding auth-service:", error);
    throw error;
  }
}

/**
 * Seed qbank-service database
 */
async function seedQBankService() {
  try {
    const qbankDb = mongoose.connection.useDb("qbank-service");

    // Seed exam types
    const examTypesCollection = qbankDb.collection("exam_types");
    if (config.deleteExisting) {
      await examTypesCollection.deleteMany({});
    }
    const examResult = await examTypesCollection.insertMany(examTypes);
    console.log(
      `✓ Seeded ${examResult.insertedCount} exam types to qbank-service`,
    );

    // Seed learning objectives
    const objectivesCollection = qbankDb.collection("learning_objectives");
    if (config.deleteExisting) {
      await objectivesCollection.deleteMany({});
    }
    const objResult = await objectivesCollection.insertMany(learningObjectives);
    console.log(
      `✓ Seeded ${objResult.insertedCount} learning objectives to qbank-service`,
    );

    // Seed questions
    const questionsCollection = qbankDb.collection("questions");
    if (config.deleteExisting) {
      await questionsCollection.deleteMany({});
    }
    const questions = generateQuestions();
    const qResult = await questionsCollection.insertMany(questions);
    console.log(`✓ Seeded ${qResult.insertedCount} questions to qbank-service`);
  } catch (error) {
    console.error("Error seeding qbank-service:", error);
    throw error;
  }
}

/**
 * Seed payment-service database
 */
async function seedPaymentService() {
  try {
    const paymentDb = mongoose.connection.useDb("payment-service");
    const plansCollection = paymentDb.collection("plans");

    if (config.deleteExisting) {
      await plansCollection.deleteMany({});
    }

    const result = await plansCollection.insertMany(subscriptions);
    console.log(
      `✓ Seeded ${result.insertedCount} subscription plans to payment-service`,
    );
  } catch (error) {
    console.error("Error seeding payment-service:", error);
    throw error;
  }
}

/**
 * Main seed function
 */
async function seedDatabase() {
  let connection: typeof mongoose;

  try {
    console.log(`Seeding database for ${config.environment} environment...\n`);

    // Connect to MongoDB
    connection = await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as any);

    console.log("✓ Connected to MongoDB\n");

    // Seed all services
    await seedAuthService();
    await seedQBankService();
    await seedPaymentService();

    console.log("\n✓ Database seeding completed successfully!");
  } catch (error) {
    console.error("Failed to seed database:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.disconnect();
    }
  }
}

// Run seed if executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };
