// Zikriyon Fyber Connect — public user app
// No login screen: readers sign in anonymously behind the scenes
// (useAnonymousReadAccess) purely to satisfy the Firebase rules'
// `auth != null` check. This view is read-only.

import { useEffect, useState } from "react";
import { useAnonymousReadAccess, useStationList, useStationLive, useStationHistory } from "./hooks";
import {
  SeverityBanner, AllClearBanner, ReadoutTile, PressureTrendChart,
  timeAgo, isStale, LanguageToggle,
} from "./ui";
import { t } from "./i18n";

export default function UserApp() {
  useAnonymousReadAccess();
  const { stations, loading } = useStationList();
  const [selectedId, setSelectedId] = useState(null);
  const [lang, setLang] = useState("en");

  useEffect(() => {
    if (!selectedId && stations.length > 0) setSelectedId(stations[0].id);
  }, [stations, selectedId]);

  const selected = stations.find((s) => s.id === selectedId);

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">Zikriyon Fyber</span>
          <span className="brand-sub">Weather Intelligence</span>
        </div>
        <LanguageToggle lang={lang} onChange={setLang} />
      </div>

      <div style={{ padding: "16px 18px", maxWidth: 640, margin: "0 auto", width: "100%" }}>
        <div className="field">
          <label>{t(lang, "selectStation")}</label>
          <select value={selectedId || ""} onChange={(e) => setSelectedId(e.target.value)}>
            {loading && <option>Loading…</option>}
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.village_name || s.station_name || s.id}
                {s.district ? ` — ${s.district}` : ""}
              </option>
            ))}
          </select>
        </div>

        {selected ? (
          <StationView stationId={selected.id} lang={lang} />
        ) : (
          !loading && <div className="empty-state">No stations are provisioned yet.</div>
        )}
      </div>
    </div>
  );
}

function StationView({ stationId, lang }) {
  const { sensors, heartbeat, alerts } = useStationLive(stationId);
  const history = useStationHistory(stationId);

  const lastSeenMs = heartbeat?.last_seen_us ? heartbeat.last_seen_us / 1000 : null;
  const stale = isStale(lastSeenMs);

  const activeAlerts = Object.values(alerts || {}).filter((a) => a && a.active);
  const worstSeverity = activeAlerts.reduce((max, a) => Math.max(max, a.severity || 0), 0);

  if (!sensors) {
    return <div className="empty-state">{t(lang, "noData")}</div>;
  }

  return (
    <div>
      {stale && (
        <div className="severity-banner medium" style={{ marginBottom: 12 }}>
          <span>{t(lang, "stationOffline")}</span>
        </div>
      )}

      {activeAlerts.length > 0 ? (
        <SeverityBanner
          severity={worstSeverity}
          message={`${activeAlerts.length} ${t(lang, "activeAlerts").toLowerCase()}`}
        />
      ) : (
        <AllClearBanner text={t(lang, "allClear")} />
      )}

      <div className="readout-grid" style={{ marginTop: 14 }}>
        <ReadoutTile
          value={sensors.temperature_c != null ? `${sensors.temperature_c.toFixed(1)}°` : "—"}
          label={t(lang, "temperature")}
          stale={stale}
        />
        <ReadoutTile
          value={sensors.humidity_pct != null ? `${sensors.humidity_pct.toFixed(0)}%` : "—"}
          label={t(lang, "humidity")}
          stale={stale}
        />
        <ReadoutTile
          value={sensors.pressure_hpa != null ? sensors.pressure_hpa.toFixed(1) : "—"}
          label={t(lang, "pressure") + " (hPa)"}
          stale={stale}
        />
        <ReadoutTile
          value={sensors.battery_voltage_v != null ? `${sensors.battery_voltage_v.toFixed(2)}V` : "—"}
          label={t(lang, "battery")}
          stale={stale}
        />
        <ReadoutTile
          value={sensors.soil_moisture_pct != null ? `${sensors.soil_moisture_pct.toFixed(0)}%` : "—"}
          label={t(lang, "soilMoisture")}
          stale={stale}
        />
        <ReadoutTile
          value={sensors.rain_detected ? t(lang, "rainDetected") : t(lang, "rainNotDetected")}
          label={t(lang, "rainStatus")}
          stale={stale}
        />
      </div>

      <div className="section">
        <div className="section-head"><h3>{t(lang, "pressureTrend")}</h3></div>
        <div className="section-body">
          <PressureTrendChart points={history} />
        </div>
      </div>

      <div className="hint-text" style={{ marginTop: 14 }}>
        {t(lang, "lastUpdated")}: {timeAgo(lastSeenMs, lang, t)}
      </div>
    </div>
  );
}
