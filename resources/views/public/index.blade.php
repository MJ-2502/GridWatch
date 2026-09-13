@extends('layout.app', ['title' => 'GridWatch | Power outage updates'])

@section('content')
<div class="public-portal">
    <header class="portal-nav">
        <a class="portal-brand" href="{{ url('/') }}"><span class="portal-brand-mark">GW</span><span>GridWatch</span></a>
        <nav class="portal-nav-links" aria-label="Public navigation">
            <a class="active" href="{{ url('/public') }}">Outage map</a>
            <a href="#updates">Updates</a>
            <a href="#about">About</a>
        </nav>
        <a class="portal-nav-action" href="#report">Report outage <span>+</span></a>
    </header>

    <main class="public-main">
        <section class="public-hero">
            <div class="public-hero-copy">
                <p class="eyebrow">Sorsogon power updates</p>
                <h1>Know what is happening in your neighborhood.</h1>
                <p class="public-lede">See verified outages, share a report, and follow restoration updates from your local electric cooperative.</p>
                <div class="public-actions"><a class="primary-action" href="#report">Report an outage <span>↗</span></a><a class="secondary-action" href="#updates">View outage map</a></div>
            </div>
            <div class="public-status-card"><div class="public-status-head"><span class="live-indicator"></span><span>Network status</span><span class="status-pill good">Updated 2 min ago</span></div><strong>98.7%</strong><p>of monitored areas currently have power</p><div class="status-bar"><span></span></div><div class="status-summary"><span><i class="legend-swatch"></i> 42 areas online</span><span><i class="legend-swatch amber"></i> 3 under review</span></div></div>
        </section>

        <section class="public-section" id="updates"><div class="public-section-heading"><div><p class="eyebrow">Verified reports</p><h2>Current outage updates</h2></div><a class="text-action" href="#map">Open full map <span>→</span></a></div><div class="public-update-grid"><article class="update-card"><div class="update-card-top"><span class="signal-marker red"></span><span class="status-pill warn">Investigating</span></div><h3>Bulusan feeder interruption</h3><p>Parts of Bulusan municipality</p><div class="update-card-foot"><span>Reported 14 min ago</span><span>›</span></div></article><article class="update-card"><div class="update-card-top"><span class="signal-marker amber"></span><span class="status-pill good">Restoration work</span></div><h3>Gubat substation maintenance</h3><p>Gubat town center and nearby barangays</p><div class="update-card-foot"><span>Estimated restoration 16:30</span><span>›</span></div></article><article class="update-card quiet-update"><div class="update-card-top"><span class="signal-marker"></span><span class="status-pill good">Monitoring</span></div><h3>Magallanes service advisory</h3><p>Scheduled work in selected areas</p><div class="update-card-foot"><span>Updated today</span><span>›</span></div></article></div></section>

        <section class="report-strip" id="report"><div><p class="eyebrow">Help your community</p><h2>Are you experiencing an outage?</h2><p>Send a quick report to help the cooperative verify what is happening on the ground.</p></div><a class="primary-action light" href="#">Start a report <span>↗</span></a></section>
    </main>
    <footer class="portal-footer"><span>GridWatch public service portal</span><a href="{{ url('/admin') }}">Cooperative staff sign in</a></footer>
</div>
@endsection
