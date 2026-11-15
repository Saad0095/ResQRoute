import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

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

const defaultRoads = [
  { u: "North Karachi", v: "Nazimabad", weight: 4.0 },
  { u: "Nazimabad", v: "Gulshan", weight: 6.0 },
  { u: "Nazimabad", v: "Saddar", weight: 7.0 },
  { u: "Gulshan", v: "Airport", weight: 5.0 },
  { u: "Gulshan", v: "Shahrah-e-Faisal", weight: 5.5 },
  { u: "Airport", v: "Malir", weight: 5.0 },
  { u: "Airport", v: "Shahrah-e-Faisal", weight: 6.0 },
  { u: "Malir", v: "Shahrah-e-Faisal", weight: 8.0 },
  { u: "Shahrah-e-Faisal", v: "Saddar", weight: 7.0 },
  { u: "Shahrah-e-Faisal", v: "Defense", weight: 6.0 },
  { u: "Saddar", v: "Clifton", weight: 4.0 },
  { u: "Clifton", v: "Defense", weight: 5.0 },
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
}) {
  const fullRoute = [
    ...(pickupRoute || []),
    ...(hospitalRoute && hospitalRoute.length > 1 ? hospitalRoute.slice(1) : []),
  ];

  const getCoord = (zone) => {
    if (!zone) return { x: 165, y: 120 };
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
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1200,
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
        tension: 40,
        useNativeDriver: false,
      }),
      Animated.spring(animY, {
        toValue: targetCoord.y,
        friction: 6,
        tension: 40,
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

  // Helper to check if a road edge belongs to pickup or hospital leg
  const isEdgeInRoute = (route, u, v) => {
    if (!route || route.length < 2) return false;
    for (let i = 0; i < route.length - 1; i++) {
      if (
        (route[i] === u && route[i + 1] === v) ||
        (route[i] === v && route[i + 1] === u)
      ) {
        return true;
      }
    }
    return false;
  };

  // Distinct city nodes to render
  const distinctNodes = Object.keys(defaultNodeCoords);

  return (
    <View style={styles.container}>
      {/* Telemetry Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerBadge}>● LIVE GPS ROUTE MAP</Text>
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
        {/* 1. Road Segments */}
        {defaultRoads.map((road, index) => {
          const p1 = getCoord(road.u);
          const p2 = getCoord(road.v);
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          const isLeg1 = isEdgeInRoute(pickupRoute, road.u, road.v);
          const isLeg2 = isEdgeInRoute(hospitalRoute, road.u, road.v);

          let strokeColor = "#334155";
          let height = 2;
          let zIndex = 1;

          if (isLeg1) {
            strokeColor = "#38BDF8"; // Sky Blue (Pickup)
            height = 4.5;
            zIndex = 3;
          } else if (isLeg2) {
            strokeColor = "#4ADE80"; // Emerald Green (Hospital)
            height = 4.5;
            zIndex = 3;
          }

          return (
            <View
              key={`road-${index}`}
              style={{
                position: "absolute",
                left: midX - length / 2,
                top: midY - height / 2,
                width: length,
                height: height,
                backgroundColor: strokeColor,
                transform: [{ rotate: `${angle}deg` }],
                zIndex,
                borderRadius: 2,
              }}
            />
          );
        })}

        {/* 2. City Sector Nodes */}
        {distinctNodes.map((nodeName) => {
          const coord = getCoord(nodeName);
          const isPatientNode = nodeName === patientLocation;
          const isHospitalNode = nodeName === hospitalLocation;

          let badgeColor = "#1E293B";
          let borderColor = "#475569";
          let icon = null;

          if (isPatientNode) {
            badgeColor = "#DC2626";
            borderColor = "#EF4444";
            icon = "📍";
          } else if (isHospitalNode) {
            badgeColor = "#16A34A";
            borderColor = "#22C55E";
            icon = "🏥";
          }

          return (
            <View
              key={`node-${nodeName}`}
              style={[
                styles.nodeWrapper,
                { left: coord.x - 13, top: coord.y - 13 },
                (isPatientNode || isHospitalNode) && { zIndex: 6 },
              ]}
            >
              {/* Pulsing ring for patient or hospital */}
              {(isPatientNode || isHospitalNode) && (
                <Animated.View
                  style={[
                    styles.beaconPulse,
                    {
                      borderColor: isPatientNode ? "#EF4444" : "#22C55E",
                      transform: [
                        {
                          scale: pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.6],
                          }),
                        },
                      ],
                      opacity: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 0.1],
                      }),
                    },
                  ]}
                />
              )}

              {/* Node Circle */}
              <View
                style={[
                  styles.nodeCircle,
                  { backgroundColor: badgeColor, borderColor: borderColor },
                ]}
              >
                {icon ? (
                  <Text style={{ fontSize: 11 }}>{icon}</Text>
                ) : (
                  <View style={styles.nodeDot} />
                )}
              </View>

              {/* Sector Name Tag */}
              <Text
                style={[
                  styles.nodeLabel,
                  (isPatientNode || isHospitalNode) && { fontWeight: "bold", color: "#F8FAFC" },
                ]}
                numberOfLines={1}
              >
                {nodeName}
              </Text>
            </View>
          );
        })}

        {/* 3. Smooth Moving Animated Ambulance Vehicle */}
        {fullRoute.length > 0 && (
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
              <Text style={{ fontSize: 13 }}>🚑</Text>
            </View>
            {/* Floating Unit ID Callout */}
            <View style={styles.vehicleCallout}>
              <Text style={styles.vehicleCalloutText}>
                Unit #{ambulanceId}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Map Legend */}
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
          <Text style={styles.legendText}>Patient</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={{ fontSize: 10 }}>🏥</Text>
          <Text style={styles.legendText}>{hospitalName || "Hospital"}</Text>
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
    height: 250,
    backgroundColor: "#0B1120",
    borderRadius: 8,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  nodeWrapper: {
    position: "absolute",
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },
  beaconPulse: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
  },
  nodeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
    top: 23,
    color: "#94A3B8",
    fontSize: 8.5,
    fontWeight: "500",
    width: 70,
    textAlign: "center",
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
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: "rgba(56, 189, 248, 0.25)",
  },
  vehicleBody: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleCallout: {
    position: "absolute",
    top: -14,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#38BDF8",
    paddingHorizontal: 4,
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
