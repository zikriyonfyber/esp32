// Zikriyon Fyber Connect — admin / Command Unit console
// Requires real email/password sign-in + an `admin: true` custom claim
// (see README for the one-time Admin SDK snippet that grants it).

import { useState } from "react";
import {
  useAuthUser, useIsAdmin, adminSignIn, adminSignOut,
  useStationList, useStationLive, useStationHistory, useStationAlertHistory,
  sendStationCommand,
} from "./hooks";
import {
  SeverityBanner, AllClearBanner, ReadoutTile, PressureTrendChart,
  timeAgo, isStale, faultSourceName,
} from "./ui";
import { severityClass } from "./firebase";

export default function AdminApp() {
  const user = useAuthUser();
  const isAdmin = useIsAdmin(user);

  if (user === undefined || (user && isAdmin === undefined)) {
    return <div className="empty-state">Loading…</div>;
  }
  if (!user) return <AdminLogin />;
  if (!isAdmin) return <NotAuthorized />;
  return <AdminConsole />;
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await adminSignIn(email, password);
    } catch (err) {
      setError("Sign-in failed — check the email and password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <h2 style={{ marginBottom: 4 }}>Command Unit Console</h2>
        <p className="hint-text" style={{ marginBottom: 20 }}>Zikriyon Fyber — admin sign-in</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 6 }} disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

function NotAuthorized() {
  return (
    <div className="login-shell">
      <div className="login-card">
        <h2>Not authorized</h2>
        <p className="hint-text" style={{ marginTop: 10 }}>
          This account can sign in but hasn't been granted admin access.
          Ask whoever manages this Firebase project to set the
          <code> admin </code> custom claim on your account.
        </p>
        <button className="btn" style={{ marginTop: 16 }} onClick={() => adminSignOut()}>Sign out</button>
      </div>
    </div>
  );
}

