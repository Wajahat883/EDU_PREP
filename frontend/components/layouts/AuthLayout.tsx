import React from "react";
import classNames from "classnames";

interface AuthLayoutProps {
  children: React.ReactNode;
  backgroundImage?: string;
  showLogo?: boolean;
  title?: string;
  description?: string;
  rightContent?: React.ReactNode;
  variant?: "light" | "dark" | "gradient";
}

export const AuthLayout = React.forwardRef<HTMLDivElement, AuthLayoutProps>(
  (
    {
      children,
      backgroundImage,
      showLogo = true,
      title,
      description,
      rightContent,
      variant = "gradient",
    },
    ref,
  ) => {
    const bgVariants = {
      light: "bg-neutral-50 dark:bg-neutral-950",
      dark: "bg-neutral-900",
      gradient:
        "bg-gradient-to-br from-primary-600 to-secondary-600 dark:from-primary-900 dark:to-secondary-900",
    };

    return (
      <div
        ref={ref}
        className={classNames("min-h-screen flex", bgVariants[variant])}
      >
        {/* Left Side - Form Container */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-8 py-12 lg:py-0">
          {/* Logo / Header */}
          {showLogo && (
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-600 dark:bg-primary-500 mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                EduPrep
              </h1>
            </div>
          )}

          {/* Content */}
          <div className="w-full max-w-md">
            {title && (
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                {title}
              </h2>
            )}

            {description && (
              <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                {description}
              </p>
            )}

            {children}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-neutral-600 dark:text-neutral-400">
            <p>© 2026 EduPrep. All rights reserved.</p>
          </div>
        </div>

        {/* Right Side - Visual */}
        {rightContent && (
          <div className="hidden lg:flex w-1/2 relative overflow-hidden">
            {backgroundImage && (
              <img
                src={backgroundImage}
                alt="Auth background"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="relative flex items-center justify-center w-full">
              {rightContent}
            </div>
          </div>
        )}
      </div>
    );
  },
);

AuthLayout.displayName = "AuthLayout";
