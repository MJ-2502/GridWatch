<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Barangay extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'municipality',
        'province',
        'cooperative', 
        'boundary_reference',
    ];

    public function gridNodes(): HasMany
    {
        return $this->hasMany(GridNode::class);
    }

    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class);
    }

    public function outageReports(): HasMany
    {
        return $this->hasMany(OutageReport::class);
    }
}
