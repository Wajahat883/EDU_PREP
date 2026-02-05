/**
 * MainLayout Component
 * Location: frontend/components/layouts/MainLayout.tsx
 *
 * Main application layout with header, sidebar, and content area
 */

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import classNames from "classnames";

interface NavLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

interface MainLayoutProps {
  children: React.ReactNode;
  navLinks?: NavLink[];
  userMenu?: React.ReactNode;
  showSidebar?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  navLinks,
  userMenu,
  showSidebar = true,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Sidebar */}
      {showSidebar && (
        <aside
          className={classNames(
            "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700",
            "transition-transform duration-300 lg:relative lg:translate-x-0 lg:w-64",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Logo */}
            <div className="px-6 py-6 border-b border-neutral-200 dark:border-neutral-700">
              <Link href="/" className="font-bold text-xl text-primary-600">
                EduPrep
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navLinks &&
                navLinks.map((link) => {
                  const isActive = router.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={classNames(
                        "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                        isActive
                          ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700",
                      )}
                    >
                      {link.icon && (
                        <span className="w-5 h-5">{link.icon}</span>
                      )}
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
            </nav>

            {/* User Menu */}
            {userMenu && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
                {userMenu}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 h-16 px-6 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6"
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

          <div className="flex-1" />

          {/* Header Actions */}
          <div className="flex items-center gap-4">
            {/* Search (placeholder) */}
            <input
              type="search"
              placeholder="Search..."
              className="hidden sm:block px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 border-0 focus:ring-2 focus:ring-primary-500"
            />

            {/* Notifications */}
            <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg relative">
              <svg
                className="w-6 h-6"
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
              <span className="absolute top-1 right-1 w-2 h-2 bg-error-600 rounded-full" />
            </button>

            {/* User Avatar */}
            <button className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold hover:bg-primary-700 transition-colors">
              U
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="container-responsive py-8">{children}</div>
        </main>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

MainLayout.displayName = "MainLayout";
