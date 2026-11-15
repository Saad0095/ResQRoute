import React, { useEffect, useRef, useState } from "react";
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
  "Gulistan-e-Jauhar":{ x: 440, y: 70 },
  "Gulistan-e-Johar": { x: 440, y: 70 },
};

export default function CityMap({ state, activeRoute, activeDispatch, onClearRoute }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [copied, setCopied] = useState(false);
  const animFrameIdRef = useRef(null);
  const progressRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const coordsMap = { ...defaultNodeCoords, ...(state?.coords || {}) };

    const getCoord = (zone) => {
      if (!zone) return { x: 430, y: 230 };
      if (coordsMap[zone]) return coordsMap[zone];
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

    // Helper: Draw directional chevron arrows along a segment
    const drawDirectionalArrow = (p1, p2, color) => {
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const arrowLength = 9;

      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-arrowLength, -5);
      ctx.lineTo(0, 0);
      ctx.lineTo(-arrowLength, 5);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
    };

    // Prepare full route polyline for live tracking
    let fullTrackingPath = [];
    let pickupPath = [];
    let hospitalPath = [];

    if (activeDispatch) {
      pickupPath = activeDispatch.ambulanceRoute || [];
      hospitalPath = activeDispatch.hospitalRoute || [];
      fullTrackingPath = [
        ...pickupPath,
        ...(hospitalPath.length > 1 ? hospitalPath.slice(1) : []),
      ];
    } else if (activeRoute && activeRoute.length > 1) {
      fullTrackingPath = activeRoute;
      pickupPath = activeRoute;
    }

    const render = (now) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Advance animated vehicle progress (completes full journey every ~9 seconds, then loops)
      if (fullTrackingPath.length > 1) {
        progressRef.current = (progressRef.current + dt * 0.12) % 1;
      } else {
        progressRef.current = 0;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!state || !state.roads) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      // 1. Draw Base Road Network
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

        // Distance Tag
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.fillStyle = r.isClosed ? "#dc2626" : (isDark ? "#94a3b8" : "#64748b");
        ctx.font = "11px Roboto, sans-serif";
        ctx.fillText(`${r.weight} km`, midX + 4, midY - 4);
      });
      ctx.setLineDash([]);

      // 2. Draw Shortest Paths
      // (a) Leg 1: Ambulance to Patient (Sky Blue)
      if (pickupPath.length > 1) {
        ctx.beginPath();
        for (let i = 0; i < pickupPath.length; i++) {
          const pt = getCoord(pickupPath[i]);
          if (!pt) continue;
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = "#0284c7"; // Sky Blue
        ctx.lineWidth = 4.5;
        ctx.lineJoin = "round";
        ctx.stroke();

        // Draw directional arrows along pickup segments
        for (let i = 0; i < pickupPath.length - 1; i++) {
          const p1 = getCoord(pickupPath[i]);
          const p2 = getCoord(pickupPath[i + 1]);
          if (p1 && p2) drawDirectionalArrow(p1, p2, "#38bdf8");
        }
      }

      // (b) Leg 2: Patient to Destination Hospital (Emerald Green)
      if (hospitalPath.length > 1) {
        ctx.beginPath();
        for (let i = 0; i < hospitalPath.length; i++) {
          const pt = getCoord(hospitalPath[i]);
          if (!pt) continue;
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = "#16a34a"; // Emerald Green
        ctx.lineWidth = 4.5;
        ctx.lineJoin = "round";
        ctx.stroke();

        // Draw directional arrows along hospital segments
        for (let i = 0; i < hospitalPath.length - 1; i++) {
          const p1 = getCoord(hospitalPath[i]);
          const p2 = getCoord(hospitalPath[i + 1]);
          if (p1 && p2) drawDirectionalArrow(p1, p2, "#4ade80");
        }
      }

      // 3. Draw City Sector Nodes
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

        // Node Circle
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

        // Center Indicator Dot
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = hasAmbulance
          ? "#16a34a"
          : hasHospital
          ? "#2563eb"
          : (isDark ? "#64748b" : "#94a3b8");
        ctx.fill();

        // Node Label
        ctx.fillStyle = isDark ? "#f1f5f9" : "#0f172a";
        ctx.font = "bold 12px Roboto, sans-serif";
        ctx.fillText(zone, x + 20, y + 4);

        // Subtext tags
        let subY = y + 18;
        if (hasAmbulance) {
          ctx.fillStyle = "#16a34a";
          ctx.font = "10px Roboto, sans-serif";
          ctx.fillText("🚑 Unit Stationed", x + 20, subY);
          subY += 12;
        }
        if (hasHospital) {
          ctx.fillStyle = "#2563eb";
          ctx.font = "10px Roboto, sans-serif";
          ctx.fillText("🏥 Hospital", x + 20, subY);
        }
      });

      // 4. Special Call Markers (Patient Incident & Assigned Hospital)
      if (activeDispatch) {
        const pulse = (Math.sin(now / 200) + 1) / 2;

        // (a) Patient Call Location Marker
        if (activeDispatch.patientLocation) {
          const pt = getCoord(activeDispatch.patientLocation);
          if (pt) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 20 + pulse * 8, 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 - pulse * 0.4})`;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 16, 0, 2 * Math.PI);
            ctx.fillStyle = "#ef4444";
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 11px Roboto, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("📍", pt.x, pt.y + 4);
            ctx.textAlign = "left";

            // Badge
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(pt.x - 42, pt.y - 28, 84, 16);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 9px Roboto, sans-serif";
            ctx.fillText("PATIENT CALL", pt.x - 36, pt.y - 16);
          }
        }

        // (b) Destination Hospital Marker
        if (activeDispatch.assignedHospital?.location) {
          const hp = getCoord(activeDispatch.assignedHospital.location);
          if (hp) {
            ctx.beginPath();
            ctx.arc(hp.x, hp.y, 20 + pulse * 8, 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(22, 163, 74, ${0.7 - pulse * 0.4})`;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(hp.x, hp.y, 16, 0, 2 * Math.PI);
            ctx.fillStyle = "#16a34a";
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 11px Roboto, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("🏥", hp.x, hp.y + 4);
            ctx.textAlign = "left";

            // Badge
            ctx.fillStyle = "#16a34a";
            ctx.fillRect(hp.x - 48, hp.y - 28, 96, 16);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 9px Roboto, sans-serif";
            ctx.fillText("EMERGENCY BED", hp.x - 44, hp.y - 16);
          }
        }
      }

      // 5. ANIMATED LIVE VEHICLE TRACKING (Ambulance Moving along Shortest Path)
      if (fullTrackingPath.length > 1) {
        const totalSegments = fullTrackingPath.length - 1;
        const currentPos = progressRef.current * totalSegments;
        const currentSegIndex = Math.min(Math.floor(currentPos), totalSegments - 1);
        const segProgress = currentPos - currentSegIndex;

        const pA = getCoord(fullTrackingPath[currentSegIndex]);
        const pB = getCoord(fullTrackingPath[currentSegIndex + 1]);

        if (pA && pB) {
          const vehX = pA.x + (pB.x - pA.x) * segProgress;
          const vehY = pA.y + (pB.y - pA.y) * segProgress;

          // Determine current phase
          const isPickupLeg = currentSegIndex < (pickupPath.length > 0 ? pickupPath.length - 1 : 0);
          const phaseColor = isPickupLeg ? "#0284c7" : "#16a34a";
          const phaseText = isPickupLeg
            ? "Leg 1: En Route to Patient"
            : "Leg 2: Transporting to Hospital";

          // Pulsing Glow around vehicle
          const vehPulse = (Math.sin(now / 150) + 1) / 2;
          ctx.beginPath();
          ctx.arc(vehX, vehY, 18 + vehPulse * 6, 0, 2 * Math.PI);
          ctx.fillStyle = isPickupLeg
            ? `rgba(2, 132, 199, ${0.4 - vehPulse * 0.2})`
            : `rgba(22, 163, 74, ${0.4 - vehPulse * 0.2})`;
          ctx.fill();

          // Vehicle Body Marker
          ctx.beginPath();
          ctx.arc(vehX, vehY, 13, 0, 2 * Math.PI);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = phaseColor;
          ctx.stroke();

          // Vehicle Emoji Icon
          ctx.font = "14px Roboto, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🚑", vehX, vehY + 5);
          ctx.textAlign = "left";

          // Floating Callout Bubble
          const ambId = activeDispatch?.assignedAmbulance?.id || "Active";
          const label = `Unit #${ambId} • ${phaseText}`;
          ctx.font = "bold 10px Roboto, sans-serif";
          const textWidth = ctx.measureText(label).width;

          ctx.fillStyle = isDark ? "#0f172a" : "#ffffff";
          ctx.strokeStyle = phaseColor;
          ctx.lineWidth = 1.5;
          const bubbleX = vehX - textWidth / 2 - 8;
          const bubbleY = vehY - 32;

          ctx.beginPath();
          ctx.roundRect(bubbleX, bubbleY, textWidth + 16, 20, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
          ctx.fillText(label, bubbleX + 8, bubbleY + 14);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    lastTimeRef.current = performance.now();
    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [state, activeRoute, activeDispatch, theme]);

  const handleCopyFullTrip = () => {
    if (!activeDispatch) return;
    const amb = activeDispatch.assignedAmbulance;
    const hosp = activeDispatch.assignedHospital;
    const text = [
      `🚨 EMERGENCY DISPATCH TRIP SUMMARY`,
      `Incident ID: ${activeDispatch.emergencyId} (Urgency: ${activeDispatch.severityLabel})`,
      `Assigned Ambulance: Unit #${amb?.id} (Driver: ${amb?.driverName}, Phone: ${amb?.phone})`,
      ``,
      `📍 STEP 1 (Pickup Route - Ambulance to Patient):`,
      `Route: ${activeDispatch.ambulanceRoute?.join(" ➔ ")}`,
      `Distance: ${activeDispatch.ambulanceDistanceKm} km | Pickup ETA: ~${activeDispatch.ambulanceEtaMinutes} mins`,
      ``,
      `🏥 STEP 2 (Hospital Delivery Route - Patient to Hospital):`,
      `Destination: ${hosp?.name} (${hosp?.location}) - Bed Reserved (${hosp?.availableBeds} remaining)`,
      `Route: ${activeDispatch.hospitalRoute?.join(" ➔ ")}`,
      `Distance: ${activeDispatch.hospitalDistanceKm} km | Hospital ETA: ~${activeDispatch.hospitalEtaMinutes} mins`,
      ``,
      `🛣️ FULL SHORTEST PATH TRIP:`,
      `Total Distance: ${activeDispatch.totalTripDistanceKm} km | Total Estimated Journey Time: ~${activeDispatch.totalEtaMinutes} mins`,
    ].join("\n");

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header and Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">City Sectors & Live Emergency Map</h2>
            {activeDispatch && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 animate-pulse">
                ● LIVE TRACKING ACTIVE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time ambulance fleet positioning, shortest-path calculation, and emergency transit tracking
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Ambulance Station
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Hospital
          </span>
          <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-medium">
            <span className="w-3 h-1 rounded-full bg-sky-600"></span> Leg 1 (Pickup)
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-3 h-1 rounded-full bg-emerald-600"></span> Leg 2 (Hospital)
          </span>
        </div>
      </div>

      {/* ACTIVE DISPATCH LIVE TELEMETRY CARD */}
      {activeDispatch && (
        <div className="bg-slate-50 dark:bg-slate-950/70 border border-sky-300 dark:border-sky-800/80 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🚑</span>
              <div>
                <span className="text-xs font-bold text-sky-700 dark:text-sky-400">
                  Unit #{activeDispatch.assignedAmbulance?.id} En Route
                </span>
                <span className="text-[11px] text-slate-500 ml-2">
                  Emergency Call #{activeDispatch.emergencyId} • Urgency: <strong>{activeDispatch.severityLabel}</strong>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyFullTrip}
                className="text-xs px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition font-medium"
              >
                {copied ? "✓ Copied!" : "📋 Copy Full Journey"}
              </button>
              {onClearRoute && (
                <button
                  type="button"
                  onClick={onClearRoute}
                  className="text-xs px-2 py-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {/* 2-Leg Journey Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Leg 1 */}
            <div className="p-2.5 rounded-lg border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20">
              <div className="font-semibold text-sky-700 dark:text-sky-300 flex items-center justify-between">
                <span>📍 Step 1: Ambulance ➔ Patient</span>
                <span className="text-[11px] font-bold">~{activeDispatch.ambulanceEtaMinutes} mins</span>
              </div>
              <div className="mt-1 text-slate-700 dark:text-slate-300 font-mono text-[11px] select-all">
                {activeDispatch.ambulanceRoute?.join(" ➔ ") || "Direct"}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Pickup Distance: <strong>{activeDispatch.ambulanceDistanceKm} km</strong>
              </div>
            </div>

            {/* Leg 2 */}
            <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                <span>🏥 Step 2: Patient ➔ Hospital</span>
                <span className="text-[11px] font-bold">~{activeDispatch.hospitalEtaMinutes} mins</span>
              </div>
              <div className="mt-1 text-slate-700 dark:text-slate-300 font-mono text-[11px] select-all">
                {activeDispatch.hospitalRoute?.join(" ➔ ") || "Direct"}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Target: <strong>{activeDispatch.assignedHospital?.name || "Nearest Care Facility"}</strong> ({activeDispatch.hospitalDistanceKm} km)
              </div>
            </div>

            {/* Total Shortest Path Trip */}
            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                🛣️ Total Trip (Shortest Path)
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeDispatch.totalTripDistanceKm} km
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Total ETA: ~{activeDispatch.totalEtaMinutes} mins
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Calculated via real-time shortest-path road graph
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANVAS CONTAINER */}
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
      </div>
    </div>
  );
}
