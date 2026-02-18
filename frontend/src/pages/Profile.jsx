import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const engagementOptions = ["Student", "Employed", "Self-employed", "Unemployed", "Apprentice"];
const qualificationOptions = ["8th","10th", "12th", "ITI", "Diploma", "UG", "PG"];
const languageOptions = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Marathi", "Bengali", "Gujarati", "Other"];
const preferredModeOptions = ["Online", "Offline", "Hybrid"];
const learningPrefOptions = ["Video", "Reading", "Hands-on", "Mixed"];
const certStatusOptions = ["Completed", "In-progress", "N ot-started"];

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    careerAspiration: { targetJobRole: "", targetSector: "" },
    engagementStatus: "",
    qualification: "",
    skills: { technical: [], soft: [] },
    workExperience: [],
    certifications: [],
    preferredLanguages: [],
    learningAvailability: { hoursPerWeek: "", preferredMode: "" },
    learningPreferences: "",
  });

  const API = "http://localhost:5000/api/users";

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");
      try {
        setLoading(true);
        const res = await axios.get(`${API}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        setForm((prev) => ({
          ...prev,
          name: data.name || "",
          careerAspiration: data.careerAspiration || prev.careerAspiration,
          engagementStatus: data.engagementStatus || "",
          qualification: data.qualification || "",
          skills: data.skills || { technical: [], soft: [] },
          workExperience: data.workExperience || [],
          certifications: data.certifications || [],
          preferredLanguages: (data.preferredLanguages || []).map((l) => l) || [],
          learningAvailability: data.learningAvailability || { hoursPerWeek: "", preferredMode: "" },
          learningPreferences: data.learningPreferences || "",
        }));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = (path, value) => {
    setForm((f) => {
      const copy = JSON.parse(JSON.stringify(f));
      const parts = path.split(".");
      let cur = copy;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]] = { ...cur[parts[i]] };
      cur[parts[parts.length - 1]] = value;
      return copy;
    });
  };

  const addSkill = (type, value) => {
    if (!value) return;
    setForm((f) => ({
      ...f,
      skills: { ...f.skills, [type]: Array.from(new Set([...(f.skills[type] || []), value])) },
    }));
  };

  const removeSkill = (type, value) => {
    setForm((f) => ({
      ...f,
      skills: { ...f.skills, [type]: (f.skills[type] || []).filter((s) => s !== value) },
    }));
  };

  const addWork = () => {
    setForm((f) => ({ ...f, workExperience: [...(f.workExperience || []), { jobTitle: "", company: "", years: "", description: "" }] }));
  };

  const updateWork = (idx, key, value) => {
    setForm((f) => {
      const arr = [...(f.workExperience || [])];
      arr[idx] = { ...arr[idx], [key]: value };
      return { ...f, workExperience: arr };
    });
  };

  const removeWork = (idx) => {
    setForm((f) => ({ ...f, workExperience: (f.workExperience || []).filter((_, i) => i !== idx) }));
  };

  const addCert = () => {
    setForm((f) => ({ ...f, certifications: [...(f.certifications || []), { courseName: "", provider: "", duration: "", completionStatus: "completed" }] }));
  };

  const updateCert = (idx, key, value) => {
    setForm((f) => {
      const arr = [...(f.certifications || [])];
      arr[idx] = { ...arr[idx], [key]: value };
      return { ...f, certifications: arr };
    });
  };

  const removeCert = (idx) => {
    setForm((f) => ({ ...f, certifications: (f.certifications || []).filter((_, i) => i !== idx) }));
  };

  const toggleLanguage = (lang) => {
    setForm((f) => ({
      ...f,
      preferredLanguages: f.preferredLanguages.includes(lang) ? f.preferredLanguages.filter((l) => l !== lang) : [...f.preferredLanguages, lang],
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setMessage("");
  const token = localStorage.getItem("token");
  if (!token) return navigate("/login");

  const payload = {
    name: form.name,
    careerAspiration: form.careerAspiration,
    engagementStatus: form.engagementStatus,
    qualification: form.qualification,
    skills: form.skills,
    workExperience: form.workExperience,
    certifications: form.certifications,
    preferredLanguages: form.preferredLanguages,
    learningAvailability: form.learningAvailability,
    learningPreferences: form.learningPreferences,
  };

  
  const sanitize = (obj) => {
    if (Array.isArray(obj)) return obj;
    if (typeof obj !== "object" || obj === null) return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) continue;
      if (typeof v === "string" && v.trim() === "") continue;
      if (typeof v === "object") {
        const nested = sanitize(v);
        if (Array.isArray(nested) ? nested.length : Object.keys(nested).length) out[k] = nested;
      } else {
        out[k] = v;
      }
    }
    return out;
  };

  const clean = sanitize(payload);

  
  if (clean.learningAvailability && clean.learningAvailability.hoursPerWeek !== undefined) {
    const n = Number(clean.learningAvailability.hoursPerWeek);
    if (!Number.isNaN(n)) clean.learningAvailability.hoursPerWeek = n;
    else delete clean.learningAvailability.hoursPerWeek;
    if (Object.keys(clean.learningAvailability).length === 0) delete clean.learningAvailability;
  }

  try {
    setLoading(true);
    const res = await axios.put(`${API}/me`, clean, { headers: { Authorization: `Bearer ${token}` } });
    setMessage(res.data?.message || "Profile updated");
    const user = res.data?.user;
    if (user) localStorage.setItem("user", JSON.stringify(user));
  } catch (err) {
    
    const serverMessage = err.response?.data?.message;
    const serverErrors = err.response?.data?.errors;
    if (serverErrors && typeof serverErrors === "object") {
      const joined = Object.values(serverErrors).join(", ");
      setError(serverMessage ? `${serverMessage}: ${joined}` : joined);
    } else {
      setError(serverMessage || "Failed to update profile");
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="relative min-h-screen edu-bg overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="accent-shape accent-shape-1"></div>
        <div className="accent-shape accent-shape-2"></div>
        <div className="accent-shape accent-shape-3"></div>
      </div>

      <div className="relative z-10 min-h-screen flex justify-center items-start p-6">
        <div className="w-full max-w-4xl">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl card-shadow p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold gradient-text">Profile</h1>
              <div className="space-x-3">
                <button type="button" onClick={() => navigate('/dashboard')} className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200">Back</button>
                <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 text-white">{loading ? 'Saving...' : 'Save'}</button>
              </div>
            </div>

            {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded">{error}</div>}
            {message && <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded">{message}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full px-3 py-2 border rounded" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Engagement Status</label>
                <select
              value={form.engagementStatus}
              onChange={(e) => handleChange('engagementStatus', e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="" disabled>Select</option>
              {engagementOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Qualification</label>
              <select
                  value={form.qualification}
                  onChange={(e) => handleChange('qualification', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="" disabled>Select</option>
                  {qualificationOptions.map((q) => <option key={q} value={q}>{q}</option>)}
              </select> 
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Preferred Learning Style</label>
                  <select
                    value={form.learningPreferences}
                    onChange={(e) => handleChange('learningPreferences', e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                >
                  <option value="" disabled>Select</option>
                  {learningPrefOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Career Aspiration</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={form.careerAspiration.targetJobRole} onChange={(e) => handleChange('careerAspiration.targetJobRole', e.target.value)} placeholder="Target Job Role" className="px-3 py-2 border rounded" />
                <input value={form.careerAspiration.targetSector} onChange={(e) => handleChange('careerAspiration.targetSector', e.target.value)} placeholder="Target Sector" className="px-3 py-2 border rounded" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Skills</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-600 mb-2">Technical</p>
                  <div className="flex gap-2 mb-2">
                    <input id="techInput" placeholder="Add technical skill" className="flex-1 px-3 py-2 border rounded" />
                    <button type="button" onClick={() => { const v = document.getElementById('techInput').value.trim(); if(v){ addSkill('technical', v); document.getElementById('techInput').value=''; } }} className="px-3 py-2 bg-slate-100 rounded">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(form.skills.technical||[]).map((s) => (
                      <div key={s} className="px-3 py-1 bg-blue-50 border border-blue-200 rounded flex items-center gap-2">
                        <span className="text-sm">{s}</span>
                        <button type="button" onClick={() => removeSkill('technical', s)} className="text-red-500">×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-600 mb-2">Soft</p>
                  <div className="flex gap-2 mb-2">
                    <input id="softInput" placeholder="Add soft skill" className="flex-1 px-3 py-2 border rounded" />
                    <button type="button" onClick={() => { const v = document.getElementById('softInput').value.trim(); if(v){ addSkill('soft', v); document.getElementById('softInput').value=''; } }} className="px-3 py-2 bg-slate-100 rounded">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(form.skills.soft||[]).map((s) => (
                      <div key={s} className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded flex items-center gap-2">
                        <span className="text-sm">{s}</span>
                        <button type="button" onClick={() => removeSkill('soft', s)} className="text-red-500">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">Work Experience</label>
                <button type="button" onClick={addWork} className="text-sm text-blue-600">+ Add</button>
              </div>
              <div className="space-y-3">
                {(form.workExperience||[]).map((w, i) => (
                  <div key={i} className="p-3 border rounded grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      placeholder="Job Title"
                      value={w.jobTitle}
                      onChange={(e) => updateWork(i, "jobTitle", e.target.value)}
                      className="px-2 py-1 border rounded"
                    />
                    <input
                      placeholder="Company"
                      value={w.company}
                      onChange={(e) => updateWork(i, "company", e.target.value)}
                      className="px-2 py-1 border rounded"
                    />
                    <input
                      placeholder="Years"
                      value={w.years}
                      onChange={(e) => updateWork(i, "years", e.target.value)}
                      className="px-2 py-1 border rounded"
                      type="number"
                    />

                    <div className="col-span-1 md:col-span-3">
                      <textarea
                        placeholder="Description"
                        value={w.description}
                        onChange={(e) => updateWork(i, "description", e.target.value)}
                        className="w-full px-3 py-2 border rounded min-h-[80px]"
                      />
                      <div className="flex justify-end mt-2">
                        <button type="button" onClick={() => removeWork(i)} className="text-red-500">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">Certifications</label>
                <button type="button" onClick={addCert} className="text-sm text-blue-600">+ Add</button>
              </div>
              <div className="space-y-3">
                {(form.certifications||[]).map((c, i) => (
                  <div key={i} className="p-3 border rounded grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      placeholder="Course"
                      value={c.courseName}
                      onChange={(e) => updateCert(i, "courseName", e.target.value)}
                      className="px-2 py-1 border rounded"
                    />
                    <input
                      placeholder="Provider"
                      value={c.provider}
                      onChange={(e) => updateCert(i, "provider", e.target.value)}
                      className="px-2 py-1 border rounded"
                    />
                    <input
                      placeholder="Duration"
                      value={c.duration}
                      onChange={(e) => updateCert(i, "duration", e.target.value)}
                      className="px-2 py-1 border rounded"
                    />

                    <div className="col-span-1 md:col-span-3 flex flex-col gap-2">
                      <select
                        value={c.completionStatus}
                        onChange={(e) => updateCert(i, "completionStatus", e.target.value)}
                        className="px-2 py-1 border rounded w-48"
                      >
                        {certStatusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      <div className="flex justify-end">
                        <button type="button" onClick={() => removeCert(i)} className="text-red-500">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Preferred Languages</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {languageOptions.map((l) => (
                    <label key={l} className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.preferredLanguages.includes(l)} onChange={() => toggleLanguage(l)} />
                      <span className="capitalize">{l}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Learning Availability</label>
                <div className="flex gap-2 mt-2">
                  <input type="number" min="0" placeholder="Hours/week" value={form.learningAvailability.hoursPerWeek} onChange={(e) => handleChange('learningAvailability.hoursPerWeek', e.target.value)} className="px-2 py-1 border rounded w-32" />
                <select
                    value={form.learningAvailability.preferredMode}
                    onChange={(e) => handleChange('learningAvailability.preferredMode', e.target.value)}
                    className="px-2 py-1 border rounded"
                  >
                    <option value="" disabled>Select</option>
                    {preferredModeOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>  
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
