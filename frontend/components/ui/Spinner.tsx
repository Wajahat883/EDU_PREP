/**
 * Spinner Component
 * Location: frontend/components/ui/Spinner.tsx
 */

import React from "react";
import classNames from "classnames";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "white" | "neutral";
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "primary",
  className,
  ...props
}) => {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }[size];

  const colorClass = {
    primary: "border-primary-600 border-r-transparent",
    white: "border-white border-r-transparent",
    neutral: "border-neutral-600 border-r-transparent",
  }[color];

  return (
    <div
      className={classNames(
        "animate-spin rounded-full border-2 border-solid",
        sizeClass,
        colorClass,
        className,
      )}
      {...props}
    />
  );
};

Spinner.displayName = "Spinner";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  message,
  className,
  ...props
}) => (
  <div
    className={classNames(
      "flex flex-col items-center justify-center p-8",
      className,
    )}
    {...props}
  >
    <Spinner size="lg" />
    {message && (
      <p className="mt-4 text-neutral-600 dark:text-neutral-400">{message}</p>
    )}
  </div>
);

Loader.displayName = "Loader";
