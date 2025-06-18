"use client";

import { SearchIcon } from "@/icons";
import React from "react";
import Input from "../ui/input/Input";
import Select from "../ui/select/Select";

interface ScheduleSearchFilters {
  fromDate: string;
  toDate: string;
  staff: string;
  client: string;
  viewType: "individual" | "group-by-staff" | "group-by-client";
}

interface ScheduleSearchFiltersProps {
  filters: ScheduleSearchFilters;
  onFiltersChange: (filters: ScheduleSearchFilters) => void;
  supervisorOptions: Array<{ value: string; label: string }>;
  clientOptions: Array<{ value: string; label: string }>;
}

export default function ScheduleSearchFilters({
  filters,
  onFiltersChange,
  supervisorOptions,
  clientOptions
}: ScheduleSearchFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 mb-6">
        <SearchIcon className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Search</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Date Inputs */}
        <div className="space-y-4">
          <Input
            type="date"
            label="From"
            value={filters.fromDate}
            onChange={(e) => handleFilterChange("fromDate", e.target.value)}
          />
          <Input
            type="date"
            label="To"
            value={filters.toDate}
            onChange={(e) => handleFilterChange("toDate", e.target.value)}
          />
        </div>

        {/* Second Column - Staff and Client Dropdowns */}
        <div className="space-y-4">
          <Select
            label="All Staff"
            options={supervisorOptions}
            value={filters.staff}
            onChange={(e) => handleFilterChange("staff", e.target.value)}
          />
          <Select
            label="All Clients"
            options={clientOptions}
            value={filters.client}
            onChange={(e) => handleFilterChange("client", e.target.value)}
          />
        </div>

        {/* Third Column - View Type Radio Buttons */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
              View Type
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="viewType"
                  value="individual"
                  checked={filters.viewType === "individual"}
                  onChange={(e) => handleFilterChange("viewType", e.target.value)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Individual</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="viewType"
                  value="group-by-staff"
                  checked={filters.viewType === "group-by-staff"}
                  onChange={(e) => handleFilterChange("viewType", e.target.value)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Group By Staff</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="viewType"
                  value="group-by-client"
                  checked={filters.viewType === "group-by-client"}
                  onChange={(e) => handleFilterChange("viewType", e.target.value)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Group By Client</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 