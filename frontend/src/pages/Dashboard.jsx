import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Welcome, {user.email}!
              </h1>
              <p className="text-gray-600">You are logged in successfully</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
            >
              Logout
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">User Info</h2>
              <p className="text-gray-600">Email: {user.email}</p>
              <p className="text-gray-600">User ID: {user.id}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-600">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Status</h2>
              <p className="text-gray-600">Status: <span className="font-semibold text-green-600">Verified ✓</span></p>
              <p className="text-gray-600">Access Level: User</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;