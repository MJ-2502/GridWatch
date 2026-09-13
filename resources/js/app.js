import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';

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

export default function App() {
    const [sorsogon, setSorsogon] = useState(null);
    const [activeLayer, setActiveLayer] = useState('Grid health');

    useEffect(() => {
        fetch('/sorsogon.geojson')
            .then((response) => response.json())
            .then(setSorsogon);
    }, []);

    return (
        <main className="dashboard-shell">
            <header className="topbar">
                <div className="brand-lockup">
                    <div className="brand-mark">GW</div>
                    <div>
                        <p className="eyebrow">GridWatch</p>
                        <p className="brand-title">Regional operations</p>
                    </div>
                </div>
                <div className="topbar-meta">
                    <span className="sync-dot"></span>
                    <span>Data synced 2 min ago</span>
                    <button className="avatar" type="button" aria-label="Open profile">AR</button>
                </div>
            </header>

            <section className="dashboard-content">
                <div className="intro-row">
                    <div>
                        <p className="eyebrow">Friday, 11 September 2026</p>
                        <h1>Sorsogon grid overview</h1>
                    </div>
                    <button className="outline-button" type="button">Export snapshot</button>
                </div>

                <div className="stat-grid">
                    <article className="stat-card stat-card-primary">
                        <div className="stat-heading"><span>Network availability</span><span className="status-pill good">Stable</span></div>
                        <strong>98.7%</strong>
                        <div className="stat-foot"><span className="trend-up">+1.4%</span><span>vs. last 24 hours</span></div>
                    </article>
                    <article className="stat-card">
                        <div className="stat-heading"><span>Active substations</span><span className="mini-icon">SUB</span></div>
                        <strong>42 <small>/ 45</small></strong>
                        <div className="stat-foot"><span>3 require attention</span></div>
                    </article>
                    <article className="stat-card">
                        <div className="stat-heading"><span>Open incidents</span><span className="status-pill warn">Monitor</span></div>
                        <strong>07</strong>
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
                            <div className="layer-tabs" role="tablist" aria-label="Map layers">
                                {['Grid health', 'Incidents', 'Demand'].map((layer) => (
                                    <button key={layer} className={activeLayer === layer ? 'layer-tab active' : 'layer-tab'} onClick={() => setActiveLayer(layer)} type="button">{layer}</button>
                                ))}
                            </div>
                        </div>
                        <div className="map-stage">
                            <MapContainer center={[12.85, 123.9]} zoom={9} zoomControl={false}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                                {sorsogon && <><GeoJSON data={sorsogon} pathOptions={{ color: '#176b66', weight: 2, fillColor: '#63c6ae', fillOpacity: 0.25 }} /><FitGeoJson data={sorsogon} /></>}
                            </MapContainer>
                            <div className="map-label"><span className="live-indicator"></span>Live boundary · {activeLayer}</div>
                            <div className="map-legend"><span className="legend-swatch"></span>Healthy <span className="legend-swatch amber"></span>Attention <span className="legend-swatch red"></span>Outage</div>
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
        </main>
    );
}

const root = document.getElementById('app');
if (root) createRoot(root).render(<App />);