import uuid
import math
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    from dsa.graph import CityGraph, build_default_city_map
    from dsa.priority_queue import EmergencyPriorityQueue, TriageEmergency
    from models import AmbulanceModel, HospitalModel, SOSRequest, DispatchResponse
except ImportError:
    from backend.dsa.graph import CityGraph, build_default_city_map
    from backend.dsa.priority_queue import EmergencyPriorityQueue, TriageEmergency
    from backend.models import AmbulanceModel, HospitalModel, SOSRequest, DispatchResponse

app = FastAPI(
    title="ResQRoute Intelligent Emergency Dispatch API",
    description="Backend DSA Engine combining Priority Queue Triage with Dijkstra's Shortest Path Routing.",
    version="2.0.0"
)

# Enable CORS for Mobile App and Web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory State
graph: CityGraph = build_default_city_map()
triage_queue: EmergencyPriorityQueue = EmergencyPriorityQueue()
ambulances: List[AmbulanceModel] = []
hospitals: List[HospitalModel] = []
dispatch_history: List[Dict[str, Any]] = []


def init_default_records():
    global ambulances, hospitals, triage_queue, dispatch_history
    ambulances = [
        AmbulanceModel(id=101, driverName="Ali Khan", location="North Karachi", isAvailable=True, phone="+92 301 5550101"),
        AmbulanceModel(id=102, driverName="Ahmed Raza", location="Gulshan", isAvailable=True, phone="+92 302 5550102"),
        AmbulanceModel(id=103, driverName="Usman Sheikh", location="Nazimabad", isAvailable=True, phone="+92 303 5550103"),
        AmbulanceModel(id=104, driverName="Tariq Jameel", location="Saddar", isAvailable=True, phone="+92 304 5550104"),
        AmbulanceModel(id=105, driverName="Hamza Qureshi", location="Clifton", isAvailable=True, phone="+92 305 5550105"),
    ]
    hospitals = [
        HospitalModel(id=201, name="City Hospital", location="Gulshan", totalBeds=15, availableBeds=12),
        HospitalModel(id=202, name="Central Medical Complex", location="Nazimabad", totalBeds=10, availableBeds=5),
        HospitalModel(id=203, name="South City Hospital", location="Clifton", totalBeds=20, availableBeds=8),
        HospitalModel(id=204, name="Civil Trauma Center", location="Saddar", totalBeds=25, availableBeds=14),
    ]
    triage_queue = EmergencyPriorityQueue()
    dispatch_history = []


init_default_records()


@app.get("/")
def root():
    return {
        "project": "ResQRoute Intelligent Dispatch System",
        "status": "online",
        "dsaEngines": ["Dijkstra Shortest Path", "Priority Queue Max-Heap Triage"],
        "endpoints": {
            "sos": "POST /api/emergency/sos",
            "status": "GET /api/status",
            "reset": "POST /api/reset",
            "locations": "GET /api/locations"
        }
    }


@app.get("/api/locations")
def get_locations():
    return {"locations": graph.get_nodes()}


@app.get("/api/status")
def get_system_status():
    return {
        "ambulances": [a.dict() for a in ambulances],
        "hospitals": [h.dict() for h in hospitals],
        "pendingEmergencies": triage_queue.to_list(),
        "recentDispatches": dispatch_history[-10:],
        "availableZones": graph.get_nodes()
    }


