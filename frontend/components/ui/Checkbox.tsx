import React from "react";
import classNames from "classnames";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  indeterminate?: boolean;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      hint,
      indeterminate = false,
      description,
      className,
      disabled,
      id,
      ...props
    },
    ref,
  ) => {
    const uniqueId =
      id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={classNames("flex flex-col", className)}>
        <div className="flex items-start gap-3">
          <div className="flex items-center pt-1">
            <input
              ref={ref}
              type="checkbox"
              id={uniqueId}
              disabled={disabled}
              className={classNames(
                "w-4 h-4 rounded border-2 transition-all",
                "border-neutral-300 dark:border-neutral-600",
                "cursor-pointer accent-primary-600 dark:accent-primary-500",
                "focus:ring-2 focus:ring-primary-500 focus:ring-offset-1",
                "dark:focus:ring-offset-neutral-900",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                error && "border-error-600 dark:border-error-500",
              )}
              {...props}
            />
          </div>

          <div className="flex-1">
            {label && (
              <label
                htmlFor={uniqueId}
                className={classNames(
                  "text-sm font-medium cursor-pointer",
                  "text-neutral-900 dark:text-neutral-100",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
              >
                {label}
              </label>
            )}

            {description && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {hint && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 ml-7">
            {hint}
          </p>
        )}

        {error && (
          <p className="text-xs text-error-600 dark:text-error-400 mt-1 ml-7">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";

// Checkbox Group
interface CheckboxGroupProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  label?: string;
  error?: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  value?: string[];
  onChange?: (values: string[]) => void;
  required?: boolean;
}

export const CheckboxGroup = React.forwardRef<
  HTMLDivElement,
  CheckboxGroupProps
>(
  (
    {
      label,
      error,
      options,
      value = [],
      onChange,
      required,
      className,
      ...props
    },
    ref,
  ) => {
    const handleChange = (optionValue: string) => {
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue];
      onChange?.(newValue);
    };

    return (
      <div ref={ref} className={className} {...props}>
        {label && (
          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
            {label}
            {required && <span className="text-error-600 ml-1">*</span>}
          </div>
        )}

        <div className="space-y-3">
          {options.map((option) => (
            <Checkbox
              key={option.value}
              checked={value.includes(option.value)}
              onChange={() => handleChange(option.value)}
              label={option.label}
              description={option.description}
              disabled={option.disabled}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-error-600 dark:text-error-400 mt-2">
            {error}
          </p>
        )}
      </div>
    );
  },
);

CheckboxGroup.displayName = "CheckboxGroup";
