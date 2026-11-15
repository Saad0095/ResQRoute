import React, { useState, useEffect } from "react";
import {
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
import {
  Users,
  Building2,
  Truck,
  Plus,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  BarChart3,
  Sliders,
  FileText,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Dashboard Overview", icon: BarChart3 },
  { id: "users", label: "Users & Staff", icon: Users },
  { id: "fleet", label: "Ambulance Fleet", icon: Truck },
  { id: "hospitals", label: "Hospital Facilities", icon: Building2 },
  { id: "incidents", label: "Call History", icon: FileText },
  { id: "settings", label: "System Settings", icon: Sliders },
];

const ROLE_COLORS = {
  ADMIN: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300",
  DISPATCHER: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300",
  DRIVER: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300",
  CITIZEN: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300",
};

export default function AdminPanel({ user, onLogout, onSwitchView }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { theme, toggleTheme } = useTheme();

  // Settings State
  const [emergencyHotline, setEmergencyHotline] = useState("+92 21 1122 0000");
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [alertSound, setAlertSound] = useState(true);

  // Forms
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "DRIVER",
    phone: "",
    ambulanceId: "",
  });

  const [showCreateHospital, setShowCreateHospital] = useState(false);
  const [newHospital, setNewHospital] = useState({
    name: "",
    location: "Gulshan",
    totalBeds: 15,
    availableBeds: 12,
  });

  const [showCreateAmbulance, setShowCreateAmbulance] = useState(false);
  const [newAmbulance, setNewAmbulance] = useState({
    id: "",
    driverName: "",
    location: "Gulshan",
    phone: "",
  });

  const showMsg = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, h, a, inc] = await Promise.all([
        fetchUsers().catch(() => []),
        fetchAdminHospitals().catch(() => []),
        fetchAdminAmbulances().catch(() => []),
        fetchIncidents().catch(() => ({ incidents: [] })),
      ]);
      setUsers(u);
      setHospitals(h);
      setAmbulances(a);
      setIncidents(inc.incidents || []);
    } catch (err) {
      showMsg(err.message, true);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createUser({
        ...newUser,
        ambulanceId: newUser.ambulanceId ? parseInt(newUser.ambulanceId) : null,
      });
      showMsg("User created successfully!");
      setShowCreateUser(false);
      setNewUser({ email: "", password: "", fullName: "", role: "DRIVER", phone: "", ambulanceId: "" });
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleToggleUser = async (userId, currentlyActive) => {
    try {
      await toggleUserActive(userId, !currentlyActive);
      showMsg(`User ${!currentlyActive ? "activated" : "deactivated"}.`);
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!confirm(`Delete user ${email}?`)) return;
    try {
      await deleteUser(userId);
      showMsg("User deleted.");
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleCreateHospital = async (e) => {
    e.preventDefault();
    try {
      await createHospital(newHospital);
      showMsg("Hospital added.");
      setShowCreateHospital(false);
      setNewHospital({ name: "", location: "Gulshan", totalBeds: 15, availableBeds: 12 });
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleUpdateBeds = async (hospitalId, availableBeds, totalBeds) => {
    const newAvail = prompt("Enter new available bed count:", availableBeds);
    if (newAvail === null) return;
    try {
      await updateHospitalBeds(hospitalId, { availableBeds: parseInt(newAvail), totalBeds });
      showMsg("Hospital beds updated.");
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleCreateAmbulance = async (e) => {
    e.preventDefault();
    try {
      await createAmbulance({
        ...newAmbulance,
        id: parseInt(newAmbulance.id),
      });
      showMsg("Ambulance registered.");
      setShowCreateAmbulance(false);
      setNewAmbulance({ id: "", driverName: "", location: "Gulshan", phone: "" });
      loadData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  // Metrics
  const totalBeds = hospitals.reduce((sum, h) => sum + h.totalBeds, 0);
  const freeBeds = hospitals.reduce((sum, h) => sum + h.availableBeds, 0);
  const availableAmbulances = ambulances.filter((a) => a.isAvailable).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-purple-600/20">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">
              ResQRoute Administration
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              System Management & Configuration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={onSwitchView}
            className="px-3 py-1.5 font-semibold bg-red-50 dark:bg-red-600/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-600/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-600/30 transition"
          >
            ← Open Control Room
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-800 pl-3">
            <span className="font-semibold text-gray-900 dark:text-white">{user.fullName}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
              {user.role}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition ml-2"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}
      {success && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs flex items-center gap-2">
          <CheckCircle size={15} /> {success}
        </div>
      )}

      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <aside className="w-60 bg-white dark:bg-gray-900/60 border-r border-gray-200 dark:border-gray-800 p-4 transition-colors">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3">
            Navigation
          </p>
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? "bg-purple-50 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300 font-semibold"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content View */}
        <main className="flex-1 p-6">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* 1. OVERVIEW PAGE */}
          {activeTab === "overview" && !loading && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  System Overview
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Live summary of emergency response operations
                </p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Ambulances</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{ambulances.length}</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                    {availableAmbulances} ready for calls
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Hospital Beds</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{freeBeds} / {totalBeds}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                    {hospitals.length} active hospitals
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs text-gray-500 dark:text-gray-400">System Users</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{users.length}</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium">
                    Drivers & Dispatchers
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Calls Logged</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{incidents.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                    All emergency dispatches
                  </div>
                </div>
              </div>

              {/* Quick Table: Recent Calls */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Latest Dispatched Calls
                  </h3>
                  <button
                    onClick={() => setActiveTab("incidents")}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
                  >
                    View All →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-left">
                        <th className="pb-2">Call ID</th>
                        <th className="pb-2">Patient</th>
                        <th className="pb-2">Sector</th>
                        <th className="pb-2">Urgency</th>
                        <th className="pb-2">Vehicle</th>
                        <th className="pb-2">ETA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {incidents.slice(0, 5).map((inc) => (
                        <tr key={inc.id} className="text-gray-700 dark:text-gray-300">
                          <td className="py-2.5 font-medium">{inc.emergencyId}</td>
                          <td className="py-2.5">{inc.patientName}</td>
                          <td className="py-2.5">{inc.location}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                              {inc.severityLabel}
                            </span>
                          </td>
                          <td className="py-2.5">Ambulance #{inc.ambulanceId || "—"}</td>
                          <td className="py-2.5 font-medium">{inc.etaMinutes} mins</td>
                        </tr>
                      ))}
                      {incidents.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-gray-400">
                            No dispatch records yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. USERS PAGE */}
          {activeTab === "users" && !loading && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Staff & User Accounts</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage operator and driver credentials</p>
                </div>
                <button
                  onClick={() => setShowCreateUser(!showCreateUser)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl transition shadow-sm"
                >
                  <Plus size={14} /> Add User
                </button>
              </div>

              {showCreateUser && (
                <form onSubmit={handleCreateUser} className="mb-5 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Add New Account</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      required
                      placeholder="Full Name"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                      className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      required
                      type="email"
                      placeholder="Email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      required
                      type="password"
                      placeholder="Password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="DRIVER">Driver</option>
                      <option value="DISPATCHER">Dispatcher</option>
                      <option value="CITIZEN">Citizen</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <input
                      placeholder="Phone (optional)"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      placeholder="Ambulance ID (drivers only)"
                      value={newUser.ambulanceId}
                      onChange={(e) => setNewUser({ ...newUser, ambulanceId: e.target.value })}
                      className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button type="submit" className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-xl hover:bg-purple-500">
                      Save Account
                    </button>
                    <button type="button" onClick={() => setShowCreateUser(false)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-xl">
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-left">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Ambulance</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {users.map((u) => (
                      <tr key={u.id} className="text-gray-700 dark:text-gray-300">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{u.fullName}</td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded font-medium ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-700"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{u.ambulanceId ? `#${u.ambulanceId}` : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${u.isActive ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300"}`}>
                            {u.isActive ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggleUser(u.id, u.isActive)}
                              className="px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              {u.isActive ? "Disable" : "Enable"}
                            </button>
                            {user.role === "ADMIN" && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. FLEET PAGE */}
          {activeTab === "fleet" && !loading && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ambulance Fleet</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage emergency response vehicles</p>
                </div>
                <button
                  onClick={() => setShowCreateAmbulance(!showCreateAmbulance)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition shadow-sm"
                >
                  <Plus size={14} /> Register Ambulance
                </button>
              </div>

              {showCreateAmbulance && (
                <form onSubmit={handleCreateAmbulance} className="mb-5 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Register New Vehicle</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      required
                      type="number"
                      placeholder="Vehicle ID (e.g. 106)"
                      value={newAmbulance.id}
                      onChange={(e) => setNewAmbulance({ ...newAmbulance, id: e.target.value })}
                      className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      required
                      placeholder="Driver Name"
                      value={newAmbulance.driverName}
                      onChange={(e) => setNewAmbulance({ ...newAmbulance, driverName: e.target.value })}
                      className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      required
                      placeholder="Base Location"
                      value={newAmbulance.location}
                      onChange={(e) => setNewAmbulance({ ...newAmbulance, location: e.target.value })}
                      className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      placeholder="Phone"
                      value={newAmbulance.phone}
                      onChange={(e) => setNewAmbulance({ ...newAmbulance, phone: e.target.value })}
                      className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-xl hover:bg-blue-500">
                      Save Ambulance
                    </button>
                    <button type="button" onClick={() => setShowCreateAmbulance(false)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-xl">
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ambulances.map((a) => (
                  <div key={a.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-gray-900 dark:text-white text-sm">Ambulance #{a.id}</div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${a.isAvailable ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"}`}>
                        {a.isAvailable ? "Ready" : a.status || "Busy"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div>Driver: <span className="font-medium text-gray-800 dark:text-gray-200">{a.driverName}</span></div>
                      <div>Base: <span className="font-medium text-gray-800 dark:text-gray-200">{a.location}</span></div>
                      <div>Phone: <span className="font-medium text-gray-800 dark:text-gray-200">{a.phone || "—"}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. HOSPITALS PAGE */}
          {activeTab === "hospitals" && !loading && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Hospital Facilities</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Emergency bed allocation & monitoring</p>
                </div>
                <button
                  onClick={() => setShowCreateHospital(!showCreateHospital)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl transition shadow-sm"
                >
                  <Plus size={14} /> Add Hospital
                </button>
              </div>

              {showCreateHospital && (
                <form onSubmit={handleCreateHospital} className="mb-5 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Add New Hospital</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      required
                      placeholder="Hospital Name"
                      value={newHospital.name}
                      onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                      className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      required
                      placeholder="Location"
                      value={newHospital.location}
                      onChange={(e) => setNewHospital({ ...newHospital, location: e.target.value })}
                      className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      required
                      type="number"
                      placeholder="Total Beds"
                      value={newHospital.totalBeds}
                      onChange={(e) => setNewHospital({ ...newHospital, totalBeds: parseInt(e.target.value) || 0 })}
                      className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      required
                      type="number"
                      placeholder="Available Beds"
                      value={newHospital.availableBeds}
                      onChange={(e) => setNewHospital({ ...newHospital, availableBeds: parseInt(e.target.value) || 0 })}
                      className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-xl hover:bg-emerald-500">
                      Save Hospital
                    </button>
                    <button type="button" onClick={() => setShowCreateHospital(false)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-xl">
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hospitals.map((h) => {
                  const pct = Math.round((h.availableBeds / h.totalBeds) * 100);
                  return (
                    <div key={h.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white text-sm">{h.name}</div>
                          <div className="text-xs text-gray-500">📍 {h.location}</div>
                        </div>
                        <button
                          onClick={() => handleUpdateBeds(h.id, h.availableBeds, h.totalBeds)}
                          className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                        >
                          Edit Beds
                        </button>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                          <span>Capacity</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{h.availableBeds} / {h.totalBeds} Free</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. INCIDENTS / CALL HISTORY PAGE */}
          {activeTab === "incidents" && !loading && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Emergency Call History</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Chronological record of all emergency dispatches</p>
                </div>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Refresh Data
                </button>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-left">
                      <th className="px-4 py-3">Call ID</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Urgency</th>
                      <th className="px-4 py-3">Ambulance</th>
                      <th className="px-4 py-3">Distance</th>
                      <th className="px-4 py-3">ETA</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {incidents.map((inc) => (
                      <tr key={inc.id} className="text-gray-700 dark:text-gray-300">
                        <td className="px-4 py-3 font-semibold text-purple-600 dark:text-purple-400">{inc.emergencyId}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{inc.patientName}</td>
                        <td className="px-4 py-3">{inc.location}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                            {inc.severityLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">#{inc.ambulanceId || "—"}</td>
                        <td className="px-4 py-3">{inc.distanceKm?.toFixed(1)} km</td>
                        <td className="px-4 py-3 font-medium">{inc.etaMinutes} mins</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-medium">
                            {inc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {incidents.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-400">
                          No calls recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. SYSTEM SETTINGS PAGE */}
          {activeTab === "settings" && !loading && (
            <div className="max-w-2xl">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">System Settings</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Control room operational preferences</p>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-5">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Emergency Dispatch Hotline
                  </label>
                  <input
                    type="text"
                    value={emergencyHotline}
                    onChange={(e) => setEmergencyHotline(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Displayed on citizen mobile application.</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">Automatic Dispatch Assignment</div>
                    <div className="text-[11px] text-gray-500">Automatically assign the nearest available ambulance when SOS is received.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoDispatch}
                    onChange={(e) => setAutoDispatch(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">Audible Alerts for Critical Calls</div>
                    <div className="text-[11px] text-gray-500">Play alert tone when high-urgency emergencies are received.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertSound}
                    onChange={(e) => setAlertSound(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => showMsg("Settings saved successfully!")}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl transition shadow-sm"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
