import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [particles, setParticles] = useState([]);
  const navigate = useNavigate();

  const API_URL = "http://localhost:5000/api/auth";

  useEffect(() => {
    const shapes = Array.from({ length: 3 }, (_, i) => ({ id: i }));
    setParticles(shapes);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please provide email and password");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      setSuccess("Login successful! Redirecting...");
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
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
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl card-shadow p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-bold gradient-text leading-tight p-1">
                Sign In
              </h1>
              <p className="text-slate-600 text-sm mt-0">Access your learning path</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition text-lg"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
                  <p className="font-medium text-sm">⚠️ {error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg">
                  <p className="font-medium text-sm">✓ {success}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover-lift"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing In...</span>
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 h-px bg-slate-200"></div>
              <p className="text-slate-500 text-sm">New User?</p>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            {/* Register Link */}
            <Link
              to="/register"
              className="w-full py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition text-center hover-lift block"
            >
              Create Account
            </Link>

          
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
