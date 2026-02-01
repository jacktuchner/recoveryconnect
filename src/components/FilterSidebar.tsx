"use client";

import { PROCEDURE_TYPES, AGE_RANGES, ACTIVITY_LEVELS, RECORDING_CATEGORIES } from "@/lib/constants";

interface FilterSidebarProps {
  filters: {
    procedure: string;
    ageRange: string;
    activityLevel: string;
    category: string;
  };
  onFilterChange: (key: string, value: string) => void;
  showCategory?: boolean;
}

export default function FilterSidebar({ filters, onFilterChange, showCategory = true }: FilterSidebarProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Procedure</h3>
        <select
          value={filters.procedure}
          onChange={(e) => onFilterChange("procedure", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="">All Procedures</option>
          {PROCEDURE_TYPES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Age Range</h3>
        <select
          value={filters.ageRange}
          onChange={(e) => onFilterChange("ageRange", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="">Any Age</option>
          {AGE_RANGES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Activity Level</h3>
        <select
          value={filters.activityLevel}
          onChange={(e) => onFilterChange("activityLevel", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="">Any Level</option>
          {ACTIVITY_LEVELS.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      {showCategory && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Category</h3>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange("category", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">All Categories</option>
            {RECORDING_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {(filters.procedure || filters.ageRange || filters.activityLevel || filters.category) && (
        <button
          onClick={() => {
            onFilterChange("procedure", "");
            onFilterChange("ageRange", "");
            onFilterChange("activityLevel", "");
            onFilterChange("category", "");
          }}
          className="text-sm text-teal-600 hover:text-teal-700"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
