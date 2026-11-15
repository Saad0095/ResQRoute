"""
Admin API Routes — Full CRUD for Users, Ambulances, Hospitals.
Requires ADMIN or DISPATCHER role for all operations.
"""
from pydantic import BaseModel
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

try:
    from database import get_db, UserDB
    from database.models_db import AmbulanceDB, HospitalDB
    from security import hash_password, get_current_user, require_roles
    import state
    from state import register_node_and_coords, add_ambulance_record, add_hospital_record
except ImportError:
    from backend.database import get_db, UserDB
    from backend.database.models_db import AmbulanceDB, HospitalDB
    from backend.security import hash_password, get_current_user, require_roles
    import backend.state as state
    from backend.state import register_node_and_coords, add_ambulance_record, add_hospital_record

router = APIRouter(prefix="/api/admin", tags=["Administration"])


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class CreateUserRequest(BaseModel):
    email: str
    password: str
    fullName: str
    role: str = "DRIVER"
    phone: Optional[str] = None
    ambulanceId: Optional[int] = None


class UpdateBedsRequest(BaseModel):
    availableBeds: int
    totalBeds: Optional[int] = None


class CreateAmbulanceRequest(BaseModel):
    id: int
    driverName: str
    location: str
    phone: Optional[str] = None
    x: Optional[int] = None
    y: Optional[int] = None
    connectedTo: Optional[str] = None


class CreateHospitalRequest(BaseModel):
    name: str
    location: str
    totalBeds: int
    availableBeds: int
    x: Optional[int] = None
    y: Optional[int] = None
    connectedTo: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: str
    fullName: str
    role: str
    phone: Optional[str] = None
    ambulanceId: Optional[int] = None
    isActive: bool


# ─── User Management ──────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN", "DISPATCHER"))
):
    """List all registered users."""
    users = db.query(UserDB).all()
    return [
        UserOut(
            id=u.id,
            email=u.email,
            fullName=u.full_name,
            role=u.role,
            phone=u.phone,
            ambulanceId=u.ambulance_id,
            isActive=u.is_active
        )
        for u in users
    ]


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(
    req: CreateUserRequest,
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN", "DISPATCHER"))
):
    """Create a new user (driver, dispatcher, etc.)."""
    if db.query(UserDB).filter(UserDB.email == req.email.lower()).first():
        raise HTTPException(400, "Email already registered.")
    user = UserDB(
        email=req.email.lower(),
        hashed_password=hash_password(req.password),
        full_name=req.fullName,
        role=req.role.upper(),
        phone=req.phone,
        ambulance_id=req.ambulanceId,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut(
        id=user.id, email=user.email, fullName=user.full_name,
        role=user.role, phone=user.phone, ambulanceId=user.ambulance_id,
        isActive=user.is_active
    )


@router.patch("/users/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN", "DISPATCHER"))
):
    """Soft-deactivate a user account."""
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found.")
    user.is_active = False
    db.commit()
    return {"success": True, "message": f"User {user.email} deactivated."}


@router.patch("/users/{user_id}/activate")
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN", "DISPATCHER"))
):
    """Re-activate a user account."""
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found.")
    user.is_active = True
    db.commit()
    return {"success": True, "message": f"User {user.email} activated."}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN"))
):
    """Permanently delete a user (ADMIN only)."""
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found.")
    db.delete(user)
    db.commit()
    return {"success": True, "message": "User permanently deleted."}


# ─── Hospital Management ───────────────────────────────────────────────────────

@router.get("/hospitals")
def list_hospitals(
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN", "DISPATCHER"))
):
    hosps = db.query(HospitalDB).all()
    return [
        {
            "id": h.id, "name": h.name, "location": h.location,
            "totalBeds": h.total_beds, "availableBeds": h.available_beds
        }
        for h in hosps
    ]


