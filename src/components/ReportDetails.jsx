import React, { useEffect, useState, useContext } from "react";
import { ThemeContext } from "../themeContext";
import { FiCheckCircle } from "react-icons/fi";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

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
  const [locationName, setLocationName] = useState("Loading location...");

  // Reverse geocode for location name
  useEffect(() => {
    if (report?.location?.latitude && report?.location?.longitude) {
      const { latitude, longitude } = report.location;
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      )
        .then((res) => res.json())
        .then((data) =>
          setLocationName(data?.display_name || "Unknown location")
        )
        .catch(() => setLocationName("Unable to fetch location"));
    }
  }, [report]);

  if (!report) {
    return (
      <div className="no-report">
        Select a report to view details
        <style>{`
          .no-report {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-style: italic;
            padding: 20px;
            border-radius: 8px;
            background: ${isDark ? "#222" : "#f8f8f8"};
            color: ${isDark ? "#999" : "#666"};
          }
        `}</style>
      </div>
    );
  }

  return (
    <section className="report-details">
      {/* Header */}
      <header className="header">
        <h2 className="title">
          {report.name ? `Report by ${report.name}` : `Report #${report.id}`}
        </h2>
        <span className={`status ${report.status?.toLowerCase() || "new"}`}>
          {report.status || "New"}
        </span>
      </header>

      {/* Map */}
      {report.location && (
        <div className="map-container">
          <MapContainer
            center={[report.location.latitude, report.location.longitude]}
            zoom={16}
            scrollWheelZoom={false}
            style={{
              width: "100%",
              height: "300px",
              borderRadius: "8px",
              marginBottom: "10px",
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker
              position={[report.location.latitude, report.location.longitude]}
            >
              <Popup>{locationName}</Popup>
            </Marker>
          </MapContainer>
          <p className="location-name">{locationName}</p>
        </div>
      )}

      {/* Details */}
      <div className="details">
        {/* Contact & Assignment Info */}
        <div className="info-row">
          <div className="info-item">
            <span className="label">Assigned To:</span>
            <span className="value">
              {report.assigned_department || "Not Assigned"}
            </span>
          </div>
          <div className="info-item">
            <span className="label">Email:</span>
            <span className="value">{report.email || "N/A"}</span>
          </div>
          <div className="info-item">
            <span className="label">Phone:</span>
            <span className="value">{report.phone || "N/A"}</span>
          </div>
          <div className="info-item">
            <span className="label">Created:</span>
            <span className="value">
              {new Date(report.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="card description-card">
          <h4>Description</h4>
          <pre className="description-content">
            {report.description || "No description provided."}
          </pre>
        </div>

        {/* Attachment */}
        {report.attachment_url && (
          <div className="card attachment-card">
            <h4>Attachment</h4>
            <a
              href={report.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={report.attachment_url} alt="Attachment" />
            </a>
          </div>
        )}

        {/* Assign Department */}
        <div className="card assign-card">
          <h4>Assign Department</h4>
          <div className="assign-controls">
            <select
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
                  <FiCheckCircle /> Assign
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .report-details {
          flex: 1;
          background: ${isDark ? "#121212" : "#fff"};
          color: ${isDark ? "#e0e0e0" : "#222"};
          padding: 20px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid ${isDark ? "#333" : "#ddd"};
          padding-bottom: 8px;
        }
        .title { font-size: 20px; font-weight: bold; color: ${isDark ? "#4bb2d6" : "#0077b6"}; }
        .status { padding: 4px 10px; font-size: 12px; border-radius: 16px; color: #fff; text-transform: uppercase; }
        .status.new { background: ${isDark ? "#555" : "#888"}; }
        .status.assigned { background: #4caf50; }

        .map-container { width: 100%; border-radius: 8px; overflow: hidden; }
        .location-name { font-size: 13px; color: ${isDark ? "#ccc" : "#555"}; margin-top: 4px; }

        .details { display: flex; flex-direction: column; gap: 16px; margin-top: 10px; }
        .info-row { display: flex; flex-wrap: wrap; gap: 16px; }
        .info-item { display: flex; gap: 6px; min-width: 180px; }
        .label { font-weight: 600; color: ${isDark ? "#aaa" : "#333"}; }
        .value { flex: 1; }

        .card { background: ${isDark ? "#1e1e1e" : "#f9f9f9"}; border-radius: 10px; padding: 12px 16px; box-shadow: ${isDark ? "0 2px 10px #00000050" : "0 2px 8px #ccc"}; display: flex; flex-direction: column; gap: 8px; }
        .card h4 { margin: 0; font-size: 14px; font-weight: 600; color: ${isDark ? "#4bb2d6" : "#0077b6"}; }

        .description-content { background: ${isDark ? "#121212" : "#fff"}; padding: 10px; border-radius: 6px; font-size: 14px; white-space: pre-wrap; color: ${isDark ? "#ddd" : "#222"}; overflow-x: auto; }

        .attachment-card img { width: 100%; max-width: 250px; border-radius: 6px; object-fit: cover; box-shadow: 0 2px 8px ${isDark ? "#000" : "#aaa"}; cursor: pointer; transition: transform 0.2s; }
        .attachment-card img:hover { transform: scale(1.05); }

        .assign-card .assign-controls { display: flex; gap: 8px; margin-top: 8px; }
        .assign-card select { padding: 6px 10px; border-radius: 6px; border: 1px solid ${isDark ? "#4bb2d6" : "#0077b6"}; background: ${isDark ? "#222" : "#eef8ff"}; color: ${isDark ? "#eee" : "#222"}; }
        .assign-card button { padding: 6px 12px; border-radius: 6px; border: none; background: ${isDark ? "#3399ff" : "#0077b6"}; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 4px; }
        .assign-card button:disabled { background: #888; cursor: not-allowed; }
      `}</style>
    </section>
  );
}
