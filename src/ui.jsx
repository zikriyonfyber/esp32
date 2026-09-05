// Zikriyon Fyber Connect — shared UI pieces

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FAULT_SOURCES, severityClass } from "./firebase";

const SEVERITY_LABEL = { critical: "Critical", medium: "Warning", low: "Notice" };

export function SeverityBanner({ severity, message }) {
  const cls = severityClass(severity);
  if (cls === "ok") return null;
  return (
    <div className={`severity-banner ${cls}`}>
      <span className="severity-word">{SEVERITY_LABEL[cls]}</span>
      <span>{message}</span>
    </div>
  );
}

export function AllClearBanner({ text }) {
  return (
    <div className="severity-banner">
      <span className="severity-dot ok" />
      <span>{text}</span>
    </div>
  );
}

export function ReadoutTile({ value, label, fault, stale }) {
  return (
    <div className="readout-tile">
      <div className={`readout-value${stale ? " stale" : ""}`}>{value}</div>
      <div className="readout-label">{label}</div>
      {fault && <div className="readout-fault">{fault}</div>}
    </div>
  );
}

export function timeAgo(timestampMs, lang, t) {
  if (!timestampMs) return "—";
  const diffS = Math.floor((Date.now() - timestampMs) / 1000);
  if (diffS < 60) return t(lang, "justNow");
  if (diffS < 3600) return `${Math.floor(diffS / 60)} ${t(lang, "minutesAgo")}`;
  return `${Math.floor(diffS / 3600)} ${t(lang, "hoursAgo")}`;
}

export function isStale(timestampMs, thresholdMs = 20 * 60 * 1000) {
  if (!timestampMs) return true;
  return Date.now() - timestampMs > thresholdMs;
}

export function PressureTrendChart({ points, statusLine }) {
  if (!points || points.length < 2) {
    return <div className="empty-state">Not enough history yet to draw a trend.</div>;
  }
  const data = points.map((p) => ({
    t: new Date(p.timestamp_us / 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    pressure: p.pressure_hpa,
  }));
  return (
    <div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
          <XAxis dataKey="t" stroke="#8ca0ac" fontSize={11} tickLine={false} axisLine={{ stroke: "#2a3944" }} />
          <YAxis stroke="#8ca0ac" fontSize={11} width={42} domain={["auto", "auto"]} tickLine={false} axisLine={{ stroke: "#2a3944" }} />
          <Tooltip
            contentStyle={{ background: "#1d2a35", border: "1px solid #2a3944", fontSize: "0.8rem" }}
            labelStyle={{ color: "#8ca0ac" }}
          />
          <Line type="monotone" dataKey="pressure" stroke="#e3a335" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      {statusLine && <div className="chart-status-line">{statusLine}</div>}
    </div>
  );
}

export function faultSourceName(sourceIndex) {
  return FAULT_SOURCES[sourceIndex] || `Source ${sourceIndex}`;
}

export function LanguageToggle({ lang, onChange }) {
  return (
    <div className="pill-toggle">
      <button className={lang === "en" ? "active" : ""} onClick={() => onChange("en")}>EN</button>
      <button className={lang === "hi" ? "active" : ""} onClick={() => onChange("hi")}>हिं</button>
    </div>
  );
}
