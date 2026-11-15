/**
 * ResQRoute Authenticated API Client for React Web Control Room
 */
export const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "https://resqroute-cq1x.onrender.com";

export function getAuthToken() {
  return localStorage.getItem("resqroute_token");
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("resqroute_token", token);
  } else {
    localStorage.removeItem("resqroute_token");
  }
}

export function getCurrentUser() {
  const user = localStorage.getItem("resqroute_user");
  return user ? JSON.parse(user) : null;
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem("resqroute_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("resqroute_user");
  }
}

export function logout() {
  setAuthToken(null);
  setCurrentUser(null);
}

function authHeaders() {
  const token = getAuthToken();
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Invalid login credentials");
  }
  const data = await res.json();
  setAuthToken(data.accessToken);
  setCurrentUser(data.user);
  return data;
}

export async function fetchSystemStatus() {
  const res = await fetch(`${API_BASE_URL}/api/status`, {
    headers: authHeaders(),
  });
  return await res.json();
}

export async function fetchRoads() {
  const res = await fetch(`${API_BASE_URL}/api/roads`, {
    headers: authHeaders(),
  });
  return await res.json();
}

export async function fetchLocations() {
  const res = await fetch(`${API_BASE_URL}/api/locations`, {
    headers: authHeaders(),
  });
  return await res.json();
}

export async function addLocation(payload) {
  const res = await fetch(`${API_BASE_URL}/api/locations`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to add location");
  }
  return await res.json();
}

export async function addRoad(payload) {
  const res = await fetch(`${API_BASE_URL}/api/roads`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to add road");
  }
  return await res.json();
}

export async function planRoute(start, destination) {
  const res = await fetch(
    `${API_BASE_URL}/api/route/plan?start=${encodeURIComponent(start)}&destination=${encodeURIComponent(destination)}`,
    {
      headers: authHeaders(),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to calculate route");
  }
  return await res.json();
}

export async function toggleRoad(u, v) {
  const res = await fetch(`${API_BASE_URL}/api/road/toggle`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ u, v }),
  });
  return await res.json();
}

export async function triggerEmergency(payload) {
  const res = await fetch(`${API_BASE_URL}/api/emergency/sos`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function freeAmbulance(id) {
  const res = await fetch(`${API_BASE_URL}/api/ambulance/${id}/status`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ status: "Completed" }),
  });
  return await res.json();
}

export async function resetSystem() {
  const res = await fetch(`${API_BASE_URL}/api/reset`, {
    method: "POST",
    headers: authHeaders(),
  });
  return await res.json();
}

// ─── Admin API ────────────────────────────────────────────────────────────────

export async function fetchUsers() {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return await res.json();
}

export async function createUser(payload) {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create user");
  }
  return await res.json();
}

export async function toggleUserActive(userId, activate) {
  const endpoint = activate ? "activate" : "deactivate";
  const res = await fetch(
    `${API_BASE_URL}/api/admin/users/${userId}/${endpoint}`,
    { method: "PATCH", headers: authHeaders() }
  );
  return await res.json();
}

export async function deleteUser(userId) {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return await res.json();
}

export async function fetchAdminHospitals() {
  const res = await fetch(`${API_BASE_URL}/api/admin/hospitals`, {
    headers: authHeaders(),
  });
  return await res.json();
}

export async function createHospital(payload) {
  const res = await fetch(`${API_BASE_URL}/api/admin/hospitals`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function updateHospitalBeds(hospitalId, payload) {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/hospitals/${hospitalId}/beds`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return await res.json();
}

export async function fetchAdminAmbulances() {
  const res = await fetch(`${API_BASE_URL}/api/admin/ambulances`, {
    headers: authHeaders(),
  });
  return await res.json();
}

export async function createAmbulance(payload) {
  const res = await fetch(`${API_BASE_URL}/api/admin/ambulances`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function fetchIncidents() {
  const res = await fetch(`${API_BASE_URL}/api/incidents`, {
    headers: authHeaders(),
  });
  return await res.json();
}
