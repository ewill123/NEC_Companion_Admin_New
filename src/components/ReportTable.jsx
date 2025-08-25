"use client";
import React, { memo, useCallback, useMemo, useRef, useEffect } from "react";
import { FiTrash2 } from "react-icons/fi";

// ===== Memoized Row =====
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
        deleteReport(report);
      },
      [deleteReport, report]
    );

    const statusColors = {
      new: "#888",
      "in-progress": "#f5a700",
      resolved: "#4caf50",
      assigned: "#2196f3",
    };

    return (
      <tr
        onClick={handleSelect}
        tabIndex={0}
        aria-selected={isSelected}
        className="report-row"
        style={{
          backgroundColor: isSelected ? "#1e88e5" : "#fff",
          color: isSelected ? "#fff" : "#222",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <td style={{ fontWeight: 700 }}>{report.name || "-"}</td>
        <td>
          {report.assigned_department || (
            <em style={{ color: "#999" }}>Unassigned</em>
          )}
        </td>
        <td>
          <span
            style={{
              backgroundColor:
                statusColors[report.status?.toLowerCase()] || "#888",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: "12px",
              fontWeight: 600,
              textTransform: "capitalize",
              fontSize: "12px",
            }}
          >
            {report.status || "New"}
          </span>
        </td>
        <td>{new Date(report.created_at).toLocaleString()}</td>
        <td style={{ textAlign: "center" }}>
          <span
            style={{
              display: "inline-block",
              width: 18,
              height: 18,
              borderRadius: "50%",
              backgroundColor: report.is_read ? "#aaa" : "#f5a700",
              fontWeight: 700,
              lineHeight: "18px",
              color: "#fff",
              textAlign: "center",
              animation: !report.is_read ? "pulse 1.5s infinite" : "none",
            }}
            title={report.is_read ? "Read" : "Unread"}
          >
            {report.is_read ? "✓" : "!"}
          </span>
        </td>
        <td style={{ textAlign: "center" }}>
          <button
            onClick={handleDelete}
            className="delete-btn"
            title="Delete Report"
          >
            <FiTrash2 />
          </button>
        </td>
      </tr>
    );
  }
);

// ===== Main Table =====
export default function ReportTable({
  reports,
  selectedReport,
  setSelectedReport,
  markAsRead,
  deleteReport,
  loading,
}) {
  const tableBodyRef = useRef(null);

  const unreadCount = useMemo(
    () => reports.filter((r) => !r.is_read).length,
    [reports]
  );

  const deleteAllReports = useCallback(async () => {
    if (reports.length === 0) return;
    if (
      !confirm(`Are you sure you want to delete ALL ${reports.length} reports?`)
    )
      return;

    try {
      await Promise.all(reports.map((report) => deleteReport(report, true)));
      alert("All reports have been deleted!");
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting reports.");
    }
  }, [reports, deleteReport]);

  const memoizedRows = useMemo(() => {
    if (loading && reports.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="status-cell">
            Loading reports...
          </td>
        </tr>
      );
    }

    if (reports.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="status-cell">
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

  useEffect(() => {
    if (tableBodyRef.current) {
      tableBodyRef.current.scrollTop = tableBodyRef.current.scrollTop;
    }
  }, [memoizedRows]);

  return (
    <div className="report-table-wrapper">
      <div className="unread-badge">
        <div>
          Unread Reports: <span className="count">{unreadCount}</span>
        </div>
        <button className="delete-all-btn" onClick={deleteAllReports}>
          Delete All
        </button>
      </div>

      <div className="report-table-container">
        <table className="report-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Status</th>
              <th>Created At</th>
              <th aria-label="Unread">•</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody ref={tableBodyRef}>{memoizedRows}</tbody>
        </table>
      </div>

      <style>{`
        .report-table-wrapper {
          position: relative;
          flex-basis: 60%;
          max-height: 800px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        }
        .unread-badge {
          position: sticky;
          top: 0;
          z-index: 2;
          background-color: #f5a700;
          color: #fff;
          font-weight: 700;
          padding: 10px 16px;
          border-bottom: 1px solid #ddd;
          font-size: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .unread-badge .count {
          background-color: #d32f2f;
          color: #fff;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 700;
        }
        .delete-all-btn {
          background-color: #d32f2f;
          color: #fff;
          border: none;
          padding: 6px 14px;
          font-weight: 700;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .delete-all-btn:hover { background-color: #b71c1c; }
        .report-table-container { max-height: 700px; overflow-y: auto; }
        .report-table { width: 100%; border-collapse: separate; border-spacing: 0 1px; font-size: 14px; }
        thead { background-color: #388e3c; color: #fff; position: sticky; top: 0; z-index: 1; }
        th, td { padding: 12px 10px; text-align: left; }
        tbody tr { border: 1px solid #eee; border-radius: 4px; transition: all 0.2s ease; }
        tbody tr:hover { background-color: #f5f5f5; }
        .status-cell { text-align: center; padding: 16px; font-style: italic; color: #888; }
        .delete-btn { background-color: #d32f2f; color: white; border: none; border-radius: 6px; padding: 6px 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; }
        .delete-btn:hover { background-color: #b71c1c; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.3); opacity: 0.6 } 100% { transform: scale(1); opacity: 1 } }
      `}</style>
    </div>
  );
}
