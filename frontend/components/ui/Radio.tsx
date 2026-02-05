import React from "react";
import classNames from "classnames";

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className, disabled, id, ...props }, ref) => {
    const uniqueId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={classNames("flex items-start gap-3", className)}>
        <div className="flex items-center pt-1">
          <input
            ref={ref}
            type="radio"
            id={uniqueId}
            disabled={disabled}
            className={classNames(
              "w-4 h-4 rounded-full border-2 transition-all",
              "border-neutral-300 dark:border-neutral-600",
              "cursor-pointer accent-primary-600 dark:accent-primary-500",
              "focus:ring-2 focus:ring-primary-500 focus:ring-offset-1",
              "dark:focus:ring-offset-neutral-900",
              "disabled:opacity-50 disabled:cursor-not-allowed",
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
    );
  },
);

Radio.displayName = "Radio";

// Radio Group
interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  label?: string;
  error?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  name?: string;
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      label,
      error,
      options,
      value,
      onChange,
      required,
      name,
      className,
      ...props
    },
    ref,
  ) => {
    const uniqueName =
      name || `radio-group-${Math.random().toString(36).substr(2, 9)}`;

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
            <Radio
              key={option.value}
              name={uniqueName}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
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

RadioGroup.displayName = "RadioGroup";
