// Zikriyon Fyber Connect — data hooks
// Each hook wraps one Firebase read pattern so components stay declarative.

import { useEffect, useState } from "react";
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection, doc, onSnapshot, query, orderBy, limit,
} from "firebase/firestore";
import { ref, onValue, set } from "firebase/database";
import { auth, firestore, rtdb } from "./firebase";

// ---- Auth ----

export function useAuthUser() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  return user;
}

/** Signs a public reader in anonymously once, so RTDB/Firestore reads
 *  satisfy the deployed rules' `auth != null` check. Silent — no UI. */
export function useAnonymousReadAccess() {
  const user = useAuthUser();
  useEffect(() => {
    if (user === null) {
      signInAnonymously(auth).catch((err) =>
        console.error("Anonymous sign-in failed:", err.message)
      );
    }
  }, [user]);
}

export async function adminSignIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function adminSignOut() {
  return signOut(auth);
}

/** True once the signed-in user's custom claim marks them admin. See
 *  README's Admin SDK snippet for how that claim gets set — this hook
 *  just reads the ID token result, it cannot grant the claim itself. */
export function useIsAdmin(user) {
  const [isAdmin, setIsAdmin] = useState(undefined);
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    user.getIdTokenResult().then((result) => {
      setIsAdmin(!!result.claims.admin);
    });
  }, [user]);
  return isAdmin;
}

// ---- Station list (Firestore) ----

export function useStationList() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onSnapshot(
      collection(firestore, "stations"),
      (snap) => {
        setStations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => { console.error("Station list read failed:", err.message); setLoading(false); }
    );
    return unsub;
  }, []);
  return { stations, loading };
}

// ---- Live sensor + heartbeat + alerts (RTDB) ----

export function useStationLive(stationId) {
  const [sensors, setSensors] = useState(null);
  const [heartbeat, setHeartbeat] = useState(null);
  const [alerts, setAlerts] = useState({});

  useEffect(() => {
    if (!stationId) return;
    const sensorsRef = ref(rtdb, `stations/${stationId}/live/sensors`);
    const heartbeatRef = ref(rtdb, `stations/${stationId}/live/heartbeat`);
    const alertsRef = ref(rtdb, `stations/${stationId}/live/alerts`);

    const unsub1 = onValue(sensorsRef, (snap) => setSensors(snap.val()));
    const unsub2 = onValue(heartbeatRef, (snap) => setHeartbeat(snap.val()));
    const unsub3 = onValue(alertsRef, (snap) => setAlerts(snap.val() || {}));

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [stationId]);

  return { sensors, heartbeat, alerts };
}

// ---- Historical readings (Firestore, for the trend chart) ----

export function useStationHistory(stationId, maxPoints = 40) {
  const [points, setPoints] = useState([]);
  useEffect(() => {
    if (!stationId) return;
    const q = query(
      collection(firestore, "stations", stationId, "readings"),
      orderBy("timestamp_us", "desc"),
      limit(maxPoints)
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => d.data()).reverse();
      setPoints(rows);
    }, (err) => console.error("History read failed:", err.message));
    return unsub;
  }, [stationId, maxPoints]);
  return points;
}

// ---- Alert history (Firestore, for the admin alerts panel) ----

export function useStationAlertHistory(stationId, maxItems = 30) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (!stationId) return;
    const q = query(
      collection(firestore, "stations", stationId, "alerts"),
      orderBy("first_seen_us", "desc"),
      limit(maxItems)
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Alert history read failed:", err.message));
    return unsub;
  }, [stationId, maxItems]);
  return items;
}

// ---- Send a command to a station (admin only — see README's firmware note) ----

export async function sendStationCommand(stationId, command) {
  const commandRef = ref(rtdb, `stations/${stationId}/commands/latest`);
  await set(commandRef, {
    ...command,
    issued_at_ms: Date.now(),
    consumed: false,
  });
}
