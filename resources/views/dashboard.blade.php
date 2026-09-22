@extends('layout')
@section('title', 'Dispatcher console · GridWatch')
@section('page', 'dashboard')

<!-- Pass the user data into the HTML dataset -->
<div id="app" data-page="dashboard" data-user="{{ json_encode(auth()->user()) }}"></div>