@router.post("/hospitals", status_code=201)
def create_hospital(
    req: CreateHospitalRequest,
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN", "DISPATCHER"))
):
    h = HospitalDB(
        name=req.name, location=req.location,
        total_beds=req.totalBeds, available_beds=req.availableBeds
    )
    db.add(h)
    db.commit()
    db.refresh(h)

    # Sync to in-memory state & graph coordinates
    add_hospital_record(
        name=h.name,
        location=h.location,
        total_beds=h.total_beds,
        available_beds=h.available_beds,
        hosp_id=h.id,
        x=req.x,
        y=req.y,
        connected_to=req.connectedTo
    )

    return {
        "success": True,
        "id": h.id,
        "name": h.name,
        "location": h.location,
        "totalBeds": h.total_beds,
        "availableBeds": h.available_beds,
        "coords": state.custom_node_coords.get(h.location)
    }


@router.patch("/hospitals/{hospital_id}/beds")
def update_hospital_beds(
    hospital_id: int,
    req: UpdateBedsRequest,
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN", "DISPATCHER"))
):
    h = db.query(HospitalDB).filter(HospitalDB.id == hospital_id).first()
    if not h:
        raise HTTPException(404, "Hospital not found.")
    h.available_beds = req.availableBeds
    if req.totalBeds is not None:
        h.total_beds = req.totalBeds
    db.commit()

    # Sync in-memory hospitals
    for item in state.hospitals:
        if item.id == hospital_id:
            item.availableBeds = h.available_beds
            if req.totalBeds is not None:
                item.totalBeds = h.total_beds
            break

    return {
        "success": True,
        "hospitalId": hospital_id,
        "availableBeds": h.available_beds,
        "totalBeds": h.total_beds
    }


@router.delete("/hospitals/{hospital_id}")
def delete_hospital(
    hospital_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN"))
):
    h = db.query(HospitalDB).filter(HospitalDB.id == hospital_id).first()
    if not h:
        raise HTTPException(404, "Hospital not found.")
    db.delete(h)
    db.commit()

    # Sync in-memory hospitals
    state.hospitals = [item for item in state.hospitals if item.id != hospital_id]
    return {"success": True, "message": "Hospital deleted."}


# ─── Ambulance / Fleet Management ─────────────────────────────────────────────

@router.get("/ambulances")
def list_ambulances(
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN", "DISPATCHER"))
):
    ambs = db.query(AmbulanceDB).all()
    return [
        {
            "id": a.id, "driverName": a.driver_name, "location": a.location,
            "phone": a.phone, "status": a.status, "isAvailable": a.is_available
        }
        for a in ambs
    ]


@router.post("/ambulances", status_code=201)
def create_ambulance(
    req: CreateAmbulanceRequest,
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN", "DISPATCHER"))
):
    existing = db.query(AmbulanceDB).filter(AmbulanceDB.id == req.id).first()
    if existing:
        raise HTTPException(400, f"Ambulance #{req.id} already exists.")
    a = AmbulanceDB(
        id=req.id,
        driver_name=req.driverName,
        location=req.location,
        phone=req.phone or "+92 300 0000000",
        status="Available",
        is_available=True,
    )
    db.add(a)
    db.commit()
    db.refresh(a)

    # Sync to in-memory fleet state & graph coordinates
    add_ambulance_record(
        amb_id=a.id,
        driver_name=a.driver_name,
        location=a.location,
        phone=a.phone,
        x=req.x,
        y=req.y,
        connected_to=req.connectedTo
    )

    return {
        "success": True,
        "id": a.id,
        "driverName": a.driver_name,
        "location": a.location,
        "coords": state.custom_node_coords.get(a.location)
    }


@router.delete("/ambulances/{amb_id}")
def delete_ambulance(
    amb_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN"))
):
    a = db.query(AmbulanceDB).filter(AmbulanceDB.id == amb_id).first()
    if not a:
        raise HTTPException(404, "Ambulance not found.")
    db.delete(a)
    db.commit()

    # Sync in-memory ambulances
    state.ambulances = [item for item in state.ambulances if item.id != amb_id]
    return {"success": True, "message": f"Ambulance #{amb_id} removed from fleet."}
