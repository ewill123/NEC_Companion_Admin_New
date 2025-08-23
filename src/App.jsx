import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useCallback,
} from "react";
import { supabase } from "./supabaseClient";
import { getUserRole } from "./utils/getUserRole";

import Login from "./Login";
import ReportFilters from "./components/ReportFilters";
import ReportTable from "./components/ReportTable";
import ReportDetails from "./components/ReportDetails";
import BackgroundAnimation from "./components/BackgroundAnimation";
import ElectionDateManager from "./components/ElectionDateManager";
import NewsManager from "./components/NewsManager";
import AppConfigManager from "./components/AppConfigManager";
import { classifyDepartment } from "./utils/classifyDepartment";
import { Toaster, toast } from "react-hot-toast";
import { ThemeContext } from "./themeContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import VideoList from "./components/VideoList";
import VideoUploader from "./components/VideoUploader";
import { ref, deleteObject } from "firebase/storage";
import { storage } from "./firebaseConfig";
import {
  FaSun,
  FaMoon,
  FaPhoneAlt,
  FaChartBar,
  FaCalendarAlt,
  FaNewspaper,
  FaCogs,
  FaVideo,
  FaBars,
  FaSignOutAlt,
} from "react-icons/fa";
import CallCenterPanel from "./components/CallCenterPanel";

