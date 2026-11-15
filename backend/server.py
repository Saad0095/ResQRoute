import os
import sys
import uuid
import math
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware

# Ensure both backend/ and project root are in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(backend_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from dsa.graph import CityGraph, build_default_city_map
from dsa.priority_queue import EmergencyPriorityQueue, TriageEmergency
from models import (
    AmbulanceModel, HospitalModel, SOSRequest, DispatchResponse,
    RoadToggleRequest, DriverStatusUpdate, AddLocationRequest, AddRoadRequest
)
from database.seed import init_and_seed_db
from database.connection import SessionLocal
from database.models_db import IncidentDB
from routers.auth import router as auth_router
from routers.admin import router as admin_router

app = FastAPI(
    title="ResQRoute Intelligent Emergency Dispatch API",
    description="Enterprise Backend DSA Engine combining Priority Queue Triage with Dijkstra's Shortest Path Routing.",
    version="3.0.0"
)

# Enable CORS for Mobile App and Web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Auth router
app.include_router(auth_router)

# Mount Admin router
app.include_router(admin_router)

# Initialize and seed database tables
init_and_seed_db()

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

# In-Memory State
graph: CityGraph = build_default_city_map()
triage_queue: EmergencyPriorityQueue = EmergencyPriorityQueue()
ambulances: List[AmbulanceModel] = []
hospitals: List[HospitalModel] = []
dispatch_history: List[Dict[str, Any]] = []

custom_node_coords: Dict[str, Dict[str, int]] = {
    "North Karachi": {"x": 180, "y": 70},
    "Nazimabad": {"x": 150, "y": 190},
    "Gulshan": {"x": 420, "y": 140},
    "Saddar": {"x": 270, "y": 290},
    "Airport": {"x": 670, "y": 170},
    "Malir": {"x": 770, "y": 130},
    "Shahrah-e-Faisal": {"x": 480, "y": 260},
    "Clifton": {"x": 200, "y": 400},
    "Defense": {"x": 490, "y": 390},
}


def init_default_records():
    global ambulances, hospitals, triage_queue, dispatch_history, graph
    graph = build_default_city_map()
    ambulances = [
        AmbulanceModel(id=101, driverName="Ali Khan", location="North Karachi", isAvailable=True, phone="+92 301 5550101", status="Available"),
        AmbulanceModel(id=102, driverName="Ahmed Raza", location="Gulshan", isAvailable=True, phone="+92 302 5550102", status="Available"),
        AmbulanceModel(id=103, driverName="Usman Sheikh", location="Nazimabad", isAvailable=True, phone="+92 303 5550103", status="Available"),
        AmbulanceModel(id=104, driverName="Tariq Jameel", location="Saddar", isAvailable=True, phone="+92 304 5550104", status="Available"),
        AmbulanceModel(id=105, driverName="Hamza Qureshi", location="Clifton", isAvailable=True, phone="+92 305 5550105", status="Available"),
        AmbulanceModel(id=106, driverName="Kamran Akmal", location="Malir", isAvailable=True, phone="+92 306 5550106", status="Available"),
    ]
    hospitals = [
        HospitalModel(id=201, name="City Hospital", location="Gulshan", totalBeds=15, availableBeds=12),
        HospitalModel(id=202, name="Central Medical Complex", location="Nazimabad", totalBeds=10, availableBeds=5),
        HospitalModel(id=203, name="South City Hospital", location="Clifton", totalBeds=20, availableBeds=8),
        HospitalModel(id=204, name="Civil Trauma Center", location="Saddar", totalBeds=25, availableBeds=14),
        HospitalModel(id=205, name="JPMC Emergency Care", location="Shahrah-e-Faisal", totalBeds=30, availableBeds=18),
    ]
    triage_queue = EmergencyPriorityQueue()
    dispatch_history = []


init_default_records()


@app.get("/", response_class=HTMLResponse)
def serve_dashboard():
    """Serves the Control Room Web Dashboard directly."""
    dash_path = os.path.join(STATIC_DIR, "dashboard.html")
    if os.path.exists(dash_path):
        return FileResponse(dash_path)
    return HTMLResponse("<h1>ResQRoute API Online. Visit /docs for Swagger UI.</h1>")


@app.get("/dashboard", response_class=HTMLResponse)
def serve_dashboard_explicit():
    return serve_dashboard()


@app.get("/api/locations")
def get_locations():
    return {
        "locations": graph.get_nodes(),
        "coords": custom_node_coords
    }


