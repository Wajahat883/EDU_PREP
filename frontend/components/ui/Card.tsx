/**
 * Card Component
 * Location: frontend/components/ui/Card.tsx
 */

import React from "react";
import classNames from "classnames";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevated, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={classNames(
        "card",
        elevated && "shadow-lg",
        interactive && "cursor-pointer hover:shadow-lg active:shadow-md",
        className,
      )}
      {...props}
    />
  ),
);

Card.displayName = "Card";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={classNames(
        "border-b border-neutral-200 dark:border-neutral-700 pb-4 mb-4",
        className,
      )}
      {...props}
    />
  ),
);

CardHeader.displayName = "CardHeader";

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={classNames("", className)} {...props} />
  ),
);

CardContent.displayName = "CardContent";

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={classNames(
        "border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4",
        className,
      )}
      {...props}
    />
  ),
);

CardFooter.displayName = "CardFooter";
