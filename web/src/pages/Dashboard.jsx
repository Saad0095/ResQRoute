import React, { useState, useEffect } from "react";
import {
  fetchSystemStatus,
  fetchRoads,
  toggleRoad,
  triggerEmergency,
  freeAmbulance,
  resetSystem,
  fetchUsers,
  createUser,
  toggleUserActive,
  deleteUser,
  fetchAdminHospitals,
  createHospital,
  updateHospitalBeds,
  fetchAdminAmbulances,
  createAmbulance,
  fetchIncidents,
  deleteIncident,
  clearIncidents,
  addLocation,
  updateLocation,
  deleteLocation,
  addRoad,
  deleteRoad,
  planRoute,
} from "../services/api";
import { useTheme } from "../context/ThemeContext";
import CityMap from "../components/CityMap";
import RoadControls from "../components/RoadControls";
import EmergencyQueue from "../components/EmergencyQueue";
import FleetTable from "../components/FleetTable";
import HospitalCards from "../components/HospitalCards";

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [state, setState] = useState(null);
  const [activeRoute, setActiveRoute] = useState([]);
  const [activeDispatch, setActiveDispatch] = useState(null);

  // Management records
  const [usersList, setUsersList] = useState([]);
  const [hospitalsList, setHospitalsList] = useState([]);
  const [ambulancesList, setAmbulancesList] = useState([]);
  const [incidents, setIncidents] = useState([]);

  // Forms & Modals
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: "", email: "", password: "", role: "DRIVER", phone: "", ambulanceId: "" });
  const [showAddAmbulance, setShowAddAmbulance] = useState(false);
  const [newAmbulance, setNewAmbulance] = useState({
    id: "",
    driverName: "",
    location: "Gulshan",
    phone: "",
    x: 420,
    y: 140,
    isCustomLocation: false,
    customLocationName: "",
    connectedTo: "Shahrah-e-Faisal",
  });
  const [showAddHospital, setShowAddHospital] = useState(false);
  const [newHospital, setNewHospital] = useState({
    name: "",
    location: "Gulshan",
    totalBeds: 20,
    availableBeds: 15,
    x: 420,
    y: 140,
    isCustomLocation: false,
    customLocationName: "",
    connectedTo: "Shahrah-e-Faisal",
  });
  const [editBedModal, setEditBedModal] = useState(null);

  // Dynamic Location & Road Creation Modals
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: "",
    connectedTo: "Gulshan",
    distanceKm: 5.0,
    direction: "above",
    x: 440,
    y: 70,
  });
  const [showAddRoad, setShowAddRoad] = useState(false);
  const [newRoad, setNewRoad] = useState({ u: "Malir", v: "Saddar", weight: 15.0 });
  const [showEditLocation, setShowEditLocation] = useState(false);
  const [editLocation, setEditLocation] = useState({
    selected: "Gulistan-e-Jauhar",
    newName: "Gulistan-e-Jauhar",
    x: 440,
    y: 70,
  });

  // Route Inspector (Test journeys e.g. Malir -> Saddar via Shahrah-e-Faisal)
  const [inspectorStart, setInspectorStart] = useState("Malir");
  const [inspectorDest, setInspectorDest] = useState("Saddar");
  const [inspectionResult, setInspectionResult] = useState(null);
  const [inspectingRoute, setInspectingRoute] = useState(false);

  // Dispatch Form
  const [patientName, setPatientName] = useState("");
  const [patientSector, setPatientSector] = useState("Gulshan");
  const [urgencyLevel, setUrgencyLevel] = useState(4);
  const [dispatching, setDispatching] = useState(false);

  // Settings
  const [hotline, setHotline] = useState("+92 21 1122 0000");
  const [autoDispatch, setAutoDispatch] = useState(true);

  // Notification
  const [notice, setNotice] = useState(null);

  const { theme, toggleTheme } = useTheme();

  const showMsg = (text, isError = false) => {
    setNotice({ text, isError });
    setTimeout(() => setNotice(null), 4000);
  };

  const loadData = async () => {
    try {
      const [statusData, roadsData, incData] = await Promise.all([
        fetchSystemStatus(),
        fetchRoads(),
        fetchIncidents().catch(() => ({ incidents: [] })),
      ]);
      setState({ ...statusData, roads: roadsData.roads });
      setIncidents(incData.incidents || []);

      if (user.role === "ADMIN" || user.role === "DISPATCHER") {
        const [u, h, a] = await Promise.all([
          fetchUsers().catch(() => []),
          fetchAdminHospitals().catch(() => []),
          fetchAdminAmbulances().catch(() => []),
        ]);
        setUsersList(u);
        setHospitalsList(h);
        setAmbulancesList(a);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleRoad = async (u, v) => {
    try {
      const res = await toggleRoad(u, v);
      showMsg(`Road ${u} ⇄ ${v} is now ${res.isClosed ? "Closed" : "Open"}.`);
      loadData();
    } catch (e) {
      showMsg("Failed to toggle road", true);
    }
  };

  const handleDispatch = async (e) => {
    if (e) e.preventDefault();
    setDispatching(true);
    try {
      const res = await triggerEmergency({
        patientName: patientName.trim() || `Patient (${patientSector})`,
        location: patientSector,
        severity: parseInt(urgencyLevel),
        notes: "Emergency call registered",
      });

      if (res.success) {
        const fullRoute = [
          ...(res.ambulanceRoute || []),
          ...(res.hospitalRoute && res.hospitalRoute.length > 1 ? res.hospitalRoute.slice(1) : [])
        ];
        setActiveRoute(fullRoute);
        setActiveDispatch(res);
        setActiveTab("map");
        showMsg(`Ambulance #${res.assignedAmbulance.id} dispatched! Pickup: ${res.ambulanceEtaMinutes} mins ➔ Hospital: ${res.hospitalEtaMinutes} mins.`);
        setPatientName("");
      } else {
        showMsg(res.message, true);
      }
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    } finally {
      setDispatching(false);
    }
  };

  const handleFreeAmbulance = async (id) => {
    try {
      await freeAmbulance(id);
      showMsg(`Ambulance #${id} is now available.`);
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset all ambulances and restore hospital bed counts?")) return;
    try {
      await resetSystem();
      setActiveRoute([]);
      setActiveDispatch(null);
      showMsg("System reset successfully.");
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  // User Actions
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createUser({
        ...newUser,
        ambulanceId: newUser.ambulanceId ? parseInt(newUser.ambulanceId) : null,
      });
      showMsg("User created successfully.");
      setShowAddUser(false);
      setNewUser({ fullName: "", email: "", password: "", role: "DRIVER", phone: "", ambulanceId: "" });
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleToggleUser = async (uId, curActive) => {
    try {
      await toggleUserActive(uId, !curActive);
      showMsg(`User account ${!curActive ? "activated" : "disabled"}.`);
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleDeleteUser = async (uId, email) => {
    if (!confirm(`Delete user ${email}?`)) return;
    try {
      await deleteUser(uId);
      showMsg("User deleted.");
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  // Hospital Actions
  const handleCreateHospital = async (e) => {
    e.preventDefault();
    const finalLocation = newHospital.isCustomLocation
      ? newHospital.customLocationName.trim()
      : newHospital.location.trim();
    if (!finalLocation) {
      showMsg("Please specify a valid sector location.", true);
      return;
    }
    try {
      await createHospital({
        name: newHospital.name.trim(),
        location: finalLocation,
        totalBeds: parseInt(newHospital.totalBeds) || 0,
        availableBeds: parseInt(newHospital.availableBeds) || 0,
        x: parseInt(newHospital.x) || 420,
        y: parseInt(newHospital.y) || 140,
        connectedTo: newHospital.isCustomLocation ? (newHospital.connectedTo || "Shahrah-e-Faisal") : undefined,
      });
      showMsg("Hospital facility added successfully.");
      setShowAddHospital(false);
      setNewHospital({
        name: "",
        location: "Gulshan",
        totalBeds: 20,
        availableBeds: 15,
        x: 420,
        y: 140,
        isCustomLocation: false,
        customLocationName: "",
        connectedTo: "Shahrah-e-Faisal",
      });
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleSaveBedModal = async (e) => {
    e.preventDefault();
    if (!editBedModal) return;
    try {
      await updateHospitalBeds(editBedModal.id, {
        availableBeds: parseInt(editBedModal.availableBeds) || 0,
        totalBeds: parseInt(editBedModal.totalBeds) || 0,
      });
      showMsg(`Bed capacity updated for ${editBedModal.name}.`);
      setEditBedModal(null);
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  // Ambulance Actions
  const handleCreateAmbulance = async (e) => {
    e.preventDefault();
    const finalLocation = newAmbulance.isCustomLocation
      ? newAmbulance.customLocationName.trim()
      : newAmbulance.location.trim();
    if (!finalLocation) {
      showMsg("Please specify a valid base location.", true);
      return;
    }
    try {
      await createAmbulance({
        id: parseInt(newAmbulance.id),
        driverName: newAmbulance.driverName.trim(),
        location: finalLocation,
        phone: newAmbulance.phone.trim(),
        x: parseInt(newAmbulance.x) || 420,
        y: parseInt(newAmbulance.y) || 140,
        connectedTo: newAmbulance.isCustomLocation ? (newAmbulance.connectedTo || "Shahrah-e-Faisal") : undefined,
      });
      showMsg("Ambulance registered to fleet successfully.");
      setShowAddAmbulance(false);
      setNewAmbulance({
        id: "",
        driverName: "",
        location: "Gulshan",
        phone: "",
        x: 420,
        y: 140,
        isCustomLocation: false,
        customLocationName: "",
        connectedTo: "Shahrah-e-Faisal",
      });
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  // Location & Road Actions
  const updateLocationPlacement = (connectedSector, dir, currentName) => {
    const base = state?.coords?.[connectedSector] || { x: 420, y: 140 };
    let newX = base.x;
    let newY = base.y;

    const norm = (currentName || "").toLowerCase().replace(/[^a-z]/g, "");
    if (norm.includes("jauhar") || norm.includes("johar")) {
      newX = 440;
      newY = 70;
    } else if (dir === "above") {
      newX = Math.min(800, Math.max(60, base.x + 15));
      newY = Math.max(50, base.y - 70);
    } else if (dir === "below") {
      newX = Math.min(800, Math.max(60, base.x + 10));
      newY = Math.min(410, base.y + 70);
    } else if (dir === "right") {
      newX = Math.min(800, base.x + 80);
      newY = base.y;
    } else if (dir === "left") {
      newX = Math.max(60, base.x - 80);
      newY = base.y;
    }

    return { x: newX, y: newY };
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    if (!newLocation.name.trim()) {
      showMsg("Please enter a location name", true);
      return;
    }
    try {
      await addLocation({
        name: newLocation.name.trim(),
        connectedTo: newLocation.connectedTo,
        distanceKm: parseFloat(newLocation.distanceKm) || 5.0,
        x: parseInt(newLocation.x) || 440,
        y: parseInt(newLocation.y) || 70,
      });
      showMsg(`Location "${newLocation.name}" added to city map at (X: ${newLocation.x}, Y: ${newLocation.y})!`);
      setShowAddLocation(false);
      setNewLocation({
        name: "",
        connectedTo: "Gulshan",
        distanceKm: 5.0,
        direction: "above",
        x: 440,
        y: 70,
      });
      await loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleCreateRoad = async (e) => {
    e.preventDefault();
    if (!newRoad.u || !newRoad.v || newRoad.u === newRoad.v) {
      showMsg("Please choose two distinct sectors to connect", true);
      return;
    }
    try {
      await addRoad({
        u: newRoad.u,
        v: newRoad.v,
        weight: parseFloat(newRoad.weight) || 5.0,
      });
      showMsg(`Road between ${newRoad.u} ⇄ ${newRoad.v} (${newRoad.weight} km) created!`);
      setShowAddRoad(false);
      await loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    if (!editLocation.selected) {
      showMsg("Please select a location to edit", true);
      return;
    }
    try {
      await updateLocation(editLocation.selected, {
        newName: editLocation.newName.trim() || editLocation.selected,
        x: parseInt(editLocation.x) || 440,
        y: parseInt(editLocation.y) || 70,
      });
      showMsg(`Location "${editLocation.newName.trim() || editLocation.selected}" updated successfully!`);
      setShowEditLocation(false);
      await loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleDeleteLocation = async (locName) => {
    const target = locName || editLocation.selected;
    if (!target) return;
    if (!window.confirm(`Are you sure you want to remove sector "${target}" from the city network? All connecting roads will be removed.`)) {
      return;
    }
    try {
      await deleteLocation(target);
      showMsg(`Sector "${target}" removed successfully!`);
      setShowEditLocation(false);
      await loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleDeleteRoad = async (u, v) => {
    if (!u || !v) return;
    if (!window.confirm(`Are you sure you want to disconnect the road between ${u} ⇄ ${v}?`)) {
      return;
    }
    try {
      await deleteRoad(u, v);
      showMsg(`Road between ${u} ⇄ ${v} disconnected!`);
      setShowAddRoad(false);
      await loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleDeleteIncident = async (id, emergencyId) => {
    if (!window.confirm(`Delete record for call ${emergencyId}?`)) return;
    try {
      await deleteIncident(id);
      showMsg(`Emergency call record ${emergencyId} deleted!`);
      await loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleClearAllIncidents = async () => {
    if (!window.confirm("Are you sure you want to clear all call history records? This cannot be undone.")) return;
    try {
      await clearIncidents();
      showMsg("All call history records cleared!");
      await loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleInspectRoute = async (e) => {
    if (e) e.preventDefault();
    if (!inspectorStart || !inspectorDest || inspectorStart === inspectorDest) {
      showMsg("Please select two distinct sectors to calculate route", true);
      return;
    }
    setInspectingRoute(true);
    try {
      const res = await planRoute(inspectorStart, inspectorDest);
      setInspectionResult(res);
      if (res.success && res.path && res.path.length > 0) {
        setActiveRoute(res.path);
        showMsg(`Shortest path: ${res.path.join(" → ")} (${res.distanceKm} km, ETA ${res.etaMinutes} mins)`);
      } else {
        showMsg(res.message || "No accessible route found between chosen sectors", true);
      }
    } catch (err) {
      showMsg(err.message, true);
    } finally {
      setInspectingRoute(false);
    }
  };

  // Dynamic sectors list from backend graph and coordinate registry (canonicalized and deduplicated)
  const canonicalizeZone = (zone) => {
    if (!zone) return "";
    const norm = zone.toLowerCase().replace(/[\s-]/g, "");
    if (
      norm === "gulistanejauhar" ||
      norm === "gulistanejohar" ||
      norm === "gulistanjauhar" ||
      norm === "gulistanjohar" ||
      norm === "jauhar" ||
      norm === "johar"
    ) {
      return "Gulistan-e-Jauhar";
    }
    if (norm === "northkarachi") return "North Karachi";
    if (norm === "shahrahefaisal") return "Shahrah-e-Faisal";
    return zone.trim();
  };

  const rawZonesList = [
    ...(state?.availableZones || []),
    ...Object.keys(state?.coords || {}),
    "Gulshan",
    "Nazimabad",
    "North Karachi",
    "Saddar",
    "Clifton",
    "Defense",
    "Airport",
    "Malir",
    "Shahrah-e-Faisal",
    "Gulistan-e-Jauhar",
  ];

  const seenZoneNorm = new Set();
  const zonesList = [];
  for (const raw of rawZonesList) {
    const canon = canonicalizeZone(raw);
    const norm = canon.toLowerCase().replace(/[\s-]/g, "");
    if (norm && !seenZoneNorm.has(norm)) {
      seenZoneNorm.add(norm);
      zonesList.push(canon);
    }
  }
  zonesList.sort();

  // Metrics
  const ambulancesReady = state?.ambulances?.filter((a) => a.isAvailable).length || 0;
  const totalAmbulances = state?.ambulances?.length || 5;
  const busyAmbulances = state?.ambulances?.filter((a) => !a.isAvailable) || [];
  const bedsFree = state?.hospitals?.reduce((sum, h) => sum + h.availableBeds, 0) || 0;
  const totalBeds = state?.hospitals?.reduce((sum, h) => sum + h.totalBeds, 0) || 0;
  const pendingCount = state?.pendingEmergencies?.length || 0;

  // Tabs with clean SVG icons
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
    },
    {
      id: "map",
      label: "City Map",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
          <line x1="8" y1="2" x2="8" y2="18"></line>
          <line x1="16" y1="6" x2="16" y2="22"></line>
        </svg>
      ),
    },
    {
      id: "dispatch",
      label: "Dispatch Call",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      ),
    },
    {
      id: "fleet",
      label: "Ambulances",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      ),
    },
    {
      id: "hospitals",
      label: "Hospitals",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18"></path>
          <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
          <path d="M9 10h6"></path>
          <path d="M12 7v6"></path>
        </svg>
      ),
    },
    {
      id: "history",
      label: "Call History",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
    },
    ...(user.role === "ADMIN"
      ? [
          {
            id: "users",
            label: "Users",
            icon: (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            ),
          },
          {
            id: "settings",
            label: "Settings",
            icon: (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors select-none font-sans">
      {/* Top Professional Navbar */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
        {/* Left Section: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Collapse navigation" : "Expand navigation"}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              ✚
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">ResQRoute</span>
              <span className="hidden sm:inline-block text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                EMS
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Controls, Theme & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 whitespace-nowrap text-xs">
          <button
            onClick={toggleTheme}
            title="Toggle Light / Dark mode"
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>

          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold flex items-center justify-center text-xs shadow-sm">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{user.fullName}</div>
              <div className="text-[10px] text-slate-400 font-semibold leading-tight">{user.role}</div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="text-xs text-slate-400 hover:text-red-600 font-medium px-1.5 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sleek Toggled Sidebar Navigation */}
        <aside
          className={`${
            sidebarOpen ? "w-56" : "w-16"
          } transition-all duration-200 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-2.5 shrink-0 z-10`}
        >
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={!sidebarOpen ? tab.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    active
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  } ${!sidebarOpen ? "justify-center px-0" : ""}`}
                >
                  {tab.icon}
                  {sidebarOpen && <span className="truncate">{tab.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Bottom Sidebar Status & Collapse Toggle */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {sidebarOpen ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                <div className="text-slate-500 text-[11px] font-medium">Calls in Waiting</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{pendingCount}</div>
              </div>
            ) : (
              <div
                title={`${pendingCount} calls waiting`}
                className="w-10 h-10 mx-auto rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-900 dark:text-white"
              >
                {pendingCount}
              </div>
            )}

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full py-1.5 text-center text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {sidebarOpen ? "◀ Collapse" : "▶"}
            </button>
          </div>
        </aside>

        {/* Full-Page Content View */}
        <main className="flex-1 p-5 sm:p-6 lg:p-8 overflow-y-auto w-full">
          {/* Status Notification Banner */}
          {notice && (
            <div
              className={`mb-5 p-3 rounded-lg border text-xs flex items-center justify-between ${
                notice.isError
                  ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
                  : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              <span>{notice.text}</span>
              <button onClick={() => setNotice(null)} className="text-xs opacity-60 hover:opacity-100 ml-4">✕</button>
            </div>
          )}

          {/* 1. OPERATIONS OVERVIEW PAGE */}
          {activeTab === "overview" && (
            <div className="w-full space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">Operations Overview</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Live fleet availability, hospital bed capacity, and real-time response monitoring
                  </p>
                </div>

                {/* Live System Status Badges */}
                <div className="flex items-center gap-2.5 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Ambulances: <strong>{ambulancesReady} of {totalAmbulances} Ready</strong></span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Hospital Beds: <strong>{bedsFree} Free</strong></span>
                  </div>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Ambulances Ready</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {ambulancesReady} <span className="text-xs font-normal text-slate-400">/ {totalAmbulances} units</span>
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">Ready for immediate dispatch</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Hospital Beds Free</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {bedsFree} <span className="text-xs font-normal text-slate-400">/ {totalBeds} beds</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">Across 4 major facilities</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Active Missions</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {busyAmbulances.length}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">En route or at patient scene</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Calls Logged</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{incidents.length}</div>
                  <div className="text-xs text-slate-500 mt-2">Total recorded incidents</div>
                </div>
              </div>

              {/* Active Emergency Field Missions (Driver Live Progress Tracker) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Field Missions</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Live tracking of dispatched ambulance drivers</p>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                    {busyAmbulances.length} in Progress
                  </span>
                </div>

                {busyAmbulances.length === 0 ? (
                  <div className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                    All ambulance units are currently on standby and ready in their sectors.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {busyAmbulances.map((amb) => (
                      <div key={amb.id} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">Ambulance #{amb.id}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              amb.status === "At Scene"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : amb.status === "Transporting"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                            }`}
                          >
                            ● {amb.status || "Dispatched"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">Driver: {amb.driverName}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                          Current Location: <strong className="text-slate-900 dark:text-white">{amb.location}</strong>
                        </div>
                        <div className="mt-3 flex justify-end gap-2">
                          {amb.currentMission && (
                            <button
                              onClick={() => {
                                const mission = amb.currentMission;
                                const dispatchObj = state?.recentDispatches?.find((d) => d.emergencyId === mission.emergencyId) || {
                                  assignedAmbulance: amb,
                                  emergencyId: mission.emergencyId,
                                  severityLabel: mission.severity || "Critical",
                                  patientLocation: mission.patientLocation,
                                  ambulanceRoute: mission.ambulanceRoute || [amb.location, mission.patientLocation],
                                  ambulanceDistanceKm: mission.ambulanceDistanceKm || 5.0,
                                  ambulanceEtaMinutes: mission.ambulanceEtaMinutes || 6,
                                  assignedHospital: { name: mission.hospitalName, location: mission.hospitalLocation },
                                  hospitalRoute: mission.hospitalRoute || [mission.patientLocation, mission.hospitalLocation],
                                  hospitalDistanceKm: mission.hospitalDistanceKm || 5.0,
                                  hospitalEtaMinutes: mission.hospitalEtaMinutes || 6,
                                  totalTripDistanceKm: mission.totalTripDistanceKm || 10.0,
                                  totalEtaMinutes: mission.totalEtaMinutes || 12,
                                };
                                const fullRoute = [
                                  ...(dispatchObj.ambulanceRoute || []),
                                  ...(dispatchObj.hospitalRoute && dispatchObj.hospitalRoute.length > 1 ? dispatchObj.hospitalRoute.slice(1) : [])
                                ];
                                setActiveDispatch(dispatchObj);
                                setActiveRoute(fullRoute.length > 0 ? fullRoute : mission.route);
                                setActiveTab("map");
                              }}
                              className="text-[11px] px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white font-medium transition"
                            >
                              🎯 Live Track
                            </button>
                          )}
                          <button
                            onClick={() => handleFreeAmbulance(amb.id)}
                            className="text-[11px] px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                          >
                            Mark Handover & Free
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Two columns: Call Queue + Quick Dispatch */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EmergencyQueue pendingCalls={state?.pendingEmergencies} />

                {/* Quick Dispatch Form */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Quick Dispatch Call</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Directly route an emergency call</p>

                  <form onSubmit={handleDispatch} className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-600 dark:text-slate-400 block mb-1">Patient Name (Optional):</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 dark:text-slate-400 block mb-1">City Sector:</label>
                      <select
                        value={patientSector}
                        onChange={(e) => setPatientSector(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600"
                      >
                        {zonesList.map((z) => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-600 dark:text-slate-400 block mb-1">Urgency:</label>
                      <select
                        value={urgencyLevel}
                        onChange={(e) => setUrgencyLevel(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600"
                      >
                        <option value="4">Critical Emergency</option>
                        <option value="3">High Priority</option>
                        <option value="2">Medium</option>
                        <option value="1">Low</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={dispatching}
                      className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg text-xs transition disabled:opacity-50"
                    >
                      {dispatching ? "Finding Ambulance..." : "Dispatch Ambulance"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 2. CITY MAP PAGE */}
          {activeTab === "map" && (
            <div className="w-full space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">City Sectors & Road Network</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Live location of ambulances, hospitals, and dynamic arterial navigation paths
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddLocation(true)}
                    className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-sm flex items-center gap-1.5 transition"
                  >
                    <span>+</span> Add Sector / Location
                  </button>
                  <button
                    onClick={() => {
                      const first = zonesList[0] || "Gulistan-e-Jauhar";
                      const c = state?.coords?.[first] || { x: 440, y: 70 };
                      setEditLocation({
                        selected: first,
                        newName: first,
                        x: c.x,
                        y: c.y,
                      });
                      setShowEditLocation(true);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm flex items-center gap-1.5 transition"
                  >
                    <span>✏️</span> Edit Sector / Location
                  </button>
                  <button
                    onClick={() => setShowAddRoad(true)}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm flex items-center gap-1.5 transition"
                  >
                    <span>+</span> Connect Road
                  </button>
                </div>
              </div>

              {/* Smart Emergency Journey & Route Inspector */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                      Emergency Route Navigator & Trip Inspector
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Test navigation between sectors (e.g. going from <strong>Malir</strong> to <strong>Saddar</strong> passes <strong>Shahrah-e-Faisal</strong>)
                    </p>
                  </div>
                  {activeRoute && activeRoute.length > 0 && (
                    <button
                      onClick={() => { setActiveRoute([]); setInspectionResult(null); }}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
                    >
                      Clear Highlighted Path
                    </button>
                  )}
                </div>

                <form onSubmit={handleInspectRoute} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4">
                    <label className="text-slate-600 dark:text-slate-400 text-xs block mb-1 font-medium">Origin Sector:</label>
                    <select
                      value={inspectorStart}
                      onChange={(e) => setInspectorStart(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-sky-500"
                    >
                      {zonesList.map((z) => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-slate-600 dark:text-slate-400 text-xs block mb-1 font-medium">Destination Sector:</label>
                    <select
                      value={inspectorDest}
                      onChange={(e) => setInspectorDest(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-sky-500"
                    >
                      {zonesList.map((z) => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <button
                      type="submit"
                      disabled={inspectingRoute}
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 rounded-lg text-xs transition disabled:opacity-50 shadow-sm"
                    >
                      {inspectingRoute ? "Calculating Fastest Route..." : "Find Fastest Route"}
                    </button>
                  </div>
                </form>

                {inspectionResult && inspectionResult.success && (
                  <div className="mt-4 p-4 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-900/80">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                            Fastest Recommended Route
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(
                                `Route: ${inspectionResult.path.join(" → ")} (${inspectionResult.distanceKm} km, ~${inspectionResult.etaMinutes} mins)`
                              );
                              showMsg("Route copied to clipboard!");
                            }}
                            className="px-2 py-0.5 text-[10px] rounded bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 transition font-semibold"
                          >
                            📋 Copy Route
                          </button>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 flex flex-wrap items-center gap-1.5 select-all">
                          {inspectionResult.path.map((step, i) => (
                            <React.Fragment key={step}>
                              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs">
                                {step}
                              </span>
                              {i < inspectionResult.path.length - 1 && (
                                <span className="text-slate-400 font-bold">→</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-center">
                          <span className="text-slate-500 block text-[10px]">Total Distance</span>
                          <span className="font-bold text-slate-900 dark:text-white">{inspectionResult.distanceKm} km</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-center">
                          <span className="text-slate-500 block text-[10px]">Estimated Travel</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">~{inspectionResult.etaMinutes} mins</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-sky-700 dark:text-sky-400 mt-2">
                      💡 Tip: Click any road card below to mark it <strong>Closed</strong>, then click <em>Find Fastest Route</em> again to observe live detours!
                    </p>
                  </div>
                )}
              </div>

              <CityMap
                state={state}
                activeRoute={activeRoute}
                activeDispatch={activeDispatch}
                onClearRoute={() => {
                  setActiveRoute([]);
                  setActiveDispatch(null);
                }}
              />

              <RoadControls
                roads={state?.roads}
                onToggleRoad={handleToggleRoad}
                onDeleteRoad={handleDeleteRoad}
              />
            </div>
          )}

          {/* 3. DISPATCH CALL PAGE */}
          {activeTab === "dispatch" && (
            <div className="w-full max-w-2xl space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Register Emergency Call</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Input caller details to trigger the fastest response vehicle
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <form onSubmit={handleDispatch} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">
                      Patient / Caller Name:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Zain Malik"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">
                      Patient Sector:
                    </label>
                    <select
                      value={patientSector}
                      onChange={(e) => setPatientSector(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600"
                    >
                      {zonesList.map((z) => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">
                      Urgency Level:
                    </label>
                    <select
                      value={urgencyLevel}
                      onChange={(e) => setUrgencyLevel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600"
                    >
                      <option value="4">Critical Emergency (Immediate)</option>
                      <option value="3">High Urgency</option>
                      <option value="2">Medium Urgency</option>
                      <option value="1">Low Urgency</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={dispatching}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg text-xs transition disabled:opacity-50"
                  >
                    {dispatching ? "Finding Nearest Unit..." : "Confirm & Dispatch Ambulance"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 4. FLEET PAGE */}
          {activeTab === "fleet" && (
            <div className="w-full space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">Ambulances</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fleet readiness and current assignments</p>
                </div>
                {user.role === "ADMIN" && (
                  <button
                    onClick={() => setShowAddAmbulance(true)}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg shadow-sm transition flex items-center gap-1.5"
                  >
                    <span>+</span>
                    <span>Add Ambulance</span>
                  </button>
                )}
              </div>

              <FleetTable
                ambulances={state?.ambulances}
                onFreeAmbulance={handleFreeAmbulance}
              />
            </div>
          )}

          {/* 5. HOSPITALS PAGE */}
          {activeTab === "hospitals" && (
            <div className="w-full space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hospital Bed Capacity</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Emergency bed availability across facilities</p>
                </div>
                {user.role === "ADMIN" && (
                  <button
                    onClick={() => setShowAddHospital(true)}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg shadow-sm transition flex items-center gap-1.5"
                  >
                    <span>+</span>
                    <span>Add Hospital</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state?.hospitals?.map((h) => {
                  const pct = Math.round((h.availableBeds / h.totalBeds) * 100);
                  return (
                    <div key={h.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{h.name}</div>
                          <div className="text-xs text-slate-500">{h.location}</div>
                        </div>
                        {user.role === "ADMIN" && (
                          <button
                            onClick={() =>
                              setEditBedModal({
                                id: h.id,
                                name: h.name,
                                location: h.location,
                                availableBeds: h.availableBeds,
                                totalBeds: h.totalBeds,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                          >
                            Edit Beds
                          </button>
                        )}
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                          <span>Free Beds</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{h.availableBeds} of {h.totalBeds}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. CALL HISTORY PAGE */}
          {activeTab === "history" && (
            <div className="w-full space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">Call History</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Chronological record of emergency dispatches and live field status (Persisted in Database)</p>
                </div>
                {incidents.length > 0 && (
                  <button
                    onClick={handleClearAllIncidents}
                    className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition flex items-center gap-1.5"
                  >
                    <span>🗑️</span> Clear Call History
                  </button>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 text-left border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3">Call ID</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Sector</th>
                      <th className="px-4 py-3">Urgency</th>
                      <th className="px-4 py-3">Ambulance</th>
                      <th className="px-4 py-3">Distance</th>
                      <th className="px-4 py-3">ETA</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {incidents.map((inc) => (
                      <tr key={inc.id} className="text-slate-700 dark:text-slate-300">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{inc.emergencyId}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard?.writeText(
                                  `Emergency Call ${inc.emergencyId}: Patient ${inc.patientName} (${inc.location}), Ambulance Unit #${inc.ambulanceId || "N/A"}, Distance: ${inc.distanceKm?.toFixed(1)} km, Status: ${inc.status}`
                                );
                                showMsg(`Incident ${inc.emergencyId} copied to clipboard!`);
                              }}
                              title="Copy Call Summary"
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition text-xs"
                            >
                              📋
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">{inc.patientName}</td>
                        <td className="px-4 py-3">{inc.location}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {inc.severityLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">Unit #{inc.ambulanceId || "—"}</td>
                        <td className="px-4 py-3">{inc.distanceKm?.toFixed(1)} km</td>
                        <td className="px-4 py-3 font-medium">{inc.etaMinutes} mins</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              inc.status === "Completed"
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                                : inc.status === "At Scene"
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
                                : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400"
                            }`}
                          >
                            {inc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteIncident(inc.id, inc.emergencyId)}
                            title="Delete Call Record"
                            className="p-1 text-slate-400 hover:text-red-600 transition"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                    {incidents.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-slate-400">
                          No emergency calls recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. USERS PAGE (Admin only) */}
          {activeTab === "users" && user.role === "ADMIN" && (
            <div className="w-full space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">Staff Accounts</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage operator and driver logins</p>
                </div>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>Add User</span>
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 text-left border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Vehicle</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {usersList.map((u) => (
                      <tr key={u.id} className="text-slate-700 dark:text-slate-300">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{u.fullName}</td>
                        <td className="px-4 py-3 text-slate-500">{u.email}</td>
                        <td className="px-4 py-3">{u.role}</td>
                        <td className="px-4 py-3 text-slate-500">{u.ambulanceId ? `#${u.ambulanceId}` : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${u.isActive ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400"}`}>
                            {u.isActive ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggleUser(u.id, u.isActive)}
                              className="px-2 py-1 rounded text-xs border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              {u.isActive ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="px-2 py-1 rounded text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. SETTINGS PAGE (Admin only) */}
          {activeTab === "settings" && user.role === "ADMIN" && (
            <div className="w-full max-w-2xl space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Control room preferences and dispatch rules</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 text-xs shadow-sm">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">
                    Emergency Dispatch Hotline:
                  </label>
                  <input
                    type="text"
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">Automatic Ambulance Assignment</div>
                    <div className="text-slate-500 text-[11px]">Automatically assign closest unit when SOS is received.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoDispatch}
                    onChange={(e) => setAutoDispatch(e.target.checked)}
                    className="w-4 h-4 accent-slate-900 dark:accent-slate-100"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => showMsg("Settings saved.")}
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded-lg shadow-sm"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= MODAL 1: ADD AMBULANCE ================= */}
      {showAddAmbulance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center text-sm font-bold">
                  🚑
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Register Ambulance</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Add a new emergency response unit to fleet</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddAmbulance(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAmbulance} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Vehicle ID *</label>
                  <input
                    required
                    type="number"
                    placeholder="e.g. 106"
                    value={newAmbulance.id}
                    onChange={(e) => setNewAmbulance({ ...newAmbulance, id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Driver Full Name *</label>
                  <input
                    required
                    placeholder="e.g. Tariq Mehmood"
                    value={newAmbulance.driverName}
                    onChange={(e) => setNewAmbulance({ ...newAmbulance, driverName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Base Sector *</label>
                  <select
                    value={newAmbulance.isCustomLocation ? "__custom__" : newAmbulance.location}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__custom__") {
                        setNewAmbulance({
                          ...newAmbulance,
                          isCustomLocation: true,
                          x: 520,
                          y: 220,
                        });
                      } else {
                        const c = state?.coords?.[val] || { x: 420, y: 140 };
                        setNewAmbulance({
                          ...newAmbulance,
                          location: val,
                          isCustomLocation: false,
                          x: c.x,
                          y: c.y,
                        });
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  >
                    {zonesList.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                    <option value="__custom__">+ Add Custom Sector / New Zone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Driver Contact Phone</label>
                  <input
                    placeholder="+92 3XX XXXXXXX"
                    value={newAmbulance.phone}
                    onChange={(e) => setNewAmbulance({ ...newAmbulance, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>

                {newAmbulance.isCustomLocation && (
                  <>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Custom Sector Name *</label>
                      <input
                        required
                        placeholder="e.g. Bahria Town / Gulberg"
                        value={newAmbulance.customLocationName}
                        onChange={(e) => setNewAmbulance({ ...newAmbulance, customLocationName: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Connect to Arterial Road</label>
                      <select
                        value={newAmbulance.connectedTo}
                        onChange={(e) => setNewAmbulance({ ...newAmbulance, connectedTo: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                      >
                        {zonesList.map((z) => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                    Map X Coordinate <span className="text-[10px] text-slate-400 font-normal">(50 - 800)</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="50"
                    max="800"
                    placeholder="e.g. 420"
                    value={newAmbulance.x}
                    onChange={(e) => setNewAmbulance({ ...newAmbulance, x: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                    Map Y Coordinate <span className="text-[10px] text-slate-400 font-normal">(50 - 420)</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="50"
                    max="420"
                    placeholder="e.g. 140"
                    value={newAmbulance.y}
                    onChange={(e) => setNewAmbulance({ ...newAmbulance, y: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Visual Map Radar Position:
                </span>
                <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                  X: {newAmbulance.x || 0}, Y: {newAmbulance.y || 0}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddAmbulance(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition"
                >
                  Register Ambulance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ADD HOSPITAL ================= */}
      {showAddHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center text-sm font-bold">
                  🏥
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Add Hospital Facility</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Register new hospital and bed allocation</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddHospital(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHospital} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Hospital Name *</label>
                  <input
                    required
                    placeholder="e.g. South City Hospital"
                    value={newHospital.name}
                    onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Sector Location *</label>
                  <select
                    value={newHospital.isCustomLocation ? "__custom__" : newHospital.location}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__custom__") {
                        setNewHospital({
                          ...newHospital,
                          isCustomLocation: true,
                          x: 520,
                          y: 220,
                        });
                      } else {
                        const c = state?.coords?.[val] || { x: 420, y: 140 };
                        setNewHospital({
                          ...newHospital,
                          location: val,
                          isCustomLocation: false,
                          x: c.x,
                          y: c.y,
                        });
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  >
                    {zonesList.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                    <option value="__custom__">+ Add Custom Sector / New Zone</option>
                  </select>
                </div>

                {newHospital.isCustomLocation && (
                  <>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Custom Sector Name *</label>
                      <input
                        required
                        placeholder="e.g. Clifton Block 4"
                        value={newHospital.customLocationName}
                        onChange={(e) => setNewHospital({ ...newHospital, customLocationName: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Connect to Arterial Road</label>
                      <select
                        value={newHospital.connectedTo}
                        onChange={(e) => setNewHospital({ ...newHospital, connectedTo: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                      >
                        {zonesList.map((z) => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Total Bed Capacity *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 25"
                    value={newHospital.totalBeds}
                    onChange={(e) => setNewHospital({ ...newHospital, totalBeds: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Available Free Beds *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="e.g. 18"
                    value={newHospital.availableBeds}
                    onChange={(e) => setNewHospital({ ...newHospital, availableBeds: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                    Map X Coordinate <span className="text-[10px] text-slate-400 font-normal">(50 - 800)</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="50"
                    max="800"
                    placeholder="e.g. 420"
                    value={newHospital.x}
                    onChange={(e) => setNewHospital({ ...newHospital, x: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                    Map Y Coordinate <span className="text-[10px] text-slate-400 font-normal">(50 - 420)</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="50"
                    max="420"
                    placeholder="e.g. 140"
                    value={newHospital.y}
                    onChange={(e) => setNewHospital({ ...newHospital, y: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Visual Map Radar Position:
                </span>
                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                  X: {newHospital.x || 0}, Y: {newHospital.y || 0}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddHospital(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition"
                >
                  Add Hospital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ADD USER ================= */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center text-sm font-bold">
                  👤
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Create Staff Account</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Register new dispatcher or vehicle driver</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUser(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Full Name *</label>
                  <input
                    required
                    placeholder="e.g. Asad Siddiqui"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Email Address *</label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. asad@resqroute.org"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Password *</label>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">System Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  >
                    <option value="DRIVER">Ambulance Driver</option>
                    <option value="DISPATCHER">Emergency Dispatcher</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Contact Phone</label>
                  <input
                    placeholder="+92 3XX XXXXXXX"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>

                {newUser.role === "DRIVER" && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Assigned Vehicle ID</label>
                    <input
                      type="number"
                      placeholder="e.g. 102"
                      value={newUser.ambulanceId}
                      onChange={(e) => setNewUser({ ...newUser, ambulanceId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: EDIT HOSPITAL BEDS ================= */}
      {editBedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center text-sm font-bold">
                  🛏️
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Update Bed Capacity</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{editBedModal.name} ({editBedModal.location})</p>
                </div>
              </div>
              <button
                onClick={() => setEditBedModal(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBedModal} className="p-6 space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Free / Available Beds *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={editBedModal.availableBeds}
                    onChange={(e) => setEditBedModal({ ...editBedModal, availableBeds: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Total Hospital Capacity *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={editBedModal.totalBeds}
                    onChange={(e) => setEditBedModal({ ...editBedModal, totalBeds: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditBedModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
                >
                  Save Beds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ADD LOCATION / SECTOR MODAL */}
      {showAddLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
                  📍
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Add City Sector / Location</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Expand the Karachi city sectors and map network</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddLocation(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="p-6 space-y-4 text-xs">
              {/* Visual Interactive Map Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                    <span>🗺️</span> Live Visual Placement Preview
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    Click or drag on map to position
                  </span>
                </div>
                <div
                  className="relative w-full h-44 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden cursor-crosshair select-none shadow-inner"
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.round(Math.max(50, Math.min(800, ((e.clientX - rect.left) / rect.width) * 860)));
                    const y = Math.round(Math.max(50, Math.min(420, ((e.clientY - rect.top) / rect.height) * 460)));
                    setNewLocation((prev) => ({ ...prev, x, y, direction: "custom" }));
                  }}
                  onMouseMove={(e) => {
                    if (e.buttons === 1) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.round(Math.max(50, Math.min(800, ((e.clientX - rect.left) / rect.width) * 860)));
                      const y = Math.round(Math.max(50, Math.min(420, ((e.clientY - rect.top) / rect.height) * 460)));
                      setNewLocation((prev) => ({ ...prev, x, y, direction: "custom" }));
                    }
                  }}
                >
                  <svg viewBox="0 0 860 460" className="w-full h-full pointer-events-none">
                    <defs>
                      <pattern id="grid-add" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                      </pattern>
                    </defs>
                    <rect width="860" height="460" fill="url(#grid-add)" />

                    {/* Existing Roads */}
                    {(state?.roads || []).map((r, i) => {
                      const p1 = state?.coords?.[r.u] || { x: 420, y: 140 };
                      const p2 = state?.coords?.[r.v] || { x: 420, y: 140 };
                      return (
                        <line
                          key={i}
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke="#334155"
                          strokeWidth="1.5"
                          opacity={0.35}
                        />
                      );
                    })}

                    {/* Road connection to parent sector */}
                    {newLocation.connectedTo && (
                      <line
                        x1={newLocation.x}
                        y1={newLocation.y}
                        x2={(state?.coords?.[newLocation.connectedTo] || { x: 420, y: 140 }).x}
                        y2={(state?.coords?.[newLocation.connectedTo] || { x: 420, y: 140 }).y}
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeDasharray="5 4"
                      />
                    )}

                    {/* Other City Sector Nodes */}
                    {zonesList.map((z) => {
                      const c = state?.coords?.[z] || { x: 420, y: 140 };
                      const isConnected = z === newLocation.connectedTo;
                      return (
                        <g key={z}>
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r={isConnected ? 9 : 6}
                            fill={isConnected ? "#0284c7" : "#1e293b"}
                            stroke={isConnected ? "#38bdf8" : "#64748b"}
                            strokeWidth={isConnected ? 2 : 1.5}
                          />
                          <text
                            x={c.x}
                            y={c.y + 15}
                            fill={isConnected ? "#38bdf8" : "#94a3b8"}
                            fontSize="10"
                            textAnchor="middle"
                            fontWeight={isConnected ? "bold" : "normal"}
                          >
                            {z}
                          </text>
                        </g>
                      );
                    })}

                    {/* New Sector Pin */}
                    <g>
                      <circle cx={newLocation.x} cy={newLocation.y} r="18" fill="#0284c7" fillOpacity="0.3" className="animate-ping" />
                      <circle cx={newLocation.x} cy={newLocation.y} r="12" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                      <circle cx={newLocation.x} cy={newLocation.y} r="4" fill="#ffffff" />
                      <text
                        x={newLocation.x}
                        y={newLocation.y - 16}
                        fill="#38bdf8"
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {newLocation.name || "New Sector"}
                      </text>
                    </g>
                  </svg>
                  <div className="absolute bottom-2 right-2 bg-slate-900/90 border border-slate-700/80 px-2 py-0.5 rounded text-[10px] font-mono text-sky-400">
                    X: {newLocation.x} | Y: {newLocation.y}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Sector Name *</label>
                  <input
                    required
                    placeholder="e.g. Gulistan-e-Jauhar, Korangi, PECHS"
                    value={newLocation.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      const norm = val.toLowerCase().replace(/[^a-z]/g, "");
                      if (norm.includes("jauhar") || norm.includes("johar")) {
                        setNewLocation({
                          ...newLocation,
                          name: val,
                          connectedTo: "Gulshan",
                          direction: "above",
                          x: 440,
                          y: 70,
                        });
                      } else {
                        setNewLocation({ ...newLocation, name: val });
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Connect Directly To Existing Sector *</label>
                  <select
                    value={newLocation.connectedTo}
                    onChange={(e) => {
                      const sel = e.target.value;
                      const coords = updateLocationPlacement(sel, newLocation.direction, newLocation.name);
                      setNewLocation({
                        ...newLocation,
                        connectedTo: sel,
                        x: coords.x,
                        y: coords.y,
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-600 transition"
                  >
                    {zonesList.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Road Distance (km) *</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={newLocation.distanceKm}
                    onChange={(e) => setNewLocation({ ...newLocation, distanceKm: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                    Map Placement Relative to {newLocation.connectedTo} *
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[
                      { id: "above", label: "⬆️ Above" },
                      { id: "right", label: "➡️ Right" },
                      { id: "below", label: "⬇️ Below" },
                      { id: "left", label: "⬅️ Left" },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          const coords = updateLocationPlacement(newLocation.connectedTo, d.id, newLocation.name);
                          setNewLocation({
                            ...newLocation,
                            direction: d.id,
                            x: coords.x,
                            y: coords.y,
                          });
                        }}
                        className={`py-1.5 px-2 rounded-lg text-center font-medium transition text-[11px] border ${
                          newLocation.direction === d.id
                            ? "bg-sky-50 dark:bg-sky-950/60 border-sky-600 text-sky-700 dark:text-sky-300 font-bold"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Map X Coordinate <span className="text-[10px] text-slate-400 font-normal">(50-800)</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="50"
                      max="800"
                      value={newLocation.x}
                      onChange={(e) => setNewLocation({ ...newLocation, x: parseInt(e.target.value) || 0, direction: "custom" })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-600 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Map Y Coordinate <span className="text-[10px] text-slate-400 font-normal">(50-420)</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="50"
                      max="420"
                      value={newLocation.y}
                      onChange={(e) => setNewLocation({ ...newLocation, y: parseInt(e.target.value) || 0, direction: "custom" })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-600 transition"
                    />
                  </div>
                </div>

                <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-lg p-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 dark:text-slate-300">
                    📍 Placement: <strong>({newLocation.x}, {newLocation.y})</strong>
                  </span>
                  <span className="text-sky-600 dark:text-sky-400 font-semibold">
                    {newLocation.direction === "above"
                      ? `Directly above ${newLocation.connectedTo}`
                      : newLocation.direction === "right"
                      ? `To the right of ${newLocation.connectedTo}`
                      : newLocation.direction === "below"
                      ? `Below ${newLocation.connectedTo}`
                      : newLocation.direction === "left"
                      ? `To the left of ${newLocation.connectedTo}`
                      : "Custom placement"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddLocation(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-sm transition"
                >
                  Add Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ADD / CONNECT ROAD MODAL */}
      {showAddRoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                  🛣️
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Connect Two City Sectors</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Create or update a bidirectional road artery</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddRoad(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoad} className="p-6 space-y-4 text-xs">
              {/* Visual Road Connection Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span>🛣️</span> Live Road Connection Preview
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    Click any node to select endpoint
                  </span>
                </div>
                <div className="relative w-full h-44 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden select-none shadow-inner">
                  <svg viewBox="0 0 860 460" className="w-full h-full">
                    <defs>
                      <pattern id="grid-road" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                      </pattern>
                    </defs>
                    <rect width="860" height="460" fill="url(#grid-road)" />

                    {/* Existing Roads */}
                    {(state?.roads || []).map((r, i) => {
                      const p1 = state?.coords?.[r.u] || { x: 420, y: 140 };
                      const p2 = state?.coords?.[r.v] || { x: 420, y: 140 };
                      return (
                        <line
                          key={i}
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke="#334155"
                          strokeWidth="1.5"
                          opacity={0.35}
                        />
                      );
                    })}

                    {/* Proposed New Road Between u and v */}
                    {newRoad.u && newRoad.v && newRoad.u !== newRoad.v && (() => {
                      const p1 = state?.coords?.[newRoad.u] || { x: 420, y: 140 };
                      const p2 = state?.coords?.[newRoad.v] || { x: 420, y: 140 };
                      const midX = (p1.x + p2.x) / 2;
                      const midY = (p1.y + p2.y) / 2;
                      return (
                        <g>
                          <line
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#10b981"
                            strokeWidth="3.5"
                            strokeDasharray="6 4"
                          />
                          <rect
                            x={midX - 35}
                            y={midY - 12}
                            width="70"
                            height="20"
                            rx="10"
                            fill="#064e3b"
                            stroke="#10b981"
                            strokeWidth="1.5"
                          />
                          <text
                            x={midX}
                            y={midY + 2}
                            fill="#a7f3d0"
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {newRoad.weight} km
                          </text>
                        </g>
                      );
                    })()}

                    {/* City Sector Nodes (Clickable) */}
                    {zonesList.map((z) => {
                      const c = state?.coords?.[z] || { x: 420, y: 140 };
                      const isU = z === newRoad.u;
                      const isV = z === newRoad.v;
                      const isSelected = isU || isV;
                      return (
                        <g
                          key={z}
                          className="cursor-pointer"
                          onClick={() => {
                            if (!isU && !isV) {
                              setNewRoad((prev) => ({ ...prev, v: z }));
                            }
                          }}
                        >
                          {isSelected && (
                            <circle cx={c.x} cy={c.y} r="16" fill="#10b981" fillOpacity="0.3" className="animate-ping" />
                          )}
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r={isSelected ? 10 : 6}
                            fill={isSelected ? "#10b981" : "#1e293b"}
                            stroke={isSelected ? "#ffffff" : "#64748b"}
                            strokeWidth={isSelected ? 2.5 : 1.5}
                          />
                          <text
                            x={c.x}
                            y={c.y + 16}
                            fill={isSelected ? "#6ee7b7" : "#94a3b8"}
                            fontSize="10"
                            textAnchor="middle"
                            fontWeight={isSelected ? "bold" : "normal"}
                          >
                            {z}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">First Sector *</label>
                  <select
                    value={newRoad.u}
                    onChange={(e) => setNewRoad({ ...newRoad, u: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 transition"
                  >
                    {zonesList.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Second Sector *</label>
                  <select
                    value={newRoad.v}
                    onChange={(e) => setNewRoad({ ...newRoad, v: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 transition"
                  >
                    {zonesList.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Travel Distance (km) *</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={newRoad.weight}
                    onChange={(e) => setNewRoad({ ...newRoad, weight: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                {state?.roads?.some((r) => (r.u === newRoad.u && r.v === newRoad.v) || (r.u === newRoad.v && r.v === newRoad.u)) ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteRoad(newRoad.u, newRoad.v)}
                    className="px-3 py-2 text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-200 dark:border-red-900/60 rounded-lg transition flex items-center gap-1.5"
                  >
                    <span>🗑️</span> Disconnect Road
                  </button>
                ) : <div />}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRoad(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
                  >
                    Save Road
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. EDIT SECTOR / LOCATION MODAL */}
      {showEditLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                  ✏️
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Edit Sector / Location</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Click & drag on map to adjust coordinates visually</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditLocation(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateLocation} className="p-6 space-y-4 text-xs">
              {/* Visual Interactive Map Preview with Drag and Click to Adjust */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <span>🎯</span> Live Visual Positioning
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    Click or drag marker on map to adjust position
                  </span>
                </div>
                <div
                  className="relative w-full h-48 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden cursor-crosshair select-none shadow-inner"
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.round(Math.max(50, Math.min(800, ((e.clientX - rect.left) / rect.width) * 860)));
                    const y = Math.round(Math.max(50, Math.min(420, ((e.clientY - rect.top) / rect.height) * 460)));
                    setEditLocation((prev) => ({ ...prev, x, y }));
                  }}
                  onMouseMove={(e) => {
                    if (e.buttons === 1) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.round(Math.max(50, Math.min(800, ((e.clientX - rect.left) / rect.width) * 860)));
                      const y = Math.round(Math.max(50, Math.min(420, ((e.clientY - rect.top) / rect.height) * 460)));
                      setEditLocation((prev) => ({ ...prev, x, y }));
                    }
                  }}
                >
                  <svg viewBox="0 0 860 460" className="w-full h-full pointer-events-none">
                    <defs>
                      <pattern id="grid-edit" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                      </pattern>
                    </defs>
                    <rect width="860" height="460" fill="url(#grid-edit)" />

                    {/* Existing Roads with Dynamic Connected Line Stretch */}
                    {(state?.roads || []).map((r, i) => {
                      const uCoord = r.u === editLocation.selected ? { x: editLocation.x, y: editLocation.y } : (state?.coords?.[r.u] || { x: 420, y: 140 });
                      const vCoord = r.v === editLocation.selected ? { x: editLocation.x, y: editLocation.y } : (state?.coords?.[r.v] || { x: 420, y: 140 });
                      const isConnected = r.u === editLocation.selected || r.v === editLocation.selected;
                      return (
                        <line
                          key={i}
                          x1={uCoord.x}
                          y1={uCoord.y}
                          x2={vCoord.x}
                          y2={vCoord.y}
                          stroke={isConnected ? "#818cf8" : "#334155"}
                          strokeWidth={isConnected ? 2.5 : 1.5}
                          strokeDasharray={isConnected ? "5 4" : "none"}
                          opacity={isConnected ? 0.95 : 0.35}
                        />
                      );
                    })}

                    {/* Other City Sector Nodes */}
                    {zonesList
                      .filter((z) => z !== editLocation.selected)
                      .map((z) => {
                        const c = state?.coords?.[z] || { x: 420, y: 140 };
                        return (
                          <g key={z}>
                            <circle cx={c.x} cy={c.y} r="7" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                            <text x={c.x} y={c.y + 15} fill="#94a3b8" fontSize="10" textAnchor="middle">
                              {z}
                            </text>
                          </g>
                        );
                      })}

                    {/* Target Sector Pin Being Edited (Glowing & Interactive) */}
                    <g>
                      <circle cx={editLocation.x} cy={editLocation.y} r="20" fill="#6366f1" fillOpacity="0.25" className="animate-ping" />
                      <circle cx={editLocation.x} cy={editLocation.y} r="13" fill="#4f46e5" stroke="#ffffff" strokeWidth="2.5" />
                      <circle cx={editLocation.x} cy={editLocation.y} r="4" fill="#ffffff" />
                      <rect
                        x={editLocation.x - 55}
                        y={editLocation.y - 30}
                        width="110"
                        height="18"
                        rx="9"
                        fill="#312e81"
                        stroke="#818cf8"
                        strokeWidth="1"
                      />
                      <text
                        x={editLocation.x}
                        y={editLocation.y - 18}
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {editLocation.newName || editLocation.selected}
                      </text>
                    </g>
                  </svg>

                  <div className="absolute bottom-2 right-2 bg-slate-900/90 border border-slate-700/80 px-2 py-0.5 rounded text-[10px] font-mono text-indigo-300">
                    X: {editLocation.x} | Y: {editLocation.y}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Select Sector to Edit *</label>
                  <select
                    value={editLocation.selected}
                    onChange={(e) => {
                      const sel = e.target.value;
                      const c = state?.coords?.[sel] || { x: 440, y: 70 };
                      setEditLocation({
                        selected: sel,
                        newName: sel,
                        x: c.x,
                        y: c.y,
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 transition"
                  >
                    {zonesList.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">Sector Display Name *</label>
                  <input
                    required
                    value={editLocation.newName}
                    onChange={(e) => setEditLocation({ ...editLocation, newName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                    Quick Nudge / Placement Presets
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => setEditLocation({ ...editLocation, y: Math.max(50, editLocation.y - 25) })}
                      className="py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-700 dark:text-slate-300 text-center font-medium transition text-[11px]"
                    >
                      ⬆️ Up (-25)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditLocation({ ...editLocation, y: Math.min(420, editLocation.y + 25) })}
                      className="py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-700 dark:text-slate-300 text-center font-medium transition text-[11px]"
                    >
                      ⬇️ Down (+25)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditLocation({ ...editLocation, x: Math.max(50, editLocation.x - 25) })}
                      className="py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-700 dark:text-slate-300 text-center font-medium transition text-[11px]"
                    >
                      ⬅️ Left (-25)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditLocation({ ...editLocation, x: Math.min(800, editLocation.x + 25) })}
                      className="py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-700 dark:text-slate-300 text-center font-medium transition text-[11px]"
                    >
                      ➡️ Right (+25)
                    </button>
                  </div>

                  {editLocation.selected.toLowerCase().includes("jauhar") && (
                    <button
                      type="button"
                      onClick={() => setEditLocation({ ...editLocation, x: 440, y: 70 })}
                      className="w-full mt-1 py-1.5 px-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold text-center text-[11px] transition hover:bg-indigo-100"
                    >
                      📍 Position Directly Above Gulshan: (440, 70)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Canvas X <span className="text-[10px] text-slate-400 font-normal">(50-800)</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="50"
                      max="800"
                      value={editLocation.x}
                      onChange={(e) => setEditLocation({ ...editLocation, x: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Canvas Y <span className="text-[10px] text-slate-400 font-normal">(50-420)</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="50"
                      max="420"
                      value={editLocation.y}
                      onChange={(e) => setEditLocation({ ...editLocation, y: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 transition"
                    />
                  </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-lg p-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 dark:text-slate-300">
                    📍 Placement: <strong>({editLocation.x}, {editLocation.y})</strong>
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    Live updates map display and dispatch routing
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteLocation(editLocation.selected)}
                  className="px-3.5 py-2 text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-200 dark:border-red-900/60 rounded-lg transition flex items-center gap-1.5"
                >
                  <span>🗑️</span> Remove Sector
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditLocation(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
