// Zikriyon Fyber Connect — Firebase initialization
//
// Matches the ESP32 firmware's schema exactly:
//   RTDB:      stations/{station_id}/live/{sensors,heartbeat,alerts}
//              stations/{station_id}/commands   (see poll note in firmware README)
//   Firestore: stations/{station_id}                      (metadata)
//              stations/{station_id}/readings/{doc}        (history)
//              stations/{station_id}/alerts/{doc}           (alert history)
//              admins/{uid}                                  (admin allowlist doc)

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Filled in with the project's actual values (from the Firebase Console
// config snippet). If you fork this for a different Firebase project,
// replace every value below.
const firebaseConfig = {
  apiKey: "AIzaSyD8V35DzMz87JPvy8J_LHF2RjYD1vRU0XY",
  authDomain: "zikriyon-fwi.firebaseapp.com",
  databaseURL: "https://zikriyon-fwi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "zikriyon-fwi",
  storageBucket: "zikriyon-fwi.firebasestorage.app",
  messagingSenderId: "81864004779",
  appId: "1:81864004779:web:f3ca0ce73fb28c0ee593ee",
};

export const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);
export const firestore = getFirestore(app);
export const auth = getAuth(app);

// ---- Fault source / severity enums — must match zf_diagnostics.h exactly ----
export const FAULT_SOURCES = [
  "BME680", "Soil Moisture", "Rain Sensor", "Battery",
  "LoRa Radio", "WiFi", "LED", "Buzzer",
];

export const SEVERITY = { NONE: 0, LOW: 1, MEDIUM: 2, CRITICAL: 3 };
export const SEVERITY_NAMES = ["none", "low", "medium", "critical"];

export function severityClass(sev) {
  if (sev >= SEVERITY.CRITICAL) return "critical";
  if (sev >= SEVERITY.MEDIUM) return "medium";
  if (sev >= SEVERITY.LOW) return "low";
  return "ok";
}
