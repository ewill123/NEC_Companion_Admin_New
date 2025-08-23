import React, { useContext } from "react";
import { ThemeContext } from "../themeContext";
import { FiCheckCircle } from "react-icons/fi";

export default function ReportDetails({
  report,
  departments,
  selectedDepartment,
  setSelectedDepartment,
  assignToDepartment,
  assigning,
}) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  if (!report) {
    return (
      <div className="no-report">
        Select a report to view details
        <style>{`
          .no-report {
            flex-basis: 40%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-style: italic;
            padding: 20px;
            border-radius: 12px;
            background: ${isDark ? "#222" : "#f8f8f8"};
            color: ${isDark ? "#999" : "#666"};
            box-shadow: ${isDark ? "0 4px 12px rgba(0,0,0,0.7)" : "0 4px 12px rgba(0,0,0,0.1)"};
          }
        `}</style>
      </div>
    );
  }

  return (
    <section className="report-details">
      <header className="header">
        <h2 className="title">
          {report.name ? `Report by ${report.name}` : `Report #${report.id}`}
        </h2>
        <span className={`status ${report.status?.toLowerCase() || "new"}`}>
          {report.status || "New"}
        </span>
      </header>

      {/* Assigned Department */}
      <div className="assigned-box">
        <strong>Assigned To:</strong>
        <span
          className={report.assigned_department ? "assigned" : "unassigned"}
        >
          {report.assigned_department || "Not Assigned"}
        </span>
      </div>

      {/* Basic Info */}
      <div className="meta-grid">
        {[
          ["Name", report.name],
          ["Email", report.email],
          ["Phone", report.phone],
          ["Created", new Date(report.created_at).toLocaleString()],
        ].map(([label, value]) => (
          <div key={label}>
            <label className="meta-label">{label}</label>
            <p className="meta-value">{value || <em>N/A</em>}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="description">
        <label>Description</label>
        <pre>{report.description || "No description provided."}</pre>
      </div>

      {/* Attachment */}
      {report.attachment_url && (
        <div className="attachment">
          <label>Attached Image</label>
          <a
            href={report.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={report.attachment_url} alt="Attachment" />
          </a>
        </div>
      )}

      {/* Department Assignment */}
      <div className="assign">
        <label htmlFor="assign-dept">Assign to Department</label>
        <select
          id="assign-dept"
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          disabled={assigning}
        >
          <option value="">Select department</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <button
          disabled={!selectedDepartment || assigning}
          onClick={assignToDepartment}
        >
          {assigning ? (
            "Assigning..."
          ) : (
            <>
              <FiCheckCircle /> Assign Department
            </>
          )}
        </button>
      </div>

      {/* Styles */}
      <style>{`
        .report-details {
          flex-basis: 40%;
          background: ${isDark ? "#121212" : "#fff"};
          color: ${isDark ? "#e0e0e0" : "#222"};
          padding: 24px;
          border-radius: 12px;
          box-shadow: ${
            isDark ? "0 6px 18px rgba(0,0,0,0.6)" : "0 6px 18px rgba(0,0,0,0.1)"
          };
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid ${isDark ? "#333" : "#ddd"};
          padding-bottom: 10px;
        }

        .title {
          font-size: 22px;
          font-weight: bold;
          color: ${isDark ? "#4bb2d6" : "#0077b6"};
        }

        .status {
          padding: 4px 12px;
          font-size: 13px;
          border-radius: 20px;
          color: #fff;
          text-transform: uppercase;
        }

        .status.assigned {
          background: #4caf50;
        }
        .status.new {
          background: ${isDark ? "#555" : "#888"};
        }

        .assigned-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .assigned-box span.assigned {
          color: #4caf50;
          font-weight: 700;
        }

        .assigned-box span.unassigned {
          color: #f44336;
          font-weight: 700;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .meta-label {
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          margin-bottom: 4px;
          display: block;
        }

        .meta-value {
          font-size: 15px;
        }

        .description label {
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 8px;
          display: block;
          color: ${isDark ? "#4bb2d6" : "#0077b6"};
        }

        .description pre {
          white-space: pre-wrap;
          background: ${isDark ? "#1e1e1e" : "#f3f9ff"};
          padding: 16px;
          border-radius: 8px;
          border: 1px solid ${isDark ? "#333" : "#ccd6f6"};
          font-size: 14px;
          color: ${isDark ? "#ddd" : "#334"};
        }

        .attachment label {
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 8px;
          display: block;
        }

        .attachment a {
          display: inline-block;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transition: transform 0.2s ease;
        }

        .attachment img {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
        }

        .assign label {
          font-weight: 700;
          font-size: 14px;
          display: block;
          margin-bottom: 6px;
        }

        .assign select {
          width: 100%;
          padding: 10px 12px;
          font-size: 14px;
          border-radius: 8px;
          border: 1.5px solid ${isDark ? "#4bb2d6" : "#0077b6"};
          background: ${isDark ? "#121212" : "#eef8ff"};
          color: ${isDark ? "#eee" : "#222"};
          margin-bottom: 12px;
        }

        .assign button {
          width: 100%;
          padding: 12px;
          font-size: 15px;
          font-weight: bold;
          border-radius: 8px;
          border: none;
          background: ${isDark ? "#3399ff" : "#0077b6"};
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.3s ease;
        }

        .assign button:disabled {
          background: #888;
          cursor: not-allowed;
        }
html[data-theme="dark"] .report-row[aria-selected="true"] {
  box-shadow: inset 0 0 0 1px #90caf9;
}

        .assign button:hover:not(:disabled) {
          background: ${isDark ? "#1a78e1" : "#005fa3"};
        }
      `}</style>
    </section>
  );
}
