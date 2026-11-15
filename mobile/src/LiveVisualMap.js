import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";

// Fixed reference coordinates scaled for mobile screens (340 x 245 canvas)
const defaultNodeCoords = {
  "North Karachi":    { x: 75,  y: 35 },
  "Nazimabad":        { x: 55,  y: 95 },
  "Gulshan":          { x: 165, y: 70 },
  "Saddar":           { x: 105, y: 155 },
  "Airport":          { x: 250, y: 80 },
  "Malir":            { x: 285, y: 38 },
  "Shahrah-e-Faisal": { x: 195, y: 140 },
  "Clifton":          { x: 80,  y: 215 },
  "Defense":          { x: 190, y: 210 },
};

// Full city road network matching backend graph
const fullCityRoads = [
  { u: "North Karachi", v: "Nazimabad", weight: 6.5 },
  { u: "Nazimabad", v: "Gulshan", weight: 5.0 },
  { u: "North Karachi", v: "Gulshan", weight: 9.0 },
  { u: "Nazimabad", v: "Saddar", weight: 7.0 },
  { u: "Gulshan", v: "Saddar", weight: 8.0 },
  { u: "Gulshan", v: "Airport", weight: 10.0 },
  { u: "Saddar", v: "Clifton", weight: 4.0 },
  { u: "Clifton", v: "Defense", weight: 5.0 },
  { u: "Saddar", v: "Defense", weight: 6.5 },
  { u: "Airport", v: "Defense", weight: 14.0 },
  { u: "Gulshan", v: "Defense", weight: 12.0 },
  { u: "Malir", v: "Airport", weight: 5.0 },
  { u: "Malir", v: "Shahrah-e-Faisal", weight: 8.0 },
  { u: "Airport", v: "Shahrah-e-Faisal", weight: 6.0 },
  { u: "Shahrah-e-Faisal", v: "Gulshan", weight: 5.5 },
  { u: "Shahrah-e-Faisal", v: "Saddar", weight: 7.0 },
  { u: "Shahrah-e-Faisal", v: "Defense", weight: 6.0 },
];

