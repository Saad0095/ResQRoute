import React, { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const defaultNodeCoords = {
  "North Karachi":    { x: 180, y: 70 },
  "Nazimabad":        { x: 150, y: 190 },
  "Gulshan":          { x: 420, y: 140 },
  "Saddar":           { x: 270, y: 290 },
  "Airport":          { x: 670, y: 170 },
  "Malir":            { x: 770, y: 130 },
  "Shahrah-e-Faisal": { x: 480, y: 260 },
  "Clifton":          { x: 200, y: 400 },
  "Defense":          { x: 490, y: 390 },
};

export default function CityMap({ state, activeRoute, activeDispatch }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!state || !state.roads) return;

    // Merge coordinates with backend custom node coordinates if present
    const coordsMap = { ...defaultNodeCoords, ...(state.coords || {}) };

    const getCoord = (zone) => {
      if (coordsMap[zone]) return coordsMap[zone];
      // Deterministic fallback for dynamically created zones without explicit x,y
      let hash = 0;
      for (let i = 0; i < zone.length; i++) {
        hash = (hash << 5) - hash + zone.charCodeAt(i);
      }
      const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
      const radius = 130 + (Math.abs(hash) % 70);
      const x = Math.max(60, Math.min(800, 450 + Math.cos(angle) * radius));
      const y = Math.max(60, Math.min(410, 240 + Math.sin(angle) * radius));
      coordsMap[zone] = { x: Math.round(x), y: Math.round(y) };
      return coordsMap[zone];
    };

    // 1. Draw Roads
    state.roads.forEach((r) => {
      const p1 = getCoord(r.u);
      const p2 = getCoord(r.v);
      if (!p1 || !p2) return;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      if (r.isClosed) {
        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
      } else {
        ctx.strokeStyle = isDark ? "#334155" : "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
      }
      ctx.stroke();

      // Distance tag
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      ctx.fillStyle = r.isClosed ? "#dc2626" : (isDark ? "#94a3b8" : "#64748b");
      ctx.font = "11px Roboto, sans-serif";
      ctx.fillText(`${r.weight} km`, midX + 4, midY - 4);
    });
    ctx.setLineDash([]);

    // 2. Draw Active Route
    if (activeRoute && activeRoute.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < activeRoute.length; i++) {
        const pt = getCoord(activeRoute[i]);
        if (!pt) continue;
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // 3. Draw Nodes (All available zones in state or roads)
    const allZones = Array.from(
      new Set([
        ...(state.availableZones || []),
        ...state.roads.flatMap((r) => [r.u, r.v]),
        ...Object.keys(coordsMap),
      ])
    );

    allZones.forEach((zone) => {
      const { x, y } = getCoord(zone);
      const hasAmbulance = state.ambulances?.some(
        (a) => a.location === zone && a.isAvailable
      );
      const hasHospital = state.hospitals?.some((h) => h.location === zone);

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, 2 * Math.PI);
      ctx.fillStyle = isDark ? "#0f172a" : "#ffffff";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = hasAmbulance
        ? "#16a34a"
        : hasHospital
        ? "#2563eb"
        : (isDark ? "#475569" : "#94a3b8");
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = hasAmbulance
        ? "#16a34a"
        : hasHospital
        ? "#2563eb"
        : (isDark ? "#64748b" : "#94a3b8");
      ctx.fill();

      // Label
      ctx.fillStyle = isDark ? "#f1f5f9" : "#0f172a";
      ctx.font = "bold 12px Roboto, sans-serif";
      ctx.fillText(zone, x + 20, y + 4);

      // Badge subtext
      let subY = y + 18;
      if (hasAmbulance) {
        ctx.fillStyle = "#16a34a";
        ctx.font = "10px Roboto, sans-serif";
        ctx.fillText("Ambulance", x + 20, subY);
        subY += 12;
      }
      if (hasHospital) {
        ctx.fillStyle = "#2563eb";
        ctx.font = "10px Roboto, sans-serif";
        ctx.fillText("Hospital", x + 20, subY);
      }
    });
  }, [state, activeRoute, theme]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">City Sectors & Emergency Map</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time positions and route calculation</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Ambulance
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Hospital
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-3 h-1 rounded-full bg-sky-600"></span> Active Route
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 min-h-[460px]"
      >
        <canvas
          ref={canvasRef}
          width={860}
          height={460}
          className="max-w-full h-auto"
        />

        {activeDispatch && (
          <div className="absolute top-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 border border-sky-300 dark:border-sky-800 rounded-lg p-3 shadow-sm flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-sky-700 dark:text-sky-400">
                Unit #{activeDispatch.assignedAmbulance?.id} Dispatched
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Route: {activeDispatch.ambulanceRoute?.join(" → ")} ({activeDispatch.ambulanceDistanceKm} km)
              </div>
            </div>
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded">
              ETA: {activeDispatch.ambulanceEtaMinutes} mins
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
