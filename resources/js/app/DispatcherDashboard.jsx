const user = window.AuthUser;

console.log(user.role);     // 'admin', 'dispatcher', 'consumer', or 'guest'
console.log(user.district); // e.g. 'Casiguran'

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import {
    CircleMarker,
    GeoJSON,
    MapContainer,
    Popup,
    TileLayer,
    useMap,
    LayersControl,
    Pane,
    Marker
} from "react-leaflet";
import L from "leaflet";
import {
    loadBarangayFeatures,
    municipalityFeatures,
    municipalityNames,
    municipalityKey,
    scopes,
} from "./data/coverage";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function createPulseIcon(color) {
    const svg = `<svg width="48" height="48" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;"><style>.spinner_98HH{animation:spinner_mnRT 1.6s cubic-bezier(0.52,.6,.25,.99) infinite}.spinner_roCJ{animation-delay:.2s}.spinner_q4Oo{animation-delay:.4s}@keyframes spinner_mnRT{0%{r:0;opacity:1}75%,100%{r:11px;opacity:0}}</style><circle cx="12" cy="12" r="3.5" fill="${color}" /><circle class="spinner_98HH" cx="12" cy="12" r="0"/><circle class="spinner_98HH spinner_roCJ" cx="12" cy="12" r="0"/><circle class="spinner_98HH spinner_q4Oo" cx="12" cy="12" r="0"/></svg>`;
    return L.divIcon({
        html: svg,
        className: 'custom-pulse-icon',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -12]
    });
}

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
        if (data.features.length) {
            // flyToBounds with a short, fixed duration gives one smooth, linear
            // pan+zoom to the target — unlike fitBounds's default animation,
            // which can zoom out further than necessary before zooming back in
            // when the old and new bounds are far apart, and unlike an instant
            // cut (animate: false), which has no transition at all.
            map.flyToBounds(L.geoJSON(data).getBounds(), {
                padding: [20, 20],
                duration: 0.8,
                easeLinearity: 0.6,
            });
        }
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
                <b className={`node-status ${node.status}`}>
                    <Icon icon="lucide:circle-dot" width="10" height="10" aria-hidden="true" /> {statusLabel}
                </b>
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
                            MORE DETAILS <Icon icon="lucide:chevron-right" width="12" height="12" aria-hidden="true" />
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
                    <Icon icon="lucide:send" width="14" height="14" aria-hidden="true" /> DISPATCH CREW TO {node.name.toUpperCase()}
                </button>
            )}
        </div>
    );
}

// NEW: Region Summary Modal for both Municipalities and Barangays
function RegionSummaryModal({ region, nodes, liveStatuses, scope, onClose }) {
    if (!region) return null;
    
    // Calculate aggregated stats dynamically based on region type
    const matchedNodes = useMemo(() => {
        if (region.type === 'municipality') {
            return nodes.filter(n => municipalityKey(n.municipality) === municipalityKey(region.name));
        } else {
            return nodes.filter(n => pointInGeometry([n.longitude, n.latitude], region.feature.geometry));
        }
    }, [region, nodes]);

    // Gather live map statuses for the selected region
    const matchedStatuses = useMemo(() => {
        if (!liveStatuses) return [];
        if (region.type === 'municipality') {
            return liveStatuses.filter(s => municipalityKey(s.municipality) === municipalityKey(region.name));
        } else {
            return liveStatuses.filter(s => 
                municipalityKey(s.name) === municipalityKey(region.name) &&
                municipalityKey(s.municipality) === municipalityKey(region.feature.properties?.ADM3_EN)
            );
        }
    }, [region, liveStatuses]);

    const totalNodes = matchedNodes.length;
    // We combine outages/reports from liveStatuses (which includes isolated issues not bound to a node)
    const outages = matchedStatuses.reduce((sum, s) => sum + (s.outages || 0), 0);
    const unverifiedNodes = matchedNodes.filter(n => n.status === 'unverified').length;
    const totalReports = matchedStatuses.reduce((sum, s) => sum + (s.reports || 0), 0);

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
                        <b style={{ color: unverifiedNodes > 0 ? "#f4a516" : "inherit" }}>{unverifiedNodes}</b>
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
                            ? `Critical: ${outages} outage(s) active. Prioritize restoration efforts in ${region.name}.` 
                            : unverifiedNodes > 0 || totalReports > 0
                                ? `Warning: Unverified node alerts or citizen reports detected. Monitor ${region.name} closely.`
                                : totalNodes === 0
                                    ? `No monitored GridWatch nodes or reports exist within this boundary.`
                                    : `All ${totalNodes} monitored nodes in ${region.name} are currently nominal.`}
                    </p>
                </div>
            </section>
        </div>
    );
}

