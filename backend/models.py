from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict


class AmbulanceModel(BaseModel):
    id: int
    driverName: str
    location: str
    isAvailable: bool = True
    phone: str = "+92 300 1234567"
    status: str = "Available"  # "Available", "Dispatched", "At Patient", "Transporting"
    currentMission: Optional[Dict[str, Any]] = None


class HospitalModel(BaseModel):
    id: int
    name: str
    location: str
    totalBeds: int
    availableBeds: int


class SOSRequest(BaseModel):
    patientName: str = "Emergency Caller"
    location: str = "Gulshan"
    severity: int = Field(default=4, ge=1, le=4, description="1: Low, 2: Medium, 3: High, 4: Critical")
    notes: Optional[str] = "Immediate emergency requested via one-tap SOS"


class DispatchResponse(BaseModel):
    success: bool
    message: str
    emergencyId: str
    severityLabel: str
    patientLocation: str
    assignedAmbulance: Optional[AmbulanceModel] = None
    ambulanceRoute: List[str] = []
    ambulanceDistanceKm: float = 0.0
    ambulanceEtaMinutes: int = 0
    assignedHospital: Optional[HospitalModel] = None
    hospitalRoute: List[str] = []
    hospitalDistanceKm: float = 0.0
    hospitalEtaMinutes: int = 0
    totalTripDistanceKm: float = 0.0
    totalEtaMinutes: int = 0


class RoadToggleRequest(BaseModel):
    u: str
    v: str


class DriverStatusUpdate(BaseModel):
    status: str  # "En Route", "At Scene", "Transporting", "Completed"


class AddLocationRequest(BaseModel):
    name: str
    connectedTo: Optional[str] = None
    distanceKm: Optional[float] = 5.0
    x: Optional[int] = None
    y: Optional[int] = None


class AddRoadRequest(BaseModel):
    u: str
    v: str
    weight: float


class EditLocationRequest(BaseModel):
    newName: Optional[str] = None
    x: int
    y: int
