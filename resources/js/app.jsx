import '../css/app.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

const municipalityFiles = import.meta.glob('../Soreco_Coverage_Geojson/*/*.geojson', { eager: true, query: '?json', import: 'default' });
const barangayFiles = import.meta.glob('../Soreco_Coverage_Geojson/*/*/*.geojson', { eager: true, query: '?json', import: 'default' });

const scopes = {
    soreco1: { label: 'SORECO 1', color: '#ff7900', folders: ['Soreco_1'], municipalities: ['Bulan', 'Bulusan', 'Casiguran', 'Irosin', 'Juban', 'Magallanes', 'Matnog', 'Santa Magdalena'] },
    soreco2: { label: 'SORECO 2', color: '#18aeea', folders: ['Soreco_2'], municipalities: ['Barcelona', 'Castilla', 'City of Sorsogon', 'Donsol', 'Gubat', 'Pilar', 'Prieto Diaz'] },
};

const demoNodes = [
    { id: 'TRF-006', name: 'Central (Pob.)', latitude: 12.8735, longitude: 124.0077, status: 'outage', reports: 218, crews: 1 },
    { id: 'TRF-014', name: 'Rizal', latitude: 12.8786, longitude: 124.0274, status: 'outage', reports: 143, crews: 1 },
    { id: 'TRF-004', name: 'Casay', latitude: 12.8375, longitude: 124.0582, status: 'unverified', reports: 45, crews: 0 },
    { id: 'TRF-007', name: 'Cogon', latitude: 12.8521, longitude: 124.039, status: 'unverified', reports: 78, crews: 0 },
    { id: 'TRF-001', name: 'Adovis (Pob.)', latitude: 12.8659, longitude: 124.0112, status: 'nominal', reports: 0, crews: 0 },
    { id: 'TRF-003', name: 'Burgos', latitude: 12.8764, longitude: 124.0461, status: 'nominal', reports: 0, crews: 0 },
    { id: 'TRF-010', name: 'Inlagadian', latitude: 12.8136, longitude: 124.0606, status: 'nominal', reports: 0, crews: 0 },
    { id: 'TRF-016', name: 'San Isidro', latitude: 12.8466, longitude: 124.0121, status: 'nominal', reports: 0, crews: 0 },
    { id: 'TRF-018', name: 'San Pascual', latitude: 12.8792, longitude: 124.0608, status: 'nominal', reports: 0, crews: 0 },
    { id: 'TRF-019', name: 'Santa Cruz', latitude: 12.8987, longitude: 124.0396, status: 'nominal', reports: 0, crews: 0 },
];

function FitGeoJson({ data }) {
    const map = useMap();

    useEffect(() => {
        if (data) {
            map.fitBounds(L.geoJSON(data).getBounds(), {
                padding: [20, 20],
            });
        }
    }, [data, map]);

    return null;
}

function municipalityKey(value = '') {
    return value.toLowerCase()
        .replace(/\(capital\)/g, '')
        .replace(/\bsta\.?\b/g, 'santa')
        .replace(/[^a-z0-9]/g, '');
}

function featuresFrom(files, scope, municipality) {
    return Object.entries(files)
        .filter(([path]) => scope.folders.some((folder) => path.includes(`/${folder}/`)))
        .map(([, data]) => data.features?.[0])
        .filter((feature) => !municipality || municipalityKey(feature.properties?.ADM3_EN) === municipalityKey(municipality))
        .filter(Boolean);
}

