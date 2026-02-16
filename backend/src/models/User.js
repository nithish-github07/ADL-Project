import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
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

        //OTP/ verification
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
    },
    {timestamps: true}
);

const User = mongoose.model("User",userSchema);
export default User;