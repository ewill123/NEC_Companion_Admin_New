"use client";
import React, { memo, useCallback, useMemo } from "react";

// ===== Memoized Report Row =====
const ReportRow = memo(
  ({ report, selectedReport, setSelectedReport, markAsRead, deleteReport }) => {
    const isSelected = selectedReport?.id === report.id;

    const handleSelect = useCallback(() => {
      setSelectedReport(report);
      if (!report.is_read) markAsRead(report.id);
    }, [report, markAsRead, setSelectedReport]);

    const handleDelete = useCallback(
      (e) => {
        e.stopPropagation();
        if (
          confirm(`Are you sure you want to delete report ID ${report.id}?`)
        ) {
          deleteReport(report);
        }
      },
      [deleteReport, report.id]
    );

    return (
      <tr
        onClick={handleSelect}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelect();
          }
        }}
        aria-selected={isSelected}
        role="row"
        className="report-row"
        style={{
          backgroundColor: isSelected ? "#1e88e5" : "#fff",
          color: isSelected ? "#fff" : "#222",
          cursor: "pointer",
        }}
      >
        <td>{report.id}</td>
        <td>{report.name || "-"}</td>
        <td>
          {report.assigned_department ? (
            report.assigned_department
          ) : (
            <em style={{ color: isSelected ? "#ccc" : "#999" }}>Unassigned</em>
          )}
        </td>
        <td>{report.status || "-"}</td>
        <td>{new Date(report.created_at).toLocaleString()}</td>
        <td
          style={{
            color: report.is_read
              ? isSelected
                ? "#bbb"
                : "#aaa"
              : isSelected
                ? "#ffeb3b"
                : "#f5a700",
            fontWeight: report.is_read ? "normal" : "700",
            textAlign: "center",
          }}
        >
          {report.is_read ? "✓" : "•"}
        </td>
        <td style={{ textAlign: "center" }}>
          <button
            onClick={handleDelete}
            className="delete-btn"
            title="Delete Report"
            aria-label={`Delete report ID ${report.id}`}
          >
            Delete
          </button>
        </td>
      </tr>
    );
  }
);

// ===== Upgraded Scrollable Report Table =====
export default function ReportTable({
  reports,
  selectedReport,
  setSelectedReport,
  markAsRead,
  deleteReport,
  loading,
}) {
  const memoizedRows = useMemo(() => {
    if (loading && reports.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="status-cell">
            Loading reports...
          </td>
        </tr>
      );
    }

    if (reports.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="status-cell">
            No reports found.
          </td>
        </tr>
      );
    }

    return reports.map((report) => (
      <ReportRow
        key={report.id}
        report={report}
        selectedReport={selectedReport}
        setSelectedReport={setSelectedReport}
        markAsRead={markAsRead}
        deleteReport={deleteReport}
      />
    ));
  }, [
    reports,
    selectedReport,
    markAsRead,
    deleteReport,
    setSelectedReport,
    loading,
  ]);

  return (
    <div
      className="report-table-container"
      role="region"
      aria-label="Reports table"
    >
      <table className="report-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Department</th>
            <th>Status</th>
            <th>Created At</th>
            <th aria-label="Unread">•</th>
            <th aria-label="Actions">Actions</th>
          </tr>
        </thead>
        <tbody>{memoizedRows}</tbody>
      </table>

      <style>{`
        .report-table-container {
          flex-basis: 60%;
          max-height: 750px; /* scrollable container */
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          background: #fff;
        }

        .report-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 1px; /* space between rows for separation */
          font-size: 14px;
        }

        thead {
          background-color: #388e3c;
          color: #fff;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        th, td {
          padding: 12px 10px;
          text-align: left;
        }

        tbody tr {
          border: 1px solid #eee;
          border-radius: 4px;
        }

        tbody tr:hover {
          background-color: #f5f5f5;
        }

        .status-cell {
          text-align: center;
          padding: 16px;
          font-style: italic;
          color: #888;
        }

        .delete-btn {
          background-color: #d32f2f;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .delete-btn:hover {
          background-color: #b71c1c;
        }

        html[data-theme="dark"] .report-row[aria-selected="true"] {
          background-color: #1e88e5;
          color: #ffffff;
        }

        html[data-theme="dark"] tbody tr:hover {
          background-color: #2f2f2f;
        }

        html[data-theme="dark"] .delete-btn {
          background-color: #e53935;
          color: #fff;
        }

        html[data-theme="dark"] .delete-btn:hover {
          background-color: #c62828;
        }
      `}</style>
    </div>
  );
}
