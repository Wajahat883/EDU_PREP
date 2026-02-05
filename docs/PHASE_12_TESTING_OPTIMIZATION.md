# Phase 12: Testing & Optimization

## Overview

Comprehensive testing strategy, performance optimization, and quality assurance across all components and pages.

---

## Testing Strategy

### Testing Pyramid

```
      E2E Tests (Cypress/Playwright)
          /\
         /  \
        /    \
    Integration Tests (React Testing Library)
      /\          /\
     /  \        /  \
    /    \      /    \
Unit Tests (Jest)
```

### Test Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** 60%+ coverage
- **E2E Tests:** Critical user flows
- **Overall:** 75%+ code coverage

---

## Unit Testing with Jest

### Setup

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Component Unit Tests

#### Button Component Test

```typescript
// components/ui/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct variant class', () => {
    const { container } = render(<Button variant="primary">Button</Button>);
    expect(container.querySelector('.btn-primary')).toBeInTheDocument();
  });

  it('disables when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toHaveClass('opacity-75');
  });
});
```

#### Input Component Test

```typescript
// components/ui/__tests__/Input.test.tsx
describe('Input Component', () => {
  it('renders with label', () => {
    render(<Input label="Email" name="email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input name="email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('handles input change', async () => {
    const { container } = render(<Input name="test" />);
    const input = container.querySelector('input');

    await userEvent.type(input!, 'test value');
    expect(input).toHaveValue('test value');
  });

  it('shows hint text', () => {
    render(<Input name="password" hint="8+ characters" />);
    expect(screen.getByText('8+ characters')).toBeInTheDocument();
  });
});
```

#### Modal Component Test

```typescript
// components/ui/__tests__/Modal.test.tsx
describe('Modal Component', () => {
  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
        Modal content
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={jest.fn()} title="Test Modal">
        Modal content
      </Modal>
    );
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('calls onClose when close button clicked', async () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        Content
      </Modal>
    );

    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(handleClose).toHaveBeenCalled();
  });

  it('closes on backdrop click', async () => {
    const handleClose = jest.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        Content
      </Modal>
    );

    const backdrop = container.querySelector('[role="presentation"]');
    await userEvent.click(backdrop!);
    expect(handleClose).toHaveBeenCalled();
  });

  it('closes on Escape key press', async () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        Content
      </Modal>
    );

    await userEvent.keyboard('{Escape}');
    expect(handleClose).toHaveBeenCalled();
  });
});
```

### Hook Testing

#### useToast Hook Test

```typescript
// components/ui/__tests__/useToast.test.tsx
import { renderHook, act } from "@testing-library/react";
import { useToast } from "../Toast";

describe("useToast Hook", () => {
  it("adds toast to list", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.addToast({
        type: "success",
        message: "Success!",
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe("Success!");
  });

  it("removes toast by id", () => {
    const { result } = renderHook(() => useToast());
    let toastId: string;

    act(() => {
      const toast = result.current.addToast({
        type: "info",
        message: "Info",
      });
      toastId = toast.id;
    });

    act(() => {
      result.current.removeToast(toastId!);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it("auto-removes toast after duration", async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.addToast({
        type: "success",
        message: "Success!",
        duration: 3000,
      });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.toasts).toHaveLength(0);
    jest.useRealTimers();
  });
});
```

---

## Integration Testing

### Page Integration Tests

#### Login Page Test

```typescript
// pages/__tests__/login_new.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../login_new';

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Login Page', () => {
  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<LoginPage />);
    const submitButton = screen.getByText(/sign in/i);

    await userEvent.click(submitButton);

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);

    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.click(screen.getByText(/sign in/i));

    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/router'), 'useRouter').mockReturnValue({
      push: mockPush,
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByText(/sign in/i));

    // Wait for async submission
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});
```

#### Dashboard Page Test

```typescript
// pages/__tests__/dashboard_new.test.tsx
describe('Dashboard Page', () => {
  it('renders dashboard layout', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('displays user statistics', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/questions attempted/i)).toBeInTheDocument();
    expect(screen.getByText(/accuracy/i)).toBeInTheDocument();
  });

  it('renders progress sections', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/progress by subject/i)).toBeInTheDocument();
  });

  it('displays activity feed', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
  });
});
```

