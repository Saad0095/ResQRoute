# 📱 ResQRoute Mobile App (Expo SDK 58)

> **Citizen Emergency SOS & Ambulance Driver HUD** powered by React Native and Expo SDK 58.

---

## 🚀 How to Run the Mobile App

### Prerequisites
1. Install **Node.js** (v18 or higher).
2. Install **Expo Go** on your physical phone:
   - [Google Play Store (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [Apple App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779)
3. Backend API running:
   - **Local**: `python backend/server.py` (`http://localhost:8000`)
   - **Live Cloud**: `https://resqroute-cq1x.onrender.com` (configured as default)

---

### Step 1: Install Dependencies (First Time Only)

```bash
cd mobile
npm install
```

---

### Step 2: Start the Development Server

```bash
cd mobile
node start.js
```

*(Note: Always use `node start.js` instead of raw `npx expo start` to prevent Windows path escaping errors).*

---

### Step 3: Open on Your Device

#### Option A: On a Physical Smartphone (Recommended via Expo Go)
1. Ensure your phone and computer are connected to the **same Wi-Fi network**.
2. Open the **Expo Go** app on your phone:
   - **Android**: Tap *"Scan QR Code"* and point your camera at the QR code in your terminal.
   - **iOS**: Open the built-in Camera app, scan the QR code, and tap the notification to open in Expo Go.

#### Option B: Web Browser Preview
- In the terminal where `node start.js` is running, press **`w`**.
- The app will automatically open in your default browser at `http://localhost:8081`.

---

## 📦 Building a Standalone Android APK

You can build and install a production-ready `.apk` file directly on any Android smartphone using Expo Application Services (EAS Build).

### 1. Install EAS CLI & Log In
```bash
npm install -g eas-cli
eas login
```

### 2. Trigger the Cloud Build
```bash
cd mobile
eas build -p android --profile preview
```

### 3. Install on Your Phone
1. Once the build completes, EAS outputs a direct download link and a QR code.
2. Scan the QR code or visit the link on your Android phone's browser.
3. Download the `.apk` file and tap **Install**.
4. *(If prompted, allow installing apps from your browser).*

---

## ⚙️ Backend Connection Settings

The app defaults to your live production cloud backend:
```
https://resqroute-cq1x.onrender.com
```

If you wish to switch back to a local backend during offline development:
1. Tap the **⚙️ Settings** icon in the top-right header of the app.
2. Enter your computer's local Wi-Fi IP address (e.g. `http://192.168.1.15:8000`).
3. Tap **Save**. The app will immediately reconnect to your local server without rebuilding!

---

## 🔐 Driver Portal Credentials

To test the **Ambulance Driver HUD**:
1. Tap the **🚑 DRIVER PORTAL** tab in the top header.
2. Sign in with the seeded vehicle driver credentials:

| Field | Value |
| :--- | :--- |
| **Email** | `driver102@resqroute.org` |
| **Password** | `driver123` |
| **Vehicle Unit** | Ambulance #102 |
| **Quick Demo** | Tap the *"⚡ Demo Login: Driver #102"* button for one-click access. |

---

## 🌟 Key Features

### 📱 Citizen SOS Mode
- **Live GPS Sector Detection**: One-tap *"Locate Me"* automatically identifies the nearest city sector (e.g., *Malir*, *Shahrah-e-Faisal*, *Gulshan*).
- **Anti-False Alarm Verification Dialog**: Requires confirming emergency category and contact info before initiating dispatch.
- **Concentric Pulse Animated SOS Button**: High-visibility emergency activation.
- **Live Vehicle Route Tracker**: Turn-by-turn waypoint visualizer showing current ambulance progression and dynamic countdown ETA.
- **One-Tap Copy**: "📋 Copy Emergency & Route Details" button to easily share or save incident information.

### 🚑 Driver Mission Portal
- **Standby & Location HUD**: Displays driver name, vehicle unit ID, and current stationed base sector.
- **Real-Time Mission Alerts**: Polling engine receives emergency dispatches within 2.5 seconds.
- **Fastest Turn-by-Turn Navigation**: Step-by-step arterial sector routing from current ambulance location to patient, and then to target hospital.
- **Hospital Allocation Details**: Displays target hospital name and sector with reserved bed status.
- **Mission Progression Controls**:
  1. *📍 Arrived at Patient Scene* (Sets status to `At Scene`)
  2. *🏥 En Route to Hospital* (Sets status to `Transporting`)
  3. *✓ Hospital Handover & Complete* (Frees ambulance back to `Available`)
- **Copy Navigation Details**: "📋 Copy Navigation Route & Hospital" copies complete journey information to clipboard.
