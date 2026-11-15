"""
Database Initialization & Seeder.
Creates tables and default pre-seeded users, fleet units, and hospitals.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from database.connection import engine, Base, SessionLocal
    from database.models_db import UserDB, AmbulanceDB, HospitalDB
    from security import hash_password
except ImportError:
    from backend.database.connection import engine, Base, SessionLocal
    from backend.database.models_db import UserDB, AmbulanceDB, HospitalDB
    from backend.security import hash_password


def init_and_seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Seed Users if not present
        if db.query(UserDB).count() == 0:
            users = [
                UserDB(
                    email="admin@resqroute.org",
                    hashed_password=hash_password("admin123"),
                    full_name="System Administrator",
                    role="ADMIN",
                    phone="+92 21 11000000",
                    is_active=True
                ),
                UserDB(
                    email="dispatcher@resqroute.org",
                    hashed_password=hash_password("admin123"),
                    full_name="Control Room Dispatcher",
                    role="DISPATCHER",
                    phone="+92 21 11220000",
                    is_active=True
                ),
                UserDB(
                    email="driver101@resqroute.org",
                    hashed_password=hash_password("driver123"),
                    full_name="Ali Khan",
                    role="DRIVER",
                    phone="+92 301 5550101",
                    ambulance_id=101
                ),
                UserDB(
                    email="driver102@resqroute.org",
                    hashed_password=hash_password("driver123"),
                    full_name="Ahmed Raza",
                    role="DRIVER",
                    phone="+92 302 5550102",
                    ambulance_id=102
                ),
                UserDB(
                    email="driver103@resqroute.org",
                    hashed_password=hash_password("driver123"),
                    full_name="Usman Sheikh",
                    role="DRIVER",
                    phone="+92 303 5550103",
                    ambulance_id=103
                ),
                UserDB(
                    email="citizen@resqroute.org",
                    hashed_password=hash_password("citizen123"),
                    full_name="Zain Citizen",
                    role="CITIZEN",
                    phone="+92 333 9991122"
                ),
            ]
            db.add_all(users)
            db.commit()
            print("[SEED] Default accounts created successfully.")

        # Seed Ambulances
        if db.query(AmbulanceDB).count() == 0:
            ambs = [
                AmbulanceDB(id=101, driver_name="Ali Khan", location="North Karachi", is_available=True, phone="+92 301 5550101", status="Available"),
                AmbulanceDB(id=102, driver_name="Ahmed Raza", location="Gulshan", is_available=True, phone="+92 302 5550102", status="Available"),
                AmbulanceDB(id=103, driver_name="Usman Sheikh", location="Nazimabad", is_available=True, phone="+92 303 5550103", status="Available"),
                AmbulanceDB(id=104, driver_name="Tariq Jameel", location="Saddar", is_available=True, phone="+92 304 5550104", status="Available"),
                AmbulanceDB(id=105, driver_name="Hamza Qureshi", location="Clifton", is_available=True, phone="+92 305 5550105", status="Available"),
            ]
            db.add_all(ambs)
            db.commit()
            print("[SEED] Default ambulances created.")

        # Seed Hospitals
        if db.query(HospitalDB).count() == 0:
            hosps = [
                HospitalDB(id=201, name="City Hospital", location="Gulshan", total_beds=15, available_beds=12),
                HospitalDB(id=202, name="Central Medical Complex", location="Nazimabad", total_beds=10, available_beds=5),
                HospitalDB(id=203, name="South City Hospital", location="Clifton", total_beds=20, available_beds=8),
                HospitalDB(id=204, name="Civil Trauma Center", location="Saddar", total_beds=25, available_beds=14),
            ]
            db.add_all(hosps)
            db.commit()
            print("[SEED] Default hospitals created.")

    finally:
        db.close()


if __name__ == "__main__":
    init_and_seed_db()
