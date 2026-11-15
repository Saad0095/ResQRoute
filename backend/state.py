"""
ResQRoute Shared State Module
Maintains in-memory single-source-of-truth for graph, fleet, hospitals, coordinates, and triage queue.
"""
from typing import Dict, List, Any, Optional
from models import AmbulanceModel, HospitalModel
from dsa.graph import CityGraph, build_default_city_map
from dsa.priority_queue import EmergencyPriorityQueue

# Canvas coordinates for city sectors
custom_node_coords: Dict[str, Dict[str, int]] = {
    "North Karachi":    {"x": 180, "y": 70},
    "Nazimabad":        {"x": 150, "y": 190},
    "Gulshan":          {"x": 420, "y": 140},
    "Saddar":           {"x": 270, "y": 290},
    "Airport":          {"x": 670, "y": 170},
    "Malir":            {"x": 770, "y": 130},
    "Shahrah-e-Faisal": {"x": 480, "y": 260},
    "Clifton":          {"x": 200, "y": 400},
    "Defense":          {"x": 490, "y": 390},
    "Gulistan-e-Jauhar":{"x": 440, "y": 70},
}


def canonicalize_node_name(name: str) -> str:
    cleaned = name.strip()
    norm = cleaned.lower().replace(" ", "").replace("-", "")
    if norm in ("gulistanejauhar", "gulistanejohar", "gulistanjauhar", "gulistanjohar", "jauhar", "johar"):
        return "Gulistan-e-Jauhar"
    if norm in ("northkarachi", "north-karachi"):
        return "North Karachi"
    if norm in ("shahrahefaisal", "shahrah-e-faisal"):
        return "Shahrah-e-Faisal"
    return cleaned

graph: CityGraph = build_default_city_map()
triage_queue: EmergencyPriorityQueue = EmergencyPriorityQueue()
ambulances: List[AmbulanceModel] = []
hospitals: List[HospitalModel] = []
dispatch_history: List[Dict[str, Any]] = []


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
    sync_from_db()


def sync_from_db():
    """Syncs persisted ambulances and hospitals from SQLite database into shared state if present."""
    try:
        try:
            from database.connection import SessionLocal
            from database.models_db import AmbulanceDB, HospitalDB
        except ImportError:
            from backend.database.connection import SessionLocal
            from backend.database.models_db import AmbulanceDB, HospitalDB

        db = SessionLocal()
        ambs = db.query(AmbulanceDB).all()
        if ambs:
            for a in ambs:
                add_ambulance_record(
                    amb_id=a.id,
                    driver_name=a.driver_name,
                    location=a.location,
                    phone=a.phone
                )

        hosps = db.query(HospitalDB).all()
        if hosps:
            for h in hosps:
                add_hospital_record(
                    name=h.name,
                    location=h.location,
                    total_beds=h.total_beds,
                    available_beds=h.available_beds,
                    hosp_id=h.id
                )
        db.close()
        load_dispatch_history_from_db()
    except Exception as e:
        print(f"[WARN] sync_from_db skipped or failed: {e}")


