import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuthStore } from "../lib/store";

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-blue-600">EduPrep</span>
        </Link>

        <nav className="hidden md:flex space-x-6">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-blue-600"
              >
                Dashboard
              </Link>
              <Link href="/qbank" className="text-gray-600 hover:text-blue-600">
                Question Bank
              </Link>
              <Link
                href="/analytics"
                className="text-gray-600 hover:text-blue-600"
              >
                Analytics
              </Link>
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-blue-600"
              >
                Pricing
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Admin
                </Link>
              )}
            </>
          ) : (
            <Link href="/pricing" className="text-gray-600 hover:text-blue-600">
              Pricing
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm text-gray-600">{user.email}</span>
              <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-blue-600">
                Login
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
