<?php

namespace App\Services;

class QueryBuilder
{
    protected $supabase;
    protected $table;
    protected $filters = [];
    protected $selectColumns = '*';

    public function __construct(SupabaseService $supabase, $table)
    {
        $this->supabase = $supabase;
        $this->table = $table;
    }

    public function select($columns)
    {
        $this->selectColumns = $columns;
        return $this;
    }

    public function eq($column, $value)
    {
        $this->filters[$column] = "eq.{$value}";
        return $this;
    }

    public function single()
    {
        $response = $this->supabase->select(
            $this->table,
            $this->selectColumns,
            array_map(function ($value) {
                return $value;
            }, $this->filters)
        );

        return $response;
    }
}