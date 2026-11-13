"""
Automated DSA & API test for ResQRoute Backend.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from server import app

client = TestClient(app)


def test_system_flow():
    # 1. Reset state
    reset_resp = client.post("/api/reset")
    assert reset_resp.status_code == 200
    print("[PASS] System reset successful.")

    # 2. Check initial status
    status_resp = client.get("/api/status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert len(status_data["ambulances"]) == 5
    assert len(status_data["hospitals"]) == 4
    print("[PASS] Initial records validated.")

    # 3. Simulate One-Tap SOS from 'Gulshan' (Severity 4 - Critical)
    sos_payload = {
        "patientName": "Zain Ali",
        "location": "Gulshan",
        "severity": 4,
        "notes": "Severe chest pain"
    }
    sos_resp = client.post("/api/emergency/sos", json=sos_payload)
    assert sos_resp.status_code == 200
    dispatch = sos_resp.json()

    print("\n--- DISPATCH DECISION ---")
    print(f"Status: {dispatch['message']}")
    print(f"Assigned Ambulance ID: {dispatch['assignedAmbulance']['id']} ({dispatch['assignedAmbulance']['driverName']})")
    print(f"Ambulance Location: {dispatch['assignedAmbulance']['location']} -> Route: {dispatch['ambulanceRoute']}")
    print(f"Ambulance ETA: {dispatch['ambulanceEtaMinutes']} mins")
    print(f"Assigned Hospital: {dispatch['assignedHospital']['name']} (Available Beds: {dispatch['assignedHospital']['availableBeds']})")
    print(f"Hospital Route: {dispatch['hospitalRoute']} (Distance: {dispatch['hospitalDistanceKm']} km)")

    # Assertions
    # In Gulshan, Ambulance 102 (Ahmed Raza) is located at Gulshan (distance 0.0), so Dijkstra selects him!
    assert dispatch["assignedAmbulance"]["id"] == 102
    assert dispatch["assignedAmbulance"]["isAvailable"] is False
    assert dispatch["assignedHospital"]["name"] == "City Hospital"
    print("\n[ALL TESTS PASSED] Dijkstra Shortest Path & Priority Queue Triage validated successfully!")


if __name__ == "__main__":
    test_system_flow()
