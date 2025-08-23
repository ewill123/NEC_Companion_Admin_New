import React from "react";

export default function ReportFilters({
  departments,
  filterDepartment,
  setFilterDepartment,
  searchTerm,
  setSearchTerm,
  onClearFilters,
}) {
  return (
    <section
      style={{
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 16,
        alignItems: "center",
      }}
      aria-label="Report filters"
    >
      <label
        htmlFor="filter-department"
        style={{ fontWeight: "600", minWidth: 110 }}
      >
        Filter by Department:
      </label>
      <select
        id="filter-department"
        value={filterDepartment}
        onChange={(e) => setFilterDepartment(e.target.value)}
        style={{
          padding: 10,
          borderRadius: 6,
          border: "1px solid #ccc",
          fontSize: 16,
          minWidth: 180,
        }}
      >
        <option value="">All Departments</option>
        {departments.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <label
        htmlFor="search-reports"
        style={{ fontWeight: "600", minWidth: 70 }}
      >
        Search:
      </label>
      <input
        id="search-reports"
        type="text"
        placeholder="Search reports..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          padding: 10,
          borderRadius: 6,
          border: "1px solid #ccc",
          fontSize: 16,
          flexGrow: 1,
          minWidth: 200,
        }}
      />
      <button
        onClick={onClearFilters}
        style={{
          padding: "10px 16px",
          borderRadius: 6,
          border: "none",
          backgroundColor: "#f5a700",
          color: "#222",
          fontWeight: "700",
          cursor: "pointer",
          userSelect: "none",
        }}
        title="Clear filters"
      >
        Clear
      </button>
    </section>
  );
}
