import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const LearningPath = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPath();
  }, [id]);

  const fetchPath = async () => {
    try {
      setLoading(true);
      const endpoint = id
        ? `${API_BASE}/api/learning-paths/${id}`
        : `${API_BASE}/api/learning-paths`;

      console.log("Fetching from:", endpoint);

      let res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // If fetching all, take the first one (most recent)
      let data = Array.isArray(res.data) ? res.data[0] : res.data;

      if (data && (!data.modules || data.modules.length === 0) && data._id) {
        console.log("Got summary, fetching full path details for:", data._id);
        const detailRes = await axios.get(`${API_BASE}/api/learning-paths/${data._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        data = detailRes.data;
      }

      console.log("Final Path Data:", data);

      if (!data) {
        setError("No learning path found. Please complete your profile to generate one.");
      } else {
        setPath(data);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Failed to load learning path.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (moduleId, currentState) => {
    try {
      const res = await axios.post(
        `${API_BASE}/api/learning-paths/${path._id}/progress`,
        { moduleId, completed: !currentState },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPath(res.data.path);
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) return (
    <div className="min-h-screen edu-bg flex items-center justify-center">
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Rotating border */}
        <div className="absolute w-full h-full rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        {/* Logo in the center */}
        <img 
          src="/logo.png" 
          alt="Loading..." 
          className="relative z-10 w-12 h-12 object-contain"
        />
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen edu-bg flex items-center justify-center p-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button
          onClick={() => navigate("/profile")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Go to Profile
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen edu-bg pb-20 pt-20">
      <Navbar handleLogout={handleLogout} />
      {/* Background shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="accent-shape accent-shape-1"></div>
        <div className="accent-shape accent-shape-2"></div>
        <div className="accent-shape accent-shape-3"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-6 pt-12">
        {/* Header Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-12 border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-4 flex-1">
              <h1 className="text-4xl font-extrabold gradient-text">{path.title}</h1>
              <p className="text-slate-600 text-lg leading-relaxed">{path.description}</p>

              <div className="flex flex-wrap gap-2 pt-2">
                {path.goalSkills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 min-w-[240px] space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Status</span>
                <span className={`font-bold capitalize ${path.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                  }`}>{path.status.replace('-', ' ')}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">OVERALL PROGRESS</span>
                  <span className="text-blue-600">{path.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-1000 ease-out"
                    style={{ width: `${path.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Current</p>
                  <p className="text-sm font-bold text-slate-700 capitalize">{path.currentLevel}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Target</p>
                  <p className="text-sm font-bold text-blue-600 capitalize">{path.targetLevel}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Timeline</p>
                <p className="font-semibold text-slate-700">{path.timeline} Days</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600">
                <i className="fas fa-clock"></i>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Start Date</p>
                <p className="font-semibold text-slate-700">{new Date(path.startDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <i className="fas fa-flag-checkered"></i>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Expected End</p>
                <p className="font-semibold text-slate-700">{new Date(path.expectedEndDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Section */}
        <div className="space-y-0 flex flex-col items-center">
          {path.modules.map((module, index) => (
            <React.Fragment key={module.moduleId}>
              {/* Module Box */}
              <div className={`group relative w-full bg-white rounded-2xl p-6 border transition-all duration-300 ${module.completed
                  ? 'border-green-200 bg-green-50/30'
                  : 'border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md'
                }`}>
                <div className="flex items-start gap-6">
                  {/* Checkbox */}
                  <div className="pt-1">
                    <button
                      onClick={() => handleToggleComplete(module.moduleId, module.completed)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${module.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-slate-300 hover:border-blue-500 bg-white'
                        }`}
                    >
                      {module.completed && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                      <h3 className={`text-xl font-bold transition-all ${module.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                        }`}>
                        {module.title}
                      </h3>
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-md">
                        {module.duration} HOURS
                      </span>
                    </div>

                    <p className={`text-sm leading-relaxed mb-4 transition-all ${module.completed ? 'text-slate-400 opacity-60' : 'text-slate-600'
                      }`}>
                      {module.description}
                    </p>

                    {/* Resources */}
                    {module.resources && module.resources.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
                        {module.resources.map((resource, ri) => (
                          <a
                            key={ri}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${module.completed
                                ? 'bg-slate-50 text-slate-400 border border-slate-100 pointer-events-none'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                              }`}
                          >
                            <span className="opacity-70">
                              {resource.resourceType === 'video' ? '📺' : '🔗'}
                            </span>
                            {resource.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vertical Step Number Bubble */}
                <div className={`absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm hidden lg:flex ${module.completed ? 'bg-green-500 text-white' : 'bg-white border border-slate-200 text-slate-400'
                  }`}>
                  {index + 1}
                </div>
              </div>

              {/* Connecting Arrow (except for last item) */}
              {index < path.modules.length - 1 && (
                <div className="h-12 w-full flex justify-center items-center">
                  <svg className={`w-8 h-12 ${module.completed ? 'text-green-400' : 'text-slate-300'}`} viewBox="0 0 24 48">
                    <path
                      d="M12 0 L12 48"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      fill="none"
                    />
                    <path
                      d="M6 38 L12 48 L18 38"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Footer controls */}
        <div className="mt-12 flex justify-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm hover-lift"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold transition shadow-lg hover-lift"
          >
            Regenerate Path
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningPath;
