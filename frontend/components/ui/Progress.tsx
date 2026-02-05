import React from "react";
import classNames from "classnames";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
  showLabel?: boolean;
  variant?: "primary" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  striped?: boolean;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      label,
      showLabel = true,
      variant = "primary",
      size = "md",
      animated = true,
      striped = false,
      className,
      ...props
    },
    ref,
  ) => {
    const percentage = Math.min((value / max) * 100, 100);

    const sizeClasses = {
      sm: "h-1",
      md: "h-2",
      lg: "h-3",
    };

    const variantClasses = {
      primary: "bg-primary-600 dark:bg-primary-500",
      success: "bg-success-600 dark:bg-success-500",
      warning: "bg-warning-600 dark:bg-warning-500",
      error: "bg-error-600 dark:bg-error-500",
    };

    return (
      <div ref={ref} className={className} {...props}>
        {showLabel && (
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {label || `Progress: ${percentage.toFixed(0)}%`}
            </label>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {Math.round(percentage)}%
            </span>
          </div>
        )}

        <div
          className={classNames(
            "w-full bg-neutral-200 dark:bg-neutral-700",
            "rounded-full overflow-hidden",
            sizeClasses[size],
          )}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={classNames(
              "h-full transition-all duration-500 rounded-full",
              variantClasses[variant],
              striped && "bg-gradient-to-r from-current to-current opacity-75",
              animated && "animate-pulse",
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  },
);

Progress.displayName = "Progress";
