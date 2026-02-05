import React from "react";
import classNames from "classnames";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  clearable?: boolean;
  searchable?: boolean;
  onClear?: () => void;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder = "Select an option...",
      clearable = false,
      className,
      disabled,
      id,
      value,
      onChange,
      ...props
    },
    ref,
  ) => {
    const uniqueId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const groupedOptions = options.reduce(
      (acc, option) => {
        const group = option.group || "ungrouped";
        if (!acc[group]) acc[group] = [];
        acc[group].push(option);
        return acc;
      },
      {} as Record<string, SelectOption[]>,
    );

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

        <div className="relative">
          <select
            ref={ref}
            id={uniqueId}
            disabled={disabled}
            value={value}
            onChange={onChange}
            className={classNames(
              "w-full px-3 py-2 rounded-lg border-2 transition-colors",
              "bg-white dark:bg-neutral-900",
              "text-neutral-900 dark:text-neutral-100",
              "focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50",
              "dark:focus:border-primary-400 dark:focus:ring-primary-400",
              "disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed",
              "dark:disabled:bg-neutral-800 dark:disabled:text-neutral-400",
              "appearance-none cursor-pointer pr-8",
              error
                ? "border-error-500 dark:border-error-400"
                : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500",
              "font-sans text-base",
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {Object.entries(groupedOptions).map(([groupName, groupOptions]) => {
              if (groupName === "ungrouped") {
                return groupOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ));
              }

              return (
                <optgroup key={groupName} label={groupName}>
                  {groupOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>

          {/* Dropdown Arrow */}
          <svg
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-neutral-600 dark:text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>

        {clearable && value && (
          <button
            type="button"
            onClick={() => {
              onChange?.({
                target: { value: "" },
              } as React.ChangeEvent<HTMLSelectElement>);
            }}
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-1"
          >
            Clear selection
          </button>
        )}

        {error && (
          <p className="text-xs font-medium text-error-600 dark:text-error-400 mt-1">
            {error}
          </p>
        )}

        {hint && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
