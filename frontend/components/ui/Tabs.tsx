import React from "react";
import classNames from "classnames";

interface TabsProps {
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
  }>;
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: "default" | "pills" | "underline";
  className?: string;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ tabs, defaultTab, onChange, variant = "default", className }, ref) => {
    const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);

    const handleTabChange = (tabId: string) => {
      setActiveTab(tabId);
      onChange?.(tabId);
    };

    const tabsVariants = {
      default: "border-b border-neutral-200 dark:border-neutral-700 flex gap-1",
      pills: "flex gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg",
      underline:
        "flex gap-6 border-b border-neutral-200 dark:border-neutral-700",
    };

    const buttonVariants = {
      default: (isActive: boolean) =>
        classNames(
          "px-4 py-2 font-medium text-sm transition-colors border-b-2",
          isActive
            ? "text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400"
            : "text-neutral-600 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-neutral-300",
        ),
      pills: (isActive: boolean) =>
        classNames(
          "px-4 py-2 font-medium text-sm rounded-md transition-colors",
          isActive
            ? "bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm"
            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-300",
        ),
      underline: (isActive: boolean) =>
        classNames(
          "px-0 py-3 font-medium text-sm transition-colors border-b-2",
          isActive
            ? "text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400"
            : "text-neutral-600 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-neutral-300",
        ),
    };

    return (
      <div ref={ref} className={className}>
        {/* Tab Headers */}
        <div className={tabsVariants[variant]} role="tablist" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={buttonVariants[variant](activeTab === tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
            >
              <span className="flex items-center gap-2">
                {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`tabpanel-${tab.id}`}
            className={classNames(
              "pt-4 animate-in fade-in duration-200",
              activeTab !== tab.id && "hidden",
            )}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    );
  },
);

Tabs.displayName = "Tabs";
