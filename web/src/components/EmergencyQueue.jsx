import React from "react";

export default function EmergencyQueue({ pendingCalls }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Emergency Call Queue</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Calls waiting for response</p>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {pendingCalls?.length || 0} waiting
        </span>
      </div>

      <div className="space-y-2">
        {!pendingCalls || pendingCalls.length === 0 ? (
          <div className="text-xs text-slate-400 dark:text-slate-500 py-8 text-center bg-slate-50 dark:bg-slate-950/50 rounded-lg">
            No calls currently waiting.
          </div>
        ) : (
          pendingCalls.map((e, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[11px]">
                  {idx + 1}
                </span>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{e.patientName}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{e.location}</div>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  e.severity === 4
                    ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {e.severityLabel}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
