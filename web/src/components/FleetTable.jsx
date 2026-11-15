import React from "react";

export default function FleetTable({ ambulances, onFreeAmbulance }) {
  const readyCount = ambulances?.filter((a) => a.isAvailable).length || 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Ambulances</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fleet availability and status</p>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
          {readyCount} Ready
        </span>
      </div>

      <div className="space-y-2.5">
        {ambulances?.map((a) => (
          <div
            key={a.id}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full ${
                  a.isAvailable ? "bg-emerald-500" : "bg-red-500 animate-pulse"
                }`}
              ></span>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  Ambulance #{a.id}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Driver: {a.driverName} • {a.location}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  a.isAvailable
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400"
                }`}
              >
                {a.isAvailable ? "Ready" : a.status || "Busy"}
              </span>

              {!a.isAvailable && (
                <button
                  onClick={() => onFreeAmbulance(a.id)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition"
                >
                  Mark Free
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