function DetailModal({ node, scope, onClose, onDispatch }) {
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        if (!node) return;
        
        let baseReports = node.reports || 0;
        
        // Generate simulated data for the last 6 blocks of 30 mins
        let data = Array.from({ length: 6 }, (_, i) => {
            const timeDate = new Date(Date.now() - (5 - i) * 30 * 60 * 1000);
            const time = timeDate.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit' });
            
            // The most recent block (index 5) gets the current actual reports
            // Earlier blocks get a random lower amount or 0 if it was completely nominal
            let value = 0;
            if (i === 5) {
                value = baseReports;
            } else if (baseReports > 0) {
                value = Math.max(0, Math.floor(baseReports * Math.random() * (i/5)));
            }
            
            return { time, value };
        });
        
        setChartData(data);
    }, [node, node?.reports]);

    if (!node) return null;
    
    const isIssue = node.status === 'outage' || node.status === 'unverified';
    const chartBgColor = node.status === 'outage' ? 'rgba(255, 72, 72, 0.8)' : (node.status === 'unverified' ? 'rgba(244, 165, 22, 0.8)' : 'rgba(35, 197, 110, 0.8)');

    const chartConfig = {
        data: {
            labels: chartData.map(d => d.time),
            datasets: [{
                label: 'Reports',
                data: chartData.map(d => d.value),
                backgroundColor: chartBgColor,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
            },
            scales: {
                x: { 
                    display: true, 
                    grid: { display: false },
                    ticks: { color: '#68817b', maxRotation: 0 }
                },
                y: { 
                    display: true, 
                    grid: { color: '#162b32', drawBorder: false },
                    ticks: { color: '#68817b', precision: 0 },
                    beginAtZero: true,
                    suggestedMax: 5
                }
            }
        }
    };

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
                        ["AFFECTED HH", node.reports ? Math.max(1, node.reports * 35) : 0],
                        [
                            "REPORTS",
                            node.reports || 0,
                        ],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <span>{label}</span>
                            <b>{value}</b>
                        </div>
                    ))}
                </div>
                <div className="detail-section">
                    <span>REPORT COUNTER · PER 30 MINS</span>
                    <div style={{ height: '140px', width: '100%', marginTop: '12px' }}>
                        <Bar data={chartConfig.data} options={chartConfig.options} />
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
                {isIssue && (
                    <button
                        className="modal-dispatch"
                        onClick={() => {
                            onDispatch(node);
                            onClose();
                        }}
                    >
                        <Icon icon="lucide:send" width="14" height="14" aria-hidden="true" /> DISPATCH CREW TO {node.name.toUpperCase()}
                    </button>
                )}
            </section>
        </div>
    );
}