function AdminConsole() {
  const { stations, loading } = useStationList();
  const [selectedId, setSelectedId] = useState(null);
  const selected = stations.find((s) => s.id === selectedId) || stations[0];

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">Zikriyon Fyber</span>
          <span className="brand-sub">Command Unit Console</span>
        </div>
        <button className="btn btn-ghost" onClick={() => adminSignOut()}>Sign out</button>
      </div>

      <div className="main admin-main">
        <div className="station-rail">
          {loading && <div className="empty-state">Loading stations…</div>}
          {!loading && stations.length === 0 && (
            <div className="empty-state">No stations provisioned yet.</div>
          )}
          {stations.map((s) => (
            <StationRow
              key={s.id}
              station={s}
              selected={selected?.id === s.id}
              onClick={() => setSelectedId(s.id)}
            />
          ))}
        </div>

        <div className="detail-pane">
          {selected ? (
            <StationDetail station={selected} />
          ) : (
            <div className="empty-state">Select a station from the list.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StationRow({ station, selected, onClick }) {
  const { heartbeat, alerts } = useStationLive(station.id);
  const lastSeenMs = heartbeat?.last_seen_us ? heartbeat.last_seen_us / 1000 : null;
  const stale = isStale(lastSeenMs);
  const dead = isStale(lastSeenMs, 60 * 60 * 1000); // 1hr with zero contact = treat as dead in the list view

  const activeAlerts = Object.values(alerts || {}).filter((a) => a && a.active);
  const worstSeverity = activeAlerts.reduce((max, a) => Math.max(max, a.severity || 0), 0);
  const sevCls = severityClass(worstSeverity);

  return (
    <div className={`station-row${selected ? " selected" : ""}`} onClick={onClick}>
      <span className={`freshness-dot${dead ? " dead" : stale ? " stale" : ""}`} />
      <div className="station-row-text">
        <div className="station-row-id">{station.id}</div>
        <div className="station-row-place">
          {station.village_name || "—"}
          {station.district ? `, ${station.district}` : ""}
        </div>
      </div>
      {sevCls !== "ok" && <span className={`severity-dot ${sevCls}`} style={{ marginLeft: "auto" }} />}
    </div>
  );
}

function StationDetail({ station }) {
  const { sensors, heartbeat, alerts } = useStationLive(station.id);
  const history = useStationHistory(station.id);
  const alertHistory = useStationAlertHistory(station.id);

  const lastSeenMs = heartbeat?.last_seen_us ? heartbeat.last_seen_us / 1000 : null;
  const stale = isStale(lastSeenMs);

  const activeAlerts = Object.entries(alerts || {})
    .filter(([, a]) => a && a.active)
    .map(([source, a]) => ({ source: Number(source), ...a }));

  return (
    <div>
      <h2>{station.id}</h2>
      <p className="hint-text" style={{ marginTop: 4 }}>
        {station.village_name || "—"}
        {station.district ? `, ${station.district}` : ""}
        {station.state ? `, ${station.state}` : ""}
        {" · "}role: {["Field Tower", "Command Unit", "Relay Only"][station.node_role] || "Unknown"}
      </p>

      <div style={{ marginTop: 14 }}>
        {activeAlerts.length > 0 ? (
          activeAlerts.map((a) => (
            <SeverityBanner
              key={a.source}
              severity={a.severity}
              message={`${faultSourceName(a.source)} — active alert`}
            />
          ))
        ) : (
          <AllClearBanner text="All clear — station operating normally" />
        )}
      </div>

      {!sensors ? (
        <div className="empty-state" style={{ marginTop: 16 }}>No live sensor data received yet.</div>
      ) : (
        <div className="readout-grid" style={{ marginTop: 14 }}>
          <ReadoutTile value={sensors.temperature_c != null ? `${sensors.temperature_c.toFixed(1)}°` : "—"} label="Temperature" stale={stale} />
          <ReadoutTile value={sensors.humidity_pct != null ? `${sensors.humidity_pct.toFixed(0)}%` : "—"} label="Humidity" stale={stale} />
          <ReadoutTile value={sensors.pressure_hpa != null ? sensors.pressure_hpa.toFixed(1) : "—"} label="Pressure (hPa)" stale={stale} />
          <ReadoutTile value={sensors.battery_voltage_v != null ? `${sensors.battery_voltage_v.toFixed(2)}V` : "—"} label="Battery" stale={stale} />
          <ReadoutTile value={sensors.soil_moisture_pct != null ? `${sensors.soil_moisture_pct.toFixed(0)}%` : "—"} label="Soil moisture" stale={stale} />
          <ReadoutTile value={sensors.rain_detected ? "Detected" : "Not detected"} label="Rain" stale={stale} />
        </div>
      )}

      <div className="hint-text" style={{ marginTop: 10 }}>
        Last heartbeat: {formatTimeAgo(lastSeenMs)}
      </div>

      <div className="section">
        <div className="section-head"><h3>Pressure trend</h3></div>
        <div className="section-body">
          <PressureTrendChart points={history} />
        </div>
      </div>

      <AlertHistorySection items={alertHistory} />
      <MessageComposer stationId={station.id} />
    </div>
  );
}

function formatTimeAgo(timestampMs) {
  if (!timestampMs) return "—";
  const diffS = Math.floor((Date.now() - timestampMs) / 1000);
  if (diffS < 60) return "just now";
  if (diffS < 3600) return `${Math.floor(diffS / 60)} min ago`;
  return `${Math.floor(diffS / 3600)} hr ago`;
}

function AlertHistorySection({ items }) {
  return (
    <div className="section">
      <div className="section-head"><h3>Alert history</h3></div>
      <div className="section-body">
        {items.length === 0 ? (
          <div className="empty-state">No recorded alerts for this station.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>When</th><th>Source</th><th>Severity</th><th>Occurrences</th></tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.first_seen_us ? new Date(a.first_seen_us / 1000).toLocaleString() : "—"}</td>
                  <td>{faultSourceName(a.source)}</td>
                  <td>
                    <span className={`severity-dot ${severityClass(a.severity)}`} style={{ marginRight: 6 }} />
                    {["None", "Low", "Medium", "Critical"][a.severity] || a.severity}
                  </td>
                  <td>{a.occurrence_count ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function MessageComposer({ stationId }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState(null);

  async function handleSend() {
    if (!text.trim()) return;
    setStatus("sending");
    try {
      await sendStationCommand(stationId, { type: "message", text: text.trim() });
      setStatus("sent");
      setText("");
    } catch (err) {
      setStatus("error");
    }
  }

  return (
    <div className="section">
      <div className="section-head"><h3>Send message to station</h3></div>
      <div className="section-body">
        <div className="field">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message for this station's admin (relayed over LoRa mesh)"
            maxLength={180}
          />
        </div>
        <button className="btn btn-primary" onClick={handleSend} disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send"}
        </button>
        {status === "sent" && <span className="hint-text" style={{ marginLeft: 10 }}>Queued for delivery.</span>}
        {status === "error" && <span className="error-text" style={{ marginLeft: 10 }}>Failed to send — try again.</span>}
        <p className="hint-text" style={{ marginTop: 10 }}>
          This writes to the station's Firebase command queue. Delivery over
          LoRa requires the tower's firmware to be polling that queue — see
          the deployment README's "Command bridge" note.
        </p>
      </div>
    </div>
  );
}