@app.post("/api/emergency/sos", response_model=DispatchResponse)
def trigger_sos(request: SOSRequest):
    """
    Core One-Tap Dispatch Workflow:
    1. Register call & insert into Priority Queue (Max-Heap based on Severity).
    2. Extract highest-priority emergency.
    3. Run Dijkstra's Algorithm on Road Graph to find the CLOSEST available ambulance.
    4. Run Dijkstra's Algorithm to find the CLOSEST hospital with free beds.
    5. Mark ambulance 'Busy' and decrement hospital bed count.
    6. Return complete dispatch decision with route steps & ETA.
    """
    patient_loc = request.location
    if patient_loc not in graph.get_nodes():
        # Fallback to closest known node or first node if not exact match
        patient_loc = "Gulshan"

    emergency_id = f"EMG-{uuid.uuid4().hex[:6].upper()}"
    triage_item = TriageEmergency(
        emergency_id=emergency_id,
        patient_name=request.patientName,
        location=patient_loc,
        severity=request.severity,
        description=request.notes or ""
    )
    triage_queue.push(triage_item)

    # Pop highest priority call to process
    current_call = triage_queue.pop()
    severity_labels = {1: "Low", 2: "Medium", 3: "High", 4: "Critical"}
    sev_label = severity_labels.get(current_call.severity, "Critical")

    # 1. Dijkstra from patient location to evaluate all node distances
    distances_from_patient, _ = graph.dijkstra(patient_loc)

    # 2. Find closest available ambulance using shortest path distances
    best_ambulance: Optional[AmbulanceModel] = None
    best_amb_dist = float("inf")
    best_amb_path: List[str] = []

    for amb in ambulances:
        if amb.isAvailable and amb.location in distances_from_patient:
            path, dist = graph.get_shortest_path(amb.location, patient_loc)
            if dist < best_amb_dist:
                best_amb_dist = dist
                best_ambulance = amb
                best_amb_path = path

    if not best_ambulance:
        # Re-queue the emergency since no ambulance is free right now
        triage_queue.push(current_call)
        return DispatchResponse(
            success=False,
            message="All ambulances are currently busy! Emergency is queued in priority order.",
            emergencyId=emergency_id,
            severityLabel=sev_label,
            patientLocation=patient_loc
        )

    # 3. Find closest hospital with capacity > 0
    best_hospital: Optional[HospitalModel] = None
    best_hosp_dist = float("inf")
    best_hosp_path: List[str] = []

    for hosp in hospitals:
        if hosp.availableBeds > 0 and hosp.location in distances_from_patient:
            dist_to_hosp = distances_from_patient[hosp.location]
            if dist_to_hosp < best_hosp_dist:
                path, dist = graph.get_shortest_path(patient_loc, hosp.location)
                best_hosp_dist = dist
                best_hospital = hosp
                best_hosp_path = path

    # 4. State updates
    best_ambulance.isAvailable = False

    if best_hospital:
        best_hospital.availableBeds = max(0, best_hospital.availableBeds - 1)

    # ETA calculations: assuming ~35-40 km/h average emergency speed (~1.5 min per km) + 2 min prep
    amb_eta = max(2, math.ceil(best_amb_dist * 1.5))
    hosp_eta = max(3, math.ceil(best_hosp_dist * 1.5))
    total_dist = round(best_amb_dist + (best_hosp_dist if best_hosp_dist != float("inf") else 0.0), 1)
    total_eta = amb_eta + hosp_eta

    result = DispatchResponse(
        success=True,
        message=f"Ambulance #{best_ambulance.id} dispatched! Routing to {best_hospital.name if best_hospital else 'Nearest Clinic'}.",
        emergencyId=emergency_id,
        severityLabel=sev_label,
        patientLocation=patient_loc,
        assignedAmbulance=best_ambulance,
        ambulanceRoute=best_amb_path,
        ambulanceDistanceKm=round(best_amb_dist, 1),
        ambulanceEtaMinutes=amb_eta,
        assignedHospital=best_hospital,
        hospitalRoute=best_hosp_path,
        hospitalDistanceKm=round(best_hosp_dist, 1) if best_hospital else 0.0,
        hospitalEtaMinutes=hosp_eta if best_hospital else 0,
        totalTripDistanceKm=total_dist,
        totalEtaMinutes=total_eta
    )

    # Record in history
    dispatch_history.append(result.dict())
    return result


@app.post("/api/reset")
def reset_system():
    init_default_records()
    return {"success": True, "message": "System reset to default state. All ambulances available and beds restored."}