def register_node_and_coords(
    location: str,
    x: Optional[int] = None,
    y: Optional[int] = None,
    connected_to: Optional[str] = "Shahrah-e-Faisal",
    distance_km: float = 6.0
):
    """
    Guarantees a city location is registered on the graph with valid canvas coordinates.
    Connects it to an existing arterial node if it's new so Dijkstra routing works immediately.
    """
    clean_loc = canonicalize_node_name(location)
    if not clean_loc:
        return

    # Clean legacy duplicate aliases
    for alias in ["Gulistan-e-Johar", "Gulistan e Jauhar", "Gulistan e Johar", "Gulistane Jauhar"]:
        if alias != clean_loc and alias in custom_node_coords:
            del custom_node_coords[alias]

    # 1. Add to graph if new
    if clean_loc not in graph.get_nodes():
        graph.add_node(clean_loc)
        target = canonicalize_node_name(connected_to) if (connected_to and connected_to in graph.get_nodes()) else "Gulshan"
        if target in graph.get_nodes() and target != clean_loc:
            graph.add_road(clean_loc, target, float(distance_km))
        elif graph.get_nodes():
            other = [n for n in graph.get_nodes() if n != clean_loc]
            if other:
                graph.add_road(clean_loc, other[0], float(distance_km))

    # 2. Register coordinates
    norm = clean_loc.lower().replace(" ", "").replace("-", "")
    if x is not None and y is not None:
        custom_node_coords[clean_loc] = {"x": int(x), "y": int(y)}
    elif "jauhar" in norm or "johar" in norm:
        # Gulistan-e-Jauhar is directly above Gulshan
        custom_node_coords[clean_loc] = {"x": 440, "y": 70}
    elif "korangi" in norm:
        custom_node_coords[clean_loc] = {"x": 600, "y": 380}
    elif "pechs" in norm:
        custom_node_coords[clean_loc] = {"x": 360, "y": 270}
    elif "gulberg" in norm:
        custom_node_coords[clean_loc] = {"x": 290, "y": 140}
    elif "bahria" in norm:
        custom_node_coords[clean_loc] = {"x": 750, "y": 60}
    elif clean_loc not in custom_node_coords:
        if connected_to and connected_to in custom_node_coords:
            base = custom_node_coords[connected_to]
            # If connected to Gulshan or high Y base, place above
            if connected_to == "Gulshan" or base["y"] >= 140:
                custom_node_coords[clean_loc] = {
                    "x": min(800, max(60, base["x"] + 20)),
                    "y": max(50, base["y"] - 70)
                }
            else:
                custom_node_coords[clean_loc] = {
                    "x": min(800, max(60, base["x"] + 60)),
                    "y": min(410, max(60, base["y"] + 35))
                }
        else:
            idx = len(custom_node_coords)
            custom_node_coords[clean_loc] = {
                "x": 100 + (idx * 65) % 650,
                "y": 120 + (idx * 45) % 300
            }


def update_location_record(
    old_name: str,
    new_name: Optional[str] = None,
    x: Optional[int] = None,
    y: Optional[int] = None,
) -> Dict[str, Any]:
    global custom_node_coords, ambulances, hospitals
    clean_old = canonicalize_node_name(old_name)
    clean_new = canonicalize_node_name(new_name) if new_name else clean_old

    # Clean legacy duplicate aliases
    for alias in ["Gulistan-e-Johar", "Gulistan e Jauhar", "Gulistan e Johar", "Gulistane Jauhar"]:
        if alias != clean_new and alias in custom_node_coords:
            del custom_node_coords[alias]

    if x is not None and y is not None:
        custom_node_coords[clean_new] = {"x": int(x), "y": int(y)}
    elif clean_new not in custom_node_coords and clean_old in custom_node_coords:
        custom_node_coords[clean_new] = custom_node_coords[clean_old]

    if clean_new != clean_old:
        if clean_old in custom_node_coords:
            del custom_node_coords[clean_old]
        graph.rename_node(clean_old, clean_new)
        for amb in ambulances:
            if amb.location == clean_old:
                amb.location = clean_new
        for hosp in hospitals:
            if hosp.location == clean_old:
                hosp.location = clean_new

    return {
        "success": True,
        "oldName": clean_old,
        "name": clean_new,
        "coords": custom_node_coords.get(clean_new)
    }