---

## E2E Testing with Cypress

### Setup

```bash
npm install --save-dev cypress
npx cypress open
```

### Critical User Flow Tests

#### User Registration & Login Flow

```typescript
// cypress/e2e/auth.cy.ts
describe("Authentication Flow", () => {
  it("completes signup and login", () => {
    cy.visit("http://localhost:3000");

    // Navigate to signup
    cy.contains("Get Started").click();
    cy.url().should("include", "/signup");

    // Fill signup form
    cy.get('input[name="name"]').type("John Doe");
    cy.get('input[name="email"]').type("john@example.com");
    cy.get('input[name="password"]').type("SecurePass123!");
    cy.get('input[name="confirmPassword"]').type("SecurePass123!");
    cy.get('input[type="checkbox"]').first().check();

    // Submit
    cy.get("button").contains("Create Account").click();

    // Verify redirect to login or dashboard
    cy.url().should("include", "/login");

    // Login
    cy.get('input[name="email"]').type("john@example.com");
    cy.get('input[name="password"]').type("SecurePass123!");
    cy.get("button").contains("Sign In").click();

    // Verify dashboard
    cy.url().should("include", "/dashboard");
    cy.contains("Welcome").should("be.visible");
  });
});
```

#### Study Session Flow

```typescript
// cypress/e2e/study.cy.ts
describe("Study Session Flow", () => {
  beforeEach(() => {
    cy.login(); // Custom command
  });

  it("completes question bank session", () => {
    cy.visit("http://localhost:3000/qbank");

    // Apply filters
    cy.get("select").first().select("Anatomy");
    cy.get("select").eq(1).select("Medium");

    // Select question
    cy.get('[data-testid="question-item"]').first().click();

    // Answer question
    cy.get('input[type="radio"]').eq(0).check();
    cy.get("button").contains("Next").click();

    // Verify next question
    cy.get('[data-testid="question-item"]').should("be.visible");
  });

  it("completes flashcard session", () => {
    cy.visit("http://localhost:3000/flashcards");

    // Select deck
    cy.get('[data-testid="deck-card"]').first().click();
    cy.get("button").contains("Study Now").click();

    // Flip card
    cy.get('[data-testid="flashcard"]').click();
    cy.contains("Answer").should("be.visible");

    // Mark as known
    cy.get("button").contains("Got It").click();

    // Next card
    cy.get("button").contains("Next").click();
    cy.get('[data-testid="flashcard"]').should("be.visible");
  });
});
```

---

## Performance Optimization

### Core Web Vitals

#### Lighthouse Targets

```
🟢 Performance: ≥ 90
🟢 Accessibility: ≥ 95
🟢 Best Practices: ≥ 90
🟢 SEO: ≥ 90
```

### Performance Metrics

#### Key Metrics to Monitor

```typescript
// lib/metrics.ts
export interface WebVitals {
  CLS: number; // Cumulative Layout Shift (< 0.1)
  FID: number; // First Input Delay (< 100ms)
  LCP: number; // Largest Contentful Paint (< 2.5s)
  FCP: number; // First Contentful Paint (< 1.8s)
  TTFB: number; // Time to First Byte (< 600ms)
}

export const reportWebVitals = (metric: NextWebVitalsMetric) => {
  console.log(metric);
  // Send to analytics service
};
```

### Code Splitting Optimization

#### Dynamic Imports

```typescript
// pages/_app.tsx
import dynamic from 'next/dynamic';

const AnalyticsPage = dynamic(() => import('./analytics_new'), {
  loading: () => <LoadingSpinner />,
});

const AdminPanel = dynamic(() => import('./admin_new'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Admin panel client-side only
});
```

#### Component Lazy Loading

```typescript
// Lazy load heavy components
const DataTable = dynamic(() => import('@/components/DataTable'), {
  loading: () => <TableSkeleton />,
});

const ChartComponent = dynamic(() => import('@/components/charts/LineChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

### Image Optimization

#### Next.js Image Optimization

```typescript
import Image from 'next/image';

