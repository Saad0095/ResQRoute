import React, { useState } from "react";
import { login } from "../services/api";
import { useTheme } from "../context/ThemeContext";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await login(email, password);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Top right theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </button>

      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
        {/* Title */}
        <div className="mb-6">
          <div className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 mb-2">
            ResQRoute
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Emergency Dispatch Login
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sign in to access your control dashboard
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dispatcher@resqroute.org"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-red-600 transition"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-red-600 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 text-center">
            Demo Accounts (Click to autofill):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("dispatcher@resqroute.org", "admin123")}
              className="p-2 text-left rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-slate-400 dark:hover:border-slate-700 transition"
            >
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Dispatcher</div>
              <div className="text-[11px] text-slate-500">Live Map & Dispatch</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("admin@resqroute.org", "admin123")}
              className="p-2 text-left rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-slate-400 dark:hover:border-slate-700 transition"
            >
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Admin</div>
              <div className="text-[11px] text-slate-500">Full System Control</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
