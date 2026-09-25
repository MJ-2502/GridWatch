<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'GridWatch')</title>
    <meta name="description" content="@yield('description', 'Live power outage status across SORECO I and SORECO II coverage areas.')">
    {{-- Inline critical loading styles so the spinner shows before Vite CSS loads --}}
    <style>
        body { margin: 0; }
        .gw-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            width: 100%;
            background: #050c0e;
            color: #68817b;
            gap: 24px;
        }
        .gw-loader svg { fill: #ffffff; }
        .gw-loader span {
            letter-spacing: 0.1em;
            font-size: 0.875rem;
            font-family: system-ui, -apple-system, sans-serif;
        }
    </style>
    @vite(['resources/js/app.jsx'])
</head>
<body class="@yield('body_class', '')">
    <div id="app" data-page="@yield('page')" data-user="{{ auth()->check() ? json_encode(auth()->user()) : '' }}">
        {{-- Inline loading screen: visible instantly, replaced when React mounts --}}
        <div class="gw-loader">
            @if(request()->routeIs('dashboard'))
                <svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><style>.spinner_zWVm{animation:spinner_5QiW 1.2s linear infinite,spinner_PnZo 1.2s linear infinite}.spinner_gfyD{animation:spinner_5QiW 1.2s linear infinite,spinner_4j7o 1.2s linear infinite;animation-delay:.1s}.spinner_T5JJ{animation:spinner_5QiW 1.2s linear infinite,spinner_fLK4 1.2s linear infinite;animation-delay:.1s}.spinner_E3Wz{animation:spinner_5QiW 1.2s linear infinite,spinner_tDji 1.2s linear infinite;animation-delay:.2s}.spinner_g2vs{animation:spinner_5QiW 1.2s linear infinite,spinner_CMiT 1.2s linear infinite;animation-delay:.2s}.spinner_ctYB{animation:spinner_5QiW 1.2s linear infinite,spinner_cHKR 1.2s linear infinite;animation-delay:.2s}.spinner_BDNj{animation:spinner_5QiW 1.2s linear infinite,spinner_Re6e 1.2s linear infinite;animation-delay:.3s}.spinner_rCw3{animation:spinner_5QiW 1.2s linear infinite,spinner_EJmJ 1.2s linear infinite;animation-delay:.3s}.spinner_Rszm{animation:spinner_5QiW 1.2s linear infinite,spinner_YJOP 1.2s linear infinite;animation-delay:.4s}@keyframes spinner_5QiW{0%,50%{width:7.33px;height:7.33px}25%{width:1.33px;height:1.33px}}@keyframes spinner_PnZo{0%,50%{x:1px;y:1px}25%{x:4px;y:4px}}@keyframes spinner_4j7o{0%,50%{x:8.33px;y:1px}25%{x:11.33px;y:4px}}@keyframes spinner_fLK4{0%,50%{x:1px;y:8.33px}25%{x:4px;y:11.33px}}@keyframes spinner_tDji{0%,50%{x:15.66px;y:1px}25%{x:18.66px;y:4px}}@keyframes spinner_CMiT{0%,50%{x:8.33px;y:8.33px}25%{x:11.33px;y:11.33px}}@keyframes spinner_cHKR{0%,50%{x:1px;y:15.66px}25%{x:4px;y:18.66px}}@keyframes spinner_Re6e{0%,50%{x:15.66px;y:8.33px}25%{x:18.66px;y:11.33px}}@keyframes spinner_EJmJ{0%,50%{x:8.33px;y:15.66px}25%{x:11.33px;y:18.66px}}@keyframes spinner_YJOP{0%,50%{x:15.66px;y:15.66px}25%{x:18.66px;y:18.66px}}</style><rect class="spinner_zWVm" x="1" y="1" width="7.33" height="7.33"/><rect class="spinner_gfyD" x="8.33" y="1" width="7.33" height="7.33"/><rect class="spinner_T5JJ" x="1" y="8.33" width="7.33" height="7.33"/><rect class="spinner_E3Wz" x="15.66" y="1" width="7.33" height="7.33"/><rect class="spinner_g2vs" x="8.33" y="8.33" width="7.33" height="7.33"/><rect class="spinner_ctYB" x="1" y="15.66" width="7.33" height="7.33"/><rect class="spinner_BDNj" x="15.66" y="8.33" width="7.33" height="7.33"/><rect class="spinner_rCw3" x="8.33" y="15.66" width="7.33" height="7.33"/><rect class="spinner_Rszm" x="15.66" y="15.66" width="7.33" height="7.33"/></svg>
            @else
                <svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="3" r="0" fill="currentColor"><animate id="SVGoB2HzdBp" attributeName="r" begin="0;SVGhp5IKccd.end-0.5s" calcMode="spline" dur="0.6s" keySplines=".27,.42,.37,.99;.53,0,.61,.73" values="0;2;0"/></circle><circle cx="16.5" cy="4.21" r="0" fill="currentColor"><animate id="SVG13I3L3Mo" attributeName="r" begin="SVGoB2HzdBp.begin+0.1s" calcMode="spline" dur="0.6s" keySplines=".27,.42,.37,.99;.53,0,.61,.73" values="0;2;0"/></circle><circle cx="7.5" cy="4.21" r="0" fill="currentColor"><animate id="SVGhp5IKccd" attributeName="r" begin="SVGZh5n6c6U.begin+0.1s" calcMode="spline" dur="0.6s" keySplines=".27,.42,.37,.99;.53,0,.61,.73" values="0;2;0"/></circle><circle cx="19.79" cy="7.5" r="0" fill="currentColor"><animate id="SVGwdpSnbWm" attributeName="r" begin="SVG13I3L3Mo.begin+0.1s" calcMode="spline" dur="0.6s" keySplines=".27,.42,.37,.99;.53,0,.61,.73" values="0;2;0"/></circle><circle cx="4.21" cy="7.5" r="0" fill="currentColor"><animate id="SVGZh5n6c6U" attributeName="r" begin="SVGZlbpteod.begin+0.1s" calcMode="spline" dur="0.6s" keySplines=".27,.42,.37,.99;.53,0,.61,.73" values="0;2;0"/></circle><circle cx="21" cy="12" r="0" fill="currentColor"><animate id="SVGtZjtgdeT" attributeName="r" begin="SVGwdpSnbWm.begin+0.1s" calcMode="spline" dur="0.6s" keySplines=".27,.42,.37,.99;.53,0,.61,.73" values="0;2;0"/></circle><circle cx="3" cy="12" r="0" fill="currentColor"><animate id="SVGZlbpteod" attributeName="r" begin="SVGwTNtvelU.begin+0.1s" calcMode="spline" dur="0.6s" keySplines=".27,.42,.37,.99;.53,0,.61,.73" values="0;2;0"/></circle><circle cx="19.79" cy="16.5" r="0" fill="currentColor"><animate id="SVGtoLBIbcZ" attributeName="r" begin="SVGtZjtgdeT.begin+0.1s" calcMode="spline" dur="0.6s" keySplines=".27,.42,.37,.99;.53,0,.61,.73" values="0;2;0"/></circle><circle cx="4.21" cy="16.5" r="0" fill="currentColor"><animate id="SVGwTNtvelU" attributeName="r" begin="SVGk1PzexJH.begin+0.1s" calcMode="spline" dur="0.6s" keySplines=".27,.42,.37,.99;.53,0,.61,.73" values="0;2;0"/></circle><circle cx="16.5" cy="19.79" r="0" fill="currentColor"><animate id="SVGoTyDPewd" attributeName="r" begin="SVGtoLBIbcZ.begin+0.1s" calcMode="spline" dur="0.6s" keySplines=".27,.42,.37,.99;.53,0,.61,.73" values="0;2;0"/></circle><circle cx="7.5" cy="19.79" r="0" fill="currentColor"><animate id="SVGk1PzexJH" attributeName="r" begin="SVG0DUTaeRN.begin+0.1s" calcMode="spline" dur="0.6s" keySplines=".27,.42,.37,.99;.53,0,.61,.73" values="0;2;0"/></circle><circle cx="12" cy="21" r="0" fill="currentColor"><animate id="SVG0DUTaeRN" attributeName="r" begin="SVGoTyDPewd.begin+0.1s" calcMode="spline" dur="0.6s" keySplines=".27,.42,.37,.99;.53,0,.61,.73" values="0;2;0"/></circle></svg>
            @endif
            @if(request()->routeIs('dashboard'))
                <span>INITIALIZING GRIDWATCH...</span>
            @else
                <span>LOADING...</span>
            @endif
        </div>
    </div>
</body>
</html>
