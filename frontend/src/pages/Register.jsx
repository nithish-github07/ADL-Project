import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [particles, setParticles] = useState([]);
  const navigate = useNavigate();

  const API_URL = "http://localhost:5000/api/auth";

  useEffect(() => {
    const shapes = Array.from({ length: 3 }, (_, i) => ({ id: i }));
    setParticles(shapes);
  }, []);

  const checkPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[@$!%*?&]/.test(pwd)) strength++;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(checkPasswordStrength(pwd));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "from-slate-400 to-slate-500";
    if (passwordStrength <= 2) return "from-red-500 to-red-600";
    if (passwordStrength <= 3) return "from-amber-500 to-amber-600";
    return "from-green-500 to-green-600";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength < 4) {
      setError(
        "Password must contain uppercase, lowercase, number, and special character"
      );
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/register`, {
        email,
        password,
        confirmPassword,
      });

      setSuccess("OTP sent to your email. Please verify to complete registration.");
      setStep(2);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp) {
      setError("Please enter OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, {
        email,
        otp,
      });

      if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
        setSuccess("Account verified successfully! Redirecting to dashboard...");
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        setSuccess("Account verified. Please sign in to continue.");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/resend-otp`, {
        email,
      });
      setSuccess("OTP resent to your email");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
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
            <div className="bg-white rounded-2xl card-shadow p-8 space-y-6">
              {/* Header */}
              <div className="text-center space-y-3">
                <h1 className="text-5xl font-bold gradient-text leading-tight">
                  Create Account
                </h1>
                <p className="text-slate-600 text-sm">Start your learning journey</p>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Min 8 characters"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition text-lg"
                    >
                    {showPassword ? <i className = "fa-solid fa-eye-slash" ></i> : <i className = "fa-solid fa-eye"></i>}
                    </button>
                  </div>

                  {/* Password Strength Indicator Only */}
                  {password && (
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getPasswordStrengthColor()} transition-all duration-300`}
                          style={{ width: `${passwordStrength * 20}%` }}
                        ></div>
                      </div>
                      <p className={`text-xs font-semibold text-center ${
                        passwordStrength <= 2 ? "text-red-600" :
                        passwordStrength <= 3 ? "text-amber-600" :
                        "text-green-600"
                      }`}>
                        Strength: {getPasswordStrengthText()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition text-lg"
                    >
                      {showConfirmPassword ? <i className = "fa-solid fa-eye-slash"></i> : <i className = "fa-solid fa-eye"></i>}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-600 text-center">Passwords do not match</p>
                  )}
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
                      <span>Creating Account...</span>
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 h-px bg-slate-200"></div>
                <p className="text-slate-500 text-sm">Already registered?</p>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              {/* Login Link */}
              <Link
                to="/login"
                className="w-full py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition text-center hover-lift block"
              >
                Sign In
              </Link>

              
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="bg-white rounded-2xl card-shadow p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="text-5xl font-bold gradient-text leading-tight">
                Verify Email
              </h1>
              <p className="text-slate-600 text-sm">Enter the code sent to your email</p>
              <p className="text-slate-600 text-sm mt-2">
                Email: <span className="font-semibold text-slate-900">{email}</span>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* OTP Input */}
              <div className="space-y-2">
                <label htmlFor="otp" className="block text-sm font-semibold text-slate-700 text-center">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-lg text-center text-4xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition tracking-[0.5em]"
                  required
                />
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

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover-lift"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifying...</span>
                  </span>
                ) : (
                  "Verify Code"
                )}
              </button>
            </form>

            {/* Resend OTP */}
            <div className="text-center space-y-3">
              <p className="text-slate-600 text-sm">Did not receive code?</p>
              <button
                onClick={handleResendOtp}
                disabled={loading}
                className="text-blue-600 font-semibold hover:text-blue-700 underline disabled:opacity-50 text-sm transition"
              >
                {loading ? "Resending..." : "Resend Code"}
              </button>
            </div>

            {/* Back Link */}
            <button
              onClick={() => setStep(1)}
              className="w-full text-slate-600 hover:text-slate-900 transition font-medium text-sm text-center"
            >
              ← Change Email
            </button>

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

export default Register;