def remove_location_record(name: str) -> Dict[str, Any]:
    """Removes a sector from graph and coordinates registry, safely relocating stationed units."""
    global custom_node_coords, ambulances, hospitals, graph
    clean_name = canonicalize_node_name(name)

    graph.remove_node(clean_name)
    if clean_name in custom_node_coords:
        del custom_node_coords[clean_name]

    # Clean any legacy alias variations
    for alias in ["Gulistan-e-Johar", "Gulistan e Jauhar", "Gulistan e Johar", "Gulistane Jauhar"]:
        if alias == clean_name or alias in custom_node_coords:
            if alias in custom_node_coords:
                del custom_node_coords[alias]
            graph.remove_node(alias)

    # Safe fallback sector for any units stationed at the deleted sector
    fallback = "Gulshan" if "Gulshan" in graph.get_nodes() else (graph.get_nodes()[0] if graph.get_nodes() else "Center")
    for amb in ambulances:
        if amb.location == clean_name:
            amb.location = fallback
    for hosp in hospitals:
        if hosp.location == clean_name:
            hosp.location = fallback

    return {
        "success": True,
        "removed": clean_name,
        "fallback": fallback
    }


def load_dispatch_history_from_db():
    """Restores dispatch call history from SQLite on backend startup."""
    global dispatch_history
    try:
        from datetime import datetime
        try:
            from database.connection import SessionLocal
            from database.models_db import IncidentDB
        except ImportError:
            from backend.database.connection import SessionLocal
            from backend.database.models_db import IncidentDB
        db = SessionLocal()
        incidents = db.query(IncidentDB).order_by(IncidentDB.created_at.asc()).all()
        history = []
        for i in incidents:
            ts_str = None
            if i.created_at:
                if isinstance(i.created_at, (int, float)):
                    ts_str = datetime.fromtimestamp(i.created_at).isoformat()
                else:
                    ts_str = str(i.created_at)
            history.append({
                "emergencyId": i.emergency_id,
                "patientName": i.patient_name,
                "patientLocation": i.location,
                "severityLabel": i.severity_label,
                "ambulanceId": i.ambulance_id,
                "hospitalId": i.hospital_id,
                "totalTripDistanceKm": i.distance_km,
                "totalEtaMinutes": i.eta_minutes,
                "status": i.status,
                "createdAt": ts_str,
            })
        db.close()
        dispatch_history = history
    except Exception as e:
        print(f"[WARN] Could not restore dispatch history from DB: {e}")


def add_ambulance_record(
    amb_id: int,
    driver_name: str,
    location: str,
    phone: Optional[str] = "+92 300 0000000",
    x: Optional[int] = None,
    y: Optional[int] = None,
    connected_to: Optional[str] = "Shahrah-e-Faisal"
) -> AmbulanceModel:
    """Adds or updates an ambulance in the active fleet and registers its coordinates."""
    register_node_and_coords(location, x=x, y=y, connected_to=connected_to)

    global ambulances
    # Remove if existing ID
    ambulances = [a for a in ambulances if a.id != amb_id]
    new_amb = AmbulanceModel(
        id=amb_id,
        driverName=driver_name,
        location=location.strip(),
        phone=phone or "+92 300 0000000",
        isAvailable=True,
        status="Available"
    )
    ambulances.append(new_amb)
    return new_amb


def add_hospital_record(
    name: str,
    location: str,
    total_beds: int,
    available_beds: int,
    hosp_id: Optional[int] = None,
    x: Optional[int] = None,
    y: Optional[int] = None,
    connected_to: Optional[str] = "Shahrah-e-Faisal"
) -> HospitalModel:
    """Adds or updates a hospital in the active healthcare registry and registers its coordinates."""
    register_node_and_coords(location, x=x, y=y, connected_to=connected_to)

    global hospitals
    if hosp_id is None:
        max_id = max([h.id for h in hospitals], default=200)
        hosp_id = max_id + 1

    hospitals = [h for h in hospitals if h.id != hosp_id]
    new_hosp = HospitalModel(
        id=hosp_id,
        name=name.strip(),
        location=location.strip(),
        totalBeds=int(total_beds),
        availableBeds=int(available_beds)
    )
    hospitals.append(new_hosp)
    return new_hosp


init_default_records()
