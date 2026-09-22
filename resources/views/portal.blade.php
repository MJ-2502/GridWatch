@extends('layout')
@section('title', 'Outage status · GridWatch')
@section('page', 'portal')
@section('body_class', 'portal-body')

<!-- Pass the user data into the HTML dataset -->
<div id="app" data-page="portal" data-user="{{ json_encode(auth()->user()) }}"></div>
