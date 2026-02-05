import React from "react";
import classNames from "classnames";

interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  divider?: boolean;
  disabled?: boolean;
  variant?: "default" | "danger";
}

interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  trigger: React.ReactNode;
  items: DropdownItem[];
  placement?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  closeOnClick?: boolean;
}

export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      trigger,
      items,
      placement = "bottom-right",
      closeOnClick = true,
      className,
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    }, [isOpen]);

    const handleItemClick = (item: DropdownItem) => {
      if (!item.disabled) {
        item.onClick?.();
        if (closeOnClick) {
          setIsOpen(false);
        }
      }
    };

    const placementClasses = {
      "bottom-left": "origin-top-left left-0 mt-2",
      "bottom-right": "origin-top-right right-0 mt-2",
      "top-left": "origin-bottom-left left-0 mb-2",
      "top-right": "origin-bottom-right right-0 mb-2",
    };

    return (
      <div
        ref={dropdownRef}
        className={classNames("relative inline-block text-left", className)}
        {...props}
      >
        {/* Trigger */}
        <div onClick={() => setIsOpen(!isOpen)} role="button" tabIndex={0}>
          {trigger}
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className={classNames(
              "absolute z-50 min-w-max",
              "bg-white dark:bg-neutral-900",
              "border border-neutral-200 dark:border-neutral-700",
              "rounded-lg shadow-lg",
              "py-1 overflow-hidden",
              "animate-in fade-in zoom-in-95 duration-200",
              placementClasses[placement],
            )}
            role="menu"
            aria-label="Dropdown menu"
          >
            {items.map((item, idx) => {
              if (item.divider) {
                return (
                  <div
                    key={`divider-${idx}`}
                    className="h-px bg-neutral-200 dark:bg-neutral-700 my-1"
                  />
                );
              }

              const isVariantDanger = item.variant === "danger";

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={classNames(
                    "w-full px-4 py-2 text-sm text-left transition-colors",
                    "flex items-center gap-2",
                    item.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer",
                    isVariantDanger
                      ? "text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  )}
                  role="menuitem"
                >
                  {item.icon && (
                    <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  },
);

Dropdown.displayName = "Dropdown";
