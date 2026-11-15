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

import state
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
    description="Real-Time Emergency Dispatch & Intelligent Arterial Routing Engine.",
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
state.sync_from_db()

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")


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
        "locations": state.graph.get_nodes(),
        "coords": state.custom_node_coords
    }


@app.post("/api/locations")
def add_location(req: AddLocationRequest):
    """Add a new geographic sector / location dynamically to the road graph."""
    name = req.name.strip()
    if not name:
        raise HTTPException(400, "Location name cannot be empty.")
    
    state.register_node_and_coords(
        name,
        x=req.x,
        y=req.y,
        connected_to=req.connectedTo,
        distance_km=float(req.distanceKm if req.distanceKm and req.distanceKm > 0 else 5.0)
    )

    return {
        "success": True,
        "name": name,
        "locations": state.graph.get_nodes(),
        "roads": state.graph.get_roads(),
        "coords": state.custom_node_coords
    }


@app.get("/api/roads")
def get_roads():
    return {"roads": state.graph.get_roads()}


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
    
    state.graph.add_road(u, v, weight)
    return {
        "success": True,
        "u": u,
        "v": v,
        "weight": weight,
        "roads": state.graph.get_roads()
    }


@app.get("/api/route/plan")
def plan_route(start: str, destination: str):
    """
    Computes shortest path using Dijkstra's algorithm between any two locations.
    Dynamic road blocks are factored in automatically.
    """
    start = start.strip()
    destination = destination.strip()
    if start not in state.graph.get_nodes():
        raise HTTPException(404, f"Start location '{start}' not found in city graph.")
    if destination not in state.graph.get_nodes():
        raise HTTPException(404, f"Destination '{destination}' not found in city graph.")

    path, dist = state.graph.get_shortest_path(start, destination)
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
    is_closed = state.graph.toggle_road(req.u, req.v)
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
        "ambulances": [a.dict() for a in state.ambulances],
        "hospitals": [h.dict() for h in state.hospitals],
        "pendingEmergencies": state.triage_queue.to_list(),
        "recentDispatches": state.dispatch_history[-10:],
        "availableZones": state.graph.get_nodes(),
        "coords": state.custom_node_coords,
        "roads": state.graph.get_roads(),
        "closedRoads": [list(k) for k in state.graph.closed_roads]
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
    if patient_loc not in state.graph.get_nodes():
        patient_loc = "Gulshan"

    emergency_id = f"EMG-{uuid.uuid4().hex[:6].upper()}"
    triage_item = TriageEmergency(
        emergency_id=emergency_id,
        patient_name=request.patientName,
        location=patient_loc,
        severity=request.severity,
        description=request.notes or ""
    )
    state.triage_queue.push(triage_item)

    # Pop highest priority call to process
    current_call = state.triage_queue.pop()
    severity_labels = {1: "Low", 2: "Medium", 3: "High", 4: "Critical"}
    sev_label = severity_labels.get(current_call.severity, "Critical")

    # 1. Dijkstra from patient location to evaluate all reachable node distances
    distances_from_patient, _ = state.graph.dijkstra(patient_loc)

    # 2. Find closest available ambulance using shortest path distances
    best_ambulance: Optional[AmbulanceModel] = None
    best_amb_dist = float("inf")
    best_amb_path: List[str] = []

    for amb in state.ambulances:
        if amb.isAvailable and amb.location in distances_from_patient:
            path, dist = state.graph.get_shortest_path(amb.location, patient_loc)
            if dist < best_amb_dist:
                best_amb_dist = dist
                best_ambulance = amb
                best_amb_path = path

    if not best_ambulance or best_amb_dist == float("inf"):
        # Re-queue the emergency since no ambulance is reachable/free right now
        state.triage_queue.push(current_call)
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

    for hosp in state.hospitals:
        if hosp.availableBeds > 0 and hosp.location in distances_from_patient:
            dist_to_hosp = distances_from_patient[hosp.location]
            if dist_to_hosp < best_hosp_dist:
                path, dist = state.graph.get_shortest_path(patient_loc, hosp.location)
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
        "ambulanceRoute": best_amb_path,
        "ambulanceDistanceKm": round(best_amb_dist, 1),
        "ambulanceEtaMinutes": amb_eta,
        "hospitalRoute": best_hosp_path,
        "hospitalDistanceKm": round(best_hosp_dist, 1) if best_hospital else 0.0,
        "hospitalEtaMinutes": hosp_eta,
        "route": best_amb_path + (best_hosp_path[1:] if best_hosp_path else []),
        "eta": amb_eta,
        "totalTripDistanceKm": total_dist,
        "totalEtaMinutes": total_eta,
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

    state.dispatch_history.append(result.dict())

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
    for amb in state.ambulances:
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
    for amb in state.ambulances:
        if amb.id == amb_id:
            amb.status = req.status
            mission_id = amb.currentMission.get("emergencyId") if amb.currentMission else None

            # Dynamically update vehicle location as mission progresses
            if amb.currentMission:
                if req.status in ["At Scene", "At Patient"]:
                    amb.location = amb.currentMission.get("patientLocation", amb.location)
                elif req.status in ["Completed", "Available"]:
                    hosp_loc = amb.currentMission.get("hospitalLocation")
                    if hosp_loc:
                        amb.location = hosp_loc
            
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
    state.init_default_records()
    return {"success": True, "message": "System reset to default state. All ambulances available and beds restored."}
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
