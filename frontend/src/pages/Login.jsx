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

      localStorage.setItem("token", response.data.token);

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
        <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Left Side: Logo and Slogan */}
          <div className="flex-1 text-center md:text-left space-y-6 animate-fade-in order-2 md:order-1">
            <img
              src="/fullLogo.png"
              alt="SkillBridge Logo"
              className="w-full max-w-lg mx-auto drop-shadow-2xl"
            />
          </div>

          {/* Right Side: Sign-in Card */}
          <div className="w-full max-w-md order-1 md:order-2">
            {/* Card */}
            <div className="bg-white rounded-2xl card-shadow p-8 space-y-6">
              {/* Header */}
              <div className="text-center md:text-left space-y-3">
                <h1 className="text-4xl font-bold gradient-text leading-tight p-1">
                  Sign In
                </h1>
                <p className="text-slate-600 text-sm mt-0 font-medium">Welcome back! Access your learning journey.</p>
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
                      {showPassword ? <i className = "fa-solid fa-eye-slash"></i> : <i className = "fa-solid fa-eye"></i>}
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
                      <div className="relative flex items-center justify-center w-6 h-6">
                        <div className="absolute w-full h-full rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                        <img src="/logo.png" alt="Loading" className="relative z-10 w-3 h-3 object-contain" />
                      </div>
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
    </div>
  );
};

export default Login;
