# 🚑 ResQRoute

## Intelligent Emergency Routing & Ambulance Dispatch

> **When every second matters, which ambulance should respond, which route
> should it take, and which hospital should receive the emergency?**

ResQRoute is a university **Data Structures and Algorithms project in C++**
that explores these decisions through a simulated city. The project models
roads as a weighted graph, then gradually builds an intelligent dispatch
workflow around it.

![Status](https://img.shields.io/badge/status-initial%20setup-blue)
![Language](https://img.shields.io/badge/language-C%2B%2B17-00599C)
![Focus](https://img.shields.io/badge/focus-Data%20Structures%20%26%20Algorithms-orange)

> **Current milestone:** The starter application loads a sample city and
> reports its intersections and roads. The complete dispatch simulation is
> intentionally being developed step by step.

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

ResQRoute will demonstrate how the right data structure or algorithm can make
each dispatch decision more organized and efficient:

1. Represent a simulated city as a weighted graph.
2. Prioritize emergencies according to urgency.
3. Find an available and suitable ambulance.
4. Calculate an efficient route to the incident and hospital.
5. React to simulated road closures.
6. Compare the design choices and time complexity of the implemented DSA
   techniques.

## 🧠 DSA toolkit

| DSA concept | Role in ResQRoute |
| --- | --- |
| **Graph + adjacency list** | Represents intersections and weighted roads |
| **Dijkstra's algorithm** | Finds shortest paths without a heuristic |
| **A\* algorithm** | Explores an advanced route-finding approach |
| **Priority queue / heap** | Processes urgent requests and candidate ambulances |
| **Hash map** | Provides fast lookup by emergency, ambulance, and hospital ID |
| **Sorting** | Ranks suitable ambulances and hospitals |

These concepts are included only where they naturally fit the problem. The
project is focused on the agreed DSA scope rather than adding unrelated
features or frameworks.

## 🗺️ Planned dispatch flow

```text
┌──────────────────────┐
│ Load simulated data  │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Queue emergencies    │ ◄── highest urgency first
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Rank ambulances      │ ◄── availability and suitability
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Calculate route      │ ◄── Dijkstra or A*
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Rank hospitals       │ ◄── distance and suitability
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Display dispatch     │
└──────────────────────┘
```

## 🚧 Development roadmap

- [x] Create modular C++ project structure
- [x] Load a small simulated road network
- [x] Store road data in a graph-oriented structure
- [ ] Add emergency, ambulance, and hospital entities
- [ ] Add priority-based emergency processing
- [ ] Implement Dijkstra's shortest-path routing
- [ ] Implement A\* route finding
- [ ] Add hash-map-based entity lookup
- [ ] Add candidate ranking and sorting
- [ ] Simulate road closures and rerouting
- [ ] Display complete dispatch decisions and complexity notes

## 🧪 Current starter demo

The current program reads [`data/sample_city.txt`](data/sample_city.txt),
which contains five one-way sample roads:

```text
# from to distance_km
Central Hospital 4
Central Station 2
Station Hospital 3
Station School 5
School Hospital 2
```

Running the starter produces:

```text
ResQRoute - Intelligent Emergency Routing & Ambulance Dispatch
Loaded 4 intersections and 5 roads.
Starter graph ready for dispatch features.
```

This small demo confirms that the project can read simulated city data and
build its initial graph representation. Routing and dispatch logic will be
added in later milestones.

## 🛠️ Technology

- **C++17**
- **C++ Standard Library (STL)**
- **CMake 3.15+**
- **GCC / MSYS2 MinGW-w64**
- **VS Code** (optional)

No external libraries are required.

## 📁 Project structure

```text
ResQRoute - Intelligent Emergency Routing & Ambulance Dispatch/
├── CMakeLists.txt             # CMake build configuration
├── README.md                  # Project documentation
├── data/
│   └── sample_city.txt        # Simulated road data
├── include/
│   └── resqroute/
│       └── graph.hpp          # RoadGraph interface
└── src/
    ├── graph.cpp              # RoadGraph implementation
    └── main.cpp               # Starter application
```

## 🚀 Setup and execution

### Prerequisites

Install a C++17-capable GCC toolchain and CMake. On Windows, **MSYS2
MinGW-w64** is suitable. Confirm that `g++` and `cmake` are available in the
VS Code terminal.

### Option A: CMake

Run these commands from the ResQRoute project directory:

```powershell
cmake -S . -B build -G "MinGW Makefiles"
cmake --build build
.\build\resqroute.exe
```

If the MinGW Makefiles generator is not available, use the generator
configured for the installed compiler:

```powershell
cmake -S . -B build
cmake --build build
.\build\resqroute.exe
```

### Option B: Direct GCC compilation

```powershell
g++ -std=c++17 -Wall -Wextra -pedantic -Iinclude src/main.cpp src/graph.cpp -o resqroute.exe
.\resqroute.exe
```

The executable expects `data/sample_city.txt` relative to the project
directory, so run it from that directory.

## 📌 Current limitations

- The starter currently loads and summarizes only the road graph.
- Emergency dispatch, ambulance selection, hospital ranking, Dijkstra, A\*,
  road closures, and complete input validation are not implemented yet.
- Distances and locations are simulated.
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
