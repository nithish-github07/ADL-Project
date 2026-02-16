import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const shapes = Array.from({ length: 3 }, (_, i) => ({ id: i }));
    setParticles(shapes);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen edu-bg overflow-hidden">
      {/* Background Accent Shapes */}
      <div className="absolute inset-0 z-0">
        <div className="accent-shape accent-shape-1"></div>
        <div className="accent-shape accent-shape-2"></div>
        <div className="accent-shape accent-shape-3"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex justify-center items-center p-4">
        <div className="w-full max-w-4xl">
          <div className="bg-white rounded-2xl card-shadow p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-slate-200">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold gradient-text">
                  Dashboard
                </h1>
                <p className="text-slate-600 text-sm">Welcome back to your learning path</p>
                <p className="text-blue-600 text-lg font-semibold mt-2">
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition font-semibold hover-lift"
              >
                Sign Out
              </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">
                  Account Information
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-slate-700">Email:</p>
                    <p className="text-slate-900 font-semibold break-all">{user.email}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-slate-700">User ID:</p>
                    <p className="text-slate-900 font-mono text-sm">{user.id?.slice(0, 8)}...</p>
                  </div>
                </div>
              </div>

              {/* Status Card */}
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

            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 rounded-xl p-8 border border-blue-200 text-center space-y-3">
              <p className="text-slate-900 text-lg font-semibold">
                Welcome to Your Learning Path Generator
              </p>
              <p className="text-slate-600 text-sm">
                Your account is verified and ready to use. Start exploring personalized learning paths tailored to your goals.
              </p>
            </div>

            {/* Footer */}
            <p className="text-center text-slate-500 text-xs">
              © 2026 Learning Path Generator. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;