import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );
  const navigate = useNavigate();
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const shapes = Array.from({ length: 3 }, (_, i) => ({ id: i }));
    setParticles(shapes);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
    axios
      .get(`${API_BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      })
      .catch((err) => {
        console.error("Failed to fetch profile:", err);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen edu-bg overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="accent-shape accent-shape-1"></div>
        <div className="accent-shape accent-shape-2"></div>
        <div className="accent-shape accent-shape-3"></div>
      </div>

      <div className="relative z-10 min-h-screen flex justify-center items-center p-4">
        <div className="w-full max-w-4xl">
          <div className="bg-white rounded-2xl card-shadow p-8 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-slate-200">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold gradient-text">
                  Dashboard
                </h1>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/profile")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition font-semibold hover-lift"
                >
                  Sign Out
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">
                  Account Information
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-slate-700">Name:</p>
                    <p className="text-slate-900 font-semibold break-all">
                      {user?.name || "-"}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-slate-700">Career Aspiration:</p>
                    <p className="text-slate-900 font-semibold text-sm">
                      {user?.careerAspiration?.targetJobRole ||
                        user?.careerAspiration?.targetSector ||
                        "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <h2 className="text-2xl font-bold text-green-900 mb-4">
                  Account Status
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-slate-700">Verification:</p>
                    <p className="text-green-700 font-bold">✓ Verified</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-slate-700">Access Level:</p>
                    <p className="text-green-700 font-bold">User</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 rounded-xl p-8 border border-blue-200 text-center space-y-3">
              <p className="text-slate-900 text-lg font-semibold">
                Welcome to Your Learning Path Generator
              </p>
              <p className="text-slate-600 text-sm">
                Start exploring personalized learning paths tailored to your
                goals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;