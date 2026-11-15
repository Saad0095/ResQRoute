# 🖥️ ResQRoute Web Control Room & Admin Portal

> **Real-Time Emergency Dispatch, Fleet Control & Route Navigation Dashboard** powered by React, Vite, and Tailwind CSS.

---

## 🚀 How to Run the Web Dashboard

### Prerequisites
1. **Node.js** (v18 or higher installed on your computer).
2. Backend API running locally at `http://localhost:8000` OR live in the cloud at `https://resqroute-cq1x.onrender.com`.

---

### Step 1: Install Dependencies (First Time Only)

```bash
cd web
npm install
```

---

### Step 2: Start the Development Server

```bash
cd web
node start.js
```
*(Alternatively, you can run `npm run dev`)*

- **Local URL**: `http://localhost:5173`
- Open `http://localhost:5173` in your browser.

---

### Step 3: Production Build (Optional)

To verify or generate production static assets:

```bash
cd web
node start.js build
```

The output bundle is generated inside `web/dist/`.

---

## 🔐 Login Credentials

| Role | Name | Email | Password | Base Station / Sector | Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Emergency Dispatcher** | Control Room Dispatcher | `dispatcher@resqroute.org` | `admin123` | **📍 Central Control Room** | Real-time map, call dispatching, bed updates, road closures. |
| **System Admin** | System Administrator | `admin@resqroute.org` | `admin123` | **📍 Central HQ Command** | Full control room, staff management, sector/road creation & deletion. |
| **Ambulance Driver #101** | Ali Khan | `driver101@resqroute.org` | `driver123` | **📍 North Karachi** | Vehicle HUD & mission navigation. |
| **Ambulance Driver #102** | Ahmed Raza | `driver102@resqroute.org` | `driver123` | **📍 Gulshan** | Vehicle HUD & mission navigation. |
| **Ambulance Driver #103** | Usman Sheikh | `driver103@resqroute.org` | `driver123` | **📍 Nazimabad** | Vehicle HUD & mission navigation. |
| **Ambulance Driver #104** | Tariq Jameel | `driver104@resqroute.org` | `driver123` | **📍 Saddar** | Vehicle HUD & mission navigation. |
| **Ambulance Driver #105** | Hamza Qureshi | `driver105@resqroute.org` | `driver123` | **📍 Clifton** | Vehicle HUD & mission navigation. |

*(All accounts are displayed on the login page with one-click quick-fill buttons).*

---

## 🌐 Deploying to Vercel

1. Import your GitHub repository into Vercel.
2. In the import settings:
   - **Root Directory**: `web`
   - **Framework Preset**: `Vite` (detected automatically)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Under **Environment Variables**, add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://resqroute-cq1x.onrender.com`
4. Click **Deploy**.

---

## 🌟 Key Features

1. **Operations Overview**:
   - Real-time KPI statistics (Ambulances Ready, Hospital Beds Free, Active Missions, Total Calls Logged).
   - Quick Emergency Call dispatch form.
   - Live Emergency Call Queue.
2. **City Sectors & Emergency Map**:
   - Canvas-based interactive map displaying ambulances, hospitals, and dynamic arterial road networks.
   - **Emergency Route Navigator & Trip Inspector**: Test fastest routes between sectors (e.g. *Malir* ➔ *Shahrah-e-Faisal* ➔ *Saddar*).
   - **Road Access & Detours**: Click any road segment to simulate closures/traffic and observe instant live rerouting.
   - **+ Add Sector / Location**: Add custom sectors and connect them to existing zones with distance.
   - **+ Connect Road**: Draw custom bidirectional roads between sectors.
3. **Emergency Call Registration**:
   - Input caller details, select sector from dynamic list, set urgency level (Critical, High, Medium, Low), and trigger automatic closest-ambulance dispatch.
4. **Fleet & Ambulances Management**:
   - Real-time ambulance status tracking (`Available`, `At Scene`, `Transporting`).
   - One-click ambulance release button.
   - Register new ambulance units into the fleet.
5. **Hospital Bed Allocation**:
   - Live bed occupancy tracking across major healthcare facilities.
   - Update bed capacity modal dialog.
6. **Call History & Audit Trail**:
   - Complete chronological log of emergency dispatches with distance, ETA, and copyable incident summaries.
7. **User & Staff Management (Admin Only)**:
   - Create, soft-deactivate, and manage accounts for dispatchers and drivers.