@app.post("/api/locations")
def add_location(req: AddLocationRequest):
    """Add a new geographic sector / location dynamically to the road graph."""
    name = req.name.strip()
    if not name:
        raise HTTPException(400, "Location name cannot be empty.")
    
    graph.add_node(name)

    # Assign coordinates for canvas visualization
    if req.x is not None and req.y is not None:
        custom_node_coords[name] = {"x": int(req.x), "y": int(req.y)}
    elif req.connectedTo and req.connectedTo in custom_node_coords:
        base = custom_node_coords[req.connectedTo]
        # Offset slightly from the connected neighbor within canvas bounds
        custom_node_coords[name] = {
            "x": min(810, max(50, base["x"] + 65)),
            "y": min(410, max(50, base["y"] + 35))
        }
    else:
        # Default layout slot based on node index
        idx = len(graph.get_nodes())
        custom_node_coords[name] = {
            "x": 100 + (idx * 65) % 650,
            "y": 120 + (idx * 45) % 300
        }

    # Optionally connect to an existing zone immediately
    if req.connectedTo:
        conn = req.connectedTo.strip()
        if conn and conn in graph.get_nodes():
            dist = float(req.distanceKm if req.distanceKm and req.distanceKm > 0 else 5.0)
            graph.add_road(name, conn, dist)

    return {
        "success": True,
        "name": name,
        "locations": graph.get_nodes(),
        "roads": graph.get_roads(),
        "coords": custom_node_coords
    }


@app.get("/api/roads")
def get_roads():
    return {"roads": graph.get_roads()}


@app.post("/api/roads")
def add_road(req: AddRoadRequest):
    """Add or update an arterial road connecting two sectors."""
    u = req.u.strip()
    v = req.v.strip()
    if not u or not v:
        raise HTTPException(400, "Both road endpoints must be specified.")
    if u == v:
        raise HTTPException(400, "Cannot create a road connecting a location to itself.")
    weight = float(req.weight)
    if weight <= 0:
        raise HTTPException(400, "Distance must be greater than 0 km.")
    
    graph.add_road(u, v, weight)
    return {
        "success": True,
        "u": u,
        "v": v,
        "weight": weight,
        "roads": graph.get_roads()
    }


@app.get("/api/route/plan")
def plan_route(start: str, destination: str):
    """
    Computes shortest path using Dijkstra's algorithm between any two locations.
    Dynamic road blocks are factored in automatically.
    """
    start = start.strip()
    destination = destination.strip()
    if start not in graph.get_nodes():
        raise HTTPException(404, f"Start location '{start}' not found in city graph.")
    if destination not in graph.get_nodes():
        raise HTTPException(404, f"Destination '{destination}' not found in city graph.")

    path, dist = graph.get_shortest_path(start, destination)
    if not path or dist == float("inf"):
        return {
            "success": False,
            "message": f"No accessible route between {start} and {destination} (roads may be blocked).",
            "start": start,
            "destination": destination,
            "path": [],
            "distanceKm": 0,
            "etaMinutes": 0
        }

    eta = max(1, round((dist / 40.0) * 60))
    return {
        "success": True,
        "start": start,
        "destination": destination,
        "path": path,
        "distanceKm": round(dist, 1),
        "etaMinutes": eta
    }


@app.post("/api/road/toggle")
def toggle_road(req: RoadToggleRequest):
    """Dynamically close or reopen a road segment to test rerouting."""
    is_closed = graph.toggle_road(req.u, req.v)
    return {
        "success": True,
        "u": req.u,
        "v": req.v,
        "isClosed": is_closed,
        "message": f"Road {req.u} ⇄ {req.v} is now {'CLOSED (Blocked)' if is_closed else 'OPEN'}"
    }


