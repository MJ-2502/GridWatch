import React, { useEffect, useMemo, useState } from "react";

const SEVERITY = {
  critical: { label: "Critical", tone: "red" },
  major: { label: "Major", tone: "red" },
  minor: { label: "Minor", tone: "amber" },
  planned: { label: "Planned", tone: "amber" },
  resolved: { label: "Resolved", tone: "good" },
};

function severityOf(incident) {
  const key = String(incident.severity ?? "").toLowerCase();
  return SEVERITY[key] ?? { label: "Monitoring", tone: "amber" };
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
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    loadIncidents();
    const timer = window.setInterval(loadIncidents, 120000);
    return () => window.clearInterval(timer);
  }, [loadIncidents]);

  const active = useMemo(
    () =>
      incidents.filter(
        (incident) =>
          String(incident.status ?? "").toLowerCase() !== "resolved",
      ),
    [incidents],
  );

  const affectedCount = useMemo(
    () =>
      active.reduce(
        (total, incident) => total + Number(incident.affected_customers ?? 0),
        0,
      ),
    [active],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return incidents;
    return incidents.filter((incident) =>
      [incident.barangay, incident.municipality, incident.title]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle)),
    );
  }, [incidents, query]);

  const allClear = status === "ready" && active.length === 0;

  return (
    <div className="public-portal">
      <a className="skip-link" href="#portal-main">
        Skip to main content
      </a>

      <nav className="portal-nav" aria-label="Primary">
        <a className="portal-brand" href="/">
          <span className="portal-brand-mark" aria-hidden="true">
            GW
          </span>
          <span>
            <span className="eyebrow">SORECO I &amp; II</span>
            <strong>GridWatch</strong>
          </span>
        </a>
        <div className="portal-nav-links">
          <a className="active" href="/">
            Outage status
          </a>
          <a href="#updates">Updates</a>
          <a href="#report">Report an outage</a>
        </div>
        <a className="portal-nav-action" href="/login">
          <span aria-hidden="true">&#9679;</span>
          Dispatcher login
        </a>
      </nav>

      <main className="public-main" id="portal-main">
        <div className="public-hero">
          <div>
            <p className="eyebrow">Live network status</p>
            <h1>Power status across Sorsogon</h1>
            <p className="public-lede">
              GridWatch monitors distribution nodes across SORECO I and SORECO
              II coverage areas. Outages detected by our sensors appear here
              automatically, usually within a few minutes of the event.
            </p>
            <div className="public-actions">
              <a className="primary-action" href="#updates">
                <span aria-hidden="true">&#8595;</span>
                See active outages
              </a>
              <a className="secondary-action" href="#report">
                Report an outage
              </a>
            </div>
          </div>

          <section
            className="public-status-card"
            aria-live="polite"
            aria-busy={status === "loading"}
          >
            <div className="public-status-head">
              <span className="eyebrow">Network summary</span>
              <span className={`status-pill ${allClear ? "good" : "warn"}`}>
                {status === "loading"
                  ? "Checking"
                  : allClear
                    ? "All clear"
                    : `${active.length} active`}
              </span>
            </div>

            {status === "error" ? (
              <>
                <strong>Status unavailable</strong>
                <p>
                  We could not reach the monitoring service. Your power may
                  still be affected.
                </p>
                <button
                  type="button"
                  className="text-action"
                  onClick={loadIncidents}
                >
                  Try again
                </button>
              </>
            ) : (
              <>
                <strong>
                  {status === "loading"
                    ? "—"
                    : affectedCount.toLocaleString("en-PH")}
                </strong>
                <p>
                  estimated households affected right now across {active.length}{" "}
                  active {active.length === 1 ? "incident" : "incidents"}.
                </p>
                <div
                  className="status-bar"
                  role="img"
                  aria-label={`${active.length} active incidents out of ${incidents.length} tracked`}
                >
                  {[...incidents]
                    .sort((a, b) => {
                      const rank = { red: 0, amber: 1, good: 2 };
                      return (
                        rank[severityOf(a).tone] - rank[severityOf(b).tone]
                      );
                    })
                    .slice(0, 24)
                    .map((incident) => (
                      <span
                        key={incident.id}
                        className={`bar-${severityOf(incident).tone} ${
                          severityOf(incident).tone !== "good"
                            ? "is-active"
                            : ""
                        }`}
                      />
                    ))}
                  {incidents.length === 0 && <span className="bar-good" />}
                </div>
                <div className="status-summary">
                  <span>
                    <i className="legend-swatch red" />
                    Outage
                  </span>
                  <span>
                    <i className="legend-swatch amber" />
                    Monitoring
                  </span>
                  <span>
                    <i className="legend-swatch" />
                    Restored
                  </span>
                </div>
                {refreshedAt && (
                  <small className="status-refreshed">
                    Updated{" "}
                    {refreshedAt.toLocaleTimeString("en-PH", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {" · "}
                    <button
                      type="button"
                      className="text-action"
                      onClick={loadIncidents}
                    >
                      Refresh
                    </button>
                  </small>
                )}
              </>
            )}
          </section>
        </div>

        <section className="public-section" id="updates">
          <div className="public-section-heading">
            <h2>Outage updates</h2>
            <label className="portal-search">
              <span className="sr-only">
                Search by barangay or municipality
              </span>
              <input
                type="search"
                value={query}
                placeholder="Search your barangay…"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>

          {status === "loading" && (
            <div className="public-update-grid">
              {[0, 1, 2].map((index) => (
                <article
                  key={index}
                  className="update-card is-skeleton"
                  aria-hidden="true"
                >
                  <div className="update-card-top">
                    <i />
                    <i />
                  </div>
                  <h3 />
                  <p />
                </article>
              ))}
            </div>
          )}

          {status === "ready" && filtered.length === 0 && (
            <p className="portal-empty">
              {query
                ? `No outages reported for “${query}”. If your power is out, please report it below.`
                : "No outages are currently reported across either cooperative."}
            </p>
          )}

          {status === "ready" && filtered.length > 0 && (
            <div className="public-update-grid">
              {filtered.map((incident) => {
                const severity = severityOf(incident);
                return (
                  <article className="update-card" key={incident.id}>
                    <div className="update-card-top">
                      <span
                        className={`status-pill ${severity.tone === "good" ? "good" : "warn"}`}
                      >
                        {severity.label}
                      </span>
                      <time
                        dateTime={incident.started_at ?? ""}
                        title={absoluteTime(incident.started_at)}
                      >
                        {relativeTime(incident.started_at)}
                      </time>
                    </div>
                    <h3>
                      {incident.barangay
                        ? `${incident.barangay}, ${incident.municipality ?? ""}`.replace(
                            /,\s*$/,
                            "",
                          )
                        : (incident.municipality ?? "Coverage area")}
                    </h3>
                    <p>
                      {incident.summary ??
                        incident.title ??
                        "Crews are assessing the affected line. Updates will be posted here."}
                    </p>
                    <div className="update-card-foot">
                      <span>
                        {Number(
                          incident.affected_customers ?? 0,
                        ).toLocaleString("en-PH")}{" "}
                        households
                      </span>
                      <span>
                        {incident.eta ? `ETA ${incident.eta}` : "ETA pending"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="report-strip" id="report">
          <div>
            <p className="eyebrow">Something not showing here?</p>
            <h2>Report an outage in your area</h2>
            <p>
              Sensor coverage is still expanding. If your power is out and it is
              not listed above, let your cooperative know directly.
            </p>
          </div>
          <a className="primary-action light" href="tel:+63561234567">
            Call the hotline
          </a>
        </section>
      </main>

      <footer className="portal-footer">
        <p>
          GridWatch · Sorsogon Electric Cooperatives I &amp; II · Status data is
          indicative and may lag actual conditions.
        </p>
        <div>
          <a href="#updates">Outage updates</a>
          <a href="#report">Report</a>
          <a href="/login">Dispatcher login</a>
        </div>
      </footer>
    </div>
  );
}
