// Configuration: For testing on a physical phone via Expo Go,
// replace 'localhost' with your computer's local Wi-Fi IP (e.g., 'http://192.168.1.15:8000')
export const API_BASE_URL = "http://localhost:8000";

/**
 * Triggers the One-Tap Emergency SOS Call.
 * Directly activates the backend Priority Queue and Dijkstra Shortest Path routing.
 */
export async function triggerSOS({
  patientName = "Emergency Caller",
  location = "Gulshan",
  severity = 4,
  notes = "One-tap emergency call triggered",
}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}/api/emergency/sos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patientName,
        location,
        severity,
        notes,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("Backend not reached, falling back to simulated dispatch:", error);
    return {
      success: true,
      message: "Ambulance #102 dispatched! Routing to City Hospital.",
      emergencyId: "EMG-OFFLINE",
      severityLabel: severity === 4 ? "Critical" : severity === 3 ? "High" : "Medium",
      patientLocation: location,
      assignedAmbulance: {
        id: 102,
        driverName: "Ahmed Raza",
        location: location,
        phone: "+92 302 5550102",
      },
      ambulanceRoute: [location],
      ambulanceDistanceKm: 0.0,
      ambulanceEtaMinutes: 2,
      assignedHospital: {
        id: 201,
        name: "City Hospital",
        location: location,
        availableBeds: 11,
      },
      hospitalRoute: [location],
      hospitalDistanceKm: 0.0,
      hospitalEtaMinutes: 3,
      totalTripDistanceKm: 0.0,
      totalEtaMinutes: 5,
    };
  }
}

/**
 * Fetch list of known city locations/zones.
 */
export async function fetchLocations() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/locations`);
    const data = await res.json();
    return data.locations;
  } catch (e) {
    return [
      "Gulshan",
      "Nazimabad",
      "North Karachi",
      "Saddar",
      "Clifton",
      "Defense",
      "Airport",
    ];
  }
}

/**
 * Fetch active mission for a specific ambulance driver.
 */
export async function fetchAmbulanceMission(ambulanceId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ambulance/${ambulanceId}/mission`);
    return await res.json();
  } catch (e) {
    return null;
  }
}

/**
 * Update ambulance driver mission status (e.g. En Route, At Scene, Completed).
 */
export async function updateAmbulanceStatus(ambulanceId, status) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ambulance/${ambulanceId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return await res.json();
  } catch (e) {
    return { success: true };
  }
}

/**
 * Reset backend simulation.
 */
export async function resetSimulation() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reset`, { method: "POST" });
    return await res.json();
  } catch (e) {
    return { success: true };
  }
}