@app.get("/api/status")
def get_system_status():
    return {
        "ambulances": [a.dict() for a in ambulances],
        "hospitals": [h.dict() for h in hospitals],
        "pendingEmergencies": triage_queue.to_list(),
        "recentDispatches": dispatch_history[-10:],
        "availableZones": graph.get_nodes(),
        "coords": custom_node_coords,
        "roads": graph.get_roads(),
        "closedRoads": [list(k) for k in graph.closed_roads]
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

    # 1. Dijkstra from patient location to evaluate all reachable node distances
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

    if not best_ambulance or best_amb_dist == float("inf"):
        # Re-queue the emergency since no ambulance is reachable/free right now
        triage_queue.push(current_call)
        return DispatchResponse(
            success=False,
            message="No available ambulance can reach this location (All units busy or roads blocked)! Queued.",
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
                if dist != float("inf"):
                    best_hosp_dist = dist
                    best_hospital = hosp
                    best_hosp_path = path

    # 4. State updates
    best_ambulance.isAvailable = False
    best_ambulance.status = "Dispatched"
    
    if best_hospital:
        best_hospital.availableBeds = max(0, best_hospital.availableBeds - 1)

    # ETA calculations: assuming ~35-40 km/h average emergency speed (~1.5 min per km) + 2 min prep
    amb_eta = max(2, math.ceil(best_amb_dist * 1.5))
    hosp_eta = max(3, math.ceil(best_hosp_dist * 1.5)) if best_hospital else 0
    total_dist = round(best_amb_dist + (best_hosp_dist if best_hosp_dist != float("inf") else 0.0), 1)
    total_eta = amb_eta + hosp_eta

    mission_info = {
        "emergencyId": emergency_id,
        "patientName": request.patientName,
        "patientLocation": patient_loc,
        "severity": sev_label,
        "hospitalName": best_hospital.name if best_hospital else "Nearest Clinic",
        "hospitalLocation": best_hospital.location if best_hospital else patient_loc,
        "route": best_amb_path + (best_hosp_path[1:] if best_hosp_path else []),
        "eta": amb_eta,
    }
    best_ambulance.currentMission = mission_info

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
        hospitalEtaMinutes=hosp_eta,
        totalTripDistanceKm=total_dist,
        totalEtaMinutes=total_eta
    )

    dispatch_history.append(result.dict())

    # Persist incident to database
    try:
        db = SessionLocal()
        import json
        incident = IncidentDB(
            emergency_id=emergency_id,
            patient_name=request.patientName,
            location=patient_loc,
            severity=request.severity,
            severity_label=sev_label,
            ambulance_id=best_ambulance.id if best_ambulance else None,
            hospital_id=best_hospital.id if best_hospital else None,
            route_json=json.dumps(best_amb_path + (best_hosp_path[1:] if best_hosp_path else [])),
            distance_km=total_dist,
            eta_minutes=total_eta,
            status="Dispatched"
        )
        db.add(incident)
        db.commit()
        db.close()
    except Exception as e:
        print(f"[WARN] Could not persist incident: {e}")

    return result


@app.get("/api/ambulance/{amb_id}/mission")
def get_ambulance_mission(amb_id: int):
    for amb in ambulances:
        if amb.id == amb_id:
            return {
                "ambulanceId": amb.id,
                "driverName": amb.driverName,
                "location": amb.location,
                "isAvailable": amb.isAvailable,
                "status": amb.status,
                "currentMission": amb.currentMission
            }
    raise HTTPException(status_code=404, detail="Ambulance not found")


@app.post("/api/ambulance/{amb_id}/status")
def update_ambulance_status(amb_id: int, req: DriverStatusUpdate):
    for amb in ambulances:
        if amb.id == amb_id:
            amb.status = req.status
            mission_id = amb.currentMission.get("emergencyId") if amb.currentMission else None
            
            if req.status in ["Completed", "Available"]:
                amb.isAvailable = True
                amb.status = "Available"
                amb.currentMission = None

            # Sync progress back to database Incident record
            if mission_id:
                try:
                    db = SessionLocal()
                    inc = db.query(IncidentDB).filter(IncidentDB.emergency_id == mission_id).first()
                    if inc:
                        inc.status = req.status
                        db.commit()
                    db.close()
                except Exception as e:
                    print(f"[WARN] Incident status update failed: {e}")

            return {
                "success": True,
                "ambulanceId": amb.id,
                "newStatus": amb.status,
                "isAvailable": amb.isAvailable
            }
    raise HTTPException(status_code=404, detail="Ambulance not found")


@app.post("/api/reset")
def reset_system():
    init_default_records()
    return {"success": True, "message": "System reset to default state. All ambulances available and beds restored."}


@app.get("/api/incidents")
def get_incidents():
    """Retrieve all persisted dispatch incidents from the database."""
    try:
        db = SessionLocal()
        incidents = db.query(IncidentDB).order_by(IncidentDB.created_at.desc()).limit(50).all()
        result = []
        for i in incidents:
            result.append({
                "id": i.id,
                "emergencyId": i.emergency_id,
                "patientName": i.patient_name,
                "location": i.location,
                "severity": i.severity,
                "severityLabel": i.severity_label,
                "ambulanceId": i.ambulance_id,
                "hospitalId": i.hospital_id,
                "distanceKm": i.distance_km,
                "etaMinutes": i.eta_minutes,
                "status": i.status,
                "createdAt": i.created_at,
            })
        db.close()
        return {"incidents": result, "total": len(result)}
    except Exception as e:
        return {"incidents": [], "total": 0, "error": str(e)}
