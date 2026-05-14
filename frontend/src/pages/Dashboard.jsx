import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch user data
        const userRes = await axios.get(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userRes.data);
        localStorage.setItem("user", JSON.stringify(userRes.data));

        // Fetch learning path progress
        const pathRes = await axios.get(`${API_BASE}/api/learning-paths`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Take the most recent path
        if (Array.isArray(pathRes.data) && pathRes.data.length > 0) {
          setPath(pathRes.data[0]);
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const progress = path ? path.progress : 0;

  // Circular Progress constants
  const size = 160;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative min-h-screen edu-bg overflow-hidden flex flex-col items-center pt-24 pb-12 px-4">
      <Navbar handleLogout={handleLogout} />
      {/* Background shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="accent-shape accent-shape-1"></div>
        <div className="accent-shape accent-shape-2"></div>
        <div className="accent-shape accent-shape-3"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h1 className="text-3xl font-bold text-slate-800">{user?.name}</h1>
              <p className="text-slate-500 font-medium">{user?.email}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 uppercase tracking-wider">
                  {user?.role || "Student"}
                </span>
                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 uppercase tracking-wider">
                  Verified Account
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/profile")}
              className="px-6 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm hover-lift"
            >
              Edit Profile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <i className="fas fa-briefcase"></i>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Career Aspiration</h2>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Target Role</p>
                    <p className="text-lg font-bold text-slate-700">
                      {user?.careerAspiration?.targetJobRole || "Not Set"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Target Sector</p>
                    <p className="text-lg font-bold text-slate-700">
                      {user?.careerAspiration?.targetSector || "Not Set"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  Your personalized learning path is being tailored based on these aspirations.
                  Keep your profile updated to get the most relevant skill recommendations.
                </p>
                <button
                  onClick={() => navigate("/learning-path")}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold transition shadow-lg hover-lift flex items-center justify-center gap-3"
                >
                  <i className="fas fa-rocket"></i>
                  View My Learning Path
                </button>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 flex flex-col items-center justify-center text-center space-y-6">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Path Progress</h2>

            <div className="relative flex items-center justify-center">
              {/* SVG Circular Progress */}
              <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Circle */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth={strokeWidth}
                />
                {/* Progress Circle */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke="url(#blue-gradient)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Inner Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                <span className="text-4xl font-bold text-slate-800">{progress}%</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest leading-none text-center px-4">
                  Modules<br />Completed
                </span>
              </div>
            </div>

            <div className="space-y-2 w-full pt-4">
              <p className="text-sm font-semibold text-slate-700">
                {path ? path.title : "No active path found"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;