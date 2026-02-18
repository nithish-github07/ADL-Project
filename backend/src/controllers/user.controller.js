import User from "../models/User.js";

/** GET /me */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otp -otpExpires");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get profile error: ", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

/** PUT /me */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const allowedFields = [
      "name",
      "careerAspiration",
      "engagementStatus",
      "qualification",
      "skills",
      "workExperience",
      "certifications",
      "preferredLanguages",
      "learningAvailability",
      "learningPreferences",
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Normalization helper: accept UI-friendly labels (e.g. "Student", "ITI", "Offline")
    const normalizeValue = (val, allowed) => {
      if (val === undefined || val === null) return val;
      if (Array.isArray(val)) return val.map((v) => normalizeValue(v, allowed)).filter(Boolean);
      const s = String(val);
      if (allowed.includes(s)) return s;
      const lower = s.toLowerCase();
      if (allowed.includes(lower)) return lower;
      const hyphen = lower.replace(/\s+/g, "-");
      if (allowed.includes(hyphen)) return hyphen;
      return s;
    };

    // Allowed enums matching the Mongoose schema
    const ENGAGEMENT_ENUM = ["student", "employed", "self-employed", "unemployed", "apprentice"];
    const QUAL_ENUM = ["8th", "10th", "12th", "iti", "diploma", "ug", "pg"];
    const LANG_ENUM = ["english", "hindi", "tamil", "telugu", "kannada", "malayalam", "marathi", "bengali", "gujarati", "other"];
    const MODE_ENUM = ["online", "offline", "hybrid"];
    const LEARN_PREF_ENUM = ["video", "reading", "hands-on", "mixed"];
    const CERT_STATUS_ENUM = ["completed", "in-progress", "not-started"];

    // Normalize enum-like fields if present
    if (updateData.engagementStatus !== undefined) {
      updateData.engagementStatus = normalizeValue(updateData.engagementStatus, ENGAGEMENT_ENUM);
    }
    if (updateData.qualification !== undefined) {
      updateData.qualification = normalizeValue(updateData.qualification, QUAL_ENUM);
    }
    if (updateData.preferredLanguages !== undefined) {
      updateData.preferredLanguages = normalizeValue(updateData.preferredLanguages, LANG_ENUM);
    }
    if (updateData.learningPreferences !== undefined) {
      updateData.learningPreferences = normalizeValue(updateData.learningPreferences, LEARN_PREF_ENUM);
    }
    if (updateData.learningAvailability && updateData.learningAvailability.preferredMode !== undefined) {
      updateData.learningAvailability.preferredMode = normalizeValue(
        updateData.learningAvailability.preferredMode,
        MODE_ENUM
      );
    }
    if (updateData.certifications && Array.isArray(updateData.certifications)) {
      updateData.certifications = updateData.certifications.map((cert) => {
        if (cert && cert.completionStatus !== undefined) {
          return { ...cert, completionStatus: normalizeValue(cert.completionStatus, CERT_STATUS_ENUM) };
        }
        return cert;
      });
    }

    // Compute isProfileComplete based on merged current + update
    const requiredForComplete = ["name", "engagementStatus", "qualification", "learningAvailability"];
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const mergedData = { ...user.toObject(), ...updateData };

    updateData.isProfileComplete = requiredForComplete.every((field) => {
      const v = mergedData[field];
      if (v === undefined || v === null) return false;
      if (typeof v === "string") return v.trim() !== "";
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "object") return Object.keys(v).length > 0;
      return true;
    });

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -otp -otpExpires");

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error: ", error);
    if (error.name === "ValidationError" && error.errors) {
      const errors = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ message: "Validation failed", errors });
    }
    return res.status(500).json({ message: "Failed to update profile", detail: error.message });
  }
};

export const addSkill = async (req, res) => {
  try {
    const { type, skill } = req.body;

    if (!type || !skill) {
      return res.status(400).json({ message: "Type and skill are required" });
    }

    if (!["technical", "soft"].includes(type)) {
      return res.status(400).json({ message: "Type must be 'technical' or 'soft'" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.skills) {
      user.skills = { technical: [], soft: [] };
    }

    if (user.skills[type].includes(skill)) {
      return res.status(400).json({ message: "Skill already exists" });
    }

    user.skills[type].push(skill);

    await user.save();

    res.status(201).json({
      message: "Skill added successfully",
      skills: user.skills,
    });
  } catch (error) {
    console.error("Add skill error: ", error);
    res.status(500).json({ message: "Failed to add skill" });
  }
};

export const removeSkill = async (req, res) => {
  try {
    const { skill } = req.params;
    const { type } = req.query;

    if (!type || !["technical", "soft"].includes(type)) {
      return res.status(400).json({ message: "Valid type query param required (?type=technical or ?type=soft)" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.skills || !user.skills[type].includes(skill)) {
      return res.status(404).json({ message: "Skill not found" });
    }

    user.skills[type] = user.skills[type].filter((s) => s != skill);
    await user.save();

    res.status(200).json({
      message: "Skill removed successfully",
      skills: user.skills,
    });
  } catch (error) {
    console.error("Remove skill error: ", error);
    res.status(500).json({ message: "Failed to remove skill" });
  }
};