export default function App() {
    const [scopeKey, setScopeKey] = useState('soreco1');
    const [municipality, setMunicipality] = useState('');
    const [activeLayer, setActiveLayer] = useState('Grid health');
    const [incidents, setIncidents] = useState([]);
    const [showAlert, setShowAlert] = useState(true);
    const [dispatchMessage, setDispatchMessage] = useState('');
    const scope = scopes[scopeKey];
    const municipalities = useMemo(() => featuresFrom(municipalityFiles, scope).map((feature) => feature.properties?.ADM3_EN).filter(Boolean), [scope]);
    const boundaries = useMemo(() => ({ type: 'FeatureCollection', features: featuresFrom(municipalityFiles, scope, municipality) }), [scope, municipality]);
    const barangays = useMemo(() => ({ type: 'FeatureCollection', features: featuresFrom(barangayFiles, scope, municipality) }), [scope, municipality]);

    useEffect(() => {
        fetch('/api/public/incidents')
            .then((response) => response.ok ? response.json() : { data: [] })
            .then((payload) => setIncidents(payload.data || []))
            .catch(() => setIncidents([]));
    }, []);

    useEffect(() => setMunicipality(''), [scopeKey]);

    const dispatchCrew = (node) => {
        setDispatchMessage(`Crew dispatched to ${node.name}`);
        window.setTimeout(() => setDispatchMessage(''), 3500);
    };

    return (
        <main className="dashboard-shell operations-shell">
            <header className="topbar">
                <div className="brand-lockup">
                    <div className="brand-mark">GW</div>
                    <div>
                        <p className="eyebrow">GridWatch</p>
                        <p className="brand-title">Sorsogon Electric Cooperative</p>
                    </div>
                </div>
                <div className="topbar-meta">
                    <span className="sync-dot"></span>
                    <span>07:22:42</span><span className="topbar-form">▤ RESIDENT FORM</span>
                    <button className="avatar" type="button" aria-label="Open profile">AR</button>
                </div>
            </header>

            <section className="dashboard-content">
                <div className="intro-row">
                    <div>
                        <p className="eyebrow">Operations control · Live service territory</p>
                        <h1>GridWatch</h1>
                    </div>
                    <div className="scope-switcher" role="tablist" aria-label="Service territory">
                        {Object.entries(scopes).map(([key, value]) => <button key={key} className={scopeKey === key ? 'scope-tab active' : 'scope-tab'} style={{ '--scope-color': value.color }} onClick={() => setScopeKey(key)} type="button">{value.label} · {value.municipalities.length} MUNICIPALITIES</button>)}
                    </div>
                </div>

                <div className="stat-grid">
                    <article className="stat-card stat-card-primary">
                        <div className="stat-heading"><span>Network availability</span><span className="status-pill good">Stable</span></div>
                        <strong>98.7%</strong>
                        <div className="stat-foot"><span className="trend-up">+1.4%</span><span>vs. last 24 hours</span></div>
                    </article>
                    <article className="stat-card">
                        <div className="stat-heading"><span>Active substations</span><span className="mini-icon">SUB</span></div>
                        <strong>16 <small>/ 20</small></strong>
                        <div className="stat-foot"><span>3 require attention</span></div>
                    </article>
                    <article className="stat-card">
                        <div className="stat-heading"><span>Open incidents</span><span className="status-pill warn">Monitor</span></div>
                        <strong>{String(incidents.length || 4).padStart(2, '0')}</strong>
                        <div className="stat-foot"><span className="trend-down">2 unresolved</span><span>since yesterday</span></div>
                    </article>
                    <article className="stat-card">
                        <div className="stat-heading"><span>Peak demand</span><span className="mini-icon">MW</span></div>
                        <strong>184 <small>MW</small></strong>
                        <div className="stat-foot"><span>Expected at 19:00</span></div>
                    </article>
                </div>

                <div className="workspace-grid">
                    <section className="map-panel">
                        <div className="panel-header">
                            <div>
                                <p className="eyebrow">Live geographic view</p>
                                <h2>Network map</h2>
                            </div>
                            <div className="map-controls">
                                <select value={municipality} onChange={(event) => setMunicipality(event.target.value)} aria-label="Select municipality"><option value="">All municipalities</option>{municipalities.map((name) => <option key={name} value={name}>{name}</option>)}</select>
                            </div>
                            <div className="layer-tabs" role="tablist" aria-label="Map layers">
                                {['Grid health', 'Incidents', 'Demand'].map((layer) => (
                                    <button key={layer} className={activeLayer === layer ? 'layer-tab active' : 'layer-tab'} onClick={() => setActiveLayer(layer)} type="button">{layer}</button>
                                ))}
                            </div>
                        </div>
                        <div className="map-stage">
                                <MapContainer center={[12.85, 124.05]} zoom={10} zoomControl={false}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap &copy; CARTO" />
                                <GeoJSON key={`${scopeKey}-${municipality}-municipalities`} data={boundaries} pathOptions={{ color: scope.color, weight: 1.5, fillColor: scope.color, fillOpacity: 0.09 }} />
                                <GeoJSON key={`${scopeKey}-${municipality}-barangays`} data={barangays} pathOptions={{ color: scope.color, weight: 0.5, fillColor: '#0d1b20', fillOpacity: 0.1 }} />
                                <FitGeoJson data={boundaries.features.length ? boundaries : barangays} />
                                    {scopeKey === 'soreco1' && demoNodes.filter((node) => !municipality || municipalityKey(node.name) === municipalityKey(municipality) || municipality === 'Casiguran').map((node) => <CircleMarker key={node.id} center={[node.latitude, node.longitude]} radius={node.status === 'outage' ? 7 : 6} pathOptions={{ color: '#f5f8f6', weight: 2, fillColor: node.status === 'outage' ? '#ff4848' : node.status === 'unverified' ? '#f4a516' : '#23c56e', fillOpacity: 1 }}>
                                    <Popup>
                                        <div className="node-popup">
                                            <div className="node-popup-head"><span>{node.id}</span><b className={`node-status ${node.status}`}>● {node.status === 'unverified' ? 'UNVERIFIED' : node.status.toUpperCase()}</b></div>
                                            <h3>{node.name}</h3>
                                            <div className="node-popup-grid"><span>CURRENT<strong className={node.status === 'outage' ? 'bad' : 'good'}>{node.status === 'outage' ? 'NONE' : 'DETECTED'}</strong></span><span>SENSOR<strong className={node.status === 'outage' ? 'bad' : ''}>{node.status === 'outage' ? 'NO SIGNAL' : 'ACTIVE'}</strong></span><span>CITIZEN REPORTS<strong className={node.reports ? 'warn' : ''}>{node.reports}</strong></span><span>TYPE<strong>POLE</strong></span></div>
                                            <div className="node-popup-foot">LAST REPORT: <span>14:18:50</span>{node.crews ? <b>{node.crews} CREW ASSIGNED</b> : null}</div>
                                            {(node.status === 'outage' || node.status === 'unverified') && <button className="dispatch-button" onClick={() => dispatchCrew(node)}>▶ DISPATCH CREW TO {node.name.toUpperCase()}</button>}
                                        </div>
                                    </Popup>
                                    </CircleMarker>)}
                                {incidents.filter((incident) => incident.latitude && incident.longitude).map((incident) => <CircleMarker key={incident.id} center={[incident.latitude, incident.longitude]} radius={9} pathOptions={{ color: '#ff5a5a', weight: 2, fillColor: '#ff4848', fillOpacity: 0.85 }} />)}
                            </MapContainer>
                            <div className="map-label"><span className="live-indicator"></span>MONITORING <b>4</b> / <em>5</em> / <strong>16</strong></div>
                            <div className="map-legend"><span className="legend-swatch red"></span>OUTAGE <span className="legend-swatch amber"></span>UNVERIFIED <span className="legend-swatch"></span>NOMINAL</div>
                        </div>
                    </section>

                    <aside className="side-panel">
                        <div className="panel-header compact"><div><p className="eyebrow">Needs review</p><h2>Priority signals</h2></div><button className="quiet-button" type="button">View all</button></div>
                        <div className="signal-list">
                            <article className="signal-item"><span className="signal-marker red"></span><div><strong>Bulusan feeder trip</strong><p>Unplanned interruption · 14 min ago</p></div><span className="signal-arrow">›</span></article>
                            <article className="signal-item"><span className="signal-marker amber"></span><div><strong>Gubat substation load</strong><p>At 89% capacity · 32 min ago</p></div><span className="signal-arrow">›</span></article>
                            <article className="signal-item"><span className="signal-marker amber"></span><div><strong>Magallanes battery</strong><p>Maintenance due · Today</p></div><span className="signal-arrow">›</span></article>
                        </div>
                        <div className="side-divider"></div>
                        <div className="panel-header compact"><div><p className="eyebrow">Field teams</p><h2>Response status</h2></div></div>
                        <div className="team-status"><div><span className="team-avatar teal">FT</span><div><strong>Field technicians</strong><p>6 teams deployed</p></div></div><span className="status-pill good">On route</span></div>
                        <div className="team-status"><div><span className="team-avatar dark">CO</span><div><strong>Control room</strong><p>All operators online</p></div></div><span className="status-pill good">Ready</span></div>
                    </aside>
                </div>
            </section>
            {showAlert && <aside className="dying-gasp-alert"><div className="alert-head"><span>●</span><b>⚠ Power Interruption</b><button onClick={() => setShowAlert(false)} aria-label="Dismiss alert">×</button></div><div className="alert-body"><strong>Central (Pob.)</strong><small>TRF-006 · 14:25:37 · no current detected</small><button onClick={() => dispatchCrew(demoNodes[0])}>Dispatch crew ›</button></div></aside>}
            {dispatchMessage && <div className="dispatch-toast">◉ {dispatchMessage}</div>}
        </main>
    );
}

const root = document.getElementById('app');
if (root) createRoot(root).render(<App />);