import React, { useEffect, useMemo, useState } from "react";
import {
    CircleMarker,
    GeoJSON,
    MapContainer,
    Popup,
    TileLayer,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import {
    barangayFeatures,
    municipalityFeatures,
    municipalityNames,
    municipalityKey,
    scopes,
} from "./data/coverage";

function FitGeoJson({ data }) {
    const map = useMap();
    useEffect(() => {
        if (data.features.length)
            map.fitBounds(L.geoJSON(data).getBounds(), { padding: [20, 20] });
    }, [data, map]);
    return null;
}

function NodePopup({ node, onDetails, onDispatch }) {
    const statusLabel =
        node.status === "unverified" ? "UNVERIFIED" : node.status.toUpperCase();
    return (
        <div className="node-popup">
            <div className="node-popup-head">
                <span>{node.id}</span>
                <b className={`node-status ${node.status}`}>● {statusLabel}</b>
            </div>
            <h3>{node.name}</h3>
            <div className="node-popup-grid">
                <span>
                    CURRENT
                    <strong
                        className={node.status === "outage" ? "bad" : "good"}
                    >
                        {node.status === "outage" ? "NONE" : "DETECTED"}
                    </strong>
                </span>
                <span>
                    SENSOR
                    <strong className={node.status === "outage" ? "bad" : ""}>
                        {node.status === "outage" ? "NO SIGNAL" : "ACTIVE"}
                    </strong>
                </span>
                <span>
                    CITIZEN REPORTS
                    <strong className={node.reports ? "warn" : ""}>
                        {node.reports}
                    </strong>
                </span>
                <span>
                    TYPE<strong>POLE</strong>
                </span>
                <span>
                    DETAILS
                    <strong>
                        <button
                            className="details-link"
                            onClick={() => onDetails(node)}
                        >
                            MORE DETAILS ›
                        </button>
                    </strong>
                </span>
            </div>
            <div className="node-popup-foot">
                LAST REPORT: <span>14:18:50</span>
                {node.crews ? <b>{node.crews} CREW ASSIGNED</b> : null}
            </div>
            {(node.status === "outage" || node.status === "unverified") && (
                <button
                    className="dispatch-button"
                    onClick={() => onDispatch(node)}
                >
                    ▶ DISPATCH CREW TO {node.name.toUpperCase()}
                </button>
            )}
        </div>
    );
}


function DetailModal({ node, onClose, onDispatch }) {
    if (!node) return null;
    return (
        <div className="detail-modal-backdrop" onClick={onClose}>
            <section
                className="detail-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="detail-title"
                onClick={(event) => event.stopPropagation()}
            >
                <header>
                    <div>
                        <span>{node.id} · SORECO 1</span>
                        <h2 id="detail-title">{node.name}</h2>
                        <small>GRID NODE · POLE · CASIGURAN</small>
                    </div>
                    <button onClick={onClose} aria-label="Close details">
                        ×
                    </button>
                </header>
                <div className="detail-stats">
                    {[
                        [
                            "CURRENT",
                            node.status === "outage" ? "NONE" : "DETECTED",
                        ],
                        [
                            "SENSOR",
                            node.status === "outage" ? "NO SIGNAL" : "ACTIVE",
                        ],
                        ["AFFECTED HH", node.reports],
                        [
                            "REPORTS",
                            node.reports
                                ? Math.max(1, Math.round(node.reports / 35))
                                : 0,
                        ],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <span>{label}</span>
                            <b>{value}</b>
                        </div>
                    ))}
                </div>
                <div className="detail-section">
                    <span>RESIDENT REPORT VOLUME · LAST 3H</span>
                    <div className="detail-bars">
                        {[18, 28, 24, 42, 35, 64, 52, 78, 66, 100].map(
                            (height, index) => (
                                <i
                                    key={index}
                                    style={{ height: `${height}%` }}
                                />
                            ),
                        )}
                    </div>
                </div>
                <div className="detail-section">
                    <span>FIELD NOTES</span>
                    <p>
                        {node.status === "outage"
                            ? "No current detected. Transformer requires field inspection and restoration dispatch."
                            : "Monitoring voltage and resident reports for changes."}
                    </p>
                </div>
                {(node.status === "outage" || node.status === "unverified") && (
                    <button
                        className="modal-dispatch"
                        onClick={() => {
                            onDispatch(node);
                            onClose();
                        }}
                    >
                        ▶ DISPATCH CREW TO {node.name.toUpperCase()}
                    </button>
                )}
            </section>
        </div>
    );
}

