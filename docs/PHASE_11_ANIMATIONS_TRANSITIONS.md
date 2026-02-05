# Phase 11: Animations & Transitions

## Overview

Comprehensive animation system including page transitions, micro-interactions, loading states, and gesture animations.

---

## Animation System Architecture

### Tailwind Animation Classes

```css
/* globals.css - Already included keyframes */
@keyframes fadeIn {
  /* 0 to 100% opacity */
}
@keyframes slideIn {
  /* transforms + opacity */
}
@keyframes scaleIn {
  /* transform: scale */
}
@keyframes bounce {
  /* elastic effect */
}
@keyframes pulse {
  /* loading effect */
}
@keyframes spin {
  /* rotation */
}
@keyframes shimmer {
  /* skeleton loading */
}
```

### Core Animation Utilities

```typescript
// lib/animations.ts
export const ANIMATIONS = {
  // Page Transitions
  pageEnter: "animate-fadeIn",
  pageExit: "animate-fadeOut",
  pageSlideIn: "animate-slideInRight",
  pageSlideOut: "animate-slideOutLeft",

  // Component Animations
  modalEnter: "animate-zoomIn",
  modalExit: "animate-zoomOut",
  dropdownEnter: "animate-slideInDown",
  toastEnter: "animate-slideInUp",
  toastExit: "animate-slideOutDown",

  // Micro-interactions
  buttonHover: "hover:scale-105 transition-transform",
  buttonClick: "active:scale-95 transition-transform",
  cardHover: "hover:shadow-lg hover:-translate-y-1 transition-all",

  // Loading States
  pulse: "animate-pulse",
  spin: "animate-spin",
  bounce: "animate-bounce",

  // Delays
  delay100: "animation-delay-100",
  delay200: "animation-delay-200",
  delay300: "animation-delay-300",
};
```

---

## Page Transitions

### Next.js Router Animations

```typescript
// components/PageTransition.tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return (
    <div className={isLoading ? 'opacity-75' : 'opacity-100 transition-opacity duration-300'}>
      {children}
    </div>
  );
};
```

### Layout Animations with Framer Motion

```typescript
// components/AnimatedLayout.tsx
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export const AnimatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial="initial"
    animate="enter"
    exit="exit"
    variants={pageVariants}
  >
    {children}
  </motion.div>
);
```

### Stagger Animation for Lists

```typescript
// components/AnimatedList.tsx
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

export const AnimatedList: React.FC<{ items: any[] }> = ({ items }) => (
  <motion.div variants={containerVariants} initial="hidden" animate="visible">
    {items.map((item) => (
      <motion.div key={item.id} variants={itemVariants}>
        {item.content}
      </motion.div>
    ))}
  </motion.div>
);
```

---

## Micro-Interactions

### Button Animations

```tsx
// Enhanced Button component with animations
<Button className="hover:scale-105 active:scale-95 transition-all duration-150 ease-out">
  Click Me
</Button>

// With icon animation
<Button className="group">
  <span className="group-hover:translate-x-1 transition-transform">Send</span>
  <svg className="w-4 h-4 group-hover:translate-x-2 transition-transform">
    {/* arrow icon */}
  </svg>
</Button>
```

### Card Hover Effects

```tsx
<Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
  <div className="group-hover:bg-primary-50 dark:group-hover:bg-primary-950 transition-colors">
    Content
  </div>
</Card>
```

### Input Focus Animations

```tsx
<Input className="focus:ring-2 focus:ring-primary-500 transition-all duration-200 focus:-translate-y-0.5" />
```

### Checkbox Animations

```tsx
<Checkbox
  className="
    before:content-[''] before:absolute before:inset-0
    before:bg-primary-500 before:rounded before:scale-0
    checked:before:scale-100 before:transition-transform
  "
/>
```

---

## Loading States & Skeletons

### Skeleton Animations

```tsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
</div>
```

### Shimmer Effect

```tsx
<div className="relative overflow-hidden bg-neutral-200 dark:bg-neutral-700 rounded">
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
</div>
```

### Loading Spinner Animations

```tsx
<div className="flex gap-1">
  <div
    className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"
    style={{ animationDelay: "0ms" }}
  ></div>
  <div
    className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"
    style={{ animationDelay: "150ms" }}
  ></div>
  <div
    className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"
    style={{ animationDelay: "300ms" }}
  ></div>
</div>
```

---

## Modal & Dropdown Animations

### Modal Entrance Animation

```typescript
// components/ui/Modal.tsx - Enhanced
<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50"
      />

      {/* Content zoom in */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="modal-content"
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### Dropdown Menu Animation

```typescript
// Staggered list items
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: 'spring', stiffness: 200 }}
>
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.05 }}
  >
    Item 1
  </motion.div>
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.1 }}
  >
    Item 2
  </motion.div>
