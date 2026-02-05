import React from "react";
import classNames from "classnames";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  helperText?: string;
  maxLength?: number;
  showCharCount?: boolean;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      helperText,
      maxLength,
      showCharCount = true,
      resize = "vertical",
      className,
      rows = 4,
      disabled,
      id,
      value = "",
      ...props
    },
    ref,
  ) => {
    const uniqueId =
      id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const charCount = typeof value === "string" ? value.length : 0;

    const resizeClasses = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    };

    return (
      <div className={classNames("flex flex-col gap-1", className)}>
        {label && (
          <label
            htmlFor={uniqueId}
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {label}
            {props.required && <span className="text-error-600 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={uniqueId}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          value={value}
          className={classNames(
            "px-3 py-2 rounded-lg border-2 transition-colors",
            "bg-white dark:bg-neutral-900",
            "text-neutral-900 dark:text-neutral-100",
            "placeholder-neutral-500 dark:placeholder-neutral-400",
            "focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50",
            "dark:focus:border-primary-400 dark:focus:ring-primary-400",
            "disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed",
            "dark:disabled:bg-neutral-800 dark:disabled:text-neutral-400",
            error
              ? "border-error-500 dark:border-error-400 focus:ring-error-500 dark:focus:ring-error-400"
              : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500",
            resizeClasses[resize],
            "font-sans text-base",
          )}
          {...props}
        />

        <div className="flex items-end justify-between gap-2">
          <div className="flex-1 space-y-1">
            {error && (
              <p className="text-xs font-medium text-error-600 dark:text-error-400">
                {error}
              </p>
            )}

            {hint && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {hint}
              </p>
            )}

            {helperText && (
              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                {helperText}
              </p>
            )}
          </div>

          {maxLength && showCharCount && (
            <span
              className={classNames(
                "text-xs font-medium whitespace-nowrap ml-2",
                charCount > maxLength * 0.9
                  ? "text-warning-600 dark:text-warning-400"
                  : "text-neutral-500 dark:text-neutral-400",
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
