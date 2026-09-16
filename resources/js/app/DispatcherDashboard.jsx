import React, { useEffect, useMemo, useRef, useState } from "react";
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
    loadBarangayFeatures,
    municipalityFeatures,
    municipalityNames,
    municipalityKey,
    scopes,
} from "./data/coverage";

function pointInRing(point, ring) {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        const intersect =
            yi > y !== yj > y &&
            x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

function pointInGeometry(point, geometry) {
    if (!geometry) return false;
    const polygons =
        geometry.type === "MultiPolygon"
            ? geometry.coordinates
            : geometry.type === "Polygon"
              ? [geometry.coordinates]
              : [];
    return polygons.some(([outer, ...holes]) => {
        if (!outer || !pointInRing(point, outer)) return false;
        return !holes.some((hole) => pointInRing(point, hole));
    });
}

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

// NEW: Region Summary Modal for both Municipalities and Barangays
function RegionSummaryModal({ region, nodes, scope, onClose }) {
    if (!region) return null;
    
    // Calculate aggregated stats dynamically based on region type
    const matchedNodes = useMemo(() => {
        if (region.type === 'municipality') {
            return nodes.filter(n => municipalityKey(n.municipality) === municipalityKey(region.name));
        } else {
            return nodes.filter(n => pointInGeometry([n.longitude, n.latitude], region.feature.geometry));
        }
    }, [region, nodes]);

    const totalNodes = matchedNodes.length;
    const outages = matchedNodes.filter(n => n.status === 'outage').length;
    const unverified = matchedNodes.filter(n => n.status === 'unverified').length;
    const totalReports = matchedNodes.reduce((sum, n) => sum + (n.reports || 0), 0);

    return (
        <div className="detail-modal-backdrop" onClick={onClose}>
            <section
                className="detail-modal"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
            >
                <header>
                    <div>
                        <span>
                            {region.type === 'municipality' ? 'MUNICIPALITY SUMMARY' : 'BARANGAY SUMMARY'}
                        </span>
                        <h2>{region.name}</h2>
                        <small>{scope?.label} TERRITORY</small>
                    </div>
                    <button onClick={onClose} aria-label="Close summary">
                        ×
                    </button>
                </header>
                <div className="detail-stats">
                    <div>
                        <span>MONITORED NODES</span>
                        <b>{totalNodes}</b>
                    </div>
                    <div>
                        <span>ACTIVE OUTAGES</span>
                        <b style={{ color: outages > 0 ? "#ff4848" : "inherit" }}>{outages}</b>
                    </div>
                    <div>
                        <span>UNVERIFIED ALERTS</span>
                        <b style={{ color: unverified > 0 ? "#f4a516" : "inherit" }}>{unverified}</b>
                    </div>
                    <div>
                        <span>CITIZEN REPORTS</span>
                        <b>{totalReports}</b>
                    </div>
                </div>
                <div className="detail-section">
                    <span>STATUS ASSESSMENT</span>
                    <p>
                        {outages > 0 
                            ? `Critical: ${outages} node(s) currently offline. Prioritize restoration efforts in ${region.name}.` 
                            : unverified > 0 
                                ? `Warning: ${unverified} unverified alert(s) detected. Monitor resident reports closely.`
                                : totalNodes === 0
                                    ? `No monitored GridWatch nodes exist within this boundary.`
                                    : `All ${totalNodes} monitored nodes in ${region.name} are currently nominal.`}
                    </p>
                </div>
            </section>
        </div>
    );
}

function DetailModal({ node, scope, onClose, onDispatch }) {
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
                        <span>
                            {node.id} · {scope?.label}
                        </span>
                        <h2 id="detail-title">{node.name}</h2>
                        <small>
                            GRID NODE · POLE ·{" "}
                            {(node.municipality || "").toUpperCase()}
                        </small>
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
    const [regionSummary, setRegionSummary] = useState(null); // NEW: State for summary modal
    const [dispatchMessage, setDispatchMessage] = useState("");
    const scope = scopes[scopeKey];
    const [activeSection, setActiveSection] = useState("Network map");
    const [barangayFeaturesList, setBarangayFeaturesList] = useState([]); 
    
    // NEW: Reference to manage the click delay timer
    const clickTimerRef = useRef(null);

    const municipalities = useMemo(() => municipalityNames(scope), [scope]);
    
    const boundaries = useMemo(
        () => ({
            type: "FeatureCollection",
            features: municipalityFeatures(scope, municipality),
        }),
        [scope, municipality],
    );

    // Fetch barangays asynchronously when a municipality is selected
    useEffect(() => {
        // 1. INSTANTLY clear the old data and active selections on change.
        // This forces the Leaflet GeoJSON layer to unmount and prevents the "stale data" bug.
        setBarangayFeaturesList([]);
        clearSelectedBarangay();

        // 2. If we just cleared the scope (e.g., clicked back to full view), stop here.
        if (!municipality) {
            return;
        }

        // 3. Otherwise, fetch the new data
        let isMounted = true;
        loadBarangayFeatures(scope, municipality).then(features => {
            if (isMounted) setBarangayFeaturesList(features);
        });

        return () => { isMounted = false; };
    }, [scope, municipality]);

    const barangays = useMemo(
        () => ({
            type: "FeatureCollection",
            features: barangayFeaturesList,
        }),
        [barangayFeaturesList],
    );

    const alertNode = nodes.find((node) => node.id === "TRF-006");

    const barangayStyle = useMemo(
        () => ({
            color: scope.color,
            weight: 0.5,
            fillColor: "#0d1b20",
            fillOpacity: 0.1,
        }),
        [scope],
    );
    const barangaySelectedStyle = useMemo(
        () => ({
            color: "#f5f8f6",
            weight: 2,
            fillColor: scope.color,
            fillOpacity: 0.5,
        }),
        [scope],
    );
    const selectedLayerRef = useRef(null);

    const clearSelectedBarangay = () => {
        if (selectedLayerRef.current) {
            selectedLayerRef.current.setStyle(barangayStyle);
            selectedLayerRef.current = null;
        }
    };

    const onEachBarangay = (feature, layer) => {
        const name =
            feature.properties?.ADM4_EN ||
            feature.properties?.NAME_3 ||
            "Barangay";
        layer.bindTooltip(name, {
            sticky: true,
            className: "barangay-tooltip",
        });
        layer.on({
            mouseover: (event) => {
                if (selectedLayerRef.current === event.target) return;
                event.target.setStyle({
                    weight: 2,
                    color: "#f5f8f6",
                    fillColor: scope.color,
                    fillOpacity: 0.45,
                });
                event.target.bringToFront();
            },
            mouseout: (event) => {
                if (selectedLayerRef.current === event.target) return;
                event.target.setStyle(barangayStyle);
            },
            // NEW: Split single and double click logic for Barangays
            click: (event) => {
                if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
                clickTimerRef.current = setTimeout(() => {
                    setRegionSummary({ type: 'barangay', name, feature });
                }, 250);
            },
            dblclick: (event) => {
                if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
                
                const matched = nodes.find(
                    (node) =>
                        (!municipality ||
                            municipalityKey(node.municipality) ===
                                municipalityKey(municipality)) &&
                        pointInGeometry(
                            [node.longitude, node.latitude],
                            feature.geometry,
                        ),
                );
                if (
                    selectedLayerRef.current &&
                    selectedLayerRef.current !== event.target
                ) {
                    selectedLayerRef.current.setStyle(barangayStyle);
                }
                if (matched) {
                    event.target.setStyle(barangaySelectedStyle);
                    event.target.bringToFront();
                    selectedLayerRef.current = event.target;
                    setDetailNode(matched);
                } else {
                    event.target.setStyle(barangayStyle);
                    selectedLayerRef.current = null;
                    setDispatchMessage(`No monitored node in ${name} yet`);
                    window.setTimeout(() => setDispatchMessage(""), 2500);
                }
            },
        });
    };

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
    
    // Clear municipality when scope (SORECO 1/2) changes
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
                            doubleClickZoom={false} // NEW: Stop Leaflet from zooming in on double-click
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; OpenStreetMap contributors"
                            />
                            
                            <FitGeoJson
                                data={
                                    boundaries.features.length
                                        ? boundaries
                                        : barangays
                                }
                            />

                            {/* STAGE 1: Scope View (No municipality selected) */}
                            {!municipality && (
                                <GeoJSON
                                    key={`${scopeKey}-municipalities-overview`}
                                    data={boundaries}
                                    pathOptions={{
                                        color: scope.color,
                                        weight: 1.5,
                                        fillColor: scope.color,
                                        fillOpacity: 0.15, 
                                    }}
                                    onEachFeature={(feature, layer) => {
                                        const name = feature.properties?.ADM3_EN;
                                        layer.bindTooltip(name, { 
                                            sticky: true,
                                            className: "municipality-tooltip" 
                                        });
                                        layer.on({
                                            mouseover: (e) => e.target.setStyle({ fillOpacity: 0.4 }),
                                            mouseout: (e) => e.target.setStyle({ fillOpacity: 0.15 }),
                                            // NEW: Split single and double click logic for Municipalities
                                            click: (e) => {
                                                if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
                                                clickTimerRef.current = setTimeout(() => {
                                                    setRegionSummary({ type: 'municipality', name, feature });
                                                }, 250);
                                            },
                                            dblclick: (e) => {
                                                if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
                                                setMunicipality(name);
                                            }
                                        });
                                    }}
                                />
                            )}

                            {/* STAGE 2: Municipality Drill-down (Municipality selected) */}
                            {municipality && (
                                <>
                                    <GeoJSON
                                        key={`${scopeKey}-${municipality}-outline`}
                                        data={boundaries}
                                        pathOptions={{
                                            color: scope.color,
                                            weight: 3, 
                                            fillColor: "transparent", 
                                            interactive: false 
                                        }}
                                    />
                                    
                                    {barangays.features.length > 0 && (
                                        <GeoJSON
                                            key={`${scopeKey}-${municipality}-barangays`}
                                            data={barangays}
                                            style={barangayStyle}
                                            onEachFeature={onEachBarangay}
                                        />
                                    )}
                                </>
                            )}

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
                        <div className="map-legend">
                            <span className="legend-swatch red" />
                            OUTAGE <span className="legend-swatch amber" />
                            UNVERIFIED <span className="legend-swatch" />
                            NOMINAL
                        </div>
                    </div>
                </section>
            </section>
            
            {/* NEW: Render the Summary Modal when active */}
            <RegionSummaryModal 
                region={regionSummary} 
                nodes={nodes} 
                scope={scope} 
                onClose={() => setRegionSummary(null)} 
            />

            <DetailModal
                node={detailNode}
                scope={scope}
                onClose={() => {
                    setDetailNode(null);
                    clearSelectedBarangay();
                }}
                onDispatch={dispatchCrew}
            />
            {dispatchMessage && (
                <div className="dispatch-toast">◉ {dispatchMessage}</div>
            )}
        </main>
    );
}