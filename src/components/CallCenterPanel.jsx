"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { supabase } from "../supabaseClient";
import { Toaster, toast } from "react-hot-toast";
import { FiFolder, FiFileText, FiX, FiPrinter, FiBell } from "react-icons/fi";
import { motion } from "framer-motion";

const COLORS = ["#4f46e5", "#3b82f6", "#10b981", "#f59e0b", "#f43f5e"];

export default function CallCenterAdminDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [view, setView] = useState("reports");
  const [folderedReports, setFolderedReports] = useState({});
  const [openFolder, setOpenFolder] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // ===== Fetch Reports =====
  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("call_center_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setReports(data || []);
    setLoading(false);
  }, []);

  // ===== Real-time subscription =====
  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel("call_center_reports_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "call_center_reports" },
        (payload) => {
          const updatedReport = payload.new;

          setReports((prev) => {
            const index = prev.findIndex((r) => r.id === updatedReport.id);
            if (index >= 0) {
              const newArr = [...prev];
              newArr[index] = updatedReport;
              return newArr;
            } else {
              return [updatedReport, ...prev];
            }
          });

          toast.success(
            payload.eventType === "INSERT"
              ? `New report from ${updatedReport.caller_name}`
              : `Updated report: ${updatedReport.caller_name}`
          );

          setNotifications((prev) => [
            {
              id: updatedReport.id,
              message:
                payload.eventType === "INSERT"
                  ? `New report from ${updatedReport.caller_name}`
                  : `Updated report: ${updatedReport.caller_name}`,
            },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchReports]);

  // ===== Folder reports by date =====
  useEffect(() => {
    const map = {};
    reports.forEach((r) => {
      const date = new Date(r.created_at).toLocaleDateString();
      if (!map[date]) map[date] = [];
      map[date].push(r);
    });
    setFolderedReports(map);
  }, [reports]);

  // ===== Graph Data =====
  const sexData = useMemo(() => {
    const arr = ["Male", "Female", "Other"].map((sex) => ({
      name: sex,
      value: reports.filter((r) => r.sex === sex).length,
    }));
    const unknownCount = reports.filter((r) => !r.sex).length;
    if (unknownCount > 0) arr.push({ name: "Unknown", value: unknownCount });
    return arr;
  }, [reports]);

  const incidentTypes = [
    "Polling Not Open",
    "Materials Not Arrived",
    "Missing On Roll",
    "No Security",
    "Tension / Unrest",
    "Campaigning at Center",
    "Hate Speech / Violence",
    "Overcrowding",
  ];

  const incidentData = useMemo(() => {
    return incidentTypes.map((type) => ({
      name: type,
      value: reports.filter((r) => r.incident_type === type).length,
    }));
  }, [reports]);

  const trendData = useMemo(() => {
    const map = {};
    reports.forEach((r) => {
      const d = new Date(r.created_at).toLocaleDateString();
      map[d] = (map[d] || 0) + 1;
    });
    return Object.keys(map)
      .sort()
      .map((d) => ({ date: d, reports: map[d] }));
  }, [reports]);

  // ===== Print functions =====
  const printReport = useCallback((report) => {
    if (!report) return;
    const html = generatePrintHTML(report);
    const w = window.open("", "_blank", "width=900,height=1200");
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }, []);

  const printAllReports = useCallback((reports) => {
    if (!reports || reports.length === 0) return;
    const html = reports
      .map((r, i) => generatePrintHTML(r, i === 0))
      .join('<div style="page-break-after:always;"></div>');
    const w = window.open("", "_blank", "width=900,height=1200");
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }, []);

  const generatePrintHTML = (report, includeHeader = true) => `
<html>
<head>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Times New Roman', serif; padding:0;margin:0; }
  .header { display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:2px solid #000;padding-bottom:8px; }
  .header img{ height:60px; }
  .header .center{ flex:1; text-align:center;}
  .header .center h1{ font-size:16pt;margin:0;font-weight:bold;}
  .header .center h2{ font-size:14pt;margin:2px 0;font-weight:normal;}
  .header .center h3{ font-size:12pt;margin:2px 0;font-weight:bold;text-decoration:underline;}
  .header .center p{ font-size:10pt;margin:2px 0;font-style:italic;}
  table{width:100%;border-collapse:collapse;margin-bottom:16px;}
  th,td{padding:8px 12px;border:1px solid #d1d5db;text-align:left;}
  th{background-color:#f3f4f6;}
  .status-pending{color:orange;font-weight:bold;}
  .status-resolved{color:green;font-weight:bold;}
</style>
</head>
<body>
  ${
    includeHeader
      ? `<div class="header">
          <img src="/seal.png" alt="Seal"/>
          <div class="center">
            <h1>Republic of Liberia</h1>
            <h2>NATIONAL ELECTIONS COMMISSION (NEC)</h2>
            <h3>CALL CENTER LOG</h3>
            <p>Sinkor, 9th and 10th Street, Monrovia</p>
          </div>
          <img src="/NEC.jpeg" alt="NEC Logo"/>
        </div>`
      : ""
  }
  <table>
    <tr><th>Name</th><td>${report.caller_name}</td></tr>
    <tr><th>Mobile</th><td>${report.caller_mobile || "—"}</td></tr>
    <tr><th>Sex</th><td>${report.sex || "Unknown"}</td></tr>
    <tr><th>Date</th><td>${new Date(report.date).toLocaleDateString()}</td></tr>
  </table>
  <table>
    <tr><th>Precinct</th><td>${report.precinct_name}</td></tr>
    <tr><th>Polling Place #</th><td>${report.polling_place_number || "—"}</td></tr>
    <tr><th>Location</th><td>${report.location || "—"}</td></tr>
  </table>
  <table>
    <tr><th>Incident Type</th><td>${report.incident_type || "—"}</td></tr>
    <tr><th>Description</th><td>${report.incident_other || "—"}</td></tr>
    <tr><th>Witness Role</th><td>${report.witness_role || "—"}</td></tr>
    <tr><th>Resolution</th><td>${report.resolution || "—"}</td></tr>
    <tr><th>Status</th><td class="${
      report.status?.toLowerCase() === "pending"
        ? "status-pending"
        : "status-resolved"
    }">${report.status || "Pending"}</td></tr>
  </table>
</body>
</html>
`;

  // ===== UI =====
  return (
    <div
      style={{
        padding: 32,
        fontFamily: "'Inter',sans-serif",
        background: "#f4f6f8",
      }}
    >
      <Toaster position="top-right" />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>
          Call Center Admin Dashboard
        </h1>

        {/* Notification bell */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 24,
            }}
          >
            <FiBell />
            {notifications.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  background: "red",
                  color: "#fff",
                  borderRadius: "50%",
                  padding: "2px 6px",
                  fontSize: 12,
                }}
              >
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 32,
                background: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                width: 300,
                maxHeight: 400,
                overflowY: "auto",
                zIndex: 1000,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      const report = reports.find((r) => r.id === n.id);
                      if (report) {
                        setSelectedReport(report);
                        setShowNotifications(false);
                        setNotifications((prev) =>
                          prev.filter((x) => x.id !== n.id)
                        );
                      }
                    }}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {n.message}
                  </div>
                ))
              ) : (
                <div style={{ padding: 12, color: "#666" }}>
                  No new notifications
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* View Switch */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => setView("reports")}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            backgroundColor: view === "reports" ? "#4f46e5" : "#e5e7eb",
            color: view === "reports" ? "#fff" : "#000",
          }}
        >
          Reports
        </button>
        <button
          onClick={() => setView("analytics")}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            backgroundColor: view === "analytics" ? "#4f46e5" : "#e5e7eb",
            color: view === "analytics" ? "#fff" : "#000",
          }}
        >
          Analytics
        </button>
      </div>

      {/* Render view */}
      {view === "reports" ? (
        openFolder ? (
          <FolderView
            date={openFolder}
            reports={folderedReports[openFolder]}
            onClose={() => setOpenFolder(null)}
            setSelectedReport={setSelectedReport}
            onPrintAll={printAllReports}
            onPrintSingle={printReport}
          />
        ) : (
          <FoldersGrid
            folderedReports={folderedReports}
            setOpenFolder={setOpenFolder}
          />
        )
      ) : (
        <AnalyticsView
          incidentData={incidentData}
          sexData={sexData}
          trendData={trendData}
          reports={reports}
        />
      )}

      {selectedReport && (
        <ReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onPrint={printReport}
        />
      )}
    </div>
  );
}

