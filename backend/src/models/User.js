import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        // ========== BASIC INFO ==========
        name: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
        },

        password: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            default: "learner",
        },

        // ========== OTP/ VERIFICATION ==========
        isVerified: {
            type: Boolean,
            default: false
        },

        otp: {
            type: String
        },

        otpExpires: {
            type: Date
        },

        // ========== USER PROFILE INFO ==========
        careerAspiration: {
            targetJobRole: {
                type: String,
            },
            targetSector: {
                type: String,
            },
        },

        engagementStatus: {
            type: String,
            enum: ["student", "employed", "self-employed", "unemployed", "apprentice"],
        },

        qualification: {
            type: String,
            enum: ["8th","10th", "12th", "iti", "diploma", "ug", "pg"],
        },

        skills: {
            technical: [String],
            soft: [String],
        },

        workExperience: [
            {
                jobTitle: String,
                company: String,
                years: Number,
                description: String,
            },
        ],

        certifications: [
            {
                courseName: String,
                provider: String,
                duration: String,
                completionStatus: {
                    type: String,
                    enum: ["completed", "in-progress", "not-started"],
                },

            },
        ],

        preferredLanguages: [
            {
                type: String,
                enum: ["english", "hindi", "tamil", "telugu", "kannada", "malayalam", "marathi", "bengali", "gujarati", "other"],
            },
        ],

        learningAvailability : {
            hoursPerWeek: {
                type: Number,
            },
            preferredMode: {
                type: String,
                enum: ["online", "offline", "hybrid"],
            },
        },

        learningPreferences: {
            type: String,
            enum: ["video", "reading", "hands-on", "mixed"],
        },

        isProfileComplete: {
            type: Boolean,
            default: false,
        },
    },
    {timestamps: true}
);

const User = mongoose.model("User",userSchema);
export default User;