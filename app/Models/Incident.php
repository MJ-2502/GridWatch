<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Incident extends Model
{
    use HasFactory;

    protected $fillable = [
        'grid_node_id',
        'barangay_id',
        'reported_by',
        'verified_by',
        'reference',
        'title',
        'description',
        'status',
        'cause',
        'latitude',
        'longitude',
        'started_at',
        'estimated_restoration_at',
        'restored_at',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'started_at' => 'datetime',
            'estimated_restoration_at' => 'datetime',
            'restored_at' => 'datetime',
        ];
    }

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    public function gridNode(): BelongsTo
    {
        return $this->belongsTo(GridNode::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function outageReports(): HasMany
    {
        return $this->hasMany(OutageReport::class);
    }
}
