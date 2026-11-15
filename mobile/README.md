# 📱 ResQRoute Mobile App (Expo SDK 58)

> **Citizen SOS & Ambulance Driver HUD** powered by React Native and Expo SDK 58.

---

## 🚀 How to Run the Mobile App

### Prerequisites
1. Install **Node.js** (v18 or higher).
2. Install **Expo Go** on your physical phone (available for free on [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) and [Apple App Store](https://apps.apple.com/app/expo-go/id982107779)).
3. Ensure the **Backend API** is running (`python backend/server.py`).

---

### Step 1: Start the Development Server

Open your terminal in the `mobile` directory and run:

```bash
cd mobile
node start.js
```

*(Note: Always use `node start.js` instead of `npx expo start` to prevent Windows path escaping errors).*

---

### Step 2: Open on Your Device

#### Option A: On a Physical Smartphone (Recommended)
1. Ensure your phone and computer are connected to the **same Wi-Fi network**.
2. Open the **Expo Go** app on your phone:
   - **Android**: Tap *"Scan QR Code"* and point your camera at the QR code in your terminal.
   - **iOS**: Open the built-in Camera app, scan the QR code, and tap the notification to open in Expo Go.

#### Option B: Web Browser Preview
- In the terminal where `node start.js` is running, press **`w`**.
- It will automatically open the mobile app in your web browser at `http://localhost:8081`.

---

## 🔐 Driver Portal Credentials

To test the **Ambulance Driver HUD**:
1. Tap the **🚑 DRIVER PORTAL** tab at the top.
2. Sign in with the seeded vehicle driver credentials:

| Field | Value |
| :--- | :--- |
| **Email** | `driver102@resqroute.org` |
| **Password** | `driver123` |
| **Quick Demo** | Tap the *"⚡ Demo Login: Driver #102"* button for one-click access. |

---

## 📱 Features

- **📱 Citizen SOS Mode**:
  - Live GPS sector detection with automatic mapping.
  - Emergency Verification Dialog to confirm case urgency and prevent false alarms.
  - Animated pulsing SOS one-tap trigger.
  - Live vehicle waypoint route tracker and real-time ETA countdown.
- **🚑 Driver Mission Portal**:
  - Live mission dispatch alerts.
  - Fastest route navigation steps.
  - **Mission Progression Buttons**:
    1. *📍 Arrived at Patient Scene* (Sets status to `At Scene`)
    2. *🏥 En Route to Hospital* (Sets status to `Transporting`)
    3. *✓ Hospital Handover & Complete* (Frees ambulance back to `Available`)
  - Status updates sync instantly with the Web Control Room and SQLite database.
