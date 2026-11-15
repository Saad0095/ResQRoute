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

      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl my-6">
        {/* Title */}
        <div className="mb-6">
          <div className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 mb-2">
            ResQRoute Emergency System
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Emergency Dispatch & Driver Login
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sign in to access control dashboard or vehicle mission HUD
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
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. dispatcher@resqroute.org"
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
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50 shadow-sm"
          >
            {loading ? "Signing in..." : "Sign In to System"}
          </button>
        </form>

        {/* Quick Demo Logins Section */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Control Room & HQ Accounts
              </span>
              <span className="text-[10px] text-slate-400">Click to autofill</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("dispatcher@resqroute.org", "admin123")}
                className={`p-2.5 text-left rounded-xl border transition ${
                  email === "dispatcher@resqroute.org"
                    ? "border-red-500 bg-red-50/60 dark:bg-red-950/30"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-slate-400 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">🚨 Dispatcher</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">admin123</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Control Room Dispatcher</div>
                <div className="text-[10px] text-red-600 dark:text-red-400 font-medium mt-1">📍 Station: Central Control Room</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("admin@resqroute.org", "admin123")}
                className={`p-2.5 text-left rounded-xl border transition ${
                  email === "admin@resqroute.org"
                    ? "border-red-500 bg-red-50/60 dark:bg-red-950/30"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-slate-400 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">🛡️ System Admin</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">admin123</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Full System & Network Access</div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">📍 Station: Central HQ</div>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Ambulance Drivers (With Base Locations)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Password: driver123</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {[
                { unit: 101, name: "Ali Khan", email: "driver101@resqroute.org", location: "North Karachi", color: "text-emerald-600 dark:text-emerald-400" },
                { unit: 102, name: "Ahmed Raza", email: "driver102@resqroute.org", location: "Gulshan", color: "text-sky-600 dark:text-sky-400" },
                { unit: 103, name: "Usman Sheikh", email: "driver103@resqroute.org", location: "Nazimabad", color: "text-amber-600 dark:text-amber-400" },
                { unit: 104, name: "Tariq Jameel", email: "driver104@resqroute.org", location: "Saddar", color: "text-purple-600 dark:text-purple-400" },
                { unit: 105, name: "Hamza Qureshi", email: "driver105@resqroute.org", location: "Clifton", color: "text-blue-600 dark:text-blue-400" },
              ].map((d) => (
                <button
                  key={d.unit}
                  type="button"
                  onClick={() => handleQuickFill(d.email, "driver123")}
                  className={`p-2.5 text-left rounded-xl border transition flex flex-col justify-between ${
                    email === d.email
                      ? "border-red-500 bg-red-50/60 dark:bg-red-950/30"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-slate-400 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">🚑 Unit #{d.unit}</span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{d.name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold">
                    <span>📍 Base:</span>
                    <span className={d.color}>{d.location}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
