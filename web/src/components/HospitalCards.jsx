import React from "react";

export default function HospitalCards({ hospitals }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Hospital Bed Capacity</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Available beds for incoming patients</p>
        </div>
      </div>

      <div className="space-y-3">
        {hospitals?.map((h) => {
          const pct = Math.round((h.availableBeds / h.totalBeds) * 100);
          return (
            <div
              key={h.id}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-xs"
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {h.name} <span className="text-slate-500 font-normal">({h.location})</span>
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {h.availableBeds} of {h.totalBeds} Free
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
