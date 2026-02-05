import React from "react";
import classNames from "classnames";

interface AdminNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  badge?: string | number;
  submenu?: AdminNavItem[];
}

interface AdminLayoutProps {
  children: React.ReactNode;
  navItems?: AdminNavItem[];
  userEmail?: string;
  onLogout?: () => void;
  theme?: "light" | "dark" | "auto";
}

export const AdminLayout = React.forwardRef<HTMLDivElement, AdminLayoutProps>(
  (
    {
      children,
      navItems = [],
      userEmail = "admin@eduprep.com",
      onLogout,
      theme = "auto",
    },
    ref,
  ) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(true);
    const [expandedMenus, setExpandedMenus] = React.useState<string[]>([]);
    const [userMenuOpen, setUserMenuOpen] = React.useState(false);

    const toggleMenu = (id: string) => {
      setExpandedMenus((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      );
    };

    const adminDefaultItems: AdminNavItem[] = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-4m0 0l4 4m-4-4v4"
            />
          </svg>
        ),
        href: "/admin",
      },
      {
        id: "users",
        label: "Users",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a6 6 0 0112 0v2H6v-2z"
            />
          </svg>
        ),
        submenu: [
          { id: "users-list", label: "All Users", href: "/admin/users" },
          {
            id: "users-roles",
            label: "Roles & Permissions",
            href: "/admin/roles",
          },
          {
            id: "users-suspended",
            label: "Suspended Users",
            href: "/admin/suspended",
            badge: 3,
          },
        ],
      },
      {
        id: "content",
        label: "Content",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C6.228 6.228 2 11.285 2 17.5c0 5.891 3.582 10.753 8.4 12.592m0-13c5.772 0 10.4 4.908 10.4 10.975 0 .642-.047 1.277-.14 1.897M12 6.253v13"
            />
          </svg>
        ),
        submenu: [
          { id: "questions", label: "Question Bank", href: "/admin/questions" },
          { id: "flashcards", label: "Flashcards", href: "/admin/flashcards" },
          { id: "exams", label: "Exams", href: "/admin/exams" },
        ],
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        ),
        href: "/admin/analytics",
      },
      {
        id: "settings",
        label: "Settings",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        ),
        submenu: [
          {
            id: "system-settings",
            label: "System",
            href: "/admin/settings/system",
          },
          {
            id: "email-settings",
            label: "Email",
            href: "/admin/settings/email",
          },
          {
            id: "integrations",
            label: "Integrations",
            href: "/admin/settings/integrations",
          },
        ],
      },
    ];

    const displayItems = navItems.length > 0 ? navItems : adminDefaultItems;

    return (
      <div
        ref={ref}
        className="flex h-screen bg-neutral-50 dark:bg-neutral-950"
      >
        {/* Sidebar */}
        <aside
          className={classNames(
            "bg-neutral-900 dark:bg-neutral-950 text-white",
            "border-r border-neutral-800",
            "fixed inset-y-0 left-0 z-40 lg:relative",
            "transform transition-transform duration-300 ease-in-out",
            "lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            sidebarOpen ? "w-64" : "w-0",
          )}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-800">
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
              {displayItems.map((item) => (
                <div key={item.id}>
                  {/* Main Item */}
                  <button
                    onClick={() => item.submenu && toggleMenu(item.id)}
                    className={classNames(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg",
                      "text-neutral-300 hover:text-white hover:bg-neutral-800",
                      "transition-colors duration-200",
                      "font-medium text-sm",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon && (
                        <span className="flex-shrink-0">{item.icon}</span>
                      )}
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto bg-error-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.submenu && (
                      <svg
                        className={classNames(
                          "w-4 h-4 transition-transform duration-200",
                          expandedMenus.includes(item.id) ? "rotate-180" : "",
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
                    )}
                  </button>

                  {/* Submenu */}
                  {item.submenu && expandedMenus.includes(item.id) && (
                    <div className="ml-6 mt-1 space-y-1 border-l border-neutral-700 pl-3">
                      {item.submenu.map((subitem) => (
                        <a
                          key={subitem.id}
                          href={subitem.href || "#"}
                          className={classNames(
                            "block px-4 py-2 rounded-lg text-sm",
                            "text-neutral-400 hover:text-white hover:bg-neutral-800",
                            "transition-colors duration-200",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span>{subitem.label}</span>
                            {subitem.badge && (
                              <span className="bg-warning-500 text-white text-xs rounded-full px-2 py-0.5">
                                {subitem.badge}
                              </span>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* User Section */}
            <div className="border-t border-neutral-800 p-4">
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">Admin User</p>
                    <p className="text-xs text-neutral-400">{userEmail}</p>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-neutral-800 rounded-lg shadow-lg border border-neutral-700 overflow-hidden">
                    <a
                      href="/admin/profile"
                      className="block px-4 py-2 hover:bg-neutral-700 text-sm"
                    >
                      Profile
                    </a>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-700 text-sm text-error-400"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 h-16 flex items-center px-4 sm:px-6 lg:px-8">
            {/* Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
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

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search & Notifications */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent text-sm outline-none w-32 dark:text-white"
                />
              </div>

              <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 relative">
                <svg
                  className="w-5 h-5"
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
                <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full" />
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-8">{children}</div>
          </main>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    );
  },
);

AdminLayout.displayName = "AdminLayout";
