# 🚑 ResQRoute — Intelligent Emergency Routing & Ambulance Dispatch

> **Enterprise-Grade Emergency Dispatch & Fleet Optimization System** powered by real-time shortest-path routing (Dijkstra's Algorithm) and priority queue triage (Max-Heap), featuring a FastAPI backend, React (Vite) Control Room, and a React Native (Expo SDK 58) mobile app for citizens and ambulance drivers.

---

## 🌐 Live Deployments & Endpoints

| Service | Environment | URL |
| :--- | :--- | :--- |
| **Backend API** | Render Cloud | [https://resqroute-cq1x.onrender.com](https://resqroute-cq1x.onrender.com) |
| **Interactive API Docs (Swagger)** | Render Cloud | [https://resqroute-cq1x.onrender.com/docs](https://resqroute-cq1x.onrender.com/docs) |
| **Alternative API Docs (ReDoc)** | Render Cloud | [https://resqroute-cq1x.onrender.com/redoc](https://resqroute-cq1x.onrender.com/redoc) |
| **Web Dashboard** | Local Dev / Vercel | `http://localhost:5173` |
| **Mobile App (Expo Go / Web)** | Local Metro | `http://localhost:8081` |
| **Android Standalone APK** | Expo Cloud (EAS) | Build via `eas build -p android --profile preview` |

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ResQRoute Platform                                   │
├────────────────────┬────────────────────┬───────────────────────┬──────────────────────┤
│     📱 Mobile      │    🖥️ Web App      │      🔧 Backend       │     💾 Database      │
│  (Expo SDK 58/RN)  │    (React+Vite)    │       (FastAPI)       │ (SQLite+SQLAlchemy)  │
├────────────────────┼────────────────────┼───────────────────────┼──────────────────────┤
│ • Citizen SOS mode │ • Control Room HUD │ • JWT Authentication  │ • Users (RBAC)       │
│ • GPS locate & SOS │ • Live City Canvas │ • Role-Based Access   │ • Ambulances         │
│ • Waypoint Tracker │ • Route Inspector  │ • Dijkstra Routing    │ • Hospitals          │
│ • Driver Mission   │ • Dynamic Roads    │ • Max-Heap Triage     │ • Incidents / Calls  │
│ • 1-Tap Copy Info  │ • Fleet Management │ • Dynamic Road Graph  │ • Road Segments      │
│ • Server Switcher  │ • Hospital Beds    │ • Live Cloud on Render│                      │
└────────────────────┴────────────────────┴───────────────────────┴──────────────────────┘
```

---

## 📂 Project Structure

```
ResQRoute/
├── backend/                       # Python FastAPI backend
│   ├── dsa/
│   │   ├── graph.py               # CityGraph + Dijkstra shortest-path algorithm
│   │   └── priority_queue.py      # Max-Heap emergency triage queue
│   ├── database/
│   │   ├── connection.py          # SQLAlchemy engine & session factory
│   │   ├── models_db.py           # ORM models (UserDB, AmbulanceDB, HospitalDB, IncidentDB)
│   │   └── seed.py                # Database seeder (users, ambulances, hospitals)
│   ├── routers/
│   │   ├── auth.py                # /api/auth/* (login, register, profile)
│   │   └── admin.py               # /api/admin/* (staff, fleet, hospital CRUD)
│   ├── security.py                # bcrypt password hashing & JWT token handling
│   ├── models.py                  # Pydantic schemas (locations, roads, SOS, auth)
│   ├── server.py                  # Main FastAPI application and API routes
│   ├── test_api.py                # API integration test suite
│   ├── requirements.txt           # Python dependencies
│   └── Procfile                   # Cloud process definition for Render
├── web/                           # React + Vite Web Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── CityMap.jsx        # Interactive canvas map with arterial roads
│   │   │   ├── FleetTable.jsx     # Real-time ambulance fleet status table
│   │   │   ├── HospitalCards.jsx  # Hospital bed occupancy grid
│   │   │   ├── RoadControls.jsx   # Live road closure & detours toggle
│   │   │   └── TriageHeap.jsx     # Emergency call queue monitor
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Dispatcher Control Room & Route Inspector
│   │   │   ├── AdminPanel.jsx     # User management & infrastructure controls
│   │   │   └── Login.jsx          # JWT authentication page with demo logins
│   │   ├── services/
│   │   │   └── api.js             # Centralized API service with live Render fallback
│   │   ├── App.jsx                # Router & role verification
│   │   └── main.jsx               # React DOM entry point
│   ├── start.js                   # Cross-platform Node launcher (safe on Windows)
│   ├── package.json
│   └── README.md                  # Web specific setup & deployment guide
├── mobile/                        # React Native / Expo Mobile App
│   ├── src/
│   │   ├── api.js                 # Mobile API service with cloud base URL
│   │   └── theme.js               # High-contrast emergency UI theme
│   ├── App.js                     # Citizen SOS & Driver Mission HUD
│   ├── app.json                   # Expo SDK 58 application manifest
│   ├── eas.json                   # Expo EAS cloud build profile for APK
│   ├── start.js                   # Cross-platform Metro bundler launcher
│   ├── package.json
│   └── README.md                  # Mobile app & APK build guide
├── src/                           # Original C++ DSA reference implementation
└── README.md                      # Complete system documentation (this file)
```

---

## 🚀 Quick Start Guide

You can run the system entirely locally or connect frontend clients directly to the **live Render backend**.

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Git**
- *(Optional for mobile testing)*: **Expo Go** app on your physical smartphone or **EAS CLI** for standalone APK builds.

---

### Step 1: Backend Server (Local or Cloud)

#### Option A: Use the Live Cloud Backend (No Setup Required)
The web and mobile apps are pre-configured to connect directly to:
```
https://resqroute-cq1x.onrender.com
```

#### Option B: Run Backend Locally
Open a terminal in the root directory:

```bash
# 1. Install dependencies
pip install -r backend/requirements.txt

# 2. Start the FastAPI server
python backend/server.py
```
- **Local API**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`

---

### Step 2: Web Control Room (React + Vite)

Open a second terminal:

```bash
cd web
npm install
node start.js
```
*(Alternatively: `npm run dev`)*

- **Web Dashboard**: `http://localhost:5173`
- Open `http://localhost:5173` in your browser.

---

### Step 3: Mobile App (React Native + Expo SDK 58)

Open a third terminal:

```bash
cd mobile
npm install
node start.js
```

- **On a Physical Smartphone**: Scan the QR code displayed in the terminal using the **Expo Go** app (Android) or Camera app (iOS). Ensure phone is on the same Wi-Fi as your PC.
- **In Web Browser Preview**: Press **`w`** in the terminal to open the mobile interface at `http://localhost:8081`.

---

## 📦 Building Standalone Android APK

You can build and install a real `.apk` on any Android device without installing Android Studio:

```bash
# 1. Install EAS CLI globally and log in
npm install -g eas-cli
eas login

# 2. Build preview APK in the cloud
cd mobile
eas build -p android --profile preview
```

When the build finishes, EAS provides a direct download link and QR code. Download the `.apk` on your phone, tap **Install**, and launch ResQRoute!

---

## 🔐 Pre-seeded User Accounts & Roles

| Role | Driver / Staff Name | Email | Password | Stationed / Base Location | Permissions & Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Emergency Dispatcher** | Control Room Dispatcher | `dispatcher@resqroute.org` | `admin123` | **📍 Central Control Room** | Control room operations, live map view, road closure toggles, call dispatching, and bed updates. |
| **System Admin** | System Administrator | `admin@resqroute.org` | `admin123` | **📍 Central HQ Command** | Full control room access, user/staff management, infrastructure editing/deletion, and ambulance/hospital creation. |
| **Ambulance Driver #101** | Ali Khan | `driver101@resqroute.org` | `driver123` | **📍 North Karachi** | Driver HUD, turn-by-turn navigation, patient arrival, and hospital handover workflow. |
| **Ambulance Driver #102** | Ahmed Raza | `driver102@resqroute.org` | `driver123` | **📍 Gulshan** | Driver HUD, turn-by-turn navigation, patient arrival, and hospital handover workflow. |
| **Ambulance Driver #103** | Usman Sheikh | `driver103@resqroute.org` | `driver123` | **📍 Nazimabad** | Driver HUD, turn-by-turn navigation, patient arrival, and hospital handover workflow. |
| **Ambulance Driver #104** | Tariq Jameel | `driver104@resqroute.org` | `driver123` | **📍 Saddar** | Driver HUD, turn-by-turn navigation, patient arrival, and hospital handover workflow. |
| **Ambulance Driver #105** | Hamza Qureshi | `driver105@resqroute.org` | `driver123` | **📍 Clifton** | Driver HUD, turn-by-turn navigation, patient arrival, and hospital handover workflow. |
| **Registered Citizen** | Zain Citizen | `citizen@resqroute.org` | `citizen123` | **📍 Public Mobile Portal** | Citizen emergency SOS trigger, location detection, and live vehicle tracking. |

*(All login screens on both Web and Mobile include one-click **⚡ Demo Login** buttons displaying driver base sectors for instant access).*

---

## 🗺️ City Arterial Road Network & Routing

The system models Karachi's arterial transit corridors as a weighted, bidirectional graph:

```
                            [Gulistan-e-Jauhar]
                                 │         ╲(8km)
                              (6km)         ╲
                                 │           ▼
[North Karachi] ──(6.5km)── [Gulshan] ──(10km)── [Airport] ──(5km)── [Malir]
      │                        │ ╲                 │ ╲                 │
   (6.5km)                  (8km) ╲(5.5km)       (6km) ╲(14km)       (8km)
      │                        │   ╲               │     ╲             │
      ▼                        ▼    ▼              ▼      ▼            ▼
[Nazimabad] ───(7km)─────► [Saddar]  [Shahrah-e-Faisal] ──────► [Defense]
                               │                           ▲
                             (4km)                       (5km)
                               │                           │
                               ▼                           │
                           [Clifton] ──────────────────────┘
```

### Key Arterial Routing
- **Gulistan-e-Jauhar Arterial Access**:
  - Located directly above Gulshan at coordinates `(440, 70)`.
  - Connected to Gulshan (6.0 km) and Airport (8.0 km).
- **Malir ⇄ Shahrah-e-Faisal ⇄ Saddar Corridor**: 
  - Malir to Shahrah-e-Faisal (8.0 km)
  - Shahrah-e-Faisal to Saddar (7.0 km)
  - Total distance: **15.0 km** (~18 min emergency transit).
- **Dynamic Infrastructure Updates & Visual Editing**:
  - **Add Sector / Location**: Add custom city sectors with coordinates, parent artery, and placement (`POST /api/locations`).
  - **Edit Sector & Live Drag Positioning**: Drag and drop nodes visually on an interactive map or use directional nudge buttons (`PUT /api/locations/{name}`).
  - **Remove Sector**: Delete any sector node and automatically reassign stranded units to safe fallback sectors (`DELETE /api/locations/{name}`).
  - **Connect Roads**: Draw new bidirectional roads with custom distances between any two sectors (`POST /api/roads`).
  - **Disconnect Road**: Sever an existing road artery directly from the UI (`DELETE /api/roads/{u}/{v}`).
  - **Route Inspector**: Test shortest paths and ETAs dynamically between any two locations (`GET /api/route/plan`).
  - **Road Closure & Detours**: Toggle any road segment closed to simulate traffic jams or blockages; Dijkstra automatically computes the optimal detour in real time!

---

## 🌟 Core Features & Operational Workflow

### 1. Web Control Room (`web/`)
- **Real-Time Operations Overview**: KPI cards tracking Available Ambulances, Free Hospital Beds, Active Missions, and Total Calls Logged.
- **Interactive City Canvas Map**:
  - High-visibility color-coded vehicle markers (`Available` in green, `At Scene` in yellow, `Transporting` in red).
  - Hospital nodes with real-time bed capacity indicators.
  - Isolated distance tags (`X km`) rendering with clean badge backgrounds to prevent line overlap.
  - Interactive road segments: click any road to toggle closure.
  - Active dispatch path highlighted with pulsing beacon.
  - **📋 Copy Route** button for immediate dispatch sharing.
- **Modal Viewport & Overflow Management**:
  - All dialogs strictly bounded (`max-h-[90vh]`) with internal scrollable bodies (`overflow-y-auto`) and sticky action buttons (`Save`, `Cancel`, `Remove`, `Disconnect`) to ensure zero screen clipping across all display sizes.
  - Interactive visual positioning preview map enlarged to `h-64 sm:h-72` with bold 12px labels and enlarged node touchpoints.
- **Emergency Route Navigator & Trip Inspector**: Test travel times and shortest paths between any pickup and destination in the city.
- **Emergency Call Registration**: Dispatch closest available ambulance with automated hospital reservation based on 4 severity levels (Critical, High, Medium, Low).
- **Fleet Management & Bed Adjustments**: Live table of all units with one-click vehicle release and hospital capacity sliders.
- **Persistent Call History & Audit Trail**: Chronological incident logs persisted in SQLite (`IncidentDB`) with individual **📋 Copy** buttons.
- **Clean Emergency Service Interface**: Zero academic jargon (no "Dijkstra", "Max-Heap", or "graph" labels on user screens).

### 2. Mobile App (`mobile/`)
- **📱 Citizen Emergency SOS**:
  - Automatic GPS sector detection via *"Locate Me"*.
  - Dynamic sector synchronization: automatically refreshes latest sectors directly from the backend on SOS button press.
  - Searchable and scrollable emergency zone selection modal (`🔍 Search sector...`).
  - Anti-false alarm verification modal displaying the emergency sector with one-tap quick change option.
  - Animated pulsing SOS button.
  - Waypoint route tracker with dynamic countdown ETA.
  - One-tap **📋 Copy Emergency & Route Details** button.
- **🚑 Driver Mission HUD**:
  - Standby HUD displaying assigned vehicle unit and stationed sector.
  - One-click demo logins for all 5 ambulance driver units with stationed base locations on screen.
  - Polling engine receiving dispatch missions in under 2.5 seconds.
  - Step-by-step navigation directions (Station ➔ Patient ➔ Hospital).
  - Three-stage mission progression:
    1. *📍 Arrived at Patient Scene* (`At Scene`)
    2. *🏥 En Route to Hospital* (`Transporting`)
    3. *✓ Hospital Handover & Complete* (`Available`)
  - One-tap **📋 Copy Navigation Route & Hospital** button.
  - **⚙️ Backend Server Switcher**: Quickly switch between live cloud backend and local server without rebuilding.

---

## 🧠 Data Structures & Algorithms (DSA) Implementation

For academic review and evaluation:

### 1. Shortest Path Routing (Dijkstra's Algorithm)
- **File**: `backend/dsa/graph.py`
- **Data Structure**: Adjacency list representation with weighted edges stored as dictionaries: `graph[u][v] = distance_km`.
- **Algorithm**: Dijkstra's algorithm implemented with a min-heap priority queue (`heapq`).
- **Time Complexity**: $\mathcal{O}((V + E) \log V)$, where $V$ is the number of city sectors and $E$ is the number of road segments.
- **Dynamic Adaptability**: When a road is toggled closed, its edge weight is temporarily removed from the active routing graph, forcing Dijkstra to compute the optimal detour.

### 2. Emergency Priority Triage (Max-Heap)
- **File**: `backend/dsa/priority_queue.py`
- **Data Structure**: Binary Max-Heap utilizing Python's `heapq` with negated priority keys.
- **Severity Ranking**:
  - **Critical (Level 4)**: Cardiac arrest, severe trauma, stroke.
  - **High (Level 3)**: Major fractures, respiratory difficulty.
  - **Medium (Level 2)**: Moderate injuries, stable vitals.
  - **Low (Level 1)**: Minor cuts, non-life-threatening ailments.
- **Time Complexity**: Insertion in $\mathcal{O}(\log N)$, Extraction (next highest emergency) in $\mathcal{O}(\log N)$.
- **Guarantee**: High-severity patients are guaranteed immediate ambulance dispatch ahead of earlier low-priority calls.

---

## 📡 API Reference Summary

### Authentication (`/api/auth/*`)
- `POST /api/auth/login` — JWT token generation.
- `POST /api/auth/register` — Register citizen or staff user.
- `GET /api/auth/me` — Current user profile and assigned ambulance.

### Emergency Operations (`/api/*`)
- `POST /api/emergency/sos` — Trigger emergency call, execute Dijkstra dispatch, reserve hospital bed.
- `GET /api/status` — Full control room state (fleet, hospitals, call queue).
- `GET /api/locations` — City sectors, coordinates, and stationed units.
- `POST /api/locations` — Add new city sector dynamically.
- `PUT /api/locations/{location_name}` — Edit sector coordinates and/or rename sector.
- `DELETE /api/locations/{location_name}` — Remove a sector node and all its connected roads safely.
- `GET /api/roads` — All road connections with distances and status.
- `POST /api/roads` — Create custom bidirectional road connection.
- `DELETE /api/roads/{u}/{v}` — Disconnect road connection between two sectors.
- `POST /api/road/toggle` — Toggle road closure (active/closed).
- `GET /api/route/plan?origin={A}&destination={B}` — Compute shortest path and ETA.
- `GET /api/ambulance/{id}/mission` — Polled by mobile driver HUD.
- `POST /api/ambulance/{id}/status` — Update driver state (`Available`, `At Scene`, `Transporting`).
- `GET /api/incidents` — Logged dispatch history from persistent SQLite database.
- `POST /api/reset` — Reset system to initial seeded state.

### Administration (`/api/admin/*`)
- `GET|POST /api/admin/users` — Staff user management.
- `PATCH /api/admin/users/{id}/deactivate` — Soft deactivate staff account.
- `GET|POST /api/admin/ambulances` — Fleet creation & tracking.
- `GET|POST /api/admin/hospitals` — Hospital creation.
- `PATCH /api/admin/hospitals/{id}/beds` — Dynamic bed capacity adjustment.

---

## 🛠️ Verification & Test Suite

Run the automated backend test suite to verify graph routing, dynamic road addition, and triage priority:

```bash
python backend/test_api.py
```

Expected output:
```
============================================================
ResQRoute Backend Test Suite (FastAPI + DSA + DB)
============================================================
PASS: Health check
PASS: Status endpoint
PASS: Dynamic Locations API
PASS: Dynamic Roads API
PASS: Dynamic Route Planning (Malir -> Shahrah-e-Faisal -> Saddar)
============================================================
ALL 5 TESTS PASSED!
============================================================
```

To verify web build:
```bash
cd web
node start.js build
```

---

## 👥 Authors & Academic Context

- **Project**: ResQRoute — Intelligent Emergency Routing & Ambulance Dispatch
- **Course**: Data Structures & Algorithms (DSA) — 3rd Semester Final Project
- **Focus Areas**: Graph Theory, Dijkstra's Shortest Path, Max-Heap Priority Queues, Full-Stack System Design.