export default function App() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [reportsMap, setReportsMap] = useState(new Map());
  const [loadingReports, setLoadingReports] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [newCount, setNewCount] = useState(0);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const lastReportIds = useRef(new Set());
  const [role, setRole] = useState(getUserRole());

  const departments = [
    "Logistics",
    "Maintenance",
    "Security",
    "IT Support",
    "Human Resources",
  ];

  // --- Authentication ---
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (isMounted) setSession(session);
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // --- Fetch reports ---
  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const newMap = new Map();
      let unreadCount = 0;

      for (const report of data) {
        if (!report.assigned_department) {
          const department = classifyDepartment(report.description || "");
          if (department) {
            const { error: updateError } = await supabase
              .from("issues")
              .update({ assigned_department: department, status: "Assigned" })
              .eq("id", report.id);

            if (!updateError) {
              console.log(
                `🧠 Auto-assigned report ${report.id} to ${department}`
              );
              report.assigned_department = department;
              report.status = "Assigned";
            }
          }
        }

        if (!report.is_read) unreadCount++;
        newMap.set(report.id, report);
      }

      setReportsMap(newMap);
      setNewCount(unreadCount);
      lastReportIds.current = new Set(data.map((r) => r.id));
    } catch (error) {
      toast.error("Error fetching reports: " + error.message);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    setRole(getUserRole()); // refresh role whenever session changes
  }, [session]);

  // --- Fetch videos ---
  const fetchVideos = useCallback(async () => {
    setVideosLoading(true);
    try {
      const { data, error } = await supabase
        .from("education_videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      toast.error("Error fetching videos: " + error.message);
    } finally {
      setVideosLoading(false);
    }
  }, []);

  // --- Poll reports & load videos ---
  useEffect(() => {
    if (!session) return;

    fetchReports();
    if (activeTab === "videos") fetchVideos();

    const interval = setInterval(() => {
      fetchReports();
    }, 15000);

    return () => clearInterval(interval);
  }, [session, activeTab, fetchReports, fetchVideos]);

  // --- Mark report as read ---
  async function markAsRead(id) {
    try {
      const { error } = await supabase
        .from("issues")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;

      setReportsMap((prevMap) => {
        const newMap = new Map(prevMap);
        const report = newMap.get(id);
        if (report) newMap.set(id, { ...report, is_read: true });
        return newMap;
      });

      setNewCount((count) => Math.max(count - 1, 0));
    } catch (error) {
      toast.error("Error marking report as read: " + error.message);
    }
  }

  // --- Assign report ---
  async function assignReportToDepartment(reportId, department) {
    if (!department) {
      toast.error("Please select a department");
      return;
    }

    setAssigning(true);
    try {
      const { error } = await supabase
        .from("issues")
        .update({ assigned_department: department, status: "Assigned" })
        .eq("id", reportId);

      if (error) throw error;

      setReportsMap((prevMap) => {
        const newMap = new Map(prevMap);
        const report = newMap.get(reportId);
        if (report) {
          newMap.set(reportId, {
            ...report,
            assigned_department: department,
            status: "Assigned",
          });
        }
        return newMap;
      });

      setSelectedReport(null);
      setSelectedDepartment("");
      toast.success(`Report assigned to ${department}`);
    } catch (error) {
      toast.error("Error assigning report: " + error.message);
    } finally {
      setAssigning(false);
    }
  }

  // --- Delete report ---
  async function deleteReport(report) {
    if (!window.confirm(`Delete report ID ${report.id}?`)) return;

    try {
      const { error } = await supabase
        .from("issues")
        .delete()
        .eq("id", report.id);
      if (error) throw error;

      setReportsMap((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.delete(report.id);
        if (selectedReport?.id === report.id) setSelectedReport(null);
        return newMap;
      });

      toast.success("Report deleted");
    } catch (error) {
      toast.error("Delete failed: " + error.message);
    }
  }

  // --- Delete video ---
  async function deleteVideo(video) {
    if (!window.confirm(`Delete video "${video.title}"?`)) return;

    try {
      if (!video.firebase_path) {
        toast.error("Missing firebase_path. Cannot delete from Firebase.");
        return;
      }
      const storageRef = ref(storage, video.firebase_path);
      await deleteObject(storageRef);

      const { error } = await supabase
        .from("education_videos")
        .delete()
        .eq("id", video.id);
      if (error) throw error;

      setVideos((prev) => prev.filter((v) => v.id !== video.id));
      toast.success("Video deleted");
    } catch (err) {
      toast.error("Failed to delete: " + err.message);
    }
  }

  // --- Clear filters ---
  function onClearFilters() {
    setFilterDepartment("");
    setSearchTerm("");
  }

  // --- Logout ---
  async function handleLogout() {
    await supabase.auth.signOut();
    setSelectedReport(null);
    setSession(null);
  }

  // --- Filter and sort reports ---
  let reportsArray = Array.from(reportsMap.values());
  if (filterDepartment) {
    reportsArray = reportsArray.filter(
      (r) => r.assigned_department === filterDepartment
    );
  }
  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    reportsArray = reportsArray.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(lowerSearch)) ||
        (r.email && r.email.toLowerCase().includes(lowerSearch)) ||
        (r.phone && r.phone.toLowerCase().includes(lowerSearch)) ||
        (r.description && r.description.toLowerCase().includes(lowerSearch))
    );
  }
  reportsArray.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // --- Show login if no session ---
  if (!session) {
    return (
      <Login
        onLogin={() =>
          supabase.auth
            .getSession()
            .then(({ data }) => setSession(data.session))
        }
      />
    );
  }

  return (
    <>
      <BackgroundAnimation />
      <Toaster position="top-right" />
      <div
        className="app-container"
        style={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          backgroundColor: theme === "dark" ? "#121212" : "#f9fbfd",
          color: theme === "dark" ? "#eee" : "#222",
          overflow: "hidden",
        }}
      >
        {/* Sidebar */}
        <aside
          className={`sidebar ${sidebarOpen ? "open" : ""}`}
          style={{
            width: sidebarOpen ? 280 : 72,
            backgroundColor: theme === "dark" ? "#1a1a1a" : "#fff",
            borderRight: theme === "dark" ? "1px solid #333" : "1px solid #eee",
            display: "flex",
            flexDirection: "column",
            transition: "width 0.3s ease",
            boxShadow:
              theme === "dark"
                ? "2px 0 8px rgba(0,0,0,0.8)"
                : "2px 0 8px rgba(0,0,0,0.1)",
            zIndex: 1000,
          }}
        >
          {/* Header + toggle */}
          <div
            style={{
              padding: "1rem 1.5rem",
              borderBottom:
                theme === "dark" ? "1px solid #333" : "1px solid #eee",
              display: "flex",
              justifyContent: sidebarOpen ? "space-between" : "center",
              alignItems: "center",
            }}
          >
            {sidebarOpen && (
              <h2
                style={{
                  margin: 0,
                  fontWeight: "bold",
                  fontSize: 22,
                  userSelect: "none",
                  color: theme === "dark" ? "#fff" : "#222",
                }}
              >
                NEC Admin
              </h2>
            )}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
              style={{
                background: "none",
                border: "none",
                color: theme === "dark" ? "#eee" : "#222",
                cursor: "pointer",
                fontSize: 22,
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaBars />
            </button>
          </div>

          {/* Navigation */}
          <nav
            style={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              padding: "1rem 0",
              gap: 4,
            }}
          >
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 20,
                display: "flex",
                alignItems: "center",
                color: theme === "dark" ? "#f9fbfd" : "#121212",
                transition: "color 0.3s ease",
                padding: "0.5rem 1.5rem",
              }}
            >
              {theme === "light" ? <FaMoon /> : <FaSun />}
              {sidebarOpen && (
                <span style={{ marginLeft: 12 }}>
                  {theme === "light" ? "Dark Mode" : "Light Mode"}
                </span>
              )}
            </button>

            {[
              { key: "dashboard", label: "Dashboard", icon: <FaChartBar /> },
              {
                key: "election",
                label: "Election Date",
                icon: <FaCalendarAlt />,
              },
              { key: "news", label: "News", icon: <FaNewspaper /> },
              { key: "config", label: "App Config", icon: <FaCogs /> },
              { key: "callcenter", label: "Call Center", icon: <FaPhoneAlt /> },
              { key: "videos", label: "Videos", icon: <FaVideo /> },
            ].map(({ key, label, icon }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="nav-btn"
                  aria-current={active ? "page" : undefined}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "0.75rem 1.5rem",
                    fontWeight: active ? "700" : "500",
                    fontSize: 16,
                    color: active
                      ? theme === "dark"
                        ? "#4caf50"
                        : "#388e3c"
                      : theme === "dark"
                        ? "#ccc"
                        : "#555",
                    backgroundColor: active
                      ? theme === "dark"
                        ? "rgba(76, 175, 80, 0.15)"
                        : "rgba(56, 142, 60, 0.15)"
                      : "transparent",
                    borderLeft: active
                      ? `4px solid ${theme === "dark" ? "#4caf50" : "#388e3c"}`
                      : "4px solid transparent",
                    transition: "background-color 0.25s ease, color 0.25s ease",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    borderRadius: "0 8px 8px 0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    direction: sidebarOpen ? "ltr" : "rtl",
                    justifyContent: sidebarOpen ? "flex-start" : "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 22,
                      lineHeight: 1,
                      flexShrink: 0,
                      userSelect: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      color: active
                        ? theme === "dark"
                          ? "#4caf50"
                          : "#388e3c"
                        : theme === "dark"
                          ? "#aaa"
                          : "#777",
                    }}
                  >
                    {icon}
                  </span>
                  {sidebarOpen && <span>{label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: theme === "dark" ? "1px solid #333" : "1px solid #eee",
            }}
          >
            <button
              onClick={handleLogout}
              style={{
                all: "unset",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0.75rem 1rem",
                fontWeight: "700",
                fontSize: 16,
                color: "#fff",
                backgroundColor: "#d32f2f",
                borderRadius: 8,
                justifyContent: sidebarOpen ? "flex-start" : "center",
                userSelect: "none",
                transition: "background-color 0.25s ease",
                boxShadow:
                  "0 2px 4px rgba(211, 47, 47, 0.6), 0 0 6px rgba(211, 47, 47, 0.4)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#b71c1c")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#d32f2f")
              }
              aria-label="Logout"
            >
              <FaSignOutAlt
                style={{
                  fontSize: 20,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
              {sidebarOpen && "Logout"}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main
          style={{
            flexGrow: 1,
            overflowY: "auto",
            padding: 24,
            display: "flex",
            justifyContent: "center",
            backgroundColor: theme === "dark" ? "#121212" : "#f9fbfd",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 1200,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ flexGrow: 1 }}
                >
                  <ReportFilters
                    departments={departments}
                    filterDepartment={filterDepartment}
                    setFilterDepartment={setFilterDepartment}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    onClearFilters={onClearFilters}
                  />
                  <div style={{ display: "flex", gap: 24 }}>
                    <ReportTable
                      reports={reportsArray}
                      selectedReport={selectedReport}
                      setSelectedReport={(report) => {
                        setSelectedReport(report);
                        if (report && !report.is_read) markAsRead(report.id);
                      }}
                      markAsRead={markAsRead}
                      deleteReport={deleteReport}
                      loading={loadingReports}
                    />

                    <AnimatePresence mode="wait">
                      {selectedReport ? (
                        <motion.div
                          key={selectedReport.id}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 50 }}
                          transition={{ duration: 0.3 }}
                          style={{
                            flexBasis: "40%",
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            padding: 16,
                            backgroundColor:
                              theme === "dark" ? "#282828" : "#ffffff",
                            overflowY: "auto",
                            maxHeight: "75vh",
                          }}
                        >
                          <ReportDetails
                            report={selectedReport}
                            departments={departments}
                            selectedDepartment={selectedDepartment}
                            setSelectedDepartment={setSelectedDepartment}
                            assignToDepartment={() =>
                              assignReportToDepartment(
                                selectedReport.id,
                                selectedDepartment
                              )
                            }
                            assigning={assigning}
                          />
                        </motion.div>
                      ) : (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{
                            marginTop: 50,
                            fontSize: 16,
                            color: theme === "dark" ? "#888" : "#777",
                            textAlign: "center",
                            flexGrow: 1,
                          }}
                        >
                          Select a report to view details
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {activeTab === "callcenter" && (
                <motion.div
                  key="callcenter"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ flexGrow: 1 }}
                >
                  <CallCenterPanel />
                </motion.div>
              )}

              {activeTab === "election" && (
                <motion.div
                  key="election"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ flexGrow: 1 }}
                >
                  <ElectionDateManager />
                </motion.div>
              )}

              {activeTab === "news" && (
                <motion.div
                  key="news"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ flexGrow: 1 }}
                >
                  <NewsManager />
                </motion.div>
              )}

              {activeTab === "config" && (
                <motion.div
                  key="config"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ flexGrow: 1 }}
                >
                  <AppConfigManager />
                </motion.div>
              )}

              {activeTab === "videos" && (
                <motion.div
                  key="videos"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 32,
                  }}
                >
                  <VideoUploader onUploadComplete={fetchVideos} />
                  <VideoList
                    videos={videos}
                    loading={videosLoading}
                    onDeleteVideo={deleteVideo}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Theme CSS & Responsive */}
        <style>{`
          html[data-theme="light"] {
            --bg-color: #f9fbfd;
            --text-color: #121212;
            --header-bg: #ffffff;
            --header-border: #eee;
            --card-bg: #ffffff;
          }

          html[data-theme="dark"] {
            --bg-color: #121212;
            --text-color: #f9fbfd;
            --header-bg: #1a1a1a;
            --header-border: #333;
            --card-bg: #282828;
          }

          body {
            background-color: var(--bg-color);
            color: var(--text-color);
            transition: background-color 0.3s ease, color 0.3s ease;
          }

          .nav-btn:hover {
            background-color: ${theme === "dark" ? "#2a2a2a" : "#f0f0f0"};
          }
          .nav-btn:focus-visible {
            outline: 2px solid ${theme === "dark" ? "#4caf50" : "#388e3c"};
            outline-offset: 2px;
          }

          @media (max-width: 900px) {
            .sidebar {
              position: fixed !important;
              height: 100% !important;
              z-index: 10000 !important;
              transform: translateX(-100%);
              transition: transform 0.3s ease;
            }
            .sidebar.open {
              transform: translateX(0);
            }
            main {
              padding: 16px !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}
