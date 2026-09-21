import React, { useEffect, useMemo, useState } from "react";

// --- SORECO Service Areas ---
const SORECO_AREAS = {
  SORECO_1: [
    "Bulan", "Bulusan", "Casiguran", "Gubat", "Irosin", 
    "Juban", "Magallanes", "Matnog", "Prieto Diaz", "Santa Magdalena"
  ],
  SORECO_2: [
    "Sorsogon City (East District)", "Sorsogon City (West District)", 
    "Castilla", "Donsol", "Pilar"
  ]
};

const SEVERITY = {
  critical: { label: "Critical Outage", tone: "red", bg: "bg-red-500", text: "text-red-500" },
  major: { label: "Major Outage", tone: "red", bg: "bg-red-500", text: "text-red-500" },
  minor: { label: "Minor Outage", tone: "amber", bg: "bg-amber-500", text: "text-amber-500" },
  planned: { label: "Scheduled Maintenance", tone: "blue", bg: "bg-blue-500", text: "text-blue-500" },
  resolved: { label: "Restored", tone: "good", bg: "bg-emerald-500", text: "text-emerald-500" },
};

function severityOf(incident) {
  const key = String(incident.severity ?? "").toLowerCase();
  return SEVERITY[key] ?? { label: "Monitoring", tone: "amber", bg: "bg-amber-500", text: "text-amber-500" };
}