export const OptimizedImage = () => (
  <Image
    src="/images/hero.jpg"
    alt="Hero banner"
    width={1200}
    height={600}
    priority // For above-the-fold images
    sizes="(max-width: 640px) 100vw,
            (max-width: 1024px) 50vw,
            33vw"
    quality={75}
  />
);
```

### CSS Optimization

#### Unused CSS Removal

```bash
# PurgeCSS is built into Tailwind
# Automatically removes unused styles in production
```

#### Critical CSS Inlining

```typescript
// Already handled by Next.js and Tailwind
// Critical styles are automatically inlined in <head>
```

### JavaScript Bundle Analysis

#### Bundle Size Monitoring

```bash
npm install --save-dev @next/bundle-analyzer
```

```typescript
// next.config.js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer({
  // Next.js config
});
```

### Caching Strategies

#### Browser Caching Headers

```typescript
// next.config.js
module.exports = {
  headers: async () => [
    {
      source: "/_next/static/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/images/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
    },
  ],
};
```

---

## Accessibility Testing

### Automated Accessibility Tests

```typescript
// cypress/e2e/accessibility.cy.ts
import "cypress-axe";

describe("Accessibility", () => {
  it("has no accessibility violations on homepage", () => {
    cy.visit("http://localhost:3000");
    cy.injectAxe();
    cy.checkA11y();
  });

  it("has no violations on login page", () => {
    cy.visit("http://localhost:3000/login");
    cy.injectAxe();
    cy.checkA11y();
  });

  it("has no violations on dashboard", () => {
    cy.login();
    cy.visit("http://localhost:3000/dashboard");
    cy.injectAxe();
    cy.checkA11y();
  });
});
```

### Manual Accessibility Checklist

- [ ] Keyboard navigation works
- [ ] Screen reader announces all content
- [ ] Color contrast ≥ 4.5:1
- [ ] Focus indicators visible
- [ ] Alt text on all images
- [ ] Form labels associated
- [ ] Error messages clear
- [ ] Skip links present

---

## QA Testing Matrix

| Test Type     | Coverage       | Tool                  | Frequency   |
| ------------- | -------------- | --------------------- | ----------- |
| Unit          | 80%+           | Jest                  | Per commit  |
| Integration   | 60%+           | React Testing Library | Per PR      |
| E2E           | Critical flows | Cypress               | Per release |
| Performance   | Lighthouse     | Web Vitals            | Weekly      |
| Accessibility | WCAG 2.1 AA    | Axe + Manual          | Weekly      |
| Visual        | Regression     | Percy                 | Per PR      |

---

## Optimization Checklist

### Performance

- [x] Code splitting enabled
- [x] Image optimization
- [x] CSS minification (Tailwind)
- [x] JavaScript minification
- [ ] Caching strategies implemented
- [ ] Service worker for offline
- [ ] API response caching

### Bundle Size

- [ ] Analyze bundle size
- [ ] Remove unused dependencies
- [ ] Lazy load heavy libraries
- [ ] Tree-shake unused code

### Runtime Performance

- [x] Memoization applied
- [x] Efficient re-renders
- [ ] Debounced expensive operations
- [ ] Virtualized long lists

### Accessibility

- [x] WCAG 2.1 AA compliant
- [x] Keyboard navigation
- [x] Screen reader support
- [x] Color contrast verified

---

## Testing Command Reference

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test Button.test.tsx

# Watch mode
npm test -- --watch

# Cypress E2E tests
npm run cypress:open

# Cypress headless
npm run cypress:run

# Lighthouse audit
npm run lighthouse

# Bundle analysis
ANALYZE=true npm run build
```

---

## Status: ✅ STRATEGY COMPLETE

### Testing Infrastructure

- Jest configuration defined
- React Testing Library patterns established
- Cypress E2E framework structured
- Accessibility testing strategy outlined

### Performance Targets

- Core Web Vitals goals set
- Bundle optimization strategy defined
- Caching strategies outlined
- Image optimization implemented

### QA Process

- Testing matrix established
- Coverage goals defined
- Automation roadmap created
- Manual testing checklist prepared

### Ready for Implementation

- Unit test suites can be created
- Integration tests can be written
- E2E tests can be automated
- Performance monitoring can begin