</motion.div>
```

---

## Gesture Animations (React Native / Mobile)

### Swipe Gesture Handling

```typescript
// lib/gestures.ts
import { useGesture } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';

export const useSwipeAnimation = (onSwipe: (direction: string) => void) => {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const bind = useGesture({
    onDrag: ({ offset: [ox] }) => {
      api.start({ x: ox, immediate: true });
      if (Math.abs(ox) > 50) {
        onSwipe(ox > 0 ? 'right' : 'left');
      }
    },
  });

  return { bind, x };
};

// Usage
export const SwipeableCard: React.FC<{ onSwipe: (dir: string) => void }> = ({ onSwipe }) => {
  const { bind, x } = useSwipeAnimation(onSwipe);
  return (
    <animated.div {...bind()} style={{ x }}>
      Card content
    </animated.div>
  );
};
```

### Pull-to-Refresh

```typescript
// components/PullToRefresh.tsx
export const PullToRefresh: React.FC<{
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}> = ({ onRefresh, children }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchMove = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      setPullDistance(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 100) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  };

  return (
    <div onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {isRefreshing && <Spinner />}
      {children}
    </div>
  );
};
```

---

## Success & Error Animations

### Success Message Animation

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{
    type: "spring",
    stiffness: 260,
    damping: 20,
  }}
  className="flex items-center gap-2 p-4 bg-success-50 dark:bg-success-950 rounded-lg"
>
  <motion.svg
    className="w-6 h-6 text-success-600"
    initial={{ opacity: 0, rotate: -180 }}
    animate={{ opacity: 1, rotate: 0 }}
    transition={{ delay: 0.2 }}
  >
    {/* checkmark */}
  </motion.svg>
  <span>Operation successful!</span>
</motion.div>
```

### Error Shake Animation

```tsx
const shakeVariants = {
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.5 },
  },
};

<motion.div
  variants={shakeVariants}
  animate="shake"
  className="p-4 bg-error-50 dark:bg-error-950 rounded-lg"
>
  Something went wrong!
</motion.div>;
```

---

## Form Validation Animations

### Field Validation Feedback

```tsx
<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
  {error && (
    <motion.p
      className="text-error-600 text-sm mt-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {error}
    </motion.p>
  )}
</motion.div>
```

### Success Checkmark

```tsx
<motion.svg
  initial={{ pathLength: 0, opacity: 0 }}
  animate={{ pathLength: 1, opacity: 1 }}
  transition={{ duration: 0.6, ease: "easeInOut" }}
  className="w-6 h-6 text-success-600"
>
  {/* SVG path for checkmark */}
</motion.svg>
```

---

## Animation Performance Optimization

### GPU Acceleration

```css
/* Use transform and opacity for 60fps animations */
will-change: transform, opacity;
transform: translateZ(0);
backface-visibility: hidden;
```

### Reduce Motion Preference

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Lazy Load Animation Library

```typescript
// Dynamically import Framer Motion only when needed
const AnimatedComponent = dynamic(() => import('@/components/AnimatedLayout'), {
  loading: () => <LoadingFallback />,
  ssr: false,
});
```

---

## Animation Library Integration

### Framer Motion Setup

```bash
npm install framer-motion
```

```typescript
// _app.tsx
import { AnimatePresence } from 'framer-motion';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AnimatePresence mode="wait">
      <Component {...pageProps} />
    </AnimatePresence>
  );
}
```

### React Spring Setup

```bash
npm install @react-spring/web @react-spring/native
```

### Gesture Handling Setup

```bash
npm install @use-gesture/react
```

---

## Animation Checklist

### Page Transitions

- [ ] Page enter/exit animations
- [ ] Route change loading indicator
- [ ] Staggered content animations

### Micro-Interactions

- [x] Button hover/click effects (Tailwind)
- [x] Card hover effects (Tailwind)
- [ ] Input focus animations (Framer Motion)
- [ ] Checkbox/Radio animations (Framer Motion)

### Component Animations

- [ ] Modal entrance/exit
- [ ] Dropdown appearance
- [ ] Toast notifications slide in/out
- [ ] Notification expand/collapse

### Loading States

- [x] Skeleton loaders (Tailwind)
- [ ] Shimmer effect (Framer Motion)
- [ ] Spinner animations (Tailwind)
- [ ] Progress bar animations

### Feedback Animations

- [ ] Success message animations
- [ ] Error shake animations
- [ ] Validation feedback
- [ ] Success checkmarks

---

## Status: ✅ ARCHITECTURE COMPLETE

- Animation patterns documented
- Micro-interaction examples provided
- Page transition strategies defined
- Loading state animations outlined
- Gesture handling architecture designed
- Performance optimization guidelines included
- Ready for implementation with Framer Motion and React Spring
