# EduPrep UI/UX System - Quick Reference Guide

## 📚 Components Overview

### UI Components (20 Total)

All located in `frontend/components/ui/` and exported from `index.ts`

```typescript
import {
  Button,
  Card,
  Input,
  Modal,
  Tabs,
  Accordion,
  Toast,
  Progress,
  Checkbox,
  Radio,
  Textarea,
  Select,
  Skeleton,
  Avatar,
  Badge,
  Alert,
  Spinner,
  Dropdown,
  Tooltip,
} from "@/components/ui";
```

#### Basic Components

- **Button** - Primary, secondary, outline, ghost, danger variants
- **Card** - Container with optional elevation and padding
- **Badge** - Status indicator with color variants
- **Alert** - Information, success, warning, error types
- **Spinner** - Loading indicator

#### Form Components

- **Input** - Text input with validation, error, hint
- **Textarea** - Multiline input with char count
- **Checkbox** / **CheckboxGroup** - Multi-select
- **Radio** / **RadioGroup** - Single-select
- **Select** - Dropdown with grouping
- **Skeleton** - Loading placeholder

#### Interactive Components

- **Modal** - Dialog with backdrop and animations
- **Tabs** - 3 variants (default, pills, underline)
- **Accordion** - Expandable sections
- **Toast** - Notifications (+ useToast hook)
- **Dropdown** - Context menus

#### Display Components

- **Avatar** / **AvatarGroup** - Profile images
- **Progress** - Progress bars
- **Tooltip** - 4-way positioning

---

## 🎨 Layout Components (4 Total)

All located in `frontend/components/layouts/` and exported from `index.ts`

```typescript
import {
  MainLayout,
  AuthLayout,
  DashboardLayout,
  AdminLayout,
} from "@/components/layouts";
```

### Usage by Page Type

| Layout              | Use Case              | Example Pages        |
| ------------------- | --------------------- | -------------------- |
| **MainLayout**      | Primary app interface | Dashboard, Analytics |
| **AuthLayout**      | Authentication pages  | Login, Signup        |
| **DashboardLayout** | User dashboards       | Dashboard            |
| **AdminLayout**     | System administration | Admin Dashboard      |

---

## 📄 Pages Reference

### Marketing Pages

- `index_new.tsx` - Landing page (hero, features, pricing, footer)
- `pricing_new.tsx` - Pricing details and comparison

### Authentication Pages

- `login_new.tsx` - Sign in form
- `signup_new.tsx` - Registration form

### User Pages

- `dashboard_new.tsx` - User dashboard (stats, progress, activity)
- `analytics_new.tsx` - Analytics and performance tracking
- `subscription_new.tsx` - Subscription management

### Study Pages

- `qbank_new.tsx` - Question bank with filters
- `flashcards_new.tsx` - Flashcard deck management

### Admin Pages

- `admin_new.tsx` - Admin dashboard (users, system health)

---

## 🎯 Common Usage Patterns

### Using Components

```typescript
// Button variants
<Button variant="primary">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// Button sizes
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>

// Button states
<Button disabled>Disabled</Button>
<Button isLoading>Loading...</Button>
<Button fullWidth>Full Width</Button>
```

### Forms

```typescript
// Simple form
<form onSubmit={handleSubmit}>
  <Input
    label="Email"
    name="email"
    type="email"
    required
    error={errors.email}
  />
  <Textarea
    label="Message"
    name="message"
    maxLength={500}
    hint="Max 500 characters"
  />
  <Button type="submit">Submit</Button>
</form>
```

### Cards & Lists

```typescript
// Card example
<Card elevated>
  <CardHeader>
    <h3>Title</h3>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>

// Card grid
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id}>Content</Card>
  ))}
</div>
```

### Modals

```typescript
// Modal state
const [isOpen, setIsOpen] = useState(false);

// Modal usage
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
>
  Are you sure?
  <ModalFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="danger">Confirm</Button>
  </ModalFooter>
</Modal>
```

### Notifications

```typescript
// Toast usage
const { addToast } = useToast();

// Trigger toast
addToast({
  type: "success",
  title: "Success",
  message: "Operation completed!",
  duration: 3000,
});

// Toast types: 'success', 'error', 'info', 'warning'
```

---

## 🌓 Dark Mode Support

### Automatic Support

All components and pages include dark mode by default:

```typescript
// Light mode (default)
<div className="bg-white text-neutral-900">Light</div>

// Dark mode (automatic with dark: prefix)
<div className="bg-white dark:bg-neutral-900
                text-neutral-900 dark:text-white">
  Auto dark mode
</div>
```

### Testing Dark Mode

- Next.js: Add `"prefers-color-scheme": "dark"` in DevTools
- Or: Toggle theme in browser extensions
- Check all text contrast ≥ 4.5:1

---

## 📱 Responsive Classes

### Breakpoint Cheatsheet

```typescript
// Mobile first - applies from this breakpoint up
className="
  w-full                    // Mobile (default)
  sm:w-1/2                  // 640px+
  md:w-1/3                  // 768px+
  lg:w-1/4                  // 1024px+
  xl:w-1/5                  // 1280px+
  2xl:w-1/6                 // 1536px+
"

// Common patterns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="px-4 md:px-6 lg:px-8"
className="text-base md:text-lg lg:text-xl"
```