// ===== Folders Grid =====
function FoldersGrid({ folderedReports, setOpenFolder }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
        gap: 24,
      }}
    >
      {Object.keys(folderedReports).map((date, idx) => (
        <motion.div
          key={date}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          layout
        >
          <div
            onClick={() => setOpenFolder(date)}
            style={{
              backgroundColor: COLORS[idx % COLORS.length],
              color: "#fff",
              padding: "32px 16px",
              borderRadius: 16,
              cursor: "pointer",
              textAlign: "center",
              fontWeight: 700,
              fontSize: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
            }}
          >
            <FiFolder size={40} style={{ marginBottom: 8 }} />
            <span>{date}</span>
            <span style={{ fontSize: 14, marginTop: 4 }}>
              {folderedReports[date].length} Reports
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ===== Folder View =====
function FolderView({
  date,
  reports,
  onClose,
  setSelectedReport,
  onPrintAll,
  onPrintSingle,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>{date} Reports</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onPrintAll(reports)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              border: "none",
              borderRadius: 6,
              background: "#10b981",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <FiPrinter size={16} /> Print All
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "6px 12px",
              border: "none",
              borderRadius: 6,
              background: "#f43f5e",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <FiX size={20} />
          </button>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 16,
        }}
      >
        {reports.map((report) => {
          const isPending = report.status?.toLowerCase() === "pending";
          const bgColor = isPending ? "#fed7aa" : "#bbf7d0";
          return (
            <motion.div
              key={report.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: bgColor,
                padding: 16,
                borderRadius: 12,
                boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              onClick={() => setSelectedReport(report)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FiFileText size={24} />
                <span style={{ fontWeight: 600 }}>{report.caller_name}</span>
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontWeight: 600,
                  color: isPending ? "orange" : "green",
                }}
              >
                {report.status || "Pending"}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrintSingle(report);
                }}
                style={{
                  marginTop: 8,
                  padding: "4px 8px",
                  border: "none",
                  borderRadius: 6,
                  background: "#4f46e5",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FiPrinter size={14} /> Print
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ===== Analytics View (Upgraded) =====
function AnalyticsView({ incidentData, sexData, trendData, reports }) {
  const totalReports = reports.length;
  const pendingReports = reports.filter(
    (r) => r.status?.toLowerCase() === "pending"
  ).length;
  const resolvedReports = reports.filter(
    (r) => r.status?.toLowerCase() === "resolved"
  ).length;

  const mostCommonIncident =
    incidentData.reduce(
      (prev, curr) => (curr.value > prev.value ? curr : prev),
      { value: 0, name: "N/A" }
    ).name || "N/A";

  // ===== Additional Metrics =====
  const reportsBySex = ["Male", "Female", "Other", "Unknown"].map((sex) => ({
    sex,
    count:
      sex === "Unknown"
        ? reports.filter((r) => !r.sex).length
        : reports.filter((r) => (r.sex || "").trim() === sex).length,
  }));

  const reportsByPrecinct = {};
  reports.forEach((r) => {
    const p = r.precinct_name || "Unknown";
    reportsByPrecinct[p] = (reportsByPrecinct[p] || 0) + 1;
  });

  const reportsWithoutMobile = reports.filter((r) => !r.caller_mobile).length;

  const reportsWithOtherIncidents = reports.filter(
    (r) => r.incident_other && r.incident_other.trim() !== ""
  ).length;

  const witnessRoles = {};
  reports.forEach((r) => {
    const role = r.witness_role || "Unknown";
    witnessRoles[role] = (witnessRoles[role] || 0) + 1;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: 24,
        }}
      >
        <StatCard title="Total Reports" value={totalReports} color="#4f46e5" />
        <StatCard
          title="Pending Reports"
          value={pendingReports}
          color="#f59e0b"
        />
        <StatCard
          title="Resolved Reports"
          value={resolvedReports}
          color="#10b981"
        />
        <StatCard
          title="Most Common Incident"
          value={mostCommonIncident}
          color="#3b82f6"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(350px,1fr))",
          gap: 32,
        }}
      >
        {/* Incident Types Chart */}
        <div style={chartBoxStyle}>
          <h2>Incident Types</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incidentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]}>
                {incidentData.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sex Distribution Chart */}
        <div style={chartBoxStyle}>
          <h2>Sex Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sexData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip formatter={(value, name) => [`${value}`, name]} />
              <Bar dataKey="value">
                {sexData.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={COLORS[idx % COLORS.length]}
                    radius={[8, 8, 8, 8]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Chart */}
        <div style={{ ...chartBoxStyle, gridColumn: "1 / -1" }}>
          <h2>Report Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="reports"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expanded Conclusion Report */}
      <div style={chartBoxStyle}>
        <h2>Conclusion Report (Chats Summary)</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Metric</th>
              <th style={tableHeaderStyle}>Count</th>
              <th style={tableHeaderStyle}>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {/* Status Summary */}
            <tr>
              <td style={tableCellStyle}>Pending</td>
              <td style={tableCellStyle}>{pendingReports}</td>
              <td style={tableCellStyle}>
                {totalReports
                  ? ((pendingReports / totalReports) * 100).toFixed(1)
                  : 0}
                %
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Resolved</td>
              <td style={tableCellStyle}>{resolvedReports}</td>
              <td style={tableCellStyle}>
                {totalReports
                  ? ((resolvedReports / totalReports) * 100).toFixed(1)
                  : 0}
                %
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Total Reports</td>
              <td style={tableCellStyle}>{totalReports}</td>
              <td style={tableCellStyle}>100%</td>
            </tr>

            {/* Reports by Sex */}
            <tr>
              <td style={tableCellStyle} colSpan={3}>
                <strong>Reports by Sex</strong>
              </td>
            </tr>
            {reportsBySex.map((s) => (
              <tr key={s.sex}>
                <td style={tableCellStyle}>{s.sex}</td>
                <td style={tableCellStyle}>{s.count}</td>
                <td style={tableCellStyle}>
                  {totalReports
                    ? ((s.count / totalReports) * 100).toFixed(1)
                    : 0}
                  %
                </td>
              </tr>
            ))}

            {/* Reports without Mobile */}
            <tr>
              <td style={tableCellStyle} colSpan={3}>
                <strong>Reports without Mobile</strong>
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle} colSpan={2}>
                {reportsWithoutMobile}
              </td>
              <td style={tableCellStyle}>
                {totalReports
                  ? ((reportsWithoutMobile / totalReports) * 100).toFixed(1)
                  : 0}
                %
              </td>
            </tr>

            {/* Reports with Other Incidents */}
            <tr>
              <td style={tableCellStyle} colSpan={3}>
                <strong>Reports with Other Incidents</strong>
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle} colSpan={2}>
                {reportsWithOtherIncidents}
              </td>
              <td style={tableCellStyle}>
                {totalReports
                  ? ((reportsWithOtherIncidents / totalReports) * 100).toFixed(
                      1
                    )
                  : 0}
                %
              </td>
            </tr>

            {/* Reports by Precinct */}
            <tr>
              <td style={tableCellStyle} colSpan={3}>
                <strong>Reports by Precinct</strong>
              </td>
            </tr>
            {Object.entries(reportsByPrecinct).map(([p, c]) => (
              <tr key={p}>
                <td style={tableCellStyle}>{p}</td>
                <td style={tableCellStyle}>{c}</td>
                <td style={tableCellStyle}>
                  {totalReports ? ((c / totalReports) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}

            {/* Witness Roles */}
            <tr>
              <td style={tableCellStyle} colSpan={3}>
                <strong>Witness Roles</strong>
              </td>
            </tr>
            {Object.entries(witnessRoles).map(([r, c]) => (
              <tr key={r}>
                <td style={tableCellStyle}>{r}</td>
                <td style={tableCellStyle}>{c}</td>
                <td style={tableCellStyle}>
                  {totalReports ? ((c / totalReports) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== Styles & Helper Components =====
const chartBoxStyle = {
  background: "#fff",
  padding: 24,
  borderRadius: 16,
  boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
};

const tableHeaderStyle = {
  padding: 8,
  borderBottom: "2px solid #ddd",
  textAlign: "left",
  fontWeight: 600,
};

const tableCellStyle = {
  padding: 8,
  borderBottom: "1px solid #eee",
};

function StatCard({ title, value, color }) {
  return (
    <div
      style={{
        background: color,
        color: "#fff",
        padding: 24,
        borderRadius: 16,
        boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <motion.div
        initial={{ count: 0 }}
        animate={{ count: typeof value === "number" ? value : 0 }}
        transition={{ duration: 1.5 }}
      >
        {({ count }) => (typeof value === "number" ? Math.floor(count) : value)}
      </motion.div>
      <div style={{ marginTop: 8, fontSize: 16 }}>{title}</div>
    </div>
  );
}

// ===== Report Modal =====
function ReportModal({ report, onClose, onPrint }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          width: "90%",
          maxWidth: 800,
          maxHeight: "90%",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            border: "none",
            background: "none",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          <FiX />
        </button>
        <h2>
          {report.caller_name} - {report.incident_type || "Incident"}
        </h2>
        <table
          style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}
        >
          {Object.entries(report).map(([key, value]) => (
            <tr key={key}>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                  padding: "6px 0",
                }}
              >
                {key}
              </th>
              <td style={{ borderBottom: "1px solid #ddd", padding: "6px 0" }}>
                {value || "—"}
              </td>
            </tr>
          ))}
        </table>
        <button
          onClick={() => onPrint(report)}
          style={{
            marginTop: 16,
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            background: "#4f46e5",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FiPrinter size={16} /> Print
        </button>
      </motion.div>
    </div>
  );
}
