# 🚑 ResQRoute — Intelligent Emergency Routing & Ambulance Dispatch

> **Enterprise-Grade Emergency Dispatch System** combining real-time DSA algorithms (Dijkstra's Shortest Path + Max-Heap Priority Queue) with full-stack JWT-authenticated multi-role architecture.

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         ResQRoute System                                │
├──────────────┬──────────────┬──────────────┬────────────────────────────┤
│  📱 Mobile   │  🖥️ Web App  │  🔧 Backend  │  💾 Database               │
│  (Expo/RN)   │  (React+Vite)│  (FastAPI)   │  (SQLite + SQLAlchemy)     │
├──────────────┼──────────────┼──────────────┼────────────────────────────┤
│ • Citizen SOS│ • Control    │ • JWT Auth   │ • users (RBAC)             │
│   one-tap    │   Room       │ • RBAC       │ • ambulances               │
│ • Driver HUD │ • Admin Panel│ • Dijkstra   │ • hospitals                │
│   (auth'd)   │ • City Map   │ • Max-Heap   │ • incidents                │
│ • Offline    │ • Fleet Mgmt │ • Full CRUD  │                            │
│   fallback   │ • Triage Q   │ • Road Graph │                            │
└──────────────┴──────────────┴──────────────┴────────────────────────────┘
```

## 📂 Project Structure

```
ResQRoute/
├── src/                    # Original C++ DSA implementation
├── backend/                # Python FastAPI server
│   ├── dsa/
│   │   ├── graph.py        # CityGraph + Dijkstra's algorithm
│   │   └── priority_queue.py  # Max-Heap Emergency Priority Queue
│   ├── database/
│   │   ├── connection.py   # SQLAlchemy engine + session
│   │   ├── models_db.py    # ORM models (User, Ambulance, Hospital, Incident)
│   │   └── seed.py         # Initial data seeding
│   ├── routers/
│   │   ├── auth.py         # /api/auth/* (login, register, profile)
│   │   └── admin.py        # /api/admin/* (user/fleet/hospital CRUD)
│   ├── security.py         # bcrypt + JWT + RBAC guards
│   ├── models.py           # Pydantic request/response schemas
│   ├── server.py           # Main FastAPI app with all endpoints
│   └── run_server.py       # Server launcher
├── web/                    # React (Vite) Web Dashboard
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx       # Auth page with demo credentials
│       │   ├── Dashboard.jsx   # Dispatcher Control Room
│       │   └── AdminPanel.jsx  # System Administration Console
│       ├── components/
│       │   ├── CityMap.jsx     # Canvas-based road graph visualization
│       │   ├── RoadControls.jsx
│       │   ├── TriageHeap.jsx
│       │   ├── FleetTable.jsx
│       │   └── HospitalCards.jsx
│       └── services/api.js    # Authenticated API client
└── mobile/                 # React Native / Expo mobile app
    ├── App.js              # Multi-role app (Citizen + Driver)
    └── src/
        ├── api.js          # Mobile API client with offline fallback
        └── theme.js        # Emergency dark theme
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **Expo Go** app (for mobile testing on physical device)

### 1. Backend Server

```powershell
cd backend
pip install -r requirements.txt
python run_server.py
```

The API starts at **http://localhost:8000**. Visit `/docs` for Swagger UI.

### 2. Web Control Room

```powershell
cd web
npm install
node start.js          # Dev server on http://localhost:5173
node start.js build    # Production build → web/dist/
```

### 3. Mobile App

```powershell
cd mobile
npm install
npm start              # Expo dev server
```

Press **`w`** to open in browser, or scan the QR code with Expo Go.

## 🔐 Authentication & Roles

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | `admin@resqroute.org` | `admin123` | Full system admin + dispatch |
| **Dispatcher** | `dispatcher@resqroute.org` | `admin123` | Control room + admin panel |
| **Driver 101** | `driver101@resqroute.org` | `driver123` | Mobile driver HUD |
| **Driver 102** | `driver102@resqroute.org` | `driver123` | Mobile driver HUD |
| **Driver 103** | `driver103@resqroute.org` | `driver123` | Mobile driver HUD |
| **Citizen** | `citizen@resqroute.org` | `citizen123` | Mobile SOS only |

## 🧠 DSA Algorithms

### Dijkstra's Shortest Path Algorithm
- **Implementation**: Adjacency list graph with weighted edges representing Karachi road network
- **Dynamic road closures**: Toggle any road segment; Dijkstra reroutes around closures
- **Used for**: Finding closest available ambulance and nearest hospital with capacity

### Max-Heap Priority Queue (Emergency Triage)
- **Implementation**: Python `heapq` with negated priorities for max-heap behavior
- **Severity levels**: Critical (4) → High (3) → Medium (2) → Low (1)
- **Guarantees**: Highest-severity emergencies are always processed first

### City Graph
7 zones (nodes) connected by 11 weighted road segments (edges):
```
North Karachi ←→ Nazimabad ←→ Gulshan ←→ Saddar ←→ Clifton ←→ Defense
                                 ↕                      ↕
                              Airport ←→ ←→ ←→ ←→ ←→ ←→
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | JWT login |
| POST | `/api/auth/register` | Create account |
| GET | `/api/auth/me` | Get current user profile |

### Dispatch Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/emergency/sos` | Trigger emergency dispatch |
| GET | `/api/status` | System status (fleet, hospitals, queue) |
| GET | `/api/roads` | Get road network |
| POST | `/api/road/toggle` | Close/reopen road segment |
| GET | `/api/ambulance/{id}/mission` | Get driver mission |
| POST | `/api/ambulance/{id}/status` | Update ambulance status |
| GET | `/api/incidents` | Dispatch history |
| POST | `/api/reset` | Reset system state |

### Administration (ADMIN/DISPATCHER only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create user |
| PATCH | `/api/admin/users/{id}/deactivate` | Deactivate user |
| PATCH | `/api/admin/users/{id}/activate` | Activate user |
| DELETE | `/api/admin/users/{id}` | Delete user (ADMIN only) |
| GET | `/api/admin/hospitals` | List hospitals |
| POST | `/api/admin/hospitals` | Add hospital |
| PATCH | `/api/admin/hospitals/{id}/beds` | Update bed count |
| GET | `/api/admin/ambulances` | List fleet |
| POST | `/api/admin/ambulances` | Add ambulance |

## 🎯 End-to-End Demo Flow

1. **Start backend** → `python backend/run_server.py`
2. **Open web** → Login as Dispatcher → See Control Room
3. **Trigger SOS** → Select zone & severity → Watch Dijkstra route light up on City Map
4. **Admin Panel** → Click "Admin Panel" button → Manage users, fleet, hospitals
5. **Mobile Citizen** → Open Expo → Press SOS → See dispatch result with ETA
6. **Mobile Driver** → Switch to Driver tab → Login → See mission HUD → Complete mission
7. **Verify** → Web dashboard shows ambulance back to Available (green)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3, FastAPI, Uvicorn |
| Auth | JWT (PyJWT), bcrypt, OAuth2 Bearer |
| Database | SQLite + SQLAlchemy ORM |
| Web Frontend | React 19, Vite 8, TailwindCSS, Lucide Icons |
| Mobile | React Native, Expo SDK 51 |
| DSA | Dijkstra (custom), Max-Heap Priority Queue |

---

**University:** 3rd Semester DSA Final Project  
**Course:** Data Structures & Algorithms
