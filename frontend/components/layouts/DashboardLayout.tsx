import React from "react";
import classNames from "classnames";

interface DashboardLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarCollapsible?: boolean;
  showBreadcrumb?: boolean;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  stats?: Array<{ label: string; value: string | number; change?: string }>;
}

export const DashboardLayout = React.forwardRef<
  HTMLDivElement,
  DashboardLayoutProps
>(
  (
    {
      children,
      header,
      sidebar,
      sidebarCollapsible = true,
      showBreadcrumb = true,
      breadcrumbs,
      stats,
    },
    ref,
  ) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    return (
      <div
        ref={ref}
        className="flex h-screen bg-neutral-50 dark:bg-neutral-950"
      >
        {/* Sidebar */}
        {sidebar && (
          <>
            {/* Mobile Overlay */}
            {!sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <aside
              className={classNames(
                "fixed inset-y-0 left-0 z-40 bg-white dark:bg-neutral-900",
                "border-r border-neutral-200 dark:border-neutral-800",
                "transform transition-transform duration-300",
                "lg:relative lg:translate-x-0 lg:w-64",
                !sidebarOpen ? "-translate-x-full" : "translate-x-0",
                sidebarCollapsible && "w-64",
              )}
            >
              <div className="flex flex-col h-full">{sidebar}</div>
            </aside>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
              {/* Hamburger Menu */}
              {sidebar && sidebarCollapsible && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-neutral-600 dark:text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              )}

              {/* Header Content */}
              <div className="flex-1">{header}</div>

              {/* User Menu / Actions */}
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <svg
                    className="w-5 h-5 text-neutral-600 dark:text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </button>

                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                  JD
                </div>
              </div>
            </div>

            {/* Breadcrumb */}
            {showBreadcrumb && breadcrumbs && (
              <div className="px-4 sm:px-6 lg:px-8 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2 text-sm">
                {breadcrumbs.map((breadcrumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && (
                      <svg
                        className="w-4 h-4 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                    <a
                      href={breadcrumb.href || "#"}
                      className={classNames(
                        idx === breadcrumbs.length - 1
                          ? "text-neutral-900 dark:text-white font-medium"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white",
                      )}
                    >
                      {breadcrumb.label}
                    </a>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Stats Bar */}
            {stats && stats.length > 0 && (
              <div className="px-4 sm:px-6 lg:px-8 py-4 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-neutral-800 rounded-lg p-3"
                  >
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                      {stat.label}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {stat.value}
                      </p>
                      {stat.change && (
                        <span
                          className={classNames(
                            "text-xs font-medium",
                            stat.change.startsWith("+")
                              ? "text-success-600 dark:text-success-400"
                              : "text-error-600 dark:text-error-400",
                          )}
                        >
                          {stat.change}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-8">{children}</div>
          </main>
        </div>
      </div>
    );
  },
);

DashboardLayout.displayName = "DashboardLayout";
