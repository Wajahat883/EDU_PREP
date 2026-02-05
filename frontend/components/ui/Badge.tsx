/**
 * Badge Component
 * Location: frontend/components/ui/Badge.tsx
 */

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import classNames from "classnames";

const badgeVariants = cva("badge", {
  variants: {
    variant: {
      primary: "badge-primary",
      success: "badge-success",
      warning: "badge-warning",
      error: "badge-error",
      neutral:
        "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200",
    },
    size: {
      sm: "px-2 py-1 text-xs",
      md: "px-2.5 py-0.5 text-xs",
      lg: "px-3 py-1 text-sm",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span
      ref={ref}
      className={classNames(badgeVariants({ variant, size }), className)}
      {...props}
    />
  ),
);

Badge.displayName = "Badge";
