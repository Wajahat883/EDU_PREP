import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { useRouter } from "next/router";
import Link from "next/link";

export const LoginForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { setUser, setToken } = useAuthStore();
  const router = useRouter();
  const loginMutation = useAuth();
  const [error, setError] = useState("");

  const onSubmit = async (data: any) => {
    try {
      const response = await loginMutation.mutateAsync(data);
      setUser(response.data.data);
      setToken(response.data.data.accessToken);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Login</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              {...register("email", { required: "Email is required" })}
              type="email"
              className="input-field"
              placeholder="your@email.com"
            />
            {errors.email && (
              <span className="text-red-500 text-sm">
                {typeof errors.email.message === "string"
                  ? errors.email.message
                  : "Email is required"}
              </span>
            )}
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              {...register("password", { required: "Password is required" })}
              type="password"
              className="input-field"
              placeholder="••••••••"
            />
            {errors.password && (
              <span className="text-red-500 text-sm">
                {typeof errors.password.message === "string"
                  ? errors.password.message
                  : "Password is required"}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isLoading}
            className="btn-primary w-full"
          >
            {loginMutation.isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
