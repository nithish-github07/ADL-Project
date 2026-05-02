import Path from "../models/Path.js";
import User from "../models/User.js";
import axios from "axios";


const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const normalizeModules = (modules = []) => {
    if (!Array.isArray(modules)) {
        return [];
    }

    return modules.map((module, index) => {
        const resources = Array.isArray(module?.resources)
            ? module.resources.map((resource) => ({
                type: resource?.type || "link",
                title: resource?.title || resource?.name || "Resource",
                url: resource?.url || resource?.link || "",
            }))
            : [];

        return {
            moduleId: module?.moduleId || module?.id || module?.slug || `module-${index + 1}`,
            title: module?.title || `Module ${index + 1}`,
            description: module?.description || "",
            duration: Number.isFinite(module?.duration)
                ? module.duration
                : (Number.isFinite(module?.hours) ? module.hours : 0),
            resources,
            completed: false,
            completedAt: null,
        };
    });
};


export const createPath = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch complete user profile from database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validate that user profile is complete
        if (!user.isProfileComplete) {
            return res.status(400).json({
                message: "Please complete your profile before generating a learning path",
                requiredFields: ["name", "engagementStatus", "qualification", "learningAvailability"]
            });
        }

        // Extract required data for AI service
        const aiRequestPayload = {
            targetJobRole: user.careerAspiration?.targetJobRole,
            targetSector: user.careerAspiration?.targetSector,
            currentLevel: req.body.currentLevel || "beginner",
            targetLevel: req.body.targetLevel || "advanced",
            qualification: user.qualification,
            technicalSkills: user.skills?.technical || [],
            softSkills: user.skills?.soft || [],
            workExperience: user.workExperience || [],
            certifications: user.certifications || [],
            engagementStatus: user.engagementStatus,
            hoursPerWeek: user.learningAvailability?.hoursPerWeek,
            preferredMode: user.learningAvailability?.preferredMode,
            learningPreferences: user.learningPreferences,
            preferredLanguages: user.preferredLanguages || [],
            timeline: req.body.timeline || 90, // Default 90 days
        };

        // Call FastAPI AI Service to generate learning path
        let aiResponse;
        try {
            aiResponse = await axios.post(
                `${AI_SERVICE_URL}/api/inngest/query`,
                aiRequestPayload,
                {
                    timeout: 30000, // 30 second timeout
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        } catch (aiError) {
            console.error("AI Service Error: ", aiError.message);
            return res.status(503).json({
                message: "AI Service unavailable. Please try again later.",
                error: aiError.message
            });
        }

        // Extract generated path data from AI service
        const { title, description, modules, estimatedDuration } = aiResponse.data;

        const normalizedModules = normalizeModules(modules);

        if (!title || normalizedModules.length === 0) {
            return res.status(400).json({
                message: "Invalid response from AI service"
            });
        }

        // Create learning path document in database
        const newPath = new Path({
            userId,
            title,
            description,
            goalSkills: aiRequestPayload.targetJobRole ? [aiRequestPayload.targetJobRole] : [],
            currentLevel: aiRequestPayload.currentLevel,
            targetLevel: aiRequestPayload.targetLevel,
            timeline: aiRequestPayload.timeline,
            modules: normalizedModules,
            status: "not-started",
            progress: 0,
            startDate: new Date(),
            expectedEndDate: new Date(
                Date.now() + aiRequestPayload.timeline * 24 * 60 * 60 * 1000
            ),
        });

        // Save to database
        await newPath.save();

        // Return response with created path
        res.status(201).json({
            message: "Learning path generated and saved successfully",
            path: newPath,
            estimatedDuration,
        });
    } catch (error) {
        console.error("Create path error: ", error);
        res.status(500).json({
            message: "Failed to generate learning path",
            error: error.message
        });
    }
};

/**
 * GET /api/learning-paths
 * Fetch all learning paths for the authenticated user
 */
export const getAllPaths = async (req, res) => {
    try {
        const paths = await Path.find({ userId: req.user.id })
            .select("-modules")
            .sort({ createdAt: -1 });

        res.status(200).json(paths);
    } catch (error) {
        console.error("Get all paths error: ", error);
        res.status(500).json({ message: "Failed to fetch learning paths" });
    }
};

/**
 * GET /api/learning-paths/:id
 * Fetch detailed view of a specific learning path with all modules
 */
export const getPathById = async (req, res) => {
    try {
        const { id } = req.params;

        const path = await Path.findById(id);

        if (!path) {
            return res.status(404).json({ message: "Learning path not found" });
        }

        // Verify user owns this path
        if (path.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        res.status(200).json(path);
    } catch (error) {
        console.error("Get path by id error: ", error);
        res.status(500).json({ message: "Failed to fetch learning path" });
    }
};

/**
 * POST /api/learning-paths/:id/progress
 * Update module completion status and calculate overall progress
 */
export const updateProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { moduleId, completed } = req.body;

        // Validate required fields
        if (moduleId === undefined || completed === undefined) {
            return res.status(400).json({
                message: "moduleId and completed status are required"
            });
        }

        // Fetch path
        const path = await Path.findById(id);

        if (!path) {
            return res.status(404).json({ message: "Learning path not found" });
        }

        // Verify user owns this path
        if (path.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        // Find and update the module
        const module = path.modules.find((m) => m.moduleId === moduleId.toString());

        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }

        // Update module completion status
        module.completed = completed;
        if (completed) {
            module.completedAt = new Date();
        } else {
            module.completedAt = null;
        }

        // Calculate overall progress
        const completedModules = path.modules.filter((m) => m.completed).length;
        path.progress = Math.round((completedModules / path.modules.length) * 100);

        // Update path status based on progress
        if (path.progress === 100) {
            path.status = "completed";
            path.completedDate = new Date();
        } else if (path.progress > 0) {
            path.status = "in-progress";
        } else {
            path.status = "not-started";
            path.completedDate = null;
        }

        // Save updated path
        await path.save();

        res.status(200).json({
            message: "Progress updated successfully",
            path,
        });
    } catch (error) {
        console.error("Update progress error: ", error);
        res.status(500).json({ message: "Failed to update progress" });
    }
};
