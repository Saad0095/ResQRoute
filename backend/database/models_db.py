"""
Database Models for ResQRoute (Users, Vehicles, Hospitals, Incidents).
"""
import time
from sqlalchemy import Column, Integer, String, Boolean, Float, Text
from .connection import Base


class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, default="CITIZEN")  # "ADMIN", "DISPATCHER", "DRIVER", "CITIZEN"
    phone = Column(String(30), nullable=True)
    ambulance_id = Column(Integer, nullable=True)  # Bound vehicle unit for drivers
    is_active = Column(Boolean, default=True)       # Soft-delete / deactivation flag


class AmbulanceDB(Base):
    __tablename__ = "ambulances"

    id = Column(Integer, primary_key=True, index=True)
    driver_name = Column(String(100), nullable=False)
    location = Column(String(50), nullable=False)
    is_available = Column(Boolean, default=True)
    phone = Column(String(30), nullable=False)
    status = Column(String(30), default="Available")  # "Available", "On Duty", "En Route", "At Scene", "Transporting"
    current_mission_json = Column(Text, nullable=True)  # Serialized mission JSON


class HospitalDB(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(50), nullable=False)
    total_beds = Column(Integer, nullable=False)
    available_beds = Column(Integer, nullable=False)


class IncidentDB(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    emergency_id = Column(String(50), unique=True, index=True, nullable=False)
    patient_name = Column(String(100), nullable=False)
    location = Column(String(50), nullable=False)
    severity = Column(Integer, nullable=False)
    severity_label = Column(String(20), nullable=False)
    ambulance_id = Column(Integer, nullable=True)
    hospital_id = Column(Integer, nullable=True)
    route_json = Column(Text, nullable=True)
    distance_km = Column(Float, default=0.0)
    eta_minutes = Column(Integer, default=0)
    status = Column(String(30), default="Dispatched")  # "Dispatched", "In Progress", "Completed", "Cancelled"
    created_at = Column(Float, default=time.time)
