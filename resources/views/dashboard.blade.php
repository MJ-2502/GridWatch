@extends('layout')
@section('title', 'Dispatcher console · GridWatch')
@section('page', 'dashboard')
<script>
    window.AuthUser = @json(auth()->user());
</script>