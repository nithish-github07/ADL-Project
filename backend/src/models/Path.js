import mongoose from 'mongoose';

const pathSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        goalSkills: {
            type: [String],
            required: true,
        },
        currentLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner',
        },
        targetLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'advanced',
        },
        timeline: {
            type: Number, // in days
        },
        modules: [
            {
                moduleId: String,
                title: String,
                description: String,
                duration: Number, // in hours
                resources: [
                    {
                        type: String,
                        title: String,
                        url: String,
                    }
                ],
                completed: {
                    type: Boolean,
                    default: false,
                },
                completedAt: Date,
            }
        ],
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        status: {
            type: String,
            enum: ['not-started', 'in-progress', 'completed'],
            default: 'not-started',
        },
        startDate: Date,
        expectedEndDate: Date,
        completedDate: Date,
    },
    { timestamps: true }
);

const Path = mongoose.model("Path", pathSchema);
export default Path;