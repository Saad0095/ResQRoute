from pydantic import BaseModel, Field
from typing import List, Optional


class AmbulanceModel(BaseModel):
    id: int
    driverName: str
    location: str
    isAvailable: bool = True
    phone: str = "+92 300 1234567"


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

