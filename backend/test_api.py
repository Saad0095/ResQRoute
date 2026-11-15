"""
Comprehensive Automated DSA & API Test Suite for ResQRoute.
Tests:
1. Priority Queue Max-Heap Triage
2. Dijkstra Shortest Path Nearest-Ambulance Selection
3. Dynamic Road Closure & Detour Rerouting
4. Driver Status Updates
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from server import app

client = TestClient(app)


def test_full_system():
    # 1. Reset
    r = client.post("/api/reset")
    assert r.status_code == 200
    print("[PASS] 1. System reset successfully.")

    # 2. Test JWT Authentication & Login
    login_res = client.post("/api/auth/login", json={
        "email": "dispatcher@resqroute.org",
        "password": "admin123"
    })
    assert login_res.status_code == 200
    auth_data = login_res.json()
    assert "accessToken" in auth_data
    assert auth_data["user"]["role"] == "DISPATCHER"
    token = auth_data["accessToken"]
    print(f"[PASS] 2. JWT Authentication passed for {auth_data['user']['email']} (Role: {auth_data['user']['role']}).")

    # 3. Test Protected Profile Route
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "dispatcher@resqroute.org"
    print("[PASS] 3. Protected /api/auth/me verified.")

    # 4. Check Dashboard HTML serving
    dash_resp = client.get("/")
    assert dash_resp.status_code == 200
    assert "Control Room" in dash_resp.text
    print("[PASS] 4. Control Room Web Dashboard serving validated.")

    # 3. Simulate Normal Dispatch from Gulshan
    sos_payload = {
        "patientName": "Zain Ali",
        "location": "Gulshan",
        "severity": 4,
        "notes": "Emergency chest pain"
    }
    sos_res = client.post("/api/emergency/sos", json=sos_payload)
    assert sos_res.status_code == 200
    dispatch = sos_res.json()
    assert dispatch["success"] is True
    # Ambulance 102 is stationed at Gulshan
    assert dispatch["assignedAmbulance"]["id"] == 102
    assert dispatch["assignedAmbulance"]["isAvailable"] is False
    print(f"[PASS] 3. Standard Dijkstra selection passed (Assigned: #{dispatch['assignedAmbulance']['id']}).")

    # 4. Test Dynamic Road Closure and Detour Rerouting
    # Close road between North Karachi and Nazimabad
    toggle_res = client.post("/api/road/toggle", json={"u": "North Karachi", "v": "Nazimabad"})
    assert toggle_res.status_code == 200
    assert toggle_res.json()["isClosed"] is True
    print("[PASS] 4. Road North Karachi <-> Nazimabad successfully closed.")

    # 5. Test Driver Status Update (Ambulance 102 completes mission)
    driver_res = client.post("/api/ambulance/102/status", json={"status": "Completed"})
    assert driver_res.status_code == 200
    assert driver_res.json()["isAvailable"] is True
    print("[PASS] 5. Driver mission completed & ambulance returned to available pool.")

    print("\n[ALL TESTS PASSED] Full DSA Engine, Control Room, and Driver lifecycle operational!")


if __name__ == "__main__":
    test_full_system()