export default function DispatcherDashboard() {
    const [scopeKey, setScopeKey] = useState("soreco1");
    const [municipality, setMunicipality] = useState("");
    const [incidents, setIncidents] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showAlert, setShowAlert] = useState(true);
    const [detailNode, setDetailNode] = useState(null);
    const [dispatchMessage, setDispatchMessage] = useState("");
    const scope = scopes[scopeKey];
    const [activeSection, setActiveSection] = useState("Network map");
    const municipalities = useMemo(() => municipalityNames(scope), [scope]);
    const boundaries = useMemo(
        () => ({
            type: "FeatureCollection",
            features: municipalityFeatures(scope, municipality),
        }),
        [scope, municipality],
    );
    const barangays = useMemo(
        () => ({
            type: "FeatureCollection",
            features: barangayFeatures(scope, municipality),
        }),
        [scope, municipality],
    );
    const alertNode = nodes.find((node) => node.id === "TRF-006");

    useEffect(() => {
        fetch("/api/public/incidents")
            .then((response) => (response.ok ? response.json() : { data: [] }))
            .then((payload) => setIncidents(payload.data || []))
            .catch(() => setIncidents([]));
    }, []);
    useEffect(() => {
        fetch("/api/grid-nodes")
            .then((response) => (response.ok ? response.json() : { data: [] }))
            .then((payload) => setNodes(payload.data || []))
            .catch(() => setNodes([]));
    }, []);
    useEffect(() => setMunicipality(""), [scopeKey]);
    const dispatchCrew = (node) => {
        setDispatchMessage(`Crew dispatched to ${node.name}`);
        window.setTimeout(() => setDispatchMessage(""), 3500);
    };

    return (
        <main className="dashboard-shell operations-shell">
            <header className="topbar">
                <div className="brand-lockup">
                    <div className="brand-mark">GW</div>
                    <div>
                        <p className="eyebrow">GridWatch</p>
                        <p className="brand-title">
                            Sorsogon Electric Cooperative
                        </p>
                    </div>
                </div>
                <div className="topbar-meta">
                    <span className="sync-dot" />
                    <span>07:22:42</span>
                    <button
                        className="avatar"
                        type="button"
                        aria-label="Open profile"
                    >
                        AR
                    </button>
                </div>
            </header>
            

            <aside className="app-sidebar" aria-label="Dispatcher navigation">
                <div className="sidebar-context">
                    <span className="sidebar-kicker">WORKSPACE</span>
                    <strong>Control room</strong>
                    <small>Live operations</small>
                </div>
                <nav className="sidebar-nav">
                    {[
                        "Network map",
                        "Incidents",
                        "Field crews",
                        "Resident reports",
                    ].map((item, index) => (
                        <button
                            key={item}
                            className={
                                activeSection === item
                                    ? "sidebar-nav-item active"
                                    : "sidebar-nav-item"
                            }
                            onClick={() => setActiveSection(item)}
                            type="button"
                        >
                            <span className="sidebar-nav-icon">
                                {["◈", "!", "⌁", "▤"][index]}
                            </span>
                            <span>{item}</span>
                            {item !== "Network map" && <em>SOON</em>}
                        </button>
                    ))}
                </nav>
                <div className="sidebar-rule" />
                <div className="sidebar-context">
                    <span className="sidebar-kicker">SERVICE TERRITORY</span>
                    <strong>{scope.label}</strong>
                    <small>
                        {scopeKey === "soreco1"
                            ? "8 municipalities"
                            : "7 municipalities"}
                    </small>
                </div>
                <div className="sidebar-territories">
                    {Object.entries(scopes).map(([key, value]) => (
                        <button
                            key={key}
                            className={
                                scopeKey === key
                                    ? "territory-button active"
                                    : "territory-button"
                            }
                            style={{ "--territory-color": value.color }}
                            onClick={() => setScopeKey(key)}
                            type="button"
                        >
                            <i />
                            {value.label}
                            <small>
                                {key === "soreco1"
                                    ? "8 municipalities"
                                    : "7 municipalities"}
                            </small>
                        </button>
                    ))}
                </div>
                <button
                    className="sidebar-placeholder"
                    type="button"
                    onClick={() => setActiveSection("Settings")}
                >
                    <span>⚙</span>
                    <span>Settings</span>
                    <em>SOON</em>
                </button>
                <div className="sidebar-footer">
                    <span className="health-dot" /> SCADA online
                </div>
            </aside>
            <section className="dashboard-content">
                <div className="stat-grid">

                    <article className="stat-card">
                        <div className="stat-heading">
                            <span>Open incidents</span>
                        </div>
                        <strong>
                            {String(incidents.length || 4).padStart(2, "0")}
                        </strong>
                    </article>
                </div>
                <section className="map-panel">
                    <div className="panel-header">
                        <div className="map-controls">
                            <select
                                value={municipality}
                                onChange={(event) =>
                                    setMunicipality(event.target.value)
                                }
                                aria-label="Select municipality"
                            >
                                <option value="">All municipalities</option>
                                {municipalities.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="map-stage">
                        <MapContainer
                            center={[12.85, 124.05]}
                            zoom={10}
                            zoomControl
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; OpenStreetMap contributors"
                            />
                            <GeoJSON
                                key={`${scopeKey}-${municipality}-municipalities`}
                                data={boundaries}
                                pathOptions={{
                                    color: scope.color,
                                    weight: 1.5,
                                    fillColor: scope.color,
                                    fillOpacity: 0.09,
                                }}
                            />
                            <GeoJSON
                                key={`${scopeKey}-${municipality}-barangays`}
                                data={barangays}
                                pathOptions={{
                                    color: scope.color,
                                    weight: 0.5,
                                    fillColor: "#0d1b20",
                                    fillOpacity: 0.1,
                                }}
                            />
                            <FitGeoJson
                                data={
                                    boundaries.features.length
                                        ? boundaries
                                        : barangays
                                }
                            />
                            {nodes
                                .filter(
                                    (node) =>
                                        !municipality ||
                                        municipalityKey(node.municipality) ===
                                            municipalityKey(municipality),
                                )
                                    .map((node) => (
                                        <CircleMarker
                                            key={node.id}
                                            center={[
                                                node.latitude,
                                                node.longitude,
                                            ]}
                                            radius={
                                                node.status === "outage" ? 7 : 6
                                            }
                                            pathOptions={{
                                                color: "#f5f8f6",
                                                weight: 2,
                                                fillColor:
                                                    node.status === "outage"
                                                        ? "#ff4848"
                                                        : node.status ===
                                                            "unverified"
                                                          ? "#f4a516"
                                                          : "#23c56e",
                                                fillOpacity: 1,
                                            }}
                                        >
                                            <Popup>
                                                <NodePopup
                                                    node={node}
                                                    onDetails={setDetailNode}
                                                    onDispatch={dispatchCrew}
                                                />
                                            </Popup>
                                        </CircleMarker>
                                    ))}
                        </MapContainer>
                        {/* <div className="map-label">
                            <span className="live-indicator" />
                            MONITORING <b>4</b> / <em>5</em> /{" "}
                            <strong>16</strong>
                        </div> */}
                        <div className="map-legend">
                            <span className="legend-swatch red" />
                            OUTAGE <span className="legend-swatch amber" />
                            UNVERIFIED <span className="legend-swatch" />
                            NOMINAL
                        </div>
                    </div>
                </section>
            </section>
            <DetailModal
                node={detailNode}
                onClose={() => setDetailNode(null)}
                onDispatch={dispatchCrew}
            />
            {showAlert && alertNode && (
                <aside className="dying-gasp-alert">
                    <div className="alert-head">
                        <span>●</span>
                        <b>⚠ Power Interruption</b>
                        <button
                            onClick={() => setShowAlert(false)}
                            aria-label="Dismiss alert"
                        >
                            ×
                        </button>
                    </div>
                    <div className="alert-body">
                        <strong>Central (Pob.)</strong>
                        <small>TRF-006 · 14:25:37 · no current detected</small>
                        <button onClick={() => dispatchCrew(alertNode)}>
                            Dispatch crew ›
                        </button>
                    </div>
                </aside>
            )}
            {dispatchMessage && (
                <div className="dispatch-toast">◉ {dispatchMessage}</div>
            )}
        </main>
    );
}
