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
  const [newAmbulance, setNewAmbulance] = useState({ id: "", driverName: "", location: "Gulshan", phone: "" });
  const [showAddHospital, setShowAddHospital] = useState(false);
  const [newHospital, setNewHospital] = useState({ name: "", location: "Gulshan", totalBeds: 20, availableBeds: 15 });
  const [editBedModal, setEditBedModal] = useState(null);

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
      const [statusData, roadsData] = await Promise.all([
        fetchSystemStatus(),
        fetchRoads(),
      ]);
      setState({ ...statusData, roads: roadsData.roads });

      if (user.role === "ADMIN" || user.role === "DISPATCHER") {
        const [u, h, a, inc] = await Promise.all([
          fetchUsers().catch(() => []),
          fetchAdminHospitals().catch(() => []),
          fetchAdminAmbulances().catch(() => []),
          fetchIncidents().catch(() => ({ incidents: [] })),
        ]);
        setUsersList(u);
        setHospitalsList(h);
        setAmbulancesList(a);
        setIncidents(inc.incidents || []);
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
        setActiveRoute(res.ambulanceRoute);
        setActiveDispatch(res);
        showMsg(`Ambulance #${res.assignedAmbulance.id} dispatched! ETA: ${res.ambulanceEtaMinutes} mins.`);
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
    try {
      await createHospital(newHospital);
      showMsg("Hospital added.");
      setShowAddHospital(false);
      setNewHospital({ name: "", location: "Gulshan", totalBeds: 20, availableBeds: 15 });
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
    try {
      await createAmbulance({ ...newAmbulance, id: parseInt(newAmbulance.id) });
      showMsg("Ambulance registered.");
      setShowAddAmbulance(false);
      setNewAmbulance({ id: "", driverName: "", location: "Gulshan", phone: "" });
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

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
            onClick={handleReset}
            title="Reset simulation to default state"
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1"
          >
            <span>↺</span>
            <span className="hidden sm:inline">Reset</span>
          </button>

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
                        <div className="mt-3 flex justify-end">
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
                        <option value="Gulshan">Gulshan</option>
                        <option value="Nazimabad">Nazimabad</option>
                        <option value="North Karachi">North Karachi</option>
                        <option value="Saddar">Saddar</option>
                        <option value="Clifton">Clifton</option>
                        <option value="Defense">Defense</option>
                        <option value="Airport">Airport</option>
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
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">City Sectors & Road Network</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Live location of ambulances, hospitals, and real-time navigation paths
                </p>
              </div>

              <CityMap
                state={state}
                activeRoute={activeRoute}
                activeDispatch={activeDispatch}
              />

              <RoadControls
                roads={state?.roads}
                onToggleRoad={handleToggleRoad}
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
                      <option value="Gulshan">Gulshan</option>
                      <option value="Nazimabad">Nazimabad</option>
                      <option value="North Karachi">North Karachi</option>
                      <option value="Saddar">Saddar</option>
                      <option value="Clifton">Clifton</option>
                      <option value="Defense">Defense</option>
                      <option value="Airport">Airport</option>
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
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Call History</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Chronological record of emergency dispatches and live field status</p>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {incidents.map((inc) => (
                      <tr key={inc.id} className="text-slate-700 dark:text-slate-300">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{inc.emergencyId}</td>
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
                      </tr>
                    ))}
                    {incidents.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400">
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
                    value={newAmbulance.location}
                    onChange={(e) => setNewAmbulance({ ...newAmbulance, location: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  >
                    <option value="Gulshan">Gulshan</option>
                    <option value="Nazimabad">Nazimabad</option>
                    <option value="North Karachi">North Karachi</option>
                    <option value="Saddar">Saddar</option>
                    <option value="Clifton">Clifton</option>
                    <option value="Defense">Defense</option>
                    <option value="Airport">Airport</option>
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
                    value={newHospital.location}
                    onChange={(e) => setNewHospital({ ...newHospital, location: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 transition"
                  >
                    <option value="Gulshan">Gulshan</option>
                    <option value="Nazimabad">Nazimabad</option>
                    <option value="North Karachi">North Karachi</option>
                    <option value="Saddar">Saddar</option>
                    <option value="Clifton">Clifton</option>
                    <option value="Defense">Defense</option>
                    <option value="Airport">Airport</option>
                  </select>
                </div>

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
    </div>
  );
}
