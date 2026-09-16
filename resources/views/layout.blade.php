<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'GridWatch')</title>
    <meta name="description" content="@yield('description', 'Live power outage status across SORECO I and SORECO II coverage areas.')">
    @vite(['resources/js/app.jsx'])
</head>
<body class="@yield('body_class', '')">
    <div id="app" data-page="@yield('page')"></div>
</body>
</html>
