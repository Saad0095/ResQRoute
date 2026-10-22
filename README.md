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
- [x] Add priority-based emergency processing
- [x] Add ambulance availability updates
- [ ] Implement Dijkstra's shortest-path routing
- [ ] Implement A\* route finding
- [ ] Add hash-map-based entity lookup
- [ ] Add candidate ranking and sorting
- [ ] Simulate road closures and rerouting
- [ ] Display complete dispatch decisions and complexity notes

## 🧪 Current application

The application is a menu-driven console program. It starts with sample
ambulances and hospitals and provides options to:

- Display, add, and update ambulances.
- Display and add hospitals.
- Register emergencies with low, medium, high, or critical severity.
- Display pending emergencies in priority order.
- Process the highest-priority emergency when an ambulance is available.

## 🛠️ Technology

- **C++17**
- **C++ Standard Library (STL)**
- **GCC / MSYS2 MinGW-w64**
- **VS Code** (optional)

No external libraries are required.

## 📁 Project structure

```text
ResQRoute - Intelligent Emergency Routing & Ambulance Dispatch/
├── README.md                  # Project documentation
└── src/
    ├── Ambulance.h/.cpp       # Ambulance class
    ├── Hospital.h/.cpp        # Hospital class
    ├── Emergency.h/.cpp       # Emergency class and priority comparator
    ├── ResQRoute.h/.cpp       # Application controller and menu operations
    └── main.cpp               # Program entry point
```

## 🚀 Setup and execution

### Prerequisites

Install a C++17-capable GCC toolchain. On Windows, **MSYS2 MinGW-w64** is
suitable. Confirm that `g++` is available in the VS Code terminal.

### Direct GCC compilation

```powershell
cd "E:\University\3rd Semester\DSA\Final-Project\ResQRoute - Intelligent Emergency Routing & Ambulance Dispatch\src"
g++ main.cpp ResQRoute.cpp Emergency.cpp Hospital.cpp Ambulance.cpp -o ResQRoute.exe
.\ResQRoute.exe
```

Compile all five `.cpp` files because the class implementations are split
across separate modules. Run the commands again after making source changes.

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