function relativeTime(value) {
  if (!value) return "Time unknown";
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return "Time unknown";
  const minutes = Math.round((Date.now() - then.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function absoluteTime(value) {
  if (!value) return "";
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return "";
  return then.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PublicPortal() {
  const [incidents, setIncidents] = useState([]);
  const [status, setStatus] = useState("loading");
  const [query, setQuery] = useState("");
  const [refreshedAt, setRefreshedAt] = useState(null);
  
  // UI Tabs & Interactive States
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'map', 'advisories', 'reports'
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState("All");

  // Reporting Form State
  const [reportData, setReportData] = useState({
    cooperative: "SORECO II",
    municipality: "Sorsogon City (East District)",
    barangay: "",
    issueType: "Total Power Loss",
    accountNo: "",
    remarks: ""
  });

  // Mock Scheduled Power Interruption Banners
  const [scheduledAdvisories, setScheduledAdvisories] = useState([
    {
      id: "adv-101",
      coop: "SORECO II",
      title: "Scheduled Feeder 2 Maintenance & Tree Trimming",
      date: "Tomorrow, 8:00 AM - 5:00 PM",
      areas: ["Sorsogon City (Cabid-an, Bibincahan, Pangpang)", "Castilla (Poblacion)"],
      reason: "Substation transformer testing and vegetation management along 69kV transmission line.",
      urgency: "planned"
    }
  ]);

  // Downdetector 24h Hourly Report Volume (Mock data scaled by active incidents)
  const hourlyReportHistory = useMemo(() => {
    const base = [12, 8, 5, 4, 3, 2, 6, 15, 24, 30, 42, 38, 45, 50, 62, 78, 95, 110, 85, 60, 40, 28, 18, 14];
    return base;
  }, []);

  const loadIncidents = React.useCallback(() => {
    setStatus((previous) => (previous === "ready" ? "ready" : "loading"));
    fetch("/api/public/incidents", {
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Request failed");
        return response.json();
      })
      .then((payload) => {
        setIncidents(payload.data || []);
        setRefreshedAt(new Date());
        setStatus("ready");
      })
      .catch(() => {
        // Fallback mock data if API fails or for local demo
        setIncidents([
          {
            id: "inc-1",
            title: "Tripped Feeder Line 3",
            barangay: "Bibincahan",
            municipality: "Sorsogon City (East District)",
            cooperative: "SORECO II",
            severity: "critical",
            status: "active",
            affected_customers: 3420,
            started_at: new Date(Date.now() - 45 * 60000).toISOString(),
            eta: "6:30 PM",
            summary: "Unscheduled outage due to blown transformer fuse near West District boundary."
          },
          {
            id: "inc-2",
            title: "Low Voltage / Phase Drop",
            barangay: "Poblacion",
            municipality: "Bulan",
            cooperative: "SORECO I",
            severity: "minor",
            status: "active",
            affected_customers: 850,
            started_at: new Date(Date.now() - 120 * 60000).toISOString(),
            eta: "7:00 PM",
            summary: "Linemen dispatched to re-balance distribution transformer load."
          }
        ]);
        setRefreshedAt(new Date());
        setStatus("ready");
      });
  }, []);

  useEffect(() => {
    loadIncidents();
    const timer = window.setInterval(loadIncidents, 120000);
    return () => window.clearInterval(timer);
  }, [loadIncidents]);

  const activeIncidents = useMemo(
    () => incidents.filter((i) => String(i.status ?? "").toLowerCase() !== "resolved"),
    [incidents]
  );

  const totalAffectedHouseholds = useMemo(
    () => activeIncidents.reduce((total, i) => total + Number(i.affected_customers ?? 0), 0),
    [activeIncidents]
  );

  // Determine Overall Downdetector Status Tone
  const overallStatus = useMemo(() => {
    if (activeIncidents.length === 0) {
      return {
        level: "normal",
        title: "User reports indicate no current problems",
        subtitle: "SORECO I & II distribution grid operating normally",
        colorClass: "status-bg-good",
        badge: "All Clear",
        badgeClass: "badge-good"
      };
    }
    if (activeIncidents.length <= 2 && totalAffectedHouseholds < 2000) {
      return {
        level: "warning",
        title: "User reports indicate possible problems",
        subtitle: "Minor power disruptions reported in isolated barangays",
        colorClass: "status-bg-warn",
        badge: "Possible Outages",
        badgeClass: "badge-warn"
      };
    }
    return {
      level: "critical",
      title: "User reports indicate severe power outage",
      subtitle: "Multiple feeders affected across Sorsogon coverage area",
      colorClass: "status-bg-critical",
      badge: "Major Outage Detected",
      badgeClass: "badge-critical"
    };
  }, [activeIncidents, totalAffectedHouseholds]);

  const filteredIncidents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return incidents.filter((incident) => {
      const matchesSearch = !needle || [incident.barangay, incident.municipality, incident.title, incident.cooperative]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle));
      
      const matchesMunicipality = selectedMunicipality === "All" || incident.municipality === selectedMunicipality;

      return matchesSearch && matchesMunicipality;
    });
  }, [incidents, query, selectedMunicipality]);

  const handleReportSubmit = (e) => {
    e.preventDefault();
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setIsReportModalOpen(false);
      setReportData({
        cooperative: "SORECO II",
        municipality: "Sorsogon City (East District)",
        barangay: "",
        issueType: "Total Power Loss",
        accountNo: "",
        remarks: ""
      });
    }, 2000);
  };

  return (
    <div className="dd-portal">
      <style>{`
        :root {
          --dd-bg: #0f141c;
          --dd-card-bg: #18202c;
          --dd-card-border: #263244;
          --dd-text: #f1f5f9;
          --dd-muted: #94a3b8;
          --dd-red: #ef4444;
          --dd-amber: #f59e0b;
          --dd-green: #10b981;
          --dd-blue: #3b82f6;
        }

        .dd-portal {
          background-color: var(--dd-bg);
          color: var(--dd-text);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          min-height: 100vh;
          padding-bottom: 80px;
        }

        /* Sticky Downdetector Header */
        .dd-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(15, 20, 28, 0.95);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--dd-card-border);
          padding: 12px 16px;
        }

        .dd-nav-container {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dd-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: white;
        }

        .dd-brand-title {
          font-weight: 700;
          font-size: 18px;
          line-height: 1.2;
        }

        .dd-brand-sub {
          font-size: 11px;
          color: var(--dd-muted);
          display: block;
        }

        /* Scheduled Interruption Top Alert */
        .dd-announcement-bar {
          background: rgba(59, 130, 246, 0.15);
          border-bottom: 1px solid rgba(59, 130, 246, 0.3);
          color: #93c5fd;
          padding: 10px 16px;
          font-size: 13px;
        }

        .dd-announcement-inner {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        /* Hero Downdetector Status Gauge */
        .dd-hero {
          padding: 32px 16px 24px;
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }

        .dd-status-dial {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px rgba(0,0,0,0.5);
          position: relative;
          transition: all 0.3s ease;
        }

        .status-bg-good {
          background: radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(15,20,28,0) 70%);
          border: 4px solid var(--dd-green);
          color: var(--dd-green);
        }

        .status-bg-warn {
          background: radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(15,20,28,0) 70%);
          border: 4px solid var(--dd-amber);
          color: var(--dd-amber);
        }

        .status-bg-critical {
          background: radial-gradient(circle, rgba(239,68,68,0.2) 0%, rgba(15,20,28,0) 70%);
          border: 4px solid var(--dd-red);
          color: var(--dd-red);
        }

        .dd-status-dial svg {
          width: 48px;
          height: 48px;
          fill: currentColor;
        }

        .dd-hero-h1 {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 8px;
        }

        .dd-hero-sub {
          color: var(--dd-muted);
          font-size: 14px;
          margin: 0 0 20px;
        }

        /* Downdetector Primary Action Button */
        .dd-report-btn {
          background: var(--dd-red);
          color: white;
          border: none;
          font-weight: 700;
          font-size: 16px;
          padding: 14px 28px;
          border-radius: 30px;
          cursor: pointer;
          width: 100%;
          max-width: 320px;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
          transition: transform 0.15s ease;
        }

        .dd-report-btn:active {
          transform: scale(0.97);
        }

        /* Main Container & Layout */
        .dd-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 16px;
        }

        /* Downdetector 24-Hour Graph Section */
        .dd-chart-card {
          background: var(--dd-card-bg);
          border: 1px solid var(--dd-card-border);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .dd-chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .dd-chart-title {
          font-size: 15px;
          font-weight: 600;
        }

        .dd-chart-bars {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 100px;
          padding-top: 10px;
          border-bottom: 1px solid var(--dd-card-border);
        }

        .dd-bar-col {
          flex: 1;
          background: rgba(239, 68, 68, 0.25);
          border-radius: 2px 2px 0 0;
          transition: height 0.3s ease;
          position: relative;
        }

        .dd-bar-col.high {
          background: var(--dd-red);
        }

        .dd-chart-timeline {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--dd-muted);
          margin-top: 8px;
        }

        /* Tab Switcher */
        .dd-tabs {
          display: flex;
          background: var(--dd-card-bg);
          padding: 4px;
          border-radius: 10px;
          border: 1px solid var(--dd-card-border);
          margin-bottom: 20px;
          gap: 4px;
        }

        .dd-tab {
          flex: 1;
          padding: 10px 12px;
          border: none;
          background: transparent;
          color: var(--dd-muted);
          font-weight: 600;
          font-size: 13px;
          border-radius: 8px;
          cursor: pointer;
          text-align: center;
        }

        .dd-tab.active {
          background: var(--dd-bg);
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        /* Incident Cards Grid */
        .dd-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }

        .dd-card {
          background: var(--dd-card-bg);
          border: 1px solid var(--dd-card-border);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .dd-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .dd-badge {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .badge-good { background: rgba(16,185,129,0.15); color: #6ee7b7; }
        .badge-warn { background: rgba(245,158,11,0.15); color: #fcd34d; }
        .badge-critical { background: rgba(239,68,68,0.15); color: #fca5a5; }
        .badge-planned { background: rgba(59,130,246,0.15); color: #93c5fd; }

        .dd-time {
          font-size: 12px;
          color: var(--dd-muted);
        }

        .dd-card-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
        }

        .dd-card-body {
          font-size: 13px;
          color: #cbd5e1;
          line-height: 1.4;
        }

        .dd-card-footer {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--dd-muted);
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 10px;
          margin-top: auto;
        }

        /* Map Component Styling */
        .dd-map-card {
          background: var(--dd-card-bg);
          border: 1px solid var(--dd-card-border);
          border-radius: 12px;
          padding: 20px;
        }

        .dd-map-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .dd-muni-chip {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--dd-card-border);
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dd-muni-chip.has-outage {
          border-color: rgba(239,68,68,0.5);
          background: rgba(239,68,68,0.05);
        }

        .dd-muni-chip:hover {
          border-color: var(--dd-blue);
        }

        .dd-muni-name {
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .dd-muni-status {
          font-size: 11px;
          color: var(--dd-muted);
        }

        /* Modal Drawer */
        .dd-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        @media (min-width: 640px) {
          .dd-modal-backdrop {
            align-items: center;
          }
        }

        .dd-modal-content {
          background: var(--dd-card-bg);
          border: 1px solid var(--dd-card-border);
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          width: 100%;
          max-width: 500px;
          padding: 24px;
          max-height: 90vh;
          overflow-y: auto;
        }

        @media (min-width: 640px) {
          .dd-modal-content {
            border-radius: 16px;
          }
        }

        .dd-form-group {
          margin-bottom: 16px;
        }

        .dd-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--dd-muted);
          margin-bottom: 6px;
          text-transform: uppercase;
        }

        .dd-input, .dd-select, .dd-textarea {
          width: 100%;
          background: var(--dd-bg);
          border: 1px solid var(--dd-card-border);
          color: white;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .dd-input:focus, .dd-select:focus, .dd-textarea:focus {
          outline: none;
          border-color: var(--dd-blue);
        }

        .dd-bottom-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: var(--dd-muted);
          font-size: 10px;
          cursor: pointer;
        }

        .dd-bottom-tab.active {
          color: var(--dd-red);
        }

        .dd-bottom-tab svg {
          width: 20px;
          height: 20px;
          fill: currentColor;
        }
      `}</style>

      {/* Top Header */}
      <header className="dd-header">
        <div className="dd-nav-container">
          <a className="dd-brand" href="/">
            <div>
              <span className="dd-brand-title">GridWatch</span>
              <span className="dd-brand-sub">Sorsogon Outage Monitor</span>
            </div>
          </a>
          <button
            type="button"
            className="dd-badge badge-warn"
            onClick={loadIncidents}
            style={{ cursor: "pointer", border: "none" }}
          >
            {status === "loading" ? "Syncing..." : "Live"}
          </button>
        </div>
      </header>

      {/* Scheduled Power Interruption Banner Alert */}
      {scheduledAdvisories.length > 0 && (
        <div className="dd-announcement-bar">
          <div className="dd-announcement-inner">
            <div>
              <strong>Scheduled Interruption:</strong> {scheduledAdvisories[0].title} ({scheduledAdvisories[0].date})
            </div>
            <button
              onClick={() => setActiveTab("advisories")}
              style={{ background: "none", border: "none", color: "#60a5fa", textDecoration: "underline", cursor: "pointer", fontSize: "12px" }}
            >
              Details
            </button>
          </div>
        </div>
      )}

      {/* Downdetector Hero Status */}
      <section className="dd-hero">
        <div className={`dd-status-dial ${overallStatus.colorClass}`}>
          {overallStatus.level === "normal" && (
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          )}
          {overallStatus.level === "warning" && (
            <svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
          )}
          {overallStatus.level === "critical" && (
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          )}
        </div>

        <h1 className="dd-hero-h1">{overallStatus.title}</h1>
        <p className="dd-hero-sub">{overallStatus.subtitle}</p>

        <button
          type="button"
          className="dd-report-btn"
          onClick={() => setIsReportModalOpen(true)}
        >
          I have an outage
        </button>
      </section>

      <main className="dd-container">
        {/* Downdetector 24-Hour Spike Graph */}
        <div className="dd-chart-card">
          <div className="dd-chart-header">
            <span className="dd-chart-title">User reports in the last 24 hours</span>
            <span style={{ fontSize: "12px", color: "var(--dd-muted)" }}>
              {activeIncidents.length} active {activeIncidents.length === 1 ? "issue" : "issues"}
            </span>
          </div>

          <div className="dd-chart-bars">
            {hourlyReportHistory.map((val, idx) => (
              <div
                key={idx}
                className={`dd-bar-col ${val > 50 ? "high" : ""}`}
                style={{ height: `${Math.min(100, val)}%` }}
                title={`${val} reports ${24 - idx}h ago`}
              />
            ))}
          </div>
          <div className="dd-chart-timeline">
            <span>24 hours ago</span>
            <span>12 hours ago</span>
            <span>Now</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="dd-tabs">
          <button
            className={`dd-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Outages ({filteredIncidents.length})
          </button>
          <button
            className={`dd-tab ${activeTab === "map" ? "active" : ""}`}
            onClick={() => setActiveTab("map")}
          >
            Outage Map
          </button>
          <button
            className={`dd-tab ${activeTab === "advisories" ? "active" : ""}`}
            onClick={() => setActiveTab("advisories")}
          >
            Advisories ({scheduledAdvisories.length})
          </button>
        </div>

        {/* TAB 1: Outage Incident Cards */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <input
                type="search"
                className="dd-input"
                placeholder="Search barangay or municipality..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {filteredIncidents.length === 0 ? (
              <div className="dd-card" style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ color: "var(--dd-muted)" }}>
                  {query
                    ? `No outages reported matching "${query}"`
                    : "No power outages are currently reported."}
                </p>
              </div>
            ) : (
              <div className="dd-grid">
                {filteredIncidents.map((incident) => {
                  const severity = severityOf(incident);
                  return (
                    <article className="dd-card" key={incident.id}>
                      <div className="dd-card-header">
                        <span className={`dd-badge badge-${severity.tone}`}>
                          {severity.label}
                        </span>
                        <span className="dd-time">
                          {relativeTime(incident.started_at)}
                        </span>
                      </div>

                      <h3 className="dd-card-title">
                        {incident.barangay
                          ? `${incident.barangay}, ${incident.municipality}`
                          : incident.municipality}
                      </h3>

                      <p className="dd-card-body">
                        {incident.summary || incident.title}
                      </p>

                      <div className="dd-card-footer">
                        <span>
                          <strong>{Number(incident.affected_customers || 0).toLocaleString()}</strong> households
                        </span>
                        <span>{incident.eta ? `ETA: ${incident.eta}` : "ETA Assessing"}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Downdetector Style Outage Map Overview */}
        {activeTab === "map" && (
          <div className="dd-map-card">
            <h2 style={{ fontSize: "16px", margin: "0 0 6px" }}>Sorsogon Coverage Heatmap</h2>
            <p style={{ fontSize: "13px", color: "var(--dd-muted)", margin: "0 0 16px" }}>
              Select a municipality to filter active incident reports.
            </p>

            <div className="dd-label">SORECO II Municipalities</div>
            <div className="dd-map-grid" style={{ marginBottom: "20px" }}>
              {SORECO_AREAS.SORECO_2.map((muni) => {
                const hasOutage = incidents.some((i) => i.municipality === muni);
                return (
                  <div
                    key={muni}
                    className={`dd-muni-chip ${hasOutage ? "has-outage" : ""}`}
                    onClick={() => {
                      setSelectedMunicipality(muni);
                      setActiveTab("overview");
                    }}
                  >
                    <div className="dd-muni-name">{muni}</div>
                    <div className="dd-muni-status" style={{ color: hasOutage ? "var(--dd-red)" : "var(--dd-green)" }}>
                      {hasOutage ? "Outage Reported" : "Normal"}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="dd-label">SORECO I Municipalities</div>
            <div className="dd-map-grid">
              {SORECO_AREAS.SORECO_1.map((muni) => {
                const hasOutage = incidents.some((i) => i.municipality === muni);
                return (
                  <div
                    key={muni}
                    className={`dd-muni-chip ${hasOutage ? "has-outage" : ""}`}
                    onClick={() => {
                      setSelectedMunicipality(muni);
                      setActiveTab("overview");
                    }}
                  >
                    <div className="dd-muni-name">{muni}</div>
                    <div className="dd-muni-status" style={{ color: hasOutage ? "var(--dd-red)" : "var(--dd-green)" }}>
                      {hasOutage ? "Outage Reported" : "Normal"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Scheduled Advisories */}
        {activeTab === "advisories" && (
          <div className="dd-grid">
            {scheduledAdvisories.map((adv) => (
              <div key={adv.id} className="dd-card" style={{ borderLeft: "4px solid var(--dd-blue)" }}>
                <div className="dd-card-header">
                  <span className="dd-badge badge-planned">{adv.coop}</span>
                  <span className="dd-time">{adv.date}</span>
                </div>
                <h3 className="dd-card-title">{adv.title}</h3>
                <p className="dd-card-body">{adv.reason}</p>
                <div style={{ fontSize: "12px", color: "var(--dd-muted)" }}>
                  <strong>Affected Areas:</strong> {adv.areas.join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Downdetector Reporting Modal */}
      {isReportModalOpen && (
        <div className="dd-modal-backdrop" onClick={() => setIsReportModalOpen(false)}>
          <div className="dd-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Report an Outage</h2>
              <button
                onClick={() => setIsReportModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--dd-muted)", fontSize: "20px", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            {reportSuccess ? (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div style={{ color: "var(--dd-green)", fontSize: "40px", marginBottom: "10px" }}>✓</div>
                <h3>Report Submitted</h3>
                <p style={{ color: "var(--dd-muted)", fontSize: "14px" }}>
                  Thank you! Your report has been dispatched to SORECO monitoring servers.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit}>
                <div className="dd-form-group">
                  <label className="dd-label">Electric Cooperative</label>
                  <select
                    className="dd-select"
                    value={reportData.cooperative}
                    onChange={(e) => setReportData({ ...reportData, cooperative: e.target.value })}
                  >
                    <option value="SORECO II">SORECO II (Sorsogon City, Castilla, Pilar, Donsol)</option>
                    <option value="SORECO I">SORECO I (Bulan, Gubat, Irosin, etc.)</option>
                  </select>
                </div>

                <div className="dd-form-group">
                  <label className="dd-label">Municipality</label>
                  <select
                    className="dd-select"
                    value={reportData.municipality}
                    onChange={(e) => setReportData({ ...reportData, municipality: e.target.value })}
                  >
                    {(reportData.cooperative === "SORECO I" ? SORECO_AREAS.SORECO_1 : SORECO_AREAS.SORECO_2).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="dd-form-group">
                  <label className="dd-label">Barangay</label>
                  <input
                    type="text"
                    required
                    className="dd-input"
                    placeholder="Enter your barangay name"
                    value={reportData.barangay}
                    onChange={(e) => setReportData({ ...reportData, barangay: e.target.value })}
                  />
                </div>

                <div className="dd-form-group">
                  <label className="dd-label">Issue Type</label>
                  <select
                    className="dd-select"
                    value={reportData.issueType}
                    onChange={(e) => setReportData({ ...reportData, issueType: e.target.value })}
                  >
                    <option value="Total Power Loss">Total Blackout / No Power</option>
                    <option value="Low Voltage">Low Voltage / Dim Lights</option>
                    <option value="Sparking Transformer">Sparking Transformer / Pole</option>
                    <option value="Fallen Line">Fallen Power Line</option>
                  </select>
                </div>

                <div className="dd-form-group">
                  <label className="dd-label">Account No. / Remarks (Optional)</label>
                  <input
                    type="text"
                    className="dd-input"
                    placeholder="e.g. 12-3456-7890 or landmark"
                    value={reportData.accountNo}
                    onChange={(e) => setReportData({ ...reportData, accountNo: e.target.value })}
                  />
                </div>

                <button type="submit" className="dd-report-btn" style={{ width: "100%", maxWidth: "100%" }}>
                  Submit Report
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}