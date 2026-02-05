/**
 * End-to-End Test Suite
 *
 * Tests for complete user journeys:
 * - User registration through question creation
 * - Test taking and completion
 * - Subscription and payment flow
 * - Admin approval workflow
 */

import { test, expect } from "@playwright/test";

test.describe("End-to-End User Flows", () => {
  const baseUrl = "http://localhost:3000";
  const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: "TestPassword123!",
    firstName: "Test",
    lastName: "User",
  };

  test.describe("User Registration and Onboarding", () => {
    test("should complete user registration flow", async ({ page }) => {
      // Navigate to registration
      await page.goto(`${baseUrl}/register`);

      // Fill registration form
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="firstName"]', testUser.firstName);
      await page.fill('input[name="lastName"]', testUser.lastName);

      // Accept terms
      await page.click('input[type="checkbox"]');

      // Submit
      await page.click('button:has-text("Register")');

      // Wait for redirect to dashboard
      await page.waitForURL(`${baseUrl}/dashboard`);

      // Verify logged in
      expect(await page.locator("text=Welcome")).toBeVisible();
    });

    test("should fail registration with weak password", async ({ page }) => {
      await page.goto(`${baseUrl}/register`);

      await page.fill('input[name="email"]', `weak_${Date.now()}@example.com`);
      await page.fill('input[name="password"]', "123"); // Too weak
      await page.fill('input[name="firstName"]', "Test");
      await page.fill('input[name="lastName"]', "User");

      await page.click('button:has-text("Register")');

      // Should show error
      expect(await page.locator("text=/password.*strong/i")).toBeVisible();
    });

    test("should prevent duplicate email registration", async ({ page }) => {
      // First registration
      await page.goto(`${baseUrl}/register`);
      const email = `dup_${Date.now()}@example.com`;

      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', "ValidPass123!");
      await page.fill('input[name="firstName"]', "First");
      await page.fill('input[name="lastName"]', "User");
      await page.click('input[type="checkbox"]');
      await page.click('button:has-text("Register")');

      await page.waitForURL(`${baseUrl}/dashboard`);

      // Logout
      await page.click('button:has-text("Logout")');

      // Try to register again with same email
      await page.goto(`${baseUrl}/register`);
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', "ValidPass123!");
      await page.fill('input[name="firstName"]', "Second");
      await page.fill('input[name="lastName"]', "User");
      await page.click('input[type="checkbox"]');
      await page.click('button:has-text("Register")');

      // Should show error
      expect(await page.locator("text=/already.*exists/i")).toBeVisible();
    });
  });

  test.describe("Question Creation and Approval", () => {
    test("should create multiple choice question end-to-end", async ({
      page,
    }) => {
      // Login first
      await page.goto(`${baseUrl}/login`);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button:has-text("Login")');
      await page.waitForURL(`${baseUrl}/dashboard`);

      // Navigate to create question
      await page.click('a:has-text("Create Question")');
      await page.waitForURL(`${baseUrl}/questions/create`);

      // Fill question form
      await page.selectOption('select[name="subject"]', "Mathematics");
      await page.fill('input[name="topic"]', "Algebra");
      await page.fill('textarea[name="text"]', "What is 2 + 2?");
      await page.selectOption('select[name="type"]', "multiple-choice");

      // Add options
      await page.click('button:has-text("Add Option")');
      await page.fill('input[name="option-0"]', "3");
      await page.fill('input[name="option-1"]', "4");

      // Select correct answer
      await page.click('input[name="correct-0"]');

      // Fill metadata
      await page.selectOption('select[name="difficulty"]', "medium");
      await page.fill('input[name="timeEstimate"]', "5");
      await page.fill('input[name="explanation"]', "2 + 2 equals 4");

      // Preview
      await page.click('button:has-text("Preview")');
      expect(await page.locator("text=What is 2 + 2?")).toBeVisible();
      await page.click('button:has-text("Close")');

      // Save
      await page.click('button:has-text("Save Question")');

      // Verify success
      await page.waitForURL(/\/questions\/\d+/);
      expect(await page.locator("text=/saved|success/i")).toBeVisible();
    });

    test("should submit question for approval", async ({ page }) => {
      // Navigate to question (from previous test)
      await page.goto(`${baseUrl}/questions`);
      await page.click("a:first-child");

      // Submit for review button should be visible
      await page.click('button:has-text("Submit for Review")');

      // Confirm dialog
      await page.click('button:has-text("Confirm")');

      // Verify status changed
      expect(await page.locator("text=Awaiting Review")).toBeVisible();
    });
  });

  test.describe("Admin Approval Workflow", () => {
    const adminUser = {
      email: "admin@example.com",
      password: "AdminPass123!",
    };

    test("should approve question as admin", async ({ page }) => {
      // Login as admin
      await page.goto(`${baseUrl}/login`);
      await page.fill('input[name="email"]', adminUser.email);
      await page.fill('input[name="password"]', adminUser.password);
      await page.click('button:has-text("Login")');
      await page.waitForURL(`${baseUrl}/dashboard`);

      // Navigate to pending approvals
      await page.click('a:has-text("Admin")');
      await page.click('a:has-text("Approve Questions")');

      // Approve first question
      await page.click('button:has-text("Approve"):first-child');

      // Fill approval form if needed
      await page.fill('textarea[name="notes"]', "Good quality question");
      await page.click('button:has-text("Confirm")');

      // Verify success
      expect(await page.locator("text=/approved|success/i")).toBeVisible();
    });

    test("should reject question with reason", async ({ page }) => {
      // Login as admin
      await page.goto(`${baseUrl}/login`);
      await page.fill('input[name="email"]', adminUser.email);
      await page.fill('input[name="password"]', adminUser.password);
      await page.click('button:has-text("Login")');
      await page.waitForURL(`${baseUrl}/dashboard`);

      // Navigate to pending approvals
      await page.click('a:has-text("Admin")');
      await page.click('a:has-text("Approve Questions")');

      // Find and reject a question
      const questionCard = page.locator('[role="article"]').first();
      await questionCard.locator('button:has-text("Reject")').click();

      // Fill rejection form
      await page.fill('textarea[name="reason"]', "Lacks clear explanation");
      await page.click('button:has-text("Confirm")');

      // Verify success
      expect(await page.locator("text=/rejected|success/i")).toBeVisible();
    });
  });

  test.describe("Test Creation and Publishing", () => {
    test("should create and publish test", async ({ page }) => {
      // Login
      await page.goto(`${baseUrl}/login`);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button:has-text("Login")');
      await page.waitForURL(`${baseUrl}/dashboard`);

      // Create test
      await page.click('a:has-text("Create Test")');
      await page.waitForURL(`${baseUrl}/tests/create`);

      // Fill test details
      await page.fill('input[name="name"]', "Sample Math Test");
      await page.fill('textarea[name="description"]', "Test your math skills");
      await page.selectOption('select[name="subject"]', "Mathematics");
      await page.fill('input[name="totalPoints"]', "100");
      await page.fill('input[name="passingScore"]', "60");
      await page.fill('input[name="timeLimit"]', "120");

      // Add section
      await page.click('button:has-text("Add Section")');
      await page.fill('input[name="section-name-0"]', "Algebra");
      await page.fill('input[name="points-per-question-0"]', "10");

      // Save test
      await page.click('button:has-text("Save Test")');
      await page.waitForURL(/\/tests\/\d+/);

      // Publish test
      await page.click('button:has-text("Publish")');
      await page.click('button:has-text("Confirm")');

      // Verify published
      expect(await page.locator("text=Published")).toBeVisible();
    });
  });

  test.describe("Student Test Taking", () => {
    test("should start and complete test", async ({ page }) => {
      // Login as student
      await page.goto(`${baseUrl}/login`);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button:has-text("Login")');
      await page.waitForURL(`${baseUrl}/dashboard`);

      // Browse tests
      await page.click('a:has-text("Take Test")');

      // Select a test
      await page.click('button:has-text("Start"):first-child');
      await page.waitForURL(/\/attempt\/\d+/);

      // Verify test loaded
      expect(await page.locator("text=/Question \d+ of/i")).toBeVisible();

      // Answer first question
      const radioButtons = await page.locator('input[type="radio"]');
      if ((await radioButtons.count()) > 0) {
        await radioButtons.first().click();
      }

      // Navigate to next question
      await page.click('button:has-text("Next")');

      // Complete test
      while (await page.locator('button:has-text("Next")').isVisible()) {
        const options = page.locator(
          'input[type="radio"], input[type="checkbox"]',
        );
        if ((await options.count()) > 0) {
          await options.first().click();
        }
        await page.click('button:has-text("Next")');
      }

      // Submit test
      await page.click('button:has-text("Submit")');
      await page.click('button:has-text("Confirm")');

      // Verify results page
      await page.waitForURL(/\/results\/\d+/);
      expect(await page.locator("text=/your score|results/i")).toBeVisible();
    });

    test("should review test answers", async ({ page }) => {
      // Navigate to completed test results
      await page.goto(`${baseUrl}/attempts`);

      // Click on a completed attempt
      await page.click("a:first-child");
      await page.waitForURL(/\/results\/\d+/);

      // Verify can see answers
      expect(
        await page.locator("text=/your answer|correct answer/i"),
      ).toBeVisible();

      // Verify can see explanation
      expect(await page.locator("text=/explanation/i")).toBeVisible();
    });
  });

  test.describe("Subscription and Payment", () => {
    test("should complete subscription checkout", async ({ page }) => {
      // Login
      await page.goto(`${baseUrl}/login`);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button:has-text("Login")');
      await page.waitForURL(`${baseUrl}/dashboard`);

      // Navigate to pricing
      await page.click('a:has-text("Upgrade")');
      await page.waitForURL(`${baseUrl}/pricing`);

      // Select plan
      await page.click('button:has-text("Subscribe to Pro")');
      await page.waitForURL(`${baseUrl}/checkout`);

      // Fill payment form
      await page.click('input[name="cardNumber"]');
      await page.fill('input[name="cardNumber"]', "4242424242424242");
      await page.fill('input[name="expiry"]', "12/25");
      await page.fill('input[name="cvc"]', "123");
      await page.fill('input[name="zip"]', "12345");

      // Submit payment
      await page.click('button:has-text("Complete Purchase")');

      // Verify success and redirect
      await page.waitForURL(`${baseUrl}/dashboard`);
      expect(await page.locator("text=/subscription|active/i")).toBeVisible();
    });

    test("should change subscription plan", async ({ page }) => {
      // Login
      await page.goto(`${baseUrl}/login`);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button:has-text("Login")');

      // Navigate to account settings
      await page.click('button:has-text("Account")');
      await page.click('a:has-text("Subscription")');

      // Change plan
      await page.click('button:has-text("Change Plan")');
      await page.click('button:has-text("Premium")');
      await page.click('button:has-text("Confirm")');

      // Verify plan changed
      expect(await page.locator("text=Premium")).toBeVisible();
    });

    test("should cancel subscription", async ({ page }) => {
      // Login
      await page.goto(`${baseUrl}/login`);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button:has-text("Login")');

      // Navigate to subscription
      await page.click('button:has-text("Account")');
      await page.click('a:has-text("Subscription")');

      // Cancel subscription
      await page.click('button:has-text("Cancel Subscription")');
      await page.fill('textarea[name="reason"]', "No longer needed");
      await page.click('button:has-text("Confirm Cancel")');

      // Verify cancellation scheduled
      expect(
        await page.locator("text=/cancelled|end of billing/i"),
      ).toBeVisible();
    });
  });

  test.describe("Analytics and Dashboard", () => {
    test("should view learning analytics", async ({ page }) => {
      // Login
      await page.goto(`${baseUrl}/login`);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button:has-text("Login")');
      await page.waitForURL(`${baseUrl}/dashboard`);

      // Navigate to analytics
      await page.click('a:has-text("Analytics")');
      await page.waitForURL(`${baseUrl}/analytics`);

      // Verify metrics displayed
      expect(
        await page.locator("text=/tests completed|average score|pass rate/i"),
      ).toBeVisible();
    });

    test("should view admin analytics", async ({ page }) => {
      // Login as admin
      await page.goto(`${baseUrl}/login`);
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "AdminPass123!");
      await page.click('button:has-text("Login")');

      // Navigate to admin dashboard
      await page.click('a:has-text("Admin")');
      await page.click('a:has-text("Dashboard")');

      // Verify admin metrics
      expect(
        await page.locator(
          "text=/total questions|pending approvals|active users/i",
        ),
      ).toBeVisible();
    });
  });
});
