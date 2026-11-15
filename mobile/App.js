import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { registerRootComponent } from "expo";
import {
  triggerSOS,
  fetchLocations,
  resetSimulation,
  fetchAmbulanceMission,
  updateAmbulanceStatus,
  loginDriver,
  setDriverToken,
  getApiBaseUrl,
  setApiBaseUrl,
} from "./src/api";
import { theme } from "./src/theme";
import LiveVisualMap from "./src/LiveVisualMap";

export default function App() {
  // App Role: 'citizen' or 'driver'
  const [appRole, setAppRole] = useState("citizen");

  // Citizen State
  const [selectedLocation, setSelectedLocation] = useState("Gulshan");
  const [isLocating, setIsLocating] = useState(false);
  const [liveGpsCoords, setLiveGpsCoords] = useState(null);
  const [trackingStepIndex, setTrackingStepIndex] = useState(0);
  const [locations, setLocations] = useState([
    "Gulshan",
    "Nazimabad",
    "North Karachi",
    "Saddar",
    "Clifton",
    "Defense",
    "Airport",
    "Malir",
    "Shahrah-e-Faisal",
  ]);
  const [severity, setSeverity] = useState(4); // 4 = Critical, 3 = High, 2 = Medium
  const [loading, setLoading] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [callerPhone, setCallerPhone] = useState("");
  const [emergencyType, setEmergencyType] = useState("Cardiac / Severe Injury");
  const [remainingEta, setRemainingEta] = useState(0);

  // Driver Auth State
  const [driverUser, setDriverUser] = useState(null);
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPassword, setDriverPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Driver Mission State
  const [driverAmbId, setDriverAmbId] = useState(102);
  const [driverMission, setDriverMission] = useState(null);
  const [driverStatus, setDriverStatus] = useState("Available");
  const [driverLocation, setDriverLocation] = useState("Gulshan");
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [updatingDriver, setUpdatingDriver] = useState(false);

  // Server Connection Configuration
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getApiBaseUrl());

  // Concentric Pulse animations for the SOS button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Dynamic Roboto Google Font & Clean Theme injection for Web
    if (Platform.OS === "web" && typeof document !== "undefined") {
      if (!document.getElementById("resqroute-roboto-link")) {
        const link = document.createElement("link");
        link.id = "resqroute-roboto-link";
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap";
        document.head.appendChild(link);
      }
      if (!document.getElementById("resqroute-global-style")) {
        const style = document.createElement("style");
        style.id = "resqroute-global-style";
        style.innerHTML = `
          * {
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif !important;
          }
          body, html, #root {
            background-color: #F8FAFC !important;
          }
        `;
        document.head.appendChild(style);
      }
    }

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ringAnim, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    fetchLocations().then((locs) => {
      if (locs && locs.length > 0) setLocations(locs);
    });

    // Auto-detect live GPS coordinates on startup
    detectLiveLocation();
  }, []);

  // Live Location Detector using standard browser/device geolocation
  const detectLiveLocation = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLiveGpsCoords({ lat: latitude.toFixed(4), lng: longitude.toFixed(4) });

          // Map approximate coords to nearest simulated Karachi sector if near, or keep default
          // Standard city sectors mapping
          const sectorMap = [
            { name: "Saddar", lat: 24.8607, lng: 67.0011 },
            { name: "Clifton", lat: 24.8138, lng: 67.0299 },
            { name: "Defense", lat: 24.8016, lng: 67.0652 },
            { name: "Gulshan", lat: 24.9207, lng: 67.0928 },
            { name: "Nazimabad", lat: 24.9180, lng: 67.0332 },
            { name: "North Karachi", lat: 24.9961, lng: 67.0620 },
            { name: "Airport", lat: 24.9056, lng: 67.1608 },
            { name: "Shahrah-e-Faisal", lat: 24.8672, lng: 67.0822 },
            { name: "Malir", lat: 24.8934, lng: 67.2023 },
          ];

          let closest = sectorMap[0];
          let minDist = 999999;
          sectorMap.forEach((s) => {
            const dist = Math.hypot(s.lat - latitude, s.lng - longitude);
            if (dist < minDist) {
              minDist = dist;
              closest = s;
            }
          });

          // If within reasonable area, select nearest sector
          if (closest) {
            setSelectedLocation(closest.name);
          }
          setIsLocating(false);
        },
        (err) => {
          console.log("GPS Notice:", err.message);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // Live Vehicle Progress Tracker: Advances ambulance along full 2-stage route in real time
  useEffect(() => {
    let progressTimer;
    if (dispatchResult) {
      const pickup = dispatchResult.ambulanceRoute || [];
      const hosp = dispatchResult.hospitalRoute || [];
      const fullRoute = [
        ...pickup,
        ...(hosp.length > 1 ? hosp.slice(1) : [])
      ];

      if (fullRoute.length > 1) {
        setTrackingStepIndex(0);
        progressTimer = setInterval(() => {
          setTrackingStepIndex((prev) => {
            if (prev < fullRoute.length - 1) {
              return prev + 1;
            }
            return prev;
          });
        }, 4000); // Advances one road node every 4 seconds for live demonstration
      }
    }
    return () => clearInterval(progressTimer);
  }, [dispatchResult]);

  // Poll driver mission when authenticated
  useEffect(() => {
    let interval;
    if (appRole === "driver" && driverUser) {
      const checkMission = async () => {
        const ambId = driverUser.ambulanceId || driverAmbId;
        const data = await fetchAmbulanceMission(ambId);
        if (data) {
          setDriverStatus(data.status);
          setDriverMission(data.currentMission);
          if (data.location) setDriverLocation(data.location);
        }
      };
      checkMission();
      interval = setInterval(checkMission, 2500);
    }
    return () => clearInterval(interval);
  }, [appRole, driverUser, driverAmbId]);

  // Citizen Live ETA Countdown
  useEffect(() => {
    let timer;
    if (dispatchResult && remainingEta > 0) {
      timer = setInterval(() => {
        setRemainingEta((prev) => Math.max(0, prev - 1));
      }, 60000);
    }
    return () => clearInterval(timer);
  }, [dispatchResult, remainingEta]);

  const showAlert = (title, msg) => {
    if (typeof window !== "undefined" && window.alert) {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleSOSPress = () => {
    // Open verification prompt to validate emergency case and prevent prank calls
    setShowVerifyModal(true);
  };

  const handleConfirmVerifiedSOS = async () => {
    setShowVerifyModal(false);
    setLoading(true);
    try {
      const response = await triggerSOS({
        patientName: callerPhone ? `Caller (${callerPhone})` : "Emergency Caller",
        location: selectedLocation,
        severity: severity,
        notes: `Verified Case: ${emergencyType}`,
      });

      if (response && response.success) {
        setDispatchResult(response);
        setRemainingEta(response.ambulanceEtaMinutes || 4);
      } else {
        showAlert(
          "Notice",
          response?.message || "Could not dispatch an ambulance at this moment. All emergency response units are currently responding to active emergencies."
        );
      }
    } catch (err) {
      showAlert("Error", "Could not connect to emergency dispatch server.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (typeof window !== "undefined" && window.confirm) {
      if (window.confirm("Are you sure you want to cancel the emergency dispatch?")) {
        setDispatchResult(null);
        resetSimulation();
      }
      return;
    }

    Alert.alert(
      "Cancel Emergency?",
      "Are you sure you want to cancel the dispatch?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            setDispatchResult(null);
            resetSimulation();
          },
        },
      ]
    );
  };

  // Driver Login Handler
  const handleDriverLogin = async (emailToUse, passToUse) => {
    const e = emailToUse || driverEmail;
    const p = passToUse || driverPassword;
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await loginDriver(e, p);
      setDriverUser(res.user);
      if (res.user.ambulanceId) {
        setDriverAmbId(res.user.ambulanceId);
      }
    } catch (err) {
      setAuthError(err.message || "Invalid driver credentials");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDriverLogout = () => {
    setDriverToken(null);
    setDriverUser(null);
    setDriverMission(null);
  };

  const handleDriverStatusChange = async (newStatus) => {
    setUpdatingDriver(true);
    const ambId = driverUser?.ambulanceId || driverAmbId;
    try {
      await updateAmbulanceStatus(ambId, newStatus);
      setDriverStatus(newStatus);
      if (newStatus === "Completed") {
        setDriverMission(null);
        showAlert("Mission Complete", `Ambulance #${ambId} has completed handover and is now Available.`);
      } else {
        showAlert("Status Updated", `Ambulance #${ambId} mission status set to: "${newStatus}"`);
      }
      const data = await fetchAmbulanceMission(ambId);
      if (data) {
        setDriverStatus(data.status);
        setDriverMission(data.currentMission);
        if (data.location) setDriverLocation(data.location);
      }
    } catch (err) {
      showAlert("Error", "Could not update mission status. Please try again.");
    } finally {
      setUpdatingDriver(false);
    }
  };

  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.45],
  });

  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.bgDark} />

      {/* HEADER WITH ROLE SWITCHER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setShowServerModal(true)}
          style={{ position: "absolute", top: 14, right: 14, padding: 6, zIndex: 10 }}
        >
          <Text style={{ fontSize: 16 }}>⚙️</Text>
        </TouchableOpacity>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>911 / 1122 RESQROUTE</Text>
        </View>
        <Text style={styles.title}>ResQRoute</Text>

        {/* ROLE TOGGLE TABS */}
        <View style={styles.roleToggleRow}>
          <TouchableOpacity
            style={[
              styles.roleTab,
              appRole === "citizen" && styles.roleTabActive,
            ]}
            onPress={() => setAppRole("citizen")}
          >
            <Text
              style={[
                styles.roleTabText,
                appRole === "citizen" && styles.roleTabTextActive,
              ]}
            >
              📱 CITIZEN SOS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleTab,
              appRole === "driver" && styles.roleTabActive,
            ]}
            onPress={() => setAppRole("driver")}
          >
            <Text
              style={[
                styles.roleTabText,
                appRole === "driver" && styles.roleTabTextActive,
              ]}
            >
              🚑 DRIVER PORTAL
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ==================== CITIZEN VIEW ==================== */}
      {appRole === "citizen" ? (
        !dispatchResult ? (
          /* IDLE SCREEN - HUGE SOS BUTTON */
          <ScrollView
            contentContainerStyle={styles.idleContent}
            showsVerticalScrollIndicator={false}
          >
            {/* LOCATION SELECTOR BAR */}
            <View style={styles.locationBar}>
              <TouchableOpacity
                style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
                onPress={() => setShowLocationModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.locationIconBg}>
                  <Text style={{ fontSize: 18 }}>📍</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationLabel}>
                    {isLocating ? "DETECTING GPS LOCATION..." : "YOUR CURRENT LOCATION"}
                  </Text>
                  <Text style={styles.locationValue}>
                    {selectedLocation}, Karachi
                  </Text>
                  {liveGpsCoords && (
                    <Text style={{ color: "#10B981", fontSize: 10, marginTop: 2 }}>
                      GPS: {liveGpsCoords.lat}° N, {liveGpsCoords.lng}° E (Live)
                    </Text>
                  )}
                </View>
                <Text style={styles.changeText}>Change ▾</Text>
              </TouchableOpacity>
            </View>

            {/* SEVERITY LEVEL SELECTOR */}
            <View style={styles.severityContainer}>
              <Text style={styles.sectionLabel}>EMERGENCY SEVERITY LEVEL</Text>
              <View style={styles.severityRow}>
                {[
                  { level: 4, label: "Critical", icon: "🚨" },
                  { level: 3, label: "High", icon: "⚠️" },
                  { level: 2, label: "Medium", icon: "🩹" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.level}
                    style={[
                      styles.severityButton,
                      severity === item.level && styles.severityButtonActive,
                      severity === item.level && {
                        borderColor:
                          item.level === 4
                            ? theme.colors.primaryRed
                            : item.level === 3
                            ? theme.colors.warningAmber
                            : theme.colors.accentCyan,
                      },
                    ]}
                    onPress={() => setSeverity(item.level)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                    <Text
                      style={[
                        styles.severityText,
                        severity === item.level && styles.severityTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* GIANT PULSATING SOS BUTTON */}
            <View style={styles.buttonWrapper}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: ringScale }],
                    opacity: ringOpacity,
                  },
                ]}
              />

              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={styles.sosButton}
                  onPress={handleSOSPress}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#FFFFFF" />
                      <Text style={styles.loadingText}>CALCULATING ROUTE...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonInner}>
                      <Text style={styles.sosSymbol}>🚨</Text>
                      <Text style={styles.sosText}>SOS</Text>
                      <Text style={styles.sosSubtext}>ONE-TAP CALL</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

            <Text style={styles.helperNotice}>
              Pressing SOS finds and dispatches the closest available ambulance
              and reserves a hospital bed along the fastest route.
            </Text>
          </ScrollView>
        ) : (
          /* ACTIVE DISPATCH HUD FOR CITIZEN */
          <ScrollView
            contentContainerStyle={styles.hudContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.dispatchedBanner}>
              <View style={styles.pulseDot} />
              <Text style={styles.dispatchedBannerText}>AMBULANCE EN ROUTE</Text>
            </View>

            <View style={styles.etaCard}>
              <Text style={styles.etaLabel}>ESTIMATED VEHICLE ARRIVAL AT SCENE</Text>
              <View style={styles.etaRow}>
                <Text style={styles.etaValue}>{remainingEta}</Text>
                <Text style={styles.etaUnit}>MINS</Text>
              </View>
              <Text style={styles.etaDistance}>
                Pickup: {dispatchResult.ambulanceDistanceKm} km • Total Trip to Hospital: {dispatchResult.totalTripDistanceKm} km (~{dispatchResult.totalEtaMinutes} mins)
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeader}>🚑 ASSIGNED AMBULANCE</Text>
              <View style={styles.cardRow}>
                <Text style={styles.cardKey}>Vehicle Unit:</Text>
                <Text style={styles.cardValHighlight}>
                  Ambulance #{dispatchResult.assignedAmbulance?.id}
                </Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardKey}>Driver Name:</Text>
                <Text style={styles.cardVal}>
                  {dispatchResult.assignedAmbulance?.driverName}
                </Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardKey}>Driver Contact:</Text>
                <Text style={styles.cardVal}>
                  {dispatchResult.assignedAmbulance?.phone}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeader}>🏥 DESTINATION HOSPITAL</Text>
              <View style={styles.cardRow}>
                <Text style={styles.cardKey}>Facility:</Text>
                <Text style={styles.cardValHighlight}>
                  {dispatchResult.assignedHospital?.name} ({dispatchResult.assignedHospital?.location})
                </Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardKey}>Bed Allocation:</Text>
                <Text style={[styles.cardVal, { color: theme.colors.successGreen }]}>
                  1 Bed Reserved ({dispatchResult.assignedHospital?.availableBeds} remaining)
                </Text>
              </View>
            </View>

            {/* LIVE GPS VISUALIZATION MAP FOR CITIZEN */}
            <LiveVisualMap
              pickupRoute={dispatchResult.ambulanceRoute}
              hospitalRoute={dispatchResult.hospitalRoute}
              patientLocation={selectedLocation}
              hospitalName={dispatchResult.assignedHospital?.name}
              hospitalLocation={dispatchResult.assignedHospital?.location}
              activeStepIndex={trackingStepIndex}
              ambulanceId={dispatchResult.assignedAmbulance?.id}
              userRole="citizen"
            />

            {/* COMPLETE 2-STAGE LIVE TRIP TRACKER */}
            {(() => {
              const pickupRoute = dispatchResult.ambulanceRoute || [];
              const hospitalRoute = dispatchResult.hospitalRoute || [];
              const fullRoute = [
                ...pickupRoute,
                ...(hospitalRoute.length > 1 ? hospitalRoute.slice(1) : [])
              ];
              const pickupStepsCount = pickupRoute.length;
              const isArrivedAtPatient = trackingStepIndex >= pickupStepsCount - 1;
              const isEnRouteToHospital = trackingStepIndex >= pickupStepsCount - 1 && trackingStepIndex < fullRoute.length - 1;
              const isArrivedAtHospital = trackingStepIndex === fullRoute.length - 1;

              let phaseText = `En Route to Patient (${selectedLocation})`;
              let phaseBadgeColor = "#0284C7";
              if (isArrivedAtHospital) {
                phaseText = `Arrived at ${dispatchResult.assignedHospital?.name || "Hospital"}`;
                phaseBadgeColor = "#16A34A";
              } else if (isEnRouteToHospital) {
                phaseText = `Transporting to ${dispatchResult.assignedHospital?.name || "Hospital"}`;
                phaseBadgeColor = "#16A34A";
              } else if (isArrivedAtPatient) {
                phaseText = `Arrived at Patient Scene (${selectedLocation})`;
                phaseBadgeColor = "#EF4444";
              }

              return (
                <View style={styles.card}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <Text style={styles.cardHeader}>🗺️ LIVE 2-STAGE JOURNEY TRACKER</Text>
                    <Text style={{ color: phaseBadgeColor, fontSize: 11, fontWeight: "bold" }}>
                      ● Tracking
                    </Text>
                  </View>

                  {/* Status Banner */}
                  <View style={{ marginBottom: 12, padding: 9, borderRadius: 8, backgroundColor: phaseBadgeColor + "15", borderWidth: 1, borderColor: phaseBadgeColor + "60" }}>
                    <Text style={{ color: phaseBadgeColor, fontSize: 11, fontWeight: "bold" }}>
                      ● STATUS: {phaseText.toUpperCase()}
                    </Text>
                    <Text style={{ color: "#334155", fontSize: 11, marginTop: 3 }}>
                      Current Vehicle Sector: <Text style={{ fontWeight: "bold", color: "#0F172A" }}>{fullRoute[trackingStepIndex] || selectedLocation}</Text>
                    </Text>
                  </View>

                  {/* Stage 1: Ambulance to Patient */}
                  <View style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: "bold", color: "#0284C7" }}>
                        📍 STEP 1: Ambulance ➔ Patient ({selectedLocation})
                      </Text>
                      <Text style={{ fontSize: 10, color: "#64748B" }}>
                        {dispatchResult.ambulanceDistanceKm} km • ~{dispatchResult.ambulanceEtaMinutes} mins
                      </Text>
                    </View>
                    <View style={styles.routeContainer}>
                      {pickupRoute.map((node, index) => {
                        const isCurrent = index === trackingStepIndex;
                        const isPassed = trackingStepIndex > index;
                        return (
                          <View key={`pickup-${index}`} style={styles.routeStep}>
                            <View
                              style={[
                                styles.stepCircle,
                                isCurrent
                                  ? { backgroundColor: "#EF4444", transform: [{ scale: 1.15 }] }
                                  : isPassed
                                  ? { backgroundColor: "#10B981" }
                                  : { backgroundColor: "#CBD5E1" },
                              ]}
                            >
                              <Text style={styles.stepNum}>
                                {isCurrent ? "🚑" : isPassed ? "✓" : index + 1}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.stepText,
                                isCurrent && { color: "#EF4444", fontWeight: "bold" },
                              ]}
                            >
                              {node}
                            </Text>
                            {index < pickupRoute.length - 1 && (
                              <Text
                                style={[
                                  styles.stepArrow,
                                  isPassed && { color: "#10B981" },
                                ]}
                              >
                                ➔
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Stage 2: Patient to Hospital */}
                  <View style={{ marginBottom: 6 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: "bold", color: "#16A34A" }}>
                        🏥 STEP 2: Patient ➔ {dispatchResult.assignedHospital?.name || "Hospital"}
                      </Text>
                      <Text style={{ fontSize: 10, color: "#64748B" }}>
                        {dispatchResult.hospitalDistanceKm} km • ~{dispatchResult.hospitalEtaMinutes} mins
                      </Text>
                    </View>
                    <View style={styles.routeContainer}>
                      {hospitalRoute.map((node, index) => {
                        const routeOffsetIndex = (pickupRoute.length - 1) + index;
                        const isCurrent = trackingStepIndex === routeOffsetIndex;
                        const isPassed = trackingStepIndex > routeOffsetIndex;
                        return (
                          <View key={`hosp-${index}`} style={styles.routeStep}>
                            <View
                              style={[
                                styles.stepCircle,
                                isCurrent
                                  ? { backgroundColor: "#16A34A", transform: [{ scale: 1.15 }] }
                                  : isPassed
                                  ? { backgroundColor: "#10B981" }
                                  : { backgroundColor: "#CBD5E1" },
                              ]}
                            >
                              <Text style={styles.stepNum}>
                                {isCurrent ? "🚑" : isPassed ? "✓" : index + 1}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.stepText,
                                isCurrent && { color: "#16A34A", fontWeight: "bold" },
                              ]}
                            >
                              {node}
                            </Text>
                            {index < hospitalRoute.length - 1 && (
                              <Text
                                style={[
                                  styles.stepArrow,
                                  isPassed && { color: "#10B981" },
                                ]}
                              >
                                ➔
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              );
            })()}

            <TouchableOpacity
              style={{
                backgroundColor: "#1E293B",
                borderWidth: 1,
                borderColor: "#334155",
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 14,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onPress={() => {
                const text = [
                  `🚨 EMERGENCY CALL SUMMARY #${dispatchResult.emergencyId}`,
                  `Assigned Ambulance: Unit #${dispatchResult.assignedAmbulance?.id} (${dispatchResult.assignedAmbulance?.driverName}, Phone: ${dispatchResult.assignedAmbulance?.phone})`,
                  `Patient Sector: ${selectedLocation}`,
                  ``,
                  `📍 STEP 1 (Pickup Route): ${dispatchResult.ambulanceRoute?.join(" ➔ ")} (${dispatchResult.ambulanceDistanceKm} km, ~${dispatchResult.ambulanceEtaMinutes} mins)`,
                  `🏥 STEP 2 (Hospital Delivery Route): ${dispatchResult.hospitalRoute?.join(" ➔ ")} (${dispatchResult.hospitalDistanceKm} km, ~${dispatchResult.hospitalEtaMinutes} mins)`,
                  `Destination Hospital: ${dispatchResult.assignedHospital?.name} (${dispatchResult.assignedHospital?.location})`,
                  ``,
                  `🛣️ TOTAL SHORTEST PATH TRIP: ${dispatchResult.totalTripDistanceKm} km • Total Journey Time: ~${dispatchResult.totalEtaMinutes} mins`,
                ].join("\n");
                if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                  navigator.clipboard.writeText(text);
                }
                showAlert("Copied", "Complete 2-stage emergency route copied to clipboard!");
              }}
            >
              <Text style={{ fontSize: 14 }}>📋</Text>
              <Text style={{ color: "#E2E8F0", fontSize: 12, fontWeight: "600" }}>Copy Complete 2-Stage Route & Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>CANCEL EMERGENCY CALL</Text>
            </TouchableOpacity>
          </ScrollView>
        )
      ) : (
        /* ==================== AUTHENTICATED DRIVER VIEW ==================== */
        !driverUser ? (
          /* DRIVER LOGIN FORM */
          <ScrollView
            contentContainerStyle={styles.idleContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.loginCard}>
              <Text style={styles.loginTitle}>🔐 Driver Authentication</Text>
              <Text style={styles.loginSubtitle}>
                Sign in with your official vehicle credentials to access mission navigation.
              </Text>

              {authError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {authError}</Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Driver Official Email:</Text>
              <TextInput
                style={styles.textInput}
                value={driverEmail}
                onChangeText={setDriverEmail}
                placeholder="driver102@resqroute.org"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Password:</Text>
              <TextInput
                style={styles.textInput}
                value={driverPassword}
                onChangeText={setDriverPassword}
                placeholder="••••••••"
                placeholderTextColor="#64748B"
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => handleDriverLogin()}
                disabled={authLoading}
              >
                {authLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.loginBtnText}>SIGN IN TO VEHICLE HUD</Text>
                )}
              </TouchableOpacity>

              <View style={styles.demoDivider}>
                <Text style={styles.demoDividerText}>OR ONE-CLICK DEMO</Text>
              </View>

              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleDriverLogin("driver102@resqroute.org", "driver123")}
              >
                <Text style={styles.demoBtnText}>⚡ Demo Login: Driver #102 (Ahmed Raza)</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          /* AUTHENTICATED DRIVER MISSION HUD */
          <ScrollView
            contentContainerStyle={styles.hudContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* DRIVER PROFILE & SHIFT TOGGLE */}
            <View style={styles.driverProfileCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverNameText}>👤 {driverUser.fullName}</Text>
                <Text style={styles.driverUnitText}>Vehicle Unit: Ambulance #{driverUser.ambulanceId || driverAmbId}</Text>
                <Text style={[styles.driverUnitText, { color: "#2563EB", fontWeight: "600", marginTop: 2 }]}>
                  Current Location: 📍 {driverLocation || "Stationed"}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <TouchableOpacity
                  style={[styles.shiftBadge, isOnDuty ? styles.shiftOn : styles.shiftOff]}
                  onPress={() => setIsOnDuty(!isOnDuty)}
                >
                  <Text style={styles.shiftBadgeText}>{isOnDuty ? "● ON DUTY" : "○ OFF DUTY"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDriverLogout} style={{ marginTop: 6 }}>
                  <Text style={{ color: "#EF4444", fontSize: 11, fontWeight: "bold" }}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* DRIVER MISSION HUD */}
            {driverMission ? (
              <>
                <View style={[styles.dispatchedBanner, { backgroundColor: "#78350F", borderColor: "#D97706" }]}>
                  <View style={[styles.pulseDot, { backgroundColor: "#F59E0B" }]} />
                  <Text style={[styles.dispatchedBannerText, { color: "#FDE68A" }]}>
                    ACTIVE CALL: {driverStatus.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardHeader}>🚨 EMERGENCY INCIDENT</Text>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardKey}>Emergency ID:</Text>
                    <Text style={styles.cardValHighlight}>{driverMission.emergencyId}</Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardKey}>Current Vehicle Sector:</Text>
                    <Text style={styles.cardValHighlight}>🚑 {driverLocation || driverMission.route?.[0] || "En Route"}</Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardKey}>Patient Sector:</Text>
                    <Text style={styles.cardValHighlight}>📍 {driverMission.patientLocation}</Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardKey}>Emergency Level:</Text>
                    <Text style={[styles.cardVal, { color: "#EF4444", fontWeight: "bold" }]}>
                      {driverMission.severity}
                    </Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardKey}>Destination Hospital:</Text>
                    <Text style={[styles.cardVal, { color: "#16A34A", fontWeight: "bold" }]}>
                      🏥 {driverMission.hospitalName} ({driverMission.hospitalLocation})
                    </Text>
                  </View>
                </View>

                {/* LIVE GPS VISUALIZATION MAP FOR DRIVER */}
                <LiveVisualMap
                  pickupRoute={driverMission.ambulanceRoute || [driverLocation, driverMission.patientLocation]}
                  hospitalRoute={driverMission.hospitalRoute || [driverMission.patientLocation, driverMission.hospitalLocation]}
                  patientLocation={driverMission.patientLocation}
                  hospitalName={driverMission.hospitalName}
                  hospitalLocation={driverMission.hospitalLocation}
                  activeStepIndex={
                    driverStatus === "Completed"
                      ? 999
                      : driverStatus === "Transporting"
                      ? (driverMission.ambulanceRoute?.length || 2)
                      : driverStatus === "At Scene"
                      ? (driverMission.ambulanceRoute?.length || 2) - 1
                      : 0
                  }
                  ambulanceId={driverUser?.ambulanceId || driverAmbId}
                  userRole="driver"
                />

                <View style={styles.card}>
                  <Text style={styles.cardHeader}>🗺️ 2-STAGE FASTEST EMERGENCY ROUTE</Text>
                  
                  {/* Stage 1: To Patient */}
                  <View style={{ marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: "bold", color: "#0284C7" }}>
                        📍 STAGE 1: Pickup Route (Base ➔ Patient)
                      </Text>
                      {driverMission.ambulanceDistanceKm && (
                        <Text style={{ fontSize: 10, color: "#64748B" }}>
                          {driverMission.ambulanceDistanceKm} km • ~{driverMission.ambulanceEtaMinutes} mins
                        </Text>
                      )}
                    </View>
                    <View style={styles.routeContainer}>
                      {(driverMission.ambulanceRoute || [driverLocation, driverMission.patientLocation]).map((step, idx, arr) => (
                        <View key={`drv-p-${idx}`} style={styles.routeStep}>
                          <View style={[
                            styles.stepCircle,
                            idx === 0
                              ? { backgroundColor: "#2563EB" }
                              : idx === arr.length - 1
                              ? { backgroundColor: "#DC2626" }
                              : { backgroundColor: "#38BDF8" }
                          ]}>
                            <Text style={styles.stepNum}>{idx === arr.length - 1 ? "📍" : idx + 1}</Text>
                          </View>
                          <Text style={[
                            styles.stepText,
                            idx === arr.length - 1 ? { fontWeight: "bold", color: "#DC2626" } : {}
                          ]}>
                            {step}
                          </Text>
                          {idx < arr.length - 1 && (
                            <Text style={styles.stepArrow}>➔</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Stage 2: To Hospital */}
                  <View style={{ marginBottom: 6 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: "bold", color: "#16A34A" }}>
                        🏥 STAGE 2: Emergency Delivery (Patient ➔ Hospital)
                      </Text>
                      {driverMission.hospitalDistanceKm && (
                        <Text style={{ fontSize: 10, color: "#64748B" }}>
                          {driverMission.hospitalDistanceKm} km • ~{driverMission.hospitalEtaMinutes} mins
                        </Text>
                      )}
                    </View>
                    <View style={styles.routeContainer}>
                      {(driverMission.hospitalRoute || [driverMission.patientLocation, driverMission.hospitalLocation]).map((step, idx, arr) => (
                        <View key={`drv-h-${idx}`} style={styles.routeStep}>
                          <View style={[
                            styles.stepCircle,
                            idx === 0
                              ? { backgroundColor: "#DC2626" }
                              : idx === arr.length - 1
                              ? { backgroundColor: "#16A34A" }
                              : { backgroundColor: "#4ADE80" }
                          ]}>
                            <Text style={styles.stepNum}>{idx === arr.length - 1 ? "🏥" : idx + 1}</Text>
                          </View>
                          <Text style={[
                            styles.stepText,
                            idx === arr.length - 1 ? { fontWeight: "bold", color: "#16A34A" } : {}
                          ]}>
                            {step}
                          </Text>
                          {idx < arr.length - 1 && (
                            <Text style={styles.stepArrow}>➔</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={{
                      marginTop: 12,
                      paddingVertical: 9,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#CBD5E1",
                      backgroundColor: "#F8FAFC",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                    onPress={() => {
                      const text = [
                        `🚨 MISSION NAVIGATION DISPATCH #${driverMission.emergencyId}`,
                        `Urgency: ${driverMission.severity}`,
                        `Patient Sector: ${driverMission.patientLocation}`,
                        `Destination Hospital: ${driverMission.hospitalName} (${driverMission.hospitalLocation})`,
                        ``,
                        `📍 STAGE 1 (Pickup Route): ${(driverMission.ambulanceRoute || [driverLocation, driverMission.patientLocation]).join(" ➔ ")}`,
                        `🏥 STAGE 2 (Hospital Delivery Route): ${(driverMission.hospitalRoute || [driverMission.patientLocation, driverMission.hospitalLocation]).join(" ➔ ")}`,
                        ``,
                        `🛣️ Full Route: ${driverMission.route?.join(" ➔ ")}`,
                      ].join("\n");
                      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                        navigator.clipboard.writeText(text);
                      }
                      showAlert("Copied", "Mission route & target hospital copied to clipboard!");
                    }}
                  >
                    <Text style={{ fontSize: 13 }}>📋</Text>
                    <Text style={{ color: "#334155", fontSize: 11, fontWeight: "600" }}>Copy Complete 2-Stage Navigation</Text>
                  </TouchableOpacity>
                </View>

                {/* ACTION PROGRESS BUTTONS */}
                <View style={styles.driverActionsCard}>
                  <Text style={styles.cardHeader}>⚡ MISSION PROGRESSION</Text>
                  <TouchableOpacity
                    style={[styles.driverActionBtn, { backgroundColor: "#D97706" }]}
                    onPress={() => handleDriverStatusChange("At Scene")}
                    disabled={updatingDriver}
                  >
                    <Text style={styles.driverActionText}>📍 Arrived at Patient Scene</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.driverActionBtn, { backgroundColor: "#2563EB" }]}
                    onPress={() => handleDriverStatusChange("Transporting")}
                    disabled={updatingDriver}
                  >
                    <Text style={styles.driverActionText}>🏥 En Route to Hospital</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.driverActionBtn, { backgroundColor: "#059669" }]}
                    onPress={() => handleDriverStatusChange("Completed")}
                    disabled={updatingDriver}
                  >
                    <Text style={styles.driverActionText}>✓ Hospital Handover & Complete</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.emptyMissionCard}>
                <Text style={{ fontSize: 44 }}>🟢</Text>
                <Text style={styles.emptyMissionTitle}>Standing By</Text>
                <Text style={styles.emptyMissionSubtitle}>
                  Vehicle #{driverUser.ambulanceId || driverAmbId} is currently stationed at{" "}
                  <Text style={{ fontWeight: "bold", color: "#0F172A" }}>📍 {driverLocation || "Base Station"}</Text> and available in the fleet.
                </Text>
                <Text style={[styles.emptyMissionSubtitle, { marginTop: 8, fontSize: 11, color: "#94A3B8" }]}>
                  When an emergency is dispatched, real-time shortest path routing to the patient and hospital will display here automatically!
                </Text>
              </View>
            )}
          </ScrollView>
        )
      )}

      {/* LOCATION SELECTION MODAL */}
      <Modal visible={showLocationModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Emergency Zone</Text>
            <Text style={styles.modalSubtitle}>Choose the simulated city location:</Text>
            {locations.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.modalItem,
                  selectedLocation === loc && styles.modalItemActive,
                ]}
                onPress={() => {
                  setSelectedLocation(loc);
                  setShowLocationModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    selectedLocation === loc && styles.modalItemTextActive,
                  ]}
                >
                  📍 {loc}
                </Text>
                {selectedLocation === loc && (
                  <Text style={{ color: theme.colors.primaryRed, fontWeight: "bold" }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* VERIFY EMERGENCY CASE MODAL (ANTI-FAKE CALL) */}
      <Modal visible={showVerifyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 440, width: "100%" }]}>
            <Text style={[styles.modalTitle, { color: "#DC2626" }]}>🚨 Verify Emergency Request</Text>
            <Text style={[styles.modalSubtitle, { marginBottom: 12 }]}>
              To prevent false alarms and ensure swift dispatch, please confirm emergency details:
            </Text>

            <Text style={{ fontSize: 12, fontWeight: "600", color: "#334155", marginBottom: 4 }}>
              Incident Type:
            </Text>
            <View style={{ gap: 6, marginBottom: 14 }}>
              {["Cardiac / Severe Trauma", "Road Traffic Accident", "Respiratory Distress", "Other Emergency"].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setEmergencyType(t)}
                  style={{
                    padding: 9,
                    borderRadius: 8,
                    backgroundColor: emergencyType === t ? "#FEF2F2" : "#F8FAFC",
                    borderWidth: 1,
                    borderColor: emergencyType === t ? "#DC2626" : "#E2E8F0",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: emergencyType === t ? "bold" : "normal", color: emergencyType === t ? "#DC2626" : "#475569" }}>
                    {emergencyType === t ? "● " : "○ "} {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 12, fontWeight: "600", color: "#334155", marginBottom: 4 }}>
              Callback Contact Phone (Optional):
            </Text>
            <TextInput
              style={[styles.textInput, { marginBottom: 16 }]}
              placeholder="+92 3XX XXXXXXX"
              placeholderTextColor="#94A3B8"
              value={callerPhone}
              onChangeText={setCallerPhone}
              keyboardType="phone-pad"
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: "#E2E8F0", paddingVertical: 12, borderRadius: 10, alignItems: "center" }}
                onPress={() => setShowVerifyModal(false)}
              >
                <Text style={{ fontWeight: "600", color: "#475569", fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: "#DC2626", paddingVertical: 12, borderRadius: 10, alignItems: "center" }}
                onPress={handleConfirmVerifiedSOS}
              >
                <Text style={{ fontWeight: "bold", color: "#FFFFFF", fontSize: 13 }}>Confirm & Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SERVER URL CONFIG MODAL */}
      <Modal visible={showServerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 360, width: "100%" }]}>
            <Text style={styles.modalTitle}>⚙️ Backend Server URL</Text>
            <Text style={[styles.modalSubtitle, { marginBottom: 12, textAlign: "center" }]}>
              Enter your live Render or local Wi-Fi backend URL:
            </Text>
            <TextInput
              style={{
                backgroundColor: "#F8FAFC",
                borderWidth: 1,
                borderColor: "#CBD5E1",
                borderRadius: 8,
                padding: 10,
                fontSize: 13,
                color: "#0F172A",
                marginBottom: 14,
                width: "100%",
              }}
              value={serverUrlInput}
              onChangeText={setServerUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="e.g. https://resqroute.onrender.com"
            />
            <View style={{ flexDirection: "row", gap: 8, width: "100%" }}>
              <TouchableOpacity
                style={[styles.modalCloseButton, { flex: 1, backgroundColor: "#E2E8F0", marginTop: 0 }]}
                onPress={() => setShowServerModal(false)}
              >
                <Text style={{ color: "#334155", fontWeight: "600", fontSize: 12 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCloseButton, { flex: 1, backgroundColor: "#2563EB", marginTop: 0 }]}
                onPress={() => {
                  setApiBaseUrl(serverUrlInput);
                  setShowServerModal(false);
                  showAlert("Server Updated", `Backend endpoint set to:\n${serverUrlInput}`);
                  fetchLocations().then((locs) => {
                    if (locs && locs.length) setLocations(locs);
                  });
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 12 }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgDark,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 28) + 10 : (Platform.OS === "web" ? 16 : 8),
    ...(Platform.OS === "web" ? { minHeight: "100vh", height: "100%", width: "100%" } : {}),
  },
  header: {
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  headerBadge: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  roleToggleRow: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 4,
  },
  roleTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: "#DC2626",
  },
  roleTabText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  roleTabTextActive: {
    color: "#FFFFFF",
  },
  idleContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  locationBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    width: "100%",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  locationIconBg: {
    backgroundColor: "#F1F5F9",
    padding: 8,
    borderRadius: 10,
    marginRight: 12,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  locationValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0F172A",
    marginTop: 2,
  },
  changeText: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "600",
  },
  severityContainer: {
    width: "100%",
    marginBottom: 24,
  },
  sectionLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: "center",
  },
  severityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  severityButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  severityButtonActive: {
    backgroundColor: "#F8FAFC",
  },
  severityText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  severityTextActive: {
    color: "#0F172A",
    fontWeight: "bold",
  },
  buttonWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
    position: "relative",
    width: 240,
    height: 240,
  },
  pulseRing: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: theme.colors.primaryRed,
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.primaryRedDark,
    alignItems: "center",
    justifyContent: "center",
    elevation: 20,
    shadowColor: theme.colors.primaryRed,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    borderWidth: 6,
    borderColor: theme.colors.primaryRedLight,
  },
  buttonInner: {
    alignItems: "center",
  },
  sosSymbol: {
    fontSize: 30,
    marginBottom: 2,
  },
  sosText: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 3,
  },
  sosSubtext: {
    color: "#FEE2E2",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 3,
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 10,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 1,
  },
  helperNotice: {
    color: theme.colors.textSubtle,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 15,
    paddingHorizontal: 20,
  },
  hudContainer: {
    padding: 16,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  dispatchedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#064E3B",
    borderColor: "#059669",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.successGreen,
  },
  dispatchedBannerText: {
    color: "#34D399",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 1.5,
  },
  etaCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#DC2626",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#DC2626",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  etaLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  etaRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginVertical: 4,
  },
  etaValue: {
    color: "#DC2626",
    fontSize: 48,
    fontWeight: "900",
  },
  etaUnit: {
    color: "#DC2626",
    fontSize: 18,
    fontWeight: "700",
  },
  etaDistance: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 6,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  cardKey: {
    color: "#64748B",
    fontSize: 13,
  },
  cardVal: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "600",
  },
  cardValHighlight: {
    color: "#0284C7",
    fontSize: 14,
    fontWeight: "bold",
  },
  routeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  routeStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primaryRed,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  stepText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "700",
  },
  stepArrow: {
    color: theme.colors.textSubtle,
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: theme.colors.primaryRed,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 30,
  },
  cancelButtonText: {
    color: theme.colors.primaryRed,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 1,
  },
  driverProfileCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  driverNameText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "bold",
  },
  driverUnitText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  shiftBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  shiftOn: {
    backgroundColor: "#16A34A",
  },
  shiftOff: {
    backgroundColor: "#94A3B8",
  },
  shiftBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  driverActionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  driverActionBtn: {
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  driverActionText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  emptyMissionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 30,
    alignItems: "center",
    marginVertical: 20,
  },
  emptyMissionTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyMissionSubtitle: {
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  loginCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 24,
    width: "100%",
    marginTop: 10,
  },
  loginTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  loginSubtitle: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 12,
    color: "#0F172A",
    fontSize: 13,
    marginBottom: 16,
  },
  loginBtn: {
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
  },
  demoDivider: {
    alignItems: "center",
    marginVertical: 16,
  },
  demoDividerText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  demoBtn: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  demoBtnText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "bold",
  },
  errorBox: {
    backgroundColor: "#7F1D1D",
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: "#FECACA",
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 2,
    backgroundColor: "#F8FAFC",
  },
  modalItemActive: {
    backgroundColor: "#E2E8F0",
  },
  modalItemText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  modalItemTextActive: {
    color: "#0F172A",
    fontWeight: "bold",
  },
  modalCloseButton: {
    backgroundColor: "#0F172A",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 14,
  },
  modalCloseText: {
    color: theme.colors.textWhite,
    fontWeight: "bold",
  },
});

registerRootComponent(App);
