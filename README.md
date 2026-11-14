# 🚑 ResQRoute

## Intelligent Emergency Routing & Ambulance Dispatch

> **When every second matters, which ambulance should respond, which route
> should it take, and which hospital should receive the emergency?**

ResQRoute is a university **Data Structures and Algorithms project in C++**
that explores these decisions through a simulated city and a menu-driven
emergency dispatch workflow.

![Status](https://img.shields.io/badge/status-working%20console%20application-blue)
![Language](https://img.shields.io/badge/language-C%2B%2B17-00599C)
![Focus](https://img.shields.io/badge/focus-Data%20Structures%20%26%20Algorithms-orange)

> **Current milestone:** The console application manages ambulances, hospitals,
> and emergency requests using C++ STL containers.

---

## 🎯 The challenge

Imagine a small city with:

- 🚨 Several emergency requests with different urgency levels
- 🚑 Ambulances in different locations and availability states
- 🏥 Hospitals with different capacities or suitability
- 🛣️ Roads with different travel distances
- 🚧 Road closures that change the available routes

A useful dispatch system must make several decisions quickly instead of
checking every possibility manually. ResQRoute turns that scenario into a
clear, educational DSA problem:

```text
Emergency request
        │
        ▼
Prioritize the request
        │
        ▼
Select a suitable ambulance
        │
        ▼
Find an efficient route
        │
        ▼
Choose a suitable hospital
```

Everything is simulated for learning. There is no live GPS, real-time traffic,
external map service, patient-record system, or production emergency
integration.

## 🌟 Project goals

ResQRoute demonstrates how the right data structure or algorithm can make each
dispatch decision more organized and efficient:

1. Store and display ambulance records.
2. Store and display hospital records.
3. Register emergency requests with severity levels.
4. Prioritize emergencies using a priority queue.
5. Assign an available ambulance to the highest-priority pending emergency.
6. Update ambulance availability after processing an emergency.

## 🧠 DSA toolkit

| DSA concept | Role in ResQRoute |
| --- | --- |
| **Priority queue / heap** | Processes urgent requests and candidate ambulances |
| **Vector** | Stores ambulances and hospitals |
| **Linear search** | Finds ambulances by ID and available ambulances |
| **STL algorithms** | Uses `find_if` for record lookup |

These concepts are included only where they naturally fit the problem. The
project is focused on the agreed DSA scope rather than adding unrelated
features or frameworks.

## 🗺️ Current dispatch flow

```text
┌──────────────────────┐
│ Load sample records  │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Queue emergencies    │ ◄── highest urgency first
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Find an available    │
│ ambulance            │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Assign the ambulance │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Remove the emergency │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Display dispatch     │
└──────────────────────┘
```

## 🚧 Development roadmap

- [x] Create a modular C++ project structure
- [x] Add emergency, ambulance, and hospital entities
- [x] Add priority-based emergency processing (Max-Heap triage)
- [x] Add ambulance availability updates
- [x] Implement Dijkstra's shortest-path routing (`backend/dsa/graph.py`)
- [x] Build REST API dispatch backend (`backend/server.py`)
- [x] Build One-Tap SOS Mobile App with live HUD (`mobile/App.js`)
- [ ] Add dynamic road closures and detour rerouting
- [ ] Add map tile view in mobile app

## 📁 Project structure

```text
ResQRoute - Intelligent Emergency Routing & Ambulance Dispatch/
├── backend/                       # Python DSA Engine & REST API
│   ├── dsa/
│   │   ├── graph.py               # City Graph (Adjacency List) & Dijkstra's Algorithm
│   │   └── priority_queue.py      # Emergency Triage Max-Heap
│   ├── static/
│   │   └── dashboard.html         # Control Room Web Dashboard (Interactive City Map)
│   ├── models.py                  # Ambulance, Hospital, Emergency schemas
│   ├── server.py                  # FastAPI Dispatch Server
│   ├── run_server.py              # Server launcher
│   ├── test_api.py                # Automated DSA & API test suite
│   └── requirements.txt
├── mobile/                        # Cross-Platform Mobile App (React Native / Expo)
│   ├── App.js                     # Citizen SOS Screen & Ambulance Driver HUD
│   ├── package.json
│   ├── app.json
│   ├── start.js                   # Node runner (bypasses Windows path bug)
│   └── src/
│       ├── api.js                 # API bridge to DSA Backend
│       └── theme.js               # Emergency high-contrast dark theme
├── src/                           # Original C++ Console System
│   ├── Ambulance.h/.cpp
│   ├── Hospital.h/.cpp
│   ├── Emergency.h/.cpp
│   ├── ResQRoute.h/.cpp
│   └── main.cpp
└── README.md
```

## 🚀 Setup and execution

### 1. Central Control Room Web Dashboard & Backend API
The backend serves the live **Control Room Web Dashboard** with an interactive city map, real-time road closures, and Dijkstra shortest-path calculations.

```powershell
# In the project root:
python backend/run_server.py
```
- **Control Room Web Dashboard:** Open `http://localhost:8000` (or `http://localhost:8000/dashboard`)
  - 🗺️ **Interactive City Map:** Karachi sector graph with real-time ambulance & hospital markers.
  - ⛔ **Dynamic Road Closures:** Click any road segment to block/unblock it and watch Dijkstra reroute!
  - 📊 **Priority Queue Visualizer:** Live triage Max-Heap table.
  - 🚑 **Fleet & Bed Monitors:** Real-time unit availability and hospital bed tracking.
- **Interactive Swagger API Docs:** `http://localhost:8000/docs`

To run the automated DSA & dispatch test suite:
```powershell
python backend/test_api.py
```

### 2. Multi-Role Mobile App (Expo)
The mobile app provides both **Citizen One-Tap SOS** and **Ambulance Driver HUD** views.

```powershell
cd mobile
npm start
```
*(Alternatively, you can run `node start.js`)*
- Press `w` in terminal to view directly in your web browser.
- Or scan the QR code with the free **Expo Go** app on your iPhone or Android device!
- Use the top toggle to switch between:
  - 📱 **Citizen SOS:** One-tap emergency call with live ETA.
  - 🚑 **Driver HUD:** Live navigation, patient sector, and mission completion buttons.

### 3. Running the Original C++ Console Application
To compile and run the console version:

```powershell
cd "E:\University\3rd Semester\DSA\Final-Project\ResQRoute - Intelligent Emergency Routing & Ambulance Dispatch\src"
g++ main.cpp ResQRoute.cpp Emergency.cpp Hospital.cpp Ambulance.cpp -o ResQRoute.exe
.\ResQRoute.exe
```

Compile all five `.cpp` files because the class implementations are split
across separate modules. Run the commands again after making source changes.
The program then displays a menu. Enter a menu number and press **Enter**.
Choose `0` to exit.

To compile and run the program with one command:

```powershell
cd "E:\University\3rd Semester\DSA\Final-Project\ResQRoute - Intelligent Emergency Routing & Ambulance Dispatch\src"; g++ main.cpp ResQRoute.cpp Emergency.cpp Hospital.cpp Ambulance.cpp -o ResQRoute.exe; if ($?) { .\ResQRoute.exe }
```

If the executable is already running, close it before compiling again so that
the compiler can replace `ResQRoute.exe`.

## 📌 Current limitations

- Route calculation, road closures, and hospital suitability ranking are not
  implemented yet.
- Input assumes that numeric values are entered where requested.
- Distances and locations are not used for route calculation yet.
- The application has no live GPS, real-time traffic, external maps,
  databases, APIs, authentication, or cloud deployment.
- This is an educational console application, not a production emergency
  service.

## 👥 Academic project focus

ResQRoute is designed as a readable, modular team project for studying
algorithmic problem solving. Future modules should make the selected data
structure visible, explain why it fits the decision being made, and document
the expected time and space complexity.

---

**ResQRoute — turning DSA concepts into life-saving decisions, one simulated
road at a time.**
