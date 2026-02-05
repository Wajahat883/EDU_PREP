import React from "react";
import classNames from "classnames";

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  onChange?: (openIds: string[]) => void;
  className?: string;
}

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    { items, allowMultiple = false, defaultOpen = [], onChange, className },
    ref,
  ) => {
    const [openIds, setOpenIds] = React.useState<string[]>(defaultOpen);

    const toggleItem = (id: string) => {
      if (items.find((item) => item.id === id)?.disabled) return;

      let newOpenIds: string[];
      if (allowMultiple) {
        newOpenIds = openIds.includes(id)
          ? openIds.filter((item) => item !== id)
          : [...openIds, id];
      } else {
        newOpenIds = openIds.includes(id) ? [] : [id];
      }

      setOpenIds(newOpenIds);
      onChange?.(newOpenIds);
    };

    return (
      <div ref={ref} className={classNames("space-y-2", className)}>
        {items.map((item) => {
          const isOpen = openIds.includes(item.id);

          return (
            <div
              key={item.id}
              className={classNames(
                "border rounded-lg overflow-hidden",
                "border-neutral-200 dark:border-neutral-700",
                "transition-all duration-200",
                isOpen
                  ? "bg-neutral-50 dark:bg-neutral-900 shadow-sm"
                  : "bg-white dark:bg-neutral-800",
              )}
            >
              {/* Header */}
              <button
                onClick={() => toggleItem(item.id)}
                disabled={item.disabled}
                className={classNames(
                  "w-full px-4 py-3 flex items-center justify-between",
                  "text-left font-medium transition-colors",
                  item.disabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer",
                  "text-neutral-900 dark:text-white",
                )}
                aria-expanded={isOpen}
                aria-controls={`accordion-content-${item.id}`}
              >
                <span className="flex items-center gap-3">
                  {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                  {item.title}
                </span>
                <svg
                  className={classNames(
                    "w-5 h-5 transition-transform duration-300",
                    "text-neutral-600 dark:text-neutral-400",
                    isOpen ? "rotate-180" : "",
                  )}
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
              </button>

              {/* Content */}
              {isOpen && (
                <div
                  id={`accordion-content-${item.id}`}
                  className={classNames(
                    "px-4 py-3 border-t",
                    "border-neutral-200 dark:border-neutral-700",
                    "text-neutral-700 dark:text-neutral-300",
                    "bg-white dark:bg-neutral-800",
                    "animate-in fade-in duration-200",
                  )}
                >
                  {item.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  },
);

Accordion.displayName = "Accordion";
