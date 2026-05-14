import React from "react";
import { Link } from "react-router-dom";

const Navbar = ({ handleLogout }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="SkillBridge Logo" className="h-10 w-auto" />
          <span className="text-xl font-bold gradient-text hidden sm:block">SkillBridge</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-slate-600 hover:text-blue-600 font-medium transition">Dashboard</Link>
          <Link to="/profile" className="text-slate-600 hover:text-blue-600 font-medium transition">Profile</Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
