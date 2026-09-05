# Zikriyon Fyber Connect — Web App (Users + Admin)

A React + Firebase web app with two views, matching the exact RTDB/
Firestore schema written by `zf_firebase.c`:

- **`/` — Public user view.** No login screen (signs in anonymously behind
  the scenes). Villagers pick their station and see live readings, active
  alerts, and a 20-minute pressure trend. English/Hindi toggle.
- **`/admin` — Command Unit console.** Real email/password login, admin-
  only. Station list with live status dots, full readout + alert history
  per station, and a message composer that reaches a station over Firebase.

---

## 1. Install and Run Locally

```bash
cd zikriyon-fyber-connect-webapp
npm install
npm run dev
```

Opens at `http://localhost:5173`. `src/firebase.js` already has this
project's real config baked in — no `.env` needed unless you fork this
for a different Firebase project.

---

## 2. Deploy Updated Rules First

This app requires the `admins/{uid}` rule and the tightened RTDB
`commands` write rule — both already updated in `firebase-config/` from
the earlier setup. Redeploy them:

```bash
cd firebase-config
firebase deploy --only firestore:rules,database
```

---

## 3. Create Your First Admin Account

1. Firebase Console → Authentication → Users → **Add user** → enter an
   email/password for whoever runs the Command Unit console.
2. Grant admin access — two things are required, both via a one-time
   Admin SDK script (Node.js, run from your laptop):

```javascript
// grant-admin.js — run with: node grant-admin.js
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.applicationDefault() });

async function grantAdmin(uid) {
  // 1. Custom claim — what the RTDB rules and the app's useIsAdmin() check
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  // 2. Firestore allowlist doc — what the Firestore admins/{uid} rule checks
  await admin.firestore().collection("admins").doc(uid).set({ grantedAt: new Date() });
  console.log("Granted admin to", uid);
}

grantAdmin("PASTE_THE_USER'S_UID_FROM_AUTH_CONSOLE_HERE");
```

The user must sign out and back in (or wait ~1hr for token auto-refresh)
before the new claim takes effect in the app.

---

## 4. Build for Production / Google AI Studio

```bash
npm run build
```

Produces `dist/`, deployable via Firebase Hosting (`firebase deploy
--only hosting`, using the `firebase.json` already in `firebase-config/`)
or importable into Google AI Studio as a starting React project — the
component structure (`UserApp.jsx`, `AdminApp.jsx`, `hooks.js`, `ui.jsx`)
is deliberately modular so AI Studio prompts can target one file (e.g.
"redesign AdminApp's station list") without needing to touch the Firebase
data-layer code in `hooks.js` or `firebase.js`.

---

## 5. Honest Gap — the "Command Bridge" (Send Message feature)

The admin console's **Send message** composer writes to
`stations/{id}/commands/latest` in RTDB. As of this update, the firmware
**does** poll that path (`zf_firebase_poll_commands()`, called every ~5s
from the existing Firebase flush task whenever WiFi is connected) — so
messages sent from the app are no longer silently ignored.

What that firmware function currently does with a message: logs it and
sounds a LOW-severity local buzzer notification via Module 4. **It does
not display the text anywhere on the tower** — there's no screen. Two
practical implications:

- **Send admin messages to the Command Unit's `station_id`**, not a
  random field tower's — the Command Unit is the node with an actual
  human operator nearby who'll notice the notification and can check the
  app for the text. A field tower has nobody standing next to it to hear
  a buzzer.
- If you want the message text itself visible on hardware (not just "a
  message arrived, go check the app"), that needs a small display
  (even a 3-line OLED) wired to the Command Unit and a new firmware
  function to render it — out of scope here, flagged rather than faked.

The **offline, no-internet path** (Module 6's LoRa text messaging between
towers) is separate and already fully functional without any of this —
it doesn't go through Firebase at all.

---

## 6. What's Genuinely Complete vs. What Needs Your Data

| Works today, no setup needed | Needs your input |
|---|---|
| Live sensor readout, alert banners, pressure trend chart | At least one station provisioned via BLE app so there's data to show |
| Anonymous read access for public users | Admin account creation + claim grant (Section 3) |
| Admin login, station list, alert history table | Rules deployed (Section 2) |
| Message send → firmware receive → local buzzer notify | — |
