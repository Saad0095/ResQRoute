import React from "react";

export default function RoadControls({ roads, onToggleRoad }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Road Access & Detours</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Click a road to simulate traffic closure or reopen it</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {roads?.map((r, idx) => (
          <button
            key={idx}
            onClick={() => onToggleRoad(r.u, r.v)}
            className={`p-3 rounded-lg text-left border text-xs transition flex flex-col justify-between ${
              r.isClosed
                ? "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-900 text-red-700 dark:text-red-300"
                : "bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700"
            }`}
          >
            <div className="font-semibold truncate">{r.u} ⇄ {r.v}</div>
            <div className="flex justify-between items-center mt-2 text-[11px]">
              <span className="text-slate-500">{r.weight} km</span>
              <span className={`font-semibold ${r.isClosed ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {r.isClosed ? "Closed" : "Open"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