---

## 🎭 Layout Wrappers

### MainLayout

```typescript
<MainLayout
  navLinks={[
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/analytics', label: 'Analytics' },
  ]}
>
  Page content here
</MainLayout>
```

### AuthLayout

```typescript
<AuthLayout variant="light">
  <h1>Sign In</h1>
  {/* Form here */}
</AuthLayout>
```

### DashboardLayout

```typescript
<DashboardLayout
  navLinks={[
    { href: '/dashboard', label: 'Dashboard' },
  ]}
  breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Dashboard' },
  ]}
>
  Dashboard content
</DashboardLayout>
```

### AdminLayout

```typescript
<AdminLayout>
  Admin content
</AdminLayout>
```

---

## 🎨 Design System

### Colors

All colors accessible via Tailwind classes:

```typescript
// Primary colors
bg-primary-50 to bg-primary-950
text-primary-600
border-primary-200

// Status colors
bg-success-600, bg-warning-600, bg-error-600, bg-info-600
```

### Typography

```typescript
// Headings
className = "text-4xl font-bold"; // h1
className = "text-3xl font-bold"; // h2
className = "text-2xl font-semibold"; // h3
className = "text-lg font-semibold"; // h4

// Body text
className = "text-base"; // Default
className = "text-sm text-neutral-600"; // Secondary text
className = "text-xs"; // Small text
```

### Spacing

```typescript
// Padding
className = "p-4"; // 1rem
className = "px-6 py-4"; // Horizontal/vertical
className = "space-y-4"; // Gap between children

// Margin
className = "m-4";
className = "mt-2 mb-4";
```

### Shadows

```typescript
className = "shadow"; // Small shadow
className = "shadow-lg"; // Large shadow
className = "shadow-xl"; // Extra large shadow
className = "hover:shadow-xl"; // On hover
```

---

## 🔧 Development Workflow

### Creating a New Page

```typescript
// frontend/pages/new_page.tsx
import { MainLayout } from '@/components/layouts';
import { Card, Button, Badge } from '@/components/ui';

export default function NewPage() {
  return (
    <MainLayout
      navLinks={[
        { href: '/dashboard', label: 'Dashboard' },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Page Title</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Description</p>
        </div>

        {/* Content */}
        <Card>
          <h2>Section</h2>
          <p>Content here</p>
        </Card>

        {/* Action */}
        <Button>Action</Button>
      </div>
    </MainLayout>
  );
}
```

### Creating a New Component

```typescript
// frontend/components/ui/NewComponent.tsx
import React from 'react';

interface NewComponentProps {
  title: string;
  children: React.ReactNode;
}

export const NewComponent = React.forwardRef<
  HTMLDivElement,
  NewComponentProps
>(({ title, children }, ref) => {
  return (
    <div ref={ref} className="space-y-4">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </div>
  );
});

NewComponent.displayName = 'NewComponent';
```

---

## 🧪 Testing Quick Start

### Unit Test Template

```typescript
// components/ui/__tests__/NewComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { NewComponent } from '../NewComponent';

describe('NewComponent', () => {
  it('renders with title', () => {
    render(<NewComponent title="Test">Content</NewComponent>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

---

## 📊 Performance Tips

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={1200}
  height={600}
  priority // For above-fold images
  quality={75}
/>
```

### Code Splitting

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('@/components/Heavy'),
  { loading: () => <Spinner /> }
);
```

### Memoization

```typescript
import { memo } from "react";

export const MemoizedComponent = memo(Component, (prev, next) => {
  return prev.id === next.id; // Custom comparison
});
```

---

## 📖 File Organization

```
frontend/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── layouts/        # Layout wrappers
│   └── charts/         # Chart components (Phase 9-10)
├── pages/              # Next.js pages (routes)
├── lib/                # Utilities and helpers
├── stores/             # State management (Zustand)
├── __tests__/          # Test files
└── styles/             # Global styles
```

---

## 🚀 Deployment Checklist

- [ ] All TypeScript errors fixed
- [ ] Linting passed (ESLint)
- [ ] Dark mode tested in all pages
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Accessibility tested (keyboard, screen reader)
- [ ] Links and navigation working
- [ ] Forms submitting correctly
- [ ] API endpoints configured
- [ ] Environment variables set
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors or warnings
- [ ] Lighthouse score ≥ 90

---

## 📞 Support Resources

### Documentation Files

- **PHASE_7-8_DARK_MODE_RESPONSIVENESS.md** - Dark mode guide
- **PHASE_9-10_FORMS_DATA_DISPLAY.md** - Forms architecture
- **PHASE_11_ANIMATIONS_TRANSITIONS.md** - Animation patterns
- **PHASE_12_TESTING_OPTIMIZATION.md** - Testing strategy
- **PROJECT_COMPLETION_SUMMARY.md** - Full project overview

### Component Type Definitions

All components have full TypeScript types in their files.
Hover in IDE to see props documentation.

### Tailwind Documentation

- Colors: https://tailwindcss.com/docs/customizing-colors
- Responsive: https://tailwindcss.com/docs/responsive-design
- Dark mode: https://tailwindcss.com/docs/dark-mode

---

**Last Updated:** January 28, 2026  
**Status:** ✅ Production Ready