export default function LiveVisualMap({
  pickupRoute = [],
  hospitalRoute = [],
  patientLocation = "",
  hospitalName = "",
  hospitalLocation = "",
  activeStepIndex = 0,
  ambulanceId = 102,
  userRole = "citizen", // "citizen" or "driver"
  customCoords = {},
}) {
  const fullRoute = [
    ...(pickupRoute || []),
    ...(hospitalRoute && hospitalRoute.length > 1 ? hospitalRoute.slice(1) : []),
  ];

  const getCoord = (zone) => {
    if (!zone) return { x: 165, y: 120 };
    // Check if custom coordinates provided by backend / admin registry
    if (customCoords && customCoords[zone]) {
      const c = customCoords[zone];
      if (typeof c.x === "number" && typeof c.y === "number") {
        // Dynamic scaling: map web coordinate space [50..800, 50..420] into mobile canvas [30..310, 30..220]
        const scaledX = Math.round(30 + ((c.x - 50) / 750) * 280);
        const scaledY = Math.round(30 + ((c.y - 50) / 370) * 190);
        return {
          x: Math.max(25, Math.min(315, scaledX)),
          y: Math.max(25, Math.min(225, scaledY)),
        };
      }
    }
    if (defaultNodeCoords[zone]) return defaultNodeCoords[zone];
    let hash = 0;
    for (let i = 0; i < zone.length; i++) {
      hash = (hash << 5) - hash + zone.charCodeAt(i);
    }
    const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
    const radius = 65 + (Math.abs(hash) % 35);
    const x = Math.max(30, Math.min(310, 165 + Math.cos(angle) * radius));
    const y = Math.max(30, Math.min(220, 120 + Math.sin(angle) * radius));
    return { x: Math.round(x), y: Math.round(y) };
  };

  // Determine current vehicle target position based on activeStepIndex
  const currentSector = fullRoute[activeStepIndex] || fullRoute[0] || pickupRoute[0] || "Gulshan";
  const targetCoord = getCoord(currentSector);

  // Animated vehicle position for smooth gliding between nodes
  const animX = useRef(new Animated.Value(targetCoord.x)).current;
  const animY = useRef(new Animated.Value(targetCoord.y)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation loop for beacons
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Glide vehicle when activeStepIndex updates
  useEffect(() => {
    Animated.parallel([
      Animated.spring(animX, {
        toValue: targetCoord.x,
        friction: 6,
        tension: 45,
        useNativeDriver: false,
      }),
      Animated.spring(animY, {
        toValue: targetCoord.y,
        friction: 6,
        tension: 45,
        useNativeDriver: false,
      }),
    ]).start();
  }, [activeStepIndex, currentSector, targetCoord.x, targetCoord.y]);

  // Determine current phase and colors
  const isAtOrPastPatient = activeStepIndex >= Math.max(1, pickupRoute.length - 1);
  const isAtHospital = fullRoute.length > 0 && activeStepIndex >= fullRoute.length - 1;

  let currentPhaseTitle = "Leg 1: En Route to Patient";
  let currentPhaseColor = "#38BDF8"; // Sky Blue
  if (isAtHospital) {
    currentPhaseTitle = "Handover: Arrived at Hospital";
    currentPhaseColor = "#4ADE80"; // Emerald Green
  } else if (isAtOrPastPatient) {
    currentPhaseTitle = "Leg 2: Transporting to Hospital";
    currentPhaseColor = "#4ADE80";
  }

  // Helper to render any road segment line
  const renderLine = (p1, p2, color, thickness, zIndex, key) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    return (
      <View
        key={key}
        style={{
          position: "absolute",
          left: midX - length / 2,
          top: midY - thickness / 2,
          width: length,
          height: thickness,
          backgroundColor: color,
          transform: [{ rotate: `${angle}deg` }],
          zIndex,
          borderRadius: 2,
        }}
      />
    );
  };

  const distinctNodes = Array.from(
    new Set([
      ...Object.keys(defaultNodeCoords),
      ...Object.keys(customCoords || {}),
      ...(fullRoute || []),
    ])
  );

  return (
    <View style={styles.container}>
      {/* Telemetry Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerBadge}>● LIVE GPS ROUTE RADAR</Text>
          <Text style={styles.headerSubtitle}>
            {userRole === "driver" ? "Ambulance Driver HUD" : "Citizen Incident Radar"}
          </Text>
        </View>
        <View style={[styles.phasePill, { borderColor: currentPhaseColor }]}>
          <Text style={[styles.phasePillText, { color: currentPhaseColor }]}>
            {currentPhaseTitle}
          </Text>
        </View>
      </View>

      {/* Map Canvas Box */}
      <View style={styles.mapCanvas}>
        {/* 1. Base City Road Network (Slate Background) */}
        {fullCityRoads.map((road, index) => {
          const p1 = getCoord(road.u);
          const p2 = getCoord(road.v);
          return renderLine(p1, p2, "#243248", 2, 1, `base-road-${index}`);
        })}

        {/* 2. DIRECT SHORTEST PATH OVERLAYS */}
        {/* (a) Leg 1: Ambulance to Patient (Vibrant Sky Blue) */}
        {pickupRoute && pickupRoute.length > 1
          ? pickupRoute.slice(0, -1).map((node, i) => {
              const p1 = getCoord(node);
              const p2 = getCoord(pickupRoute[i + 1]);
              return renderLine(p1, p2, "#38BDF8", 4.5, 3, `pickup-leg-${i}`);
            })
          : null}

        {/* (b) Leg 2: Patient to Hospital (Vibrant Emerald Green) */}
        {hospitalRoute && hospitalRoute.length > 1
          ? hospitalRoute.slice(0, -1).map((node, i) => {
              const p1 = getCoord(node);
              const p2 = getCoord(hospitalRoute[i + 1]);
              return renderLine(p1, p2, "#4ADE80", 4.5, 4, `hosp-leg-${i}`);
            })
          : null}

        {/* 3. City Sector Nodes */}
        {distinctNodes.map((nodeName) => {
          const coord = getCoord(nodeName);
          const isPatientNode = nodeName === patientLocation;
          const isHospitalNode = nodeName === hospitalLocation;
          const isBaseNode = pickupRoute && pickupRoute[0] === nodeName && !isPatientNode && !isHospitalNode;

          let badgeBg = "#1E293B";
          let borderColor = "#475569";
          let icon = null;

          if (isPatientNode) {
            badgeBg = "#DC2626";
            borderColor = "#EF4444";
            icon = "📍";
          } else if (isHospitalNode) {
            badgeBg = "#16A34A";
            borderColor = "#22C55E";
            icon = "🏥";
          } else if (isBaseNode) {
            badgeBg = "#2563EB";
            borderColor = "#38BDF8";
            icon = "🚑";
          }

          return (
            <View
              key={`node-${nodeName}`}
              style={[
                styles.nodeWrapper,
                { left: coord.x - 14, top: coord.y - 14 },
                (isPatientNode || isHospitalNode || isBaseNode) && { zIndex: 7 },
              ]}
            >
              {/* Pulsing beacon ring for patient or hospital */}
              {(isPatientNode || isHospitalNode) ? (
                <Animated.View
                  style={[
                    styles.beaconPulse,
                    {
                      borderColor: isPatientNode ? "#EF4444" : "#22C55E",
                      transform: [
                        {
                          scale: pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.7],
                          }),
                        },
                      ],
                      opacity: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.75, 0.05],
                      }),
                    },
                  ]}
                />
              ) : null}

              {/* Node Circle */}
              <View
                style={[
                  styles.nodeCircle,
                  { backgroundColor: badgeBg, borderColor: borderColor },
                ]}
              >
                {icon ? (
                  <Text style={{ fontSize: 12 }}>{icon}</Text>
                ) : (
                  <View style={styles.nodeDot} />
                )}
              </View>

              {/* High-Visibility Callout Badges for Patient and Hospital */}
              {isPatientNode ? (
                <View style={styles.patientCallout}>
                  <Text style={styles.patientCalloutText}>📍 PATIENT ({nodeName})</Text>
                </View>
              ) : isHospitalNode ? (
                <View style={styles.hospitalCallout}>
                  <Text style={styles.hospitalCalloutText}>🏥 {hospitalName || nodeName}</Text>
                </View>
              ) : isBaseNode ? (
                <View style={styles.baseCallout}>
                  <Text style={styles.baseCalloutText}>🚑 UNIT #{ambulanceId}</Text>
                </View>
              ) : (
                /* Regular Sector Label */
                <Text style={styles.nodeLabel} numberOfLines={1}>
                  {nodeName}
                </Text>
              )}
            </View>
          );
        })}

        {/* 4. Smooth Moving Animated Ambulance Vehicle */}
        {fullRoute.length > 0 ? (
          <Animated.View
            style={[
              styles.vehicleMarker,
              {
                left: Animated.subtract(animX, 16),
                top: Animated.subtract(animY, 16),
                zIndex: 10,
              },
            ]}
          >
            {/* Outer Glow Ring */}
            <View
              style={[
                styles.vehicleGlow,
                { borderColor: currentPhaseColor },
              ]}
            />
            {/* Inner White Body */}
            <View
              style={[
                styles.vehicleBody,
                { borderColor: currentPhaseColor },
              ]}
            >
              <Text style={{ fontSize: 14 }}>🚑</Text>
            </View>
            {/* Floating Unit ID Callout */}
            <View style={[styles.vehicleCallout, { borderColor: currentPhaseColor }]}>
              <Text style={styles.vehicleCalloutText}>
                Unit #{ambulanceId}
              </Text>
            </View>
          </Animated.View>
        ) : null}
      </View>

      {/* Map Legend & Shortest Path Indicator */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: "#38BDF8" }]} />
          <Text style={styles.legendText}>Leg 1 (Pickup)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: "#4ADE80" }]} />
          <Text style={styles.legendText}>Leg 2 (Hospital)</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={{ fontSize: 10 }}>📍</Text>
          <Text style={styles.legendText}>Patient ({patientLocation || "Scene"})</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={{ fontSize: 10 }}>🏥</Text>
          <Text style={styles.legendText}>{hospitalName || hospitalLocation || "Hospital"}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0F172A", // Sleek dark command console
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 10,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    paddingBottom: 6,
  },
  headerLeft: {
    flex: 1,
  },
  headerBadge: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 1,
  },
  phasePill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "#1E293B",
  },
  phasePillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  mapCanvas: {
    width: "100%",
    height: 255,
    backgroundColor: "#080E1A",
    borderRadius: 8,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  nodeWrapper: {
    position: "absolute",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },
  beaconPulse: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
  },
  nodeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#94A3B8",
  },
  nodeLabel: {
    position: "absolute",
    top: 25,
    color: "#94A3B8",
    fontSize: 8.5,
    fontWeight: "500",
    width: 75,
    textAlign: "center",
  },
  patientCallout: {
    position: "absolute",
    top: -15,
    backgroundColor: "#DC2626",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  patientCalloutText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  hospitalCallout: {
    position: "absolute",
    top: -15,
    backgroundColor: "#16A34A",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  hospitalCalloutText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  baseCallout: {
    position: "absolute",
    top: -15,
    backgroundColor: "#2563EB",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  baseCalloutText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },
  vehicleMarker: {
    position: "absolute",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleGlow: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    backgroundColor: "rgba(56, 189, 248, 0.25)",
  },
  vehicleBody: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  vehicleCallout: {
    position: "absolute",
    top: -15,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  vehicleCalloutText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "bold",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendLine: {
    width: 14,
    height: 3.5,
    borderRadius: 2,
  },
  legendText: {
    color: "#94A3B8",
    fontSize: 9.5,
    fontWeight: "500",
  },
});
