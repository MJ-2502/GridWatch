<?php 
require 'vendor/autoload.php'; 
$app = require_once 'bootstrap/app.php'; 
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class); 
$kernel->bootstrap(); 
$req = Illuminate\Http\Request::create('/api/public/reports', 'POST', ['municipality' => 'City of Sorsogon (Capital)', 'barangay' => 'Bibincahan', 'issueType' => 'Total Power Loss', 'remarks' => '']); 
try { 
    $res = app()->make('App\Http\Controllers\Api\PublicReportController')->store($req); 
    echo $res->getContent(); 
} catch(Illuminate\Validation\ValidationException $e) { 
    echo json_encode($e->errors()); 
} catch(Exception $e) { 
    echo $e->getMessage(); 
}