export default function DispatcherDashboard() {
    // "all" = both territories shown together (the fresh-login default).
    // Any other value is a single scopes key ("soreco1" / "soreco2") — focused view.
    const [scopeKey, setScopeKey] = useState("all");
    const [municipality, setMunicipality] = useState("");
    const [incidents, setIncidents] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showAlert, setShowAlert] = useState(true);
    const [detailNode, setDetailNode] = useState(null);
    const [regionSummary, setRegionSummary] = useState(null);
    const [dispatchMessage, setDispatchMessage] = useState("");
    const isAllTerritories = scopeKey === "all";
    // scope is null while viewing both territories together — nothing downstream
    // that touches `scope` directly can run in that mode (guarded below).
    const scope = isAllTerritories ? null : scopes[scopeKey];
    const [activeSection, setActiveSection] = useState("Network map");
    const [rawBarangayFeatures, setRawBarangayFeatures] = useState([]); 
    const [liveStatuses, setLiveStatuses] = useState([]);
    // NEW: Reference to manage the click delay timer
    const clickTimerRef = useRef(null);

    const municipalities = useMemo(
        () => (scope ? municipalityNames(scope) : []),
        [scope],
    );

    // Counts per territory, computed from the real data instead of hardcoded
    // "8"/"7" strings, so this stays correct if coverage data ever changes.
    const territoryMunicipalityCounts = useMemo(
        () =>
            Object.fromEntries(
                Object.entries(scopes).map(([key, value]) => [
                    key,
                    municipalityNames(value).length,
                ]),
            ),
        [],
    );
    const totalMunicipalityCount = useMemo(
        () =>
            Object.values(territoryMunicipalityCounts).reduce(
                (sum, count) => sum + count,
                0,
            ),
        [territoryMunicipalityCounts],
    );

    const boundaries = useMemo(() => {
        if (isAllTerritories) {
            // Combine every territory's municipality outlines into one collection,
            // tagging each feature with its own territory's color and key so the
            // map can render both palettes at once and drill-down still knows
            // which territory a double-clicked municipality belongs to.
            const combined = Object.entries(scopes).flatMap(([key, value]) =>
                municipalityFeatures(value, "").map((feature) => ({
                    ...feature,
                    properties: {
                        ...feature.properties,
                        __scopeColor: value.color,
                        __scopeKey: key,
                    },
                })),
            );
            return { type: "FeatureCollection", features: combined };
        }
        return {
            type: "FeatureCollection",
            features: municipalityFeatures(scope, municipality).map(
                (feature) => ({
                    ...feature,
                    properties: {
                        ...feature.properties,
                        __scopeColor: scope.color,
                        __scopeKey: scopeKey,
                    },
                }),
            ),
        };
    }, [isAllTerritories, scopeKey, scope, municipality]);

    // Fetch barangays asynchronously when a municipality is selected
    useEffect(() => {
        // 1. INSTANTLY clear the old data and active selections on change.
        // This forces the Leaflet GeoJSON layer to unmount and prevents the "stale data" bug.
        setRawBarangayFeatures([]);
        clearSelectedBarangay();

        // 2. If we just cleared the scope (e.g., clicked back to full view), stop here.
        if (!municipality) {
            return;
        }

        // 3. Otherwise, fetch the new data
        let isMounted = true;
        loadBarangayFeatures(scope, municipality).then(features => {
            if (isMounted) { 
                setRawBarangayFeatures(features);
            }
        });

        return () => { isMounted = false; };
    }, [scope, municipality]);

    useEffect(() => {
        const fetchMapStatus = () => {
            fetch("/api/map/status", { headers: { "Accept": "application/json" } })
                .then((response) => (response.ok ? response.json() : []))
                .then((payload) => setLiveStatuses(payload))
                .catch(() => setLiveStatuses([]));
        };
        fetchMapStatus();
        const intervalId = setInterval(fetchMapStatus, 5000);
        return () => clearInterval(intervalId);
    }, []);

    const barangayFeaturesList = useMemo(() => {
        return rawBarangayFeatures.map(feature => {
            const brgyName = feature.properties?.ADM4_EN || feature.properties?.NAME_3 || "Barangay";
            
            const liveData = liveStatuses.find(d => 
                municipalityKey(d.name) === municipalityKey(brgyName) &&
                municipalityKey(d.municipality) === municipalityKey(municipality)
            );
            
            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    // Default to your dark theme color if nominal, otherwise use the API color
                    fillColor: liveData && liveData.status !== 'normal' ? liveData.color : "#0d1b20",
                    fillOpacity: liveData && liveData.status !== 'normal' ? 0.6 : 0.1,
                    status: liveData ? liveData.status : "normal"
                }
            };
        });
    }, [rawBarangayFeatures, liveStatuses, municipality]);

    const barangays = useMemo(
        () => ({
            type: "FeatureCollection",
            features: barangayFeaturesList,
        }),
        [barangayFeaturesList],
    );

    const alertNode = nodes.find((node) => node.id === "TRF-006");

    const getDynamicBarangayStyle = (feature) => ({
        color: scope?.color || "#68817b",
        weight: 0.5,
        fillColor: feature?.properties?.fillColor || "#0d1b20",
        fillOpacity: feature?.properties?.fillOpacity || 0.1,
    });
    const barangaySelectedStyle = useMemo(
        () => ({
            color: "#f5f8f6",
            weight: 2,
            fillColor: scope?.color || "#68817b",
            fillOpacity: 0.5,
        }),
        [scope],
    );
    const selectedLayerRef = useRef(null);

    const clearSelectedBarangay = () => {
        if (selectedLayerRef.current) {
            selectedLayerRef.current.setStyle(getDynamicBarangayStyle(selectedLayerRef.current.feature));
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
                });
                event.target.bringToFront();
            },
            mouseout: (event) => {
                if (selectedLayerRef.current === event.target) return;
                event.target.setStyle(getDynamicBarangayStyle());
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
        const fetchIncidents = () => {
            fetch("/api/public/incidents")
                .then((response) => (response.ok ? response.json() : { data: [] }))
                .then((payload) => setIncidents(payload.data || []))
                .catch(() => setIncidents([]));
        };
        fetchIncidents();
        const intervalId = setInterval(fetchIncidents, 5000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const fetchNodes = () => {
            fetch("/api/grid-nodes", { headers: { "Accept": "application/json" } })
                .then((response) => (response.ok ? response.json() : { data: [] }))
                .then((payload) => setNodes(payload.data || []))
                .catch(() => setNodes([]));
        };

        // Fetch immediately on load
        fetchNodes();

        // Check for hardware updates every 5 seconds
        const intervalId = setInterval(fetchNodes, 5000);

        // Cleanup the timer if the dispatcher leaves the page
        return () => clearInterval(intervalId);
    }, []);
    
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
                    <span>LIVE</span>
                    {/* NEW: Replaced Avatar with Logout Link */}
                    <a
                        href="/quick-logout"
                        className="avatar"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}
                        title="Logout"
                    >
                        OUT
                    </a>
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
                                <Icon
                                    icon={
                                        [
                                            "lucide:map",
                                            "lucide:alert-triangle",
                                            "lucide:radio-tower",
                                            "lucide:users",
                                        ][index]
                                    }
                                    width="14"
                                    height="14"
                                    aria-hidden="true"
                                />
                            </span>
                            <span>{item}</span>
                            {item !== "Network map" && <em>SOON</em>}
                        </button>
                    ))}
                </nav>
                <div className="sidebar-rule" />
                <div className="sidebar-context">
                    <span className="sidebar-kicker">SERVICE TERRITORY</span>
                    <strong>
                        {isAllTerritories ? "All territories" : scope.label}
                    </strong>
                    <small>
                        {isAllTerritories
                            ? `${totalMunicipalityCount} municipalities`
                            : `${territoryMunicipalityCounts[scopeKey]} municipalities`}
                    </small>
                </div>
                <div className="sidebar-territories">
                    {Object.entries(scopes).map(([key, value]) => (
                        <button
                            key={key}
                            className={
                                isAllTerritories || scopeKey === key
                                    ? "territory-button active"
                                    : "territory-button"
                            }
                            style={{ "--territory-color": value.color }}
                            onClick={() => {
                                // Clicking the territory that's already solely focused
                                // returns to the combined "all" view; clicking any
                                // other territory (including from "all") focuses it.
                                setScopeKey(scopeKey === key ? "all" : key);
                                setMunicipality("");
                            }}
                            type="button"
                        >
                            <i />
                            {value.label}
                            <small>
                                {territoryMunicipalityCounts[key]} municipalities
                            </small>
                        </button>
                    ))}
                </div>
                <button
                    className="sidebar-placeholder"
                    type="button"
                    onClick={() => setActiveSection("Settings")}
                >
                    <span>
                        <Icon icon="lucide:settings" width="14" height="14" aria-hidden="true" />
                    </span>
                    <span>Settings</span>
                    <em>SOON</em>
                </button>
                <div className="sidebar-footer">
                    <span className="health-dot" /> SCADA online
                </div>
            </aside>
            <section className="dashboard-content">
                <section className="map-panel">
                    <div className="panel-header">
                        <div className="map-controls">
                            <select
                                value={municipality}
                                onChange={(event) =>
                                    setMunicipality(event.target.value)
                                }
                                disabled={isAllTerritories}
                                aria-label="Select municipality"
                                title={
                                    isAllTerritories
                                        ? "Focus a service territory to drill into a municipality"
                                        : undefined
                                }
                            >
                                <option value="">
                                    {isAllTerritories
                                        ? "Select a territory first"
                                        : "All municipalities"}
                                </option>
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
                            doubleClickZoom={false}
                        >

                            <LayersControl position="bottomright">
                                
                                <LayersControl.BaseLayer name="Google Satellite">
                                    <TileLayer
                                        url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                                        attribution="&copy; Google"
                                    />
                                </LayersControl.BaseLayer>

                                <LayersControl.BaseLayer name="Dark Theme">
                                    <TileLayer
                                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                        attribution="&copy; OpenStreetMap contributors &copy; CARTO"
                                    />
                                </LayersControl.BaseLayer>

                                <LayersControl.BaseLayer checked name="Street Map">
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution="&copy; OpenStreetMap contributors"
                                    />
                                </LayersControl.BaseLayer>

                            </LayersControl>
                            
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
                                    style={(feature) => ({
                                        color: feature.properties.__scopeColor,
                                        weight: 1.5,
                                        fillColor: feature.properties.__scopeColor,
                                        fillOpacity: 0.15,
                                    })}
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
                                                // If viewing both territories, focus the one this
                                                // municipality belongs to at the same time as drilling in.
                                                if (isAllTerritories) {
                                                    setScopeKey(feature.properties.__scopeKey);
                                                }
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
                                            style={getDynamicBarangayStyle}
                                            onEachFeature={onEachBarangay}
                                        />
                                    )}
                                </>
                            )}

                            <Pane name="nodes" style={{ zIndex: 500 }}>
                                {nodes
                                    .filter(
                                        (node) =>
                                            !municipality ||
                                            municipalityKey(node.municipality) ===
                                                municipalityKey(municipality),
                                    )
                                    .map((node) => {
                                        const isIssue = node.status === "outage" || node.status === "unverified";
                                        const nodeColor = node.status === "outage" ? "#ff4848" : (node.status === "unverified" ? "#f4a516" : "#23c56e");
                                        const position = [node.latitude, node.longitude];
                                        const popup = (
                                            <Popup className="node-popup-wrapper" pane="popupPane">
                                                <NodePopup node={node} onDetails={setDetailNode} onDispatch={dispatchCrew} />
                                            </Popup>
                                        );

                                        if (isIssue) {
                                            return (
                                                <Marker
                                                    key={node.id}
                                                    position={position}
                                                    icon={createPulseIcon(nodeColor)}
                                                >
                                                    {popup}
                                                </Marker>
                                            );
                                        }

                                        return (
                                            <CircleMarker
                                                key={node.id}
                                                center={position}
                                                radius={6}
                                                pathOptions={{
                                                    color: "#f5f8f6",
                                                    weight: 2,
                                                    fillColor: nodeColor,
                                                    fillOpacity: 1,
                                                }}
                                            >
                                                {popup}
                                            </CircleMarker>
                                        );
                                    })}
                            </Pane>
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
                liveStatuses={liveStatuses}
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
                <div className="dispatch-toast">
                    <Icon icon="lucide:radio" width="14" height="14" aria-hidden="true" /> {dispatchMessage}
                </div>
            )}
        </main>
    );
}