/**
 * Alert Component
 * Location: frontend/components/ui/Alert.tsx
 */

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import classNames from "classnames";

const alertVariants = cva(
  "rounded-lg border px-4 py-3 flex items-start gap-3",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-800 dark:text-primary-200",
        success:
          "bg-success-50 dark:bg-success-900/20 border-success-300 dark:border-success-700 text-success-800 dark:text-success-200",
        warning:
          "bg-warning-50 dark:bg-warning-900/20 border-warning-300 dark:border-warning-700 text-warning-800 dark:text-warning-200",
        error:
          "bg-error-50 dark:bg-error-900/20 border-error-300 dark:border-error-700 text-error-800 dark:text-error-200",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

interface AlertProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode;
  title?: string;
  onClose?: () => void;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, icon, title, onClose, children, ...props }, ref) => (
    <div
      ref={ref}
      className={classNames(alertVariants({ variant }), className)}
      role="alert"
      {...props}
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-1">
        {title && <p className="font-semibold mb-1">{title}</p>}
        {children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close alert"
        >
          ✕
        </button>
      )}
    </div>
  ),
);

Alert.displayName = "Alert";
