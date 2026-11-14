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
  Platform,
} from "react-native";
import { registerRootComponent } from "expo";
import {
  triggerSOS,
  fetchLocations,
  resetSimulation,
  fetchAmbulanceMission,
  updateAmbulanceStatus,
} from "./src/api";
import { theme } from "./src/theme";

export default function App() {
  // App Role: 'citizen' or 'driver'
  const [appRole, setAppRole] = useState("citizen");

  // Citizen State
  const [selectedLocation, setSelectedLocation] = useState("Gulshan");
  const [locations, setLocations] = useState([
    "Gulshan",
    "Nazimabad",
    "North Karachi",
    "Saddar",
    "Clifton",
    "Defense",
    "Airport",
  ]);
  const [severity, setSeverity] = useState(4); // 4 = Critical, 3 = High, 2 = Medium
  const [loading, setLoading] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [remainingEta, setRemainingEta] = useState(0);

  // Driver State
  const [driverAmbId, setDriverAmbId] = useState(102); // Default: Ahmed Raza (Gulshan)
  const [driverMission, setDriverMission] = useState(null);
  const [driverStatus, setDriverStatus] = useState("Available");
  const [updatingDriver, setUpdatingDriver] = useState(false);

  // Concentric Pulse animations for the SOS button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, []);

  // Poll driver mission when in driver mode
  useEffect(() => {
    let interval;
    if (appRole === "driver") {
      const checkMission = async () => {
        const data = await fetchAmbulanceMission(driverAmbId);
        if (data) {
          setDriverStatus(data.status);
          setDriverMission(data.currentMission);
        }
      };
      checkMission();
      interval = setInterval(checkMission, 2500);
    }
    return () => clearInterval(interval);
  }, [appRole, driverAmbId]);

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

  const handleSOSPress = async () => {
    setLoading(true);
    try {
      const response = await triggerSOS({
        patientName: "Emergency Caller",
        location: selectedLocation,
        severity: severity,
        notes: "One-click mobile SOS triggered",
      });

      if (response && response.success) {
        setDispatchResult(response);
        setRemainingEta(response.ambulanceEtaMinutes || 4);
      } else {
        showAlert(
          "Notice",
          response?.message || "Could not dispatch an ambulance. Queue is full."
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

  const handleDriverStatusChange = async (newStatus) => {
    setUpdatingDriver(true);
    await updateAmbulanceStatus(driverAmbId, newStatus);
    setDriverStatus(newStatus);
    if (newStatus === "Completed") {
      setDriverMission(null);
    }
    setUpdatingDriver(false);
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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.bgDark} />

      {/* HEADER WITH ROLE SWITCHER */}
      <View style={styles.header}>
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
              🚑 DRIVER HUD
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
            <TouchableOpacity
              style={styles.locationBar}
              onPress={() => setShowLocationModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.locationIconBg}>
                <Text style={{ fontSize: 18 }}>📍</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationLabel}>CURRENT LOCATION</Text>
                <Text style={styles.locationValue}>
                  {selectedLocation}, Karachi
                </Text>
              </View>
              <Text style={styles.changeText}>Tap to change ▾</Text>
            </TouchableOpacity>

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
              Pressing SOS runs Dijkstra's algorithm to find and dispatch
              the closest available ambulance and reserve a hospital bed.
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
              <Text style={styles.etaLabel}>ESTIMATED ARRIVAL TIME</Text>
              <View style={styles.etaRow}>
                <Text style={styles.etaValue}>{remainingEta}</Text>
                <Text style={styles.etaUnit}>MINS</Text>
              </View>
              <Text style={styles.etaDistance}>
                Distance: {dispatchResult.ambulanceDistanceKm} km • Direct Shortest Route
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
                  {dispatchResult.assignedHospital?.name}
                </Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardKey}>Bed Allocation:</Text>
                <Text style={[styles.cardVal, { color: theme.colors.successGreen }]}>
                  1 Bed Reserved ({dispatchResult.assignedHospital?.availableBeds} remaining)
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeader}>🛣️ DIJKSTRA SHORTEST ROUTE</Text>
              <View style={styles.routeContainer}>
                {dispatchResult.ambulanceRoute?.map((node, index) => (
                  <View key={index} style={styles.routeStep}>
                    <View style={styles.stepCircle}>
                      <Text style={styles.stepNum}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{node}</Text>
                    {index < dispatchResult.ambulanceRoute.length - 1 && (
                      <Text style={styles.stepArrow}>➔</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>

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
        /* ==================== DRIVER HUD VIEW ==================== */
        <ScrollView
          contentContainerStyle={styles.hudContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* VEHICLE UNIT SELECTOR */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>🚑 DRIVER VEHICLE UNIT</Text>
            <View style={styles.driverUnitRow}>
              {[
                { id: 101, name: "Ali (#101)" },
                { id: 102, name: "Ahmed (#102)" },
                { id: 103, name: "Usman (#103)" },
                { id: 104, name: "Tariq (#104)" },
              ].map((amb) => (
                <TouchableOpacity
                  key={amb.id}
                  style={[
                    styles.driverUnitBtn,
                    driverAmbId === amb.id && styles.driverUnitBtnActive,
                  ]}
                  onPress={() => setDriverAmbId(amb.id)}
                >
                  <Text
                    style={[
                      styles.driverUnitBtnText,
                      driverAmbId === amb.id && styles.driverUnitBtnTextActive,
                    ]}
                  >
                    {amb.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* DRIVER MISSION HUD */}
          {driverMission ? (
            <>
              <View style={[styles.dispatchedBanner, { backgroundColor: "#78350F", borderColor: "#D97706" }]}>
                <View style={[styles.pulseDot, { backgroundColor: "#F59E0B" }]} />
                <Text style={[styles.dispatchedBannerText, { color: "#FDE68A" }]}>
                  MISSION ACTIVE: {driverStatus.toUpperCase()}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardHeader}>🚨 EMERGENCY INCIDENT</Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardKey}>Emergency ID:</Text>
                  <Text style={styles.cardValHighlight}>{driverMission.emergencyId}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardKey}>Patient Sector:</Text>
                  <Text style={styles.cardValHighlight}>📍 {driverMission.patientLocation}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardKey}>Severity:</Text>
                  <Text style={[styles.cardVal, { color: "#EF4444", fontWeight: "bold" }]}>
                    {driverMission.severity}
                  </Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardKey}>Target Hospital:</Text>
                  <Text style={styles.cardVal}>{driverMission.hospitalName}</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardHeader}>🗺️ NAVIGATION ROUTE</Text>
                <View style={styles.routeContainer}>
                  {driverMission.route?.map((step, idx) => (
                    <View key={idx} style={styles.routeStep}>
                      <View style={styles.stepCircle}>
                        <Text style={styles.stepNum}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                      {idx < driverMission.route.length - 1 && (
                        <Text style={styles.stepArrow}>➔</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>

              {/* ACTION PROGRESS BUTTONS */}
              <View style={styles.driverActionsCard}>
                <Text style={styles.cardHeader}>⚡ MISSION ACTION STATUS</Text>
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
                  <Text style={styles.driverActionText}>✓ Handover & Finish Mission</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.emptyMissionCard}>
              <Text style={{ fontSize: 44 }}>🟢</Text>
              <Text style={styles.emptyMissionTitle}>Standing By</Text>
              <Text style={styles.emptyMissionSubtitle}>
                Ambulance #{driverAmbId} is currently available. When a citizen taps SOS, the Dijkstra engine will assign this unit automatically!
              </Text>
            </View>
          )}
        </ScrollView>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgDark,
    ...(Platform.OS === "web" ? { minHeight: "100vh", height: "100%", width: "100%" } : {}),
  },
  header: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  headerBadge: {
    backgroundColor: theme.colors.primaryRed,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.textWhite,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  roleToggleRow: {
    flexDirection: "row",
    backgroundColor: "#161E2E",
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 6,
  },
  roleTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: theme.colors.primaryRed,
  },
  roleTabText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
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
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 14,
    width: "100%",
    marginBottom: 18,
  },
  locationIconBg: {
    backgroundColor: theme.colors.bgCardActive,
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  locationValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: theme.colors.textWhite,
    marginTop: 2,
  },
  changeText: {
    color: theme.colors.accentCyan,
    fontSize: 12,
    fontWeight: "600",
  },
  severityContainer: {
    width: "100%",
    marginBottom: 28,
  },
  sectionLabel: {
    color: theme.colors.textSubtle,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
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
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1.5,
    borderColor: "#1E293B",
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  severityButtonActive: {
    backgroundColor: theme.colors.bgCardActive,
  },
  severityText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  severityTextActive: {
    color: theme.colors.textWhite,
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
    backgroundColor: theme.colors.bgCard,
    borderWidth: 2,
    borderColor: theme.colors.primaryRed,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    marginBottom: 14,
  },
  etaLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  etaRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginVertical: 4,
  },
  etaValue: {
    color: theme.colors.primaryRed,
    fontSize: 48,
    fontWeight: "900",
  },
  etaUnit: {
    color: theme.colors.primaryRed,
    fontSize: 18,
    fontWeight: "800",
  },
  etaDistance: {
    color: theme.colors.textSubtle,
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    color: theme.colors.textWhite,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    paddingBottom: 6,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  cardKey: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  cardVal: {
    color: "#F1F5F9",
    fontSize: 13,
    fontWeight: "600",
  },
  cardValHighlight: {
    color: theme.colors.accentCyan,
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
  driverUnitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  driverUnitBtn: {
    backgroundColor: "#0B0F19",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  driverUnitBtnActive: {
    borderColor: theme.colors.primaryRed,
    backgroundColor: "#1E293B",
  },
  driverUnitBtnText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  driverUnitBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  driverActionsCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  driverActionBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  driverActionText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  emptyMissionCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 30,
    alignItems: "center",
    marginVertical: 20,
  },
  emptyMissionTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyMissionSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
  },
  modalTitle: {
    color: theme.colors.textWhite,
    fontSize: 18,
    fontWeight: "bold",
  },
  modalSubtitle: {
    color: theme.colors.textSubtle,
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
  },
  modalItemActive: {
    backgroundColor: theme.colors.bgCardActive,
  },
  modalItemText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  modalItemTextActive: {
    color: theme.colors.textWhite,
    fontWeight: "bold",
  },
  modalCloseButton: {
    backgroundColor: theme.colors.border,
    paddingVertical: 10,
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
