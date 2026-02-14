import User from "../models/User.js";

/** GET /me */

export const getProfile = async (req,res) => {
    try{
        const user = await User.findById(req.user.id).select("-password -otp -otpExpires");
        
        if(!user){
            return res.status(404).json({message: "User not found"});
        }

        res.status(200).json(user);
    }
    catch(error){
        console.error("Get profile error: ",error);
        res.status(500).json({message: "Failed to fetch profile"});
    }
};

/** PUT /me */
export const updateProfile = async(req,res) =>{
    try{
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
            "learningPreference",
        ];

        const updateData = {};
        allowedFields.forEach((field) => {
            if(req.body[field] !== undefined){
                updateData[field] = req.body[field];
            }
        });

        const requiredForComplete = ["name", "engagementStatus", "qualification", "learningAvailability"];
        const user = await User.findById(userId);
        const mergedData = { ...user.toObject(), ...updateData};

        updateData.isProfileComplete = requiredForComplete.every(
            (field) => mergedData[field] !== undefined && mergedData[field] != null
        );

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
        }).select("-password -otp -otpExpires");

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    }
    catch(error){
        console.error("Update profile error: ",error);
        res.status(500).json({message: "Failed to update profile"});
    }
    
};

export const addSkill = async(req,res) => {
    try{
        const {type, skill} = req.body;


        if(!type || !skill){
            return res.status(400).json({message: "Type and skill are required"});
        }

        if(!["technical", "soft"].includes(type)){
            return res.status(400).json({message: "Type must be 'technical' or 'soft'" });
        }

        const user = await User.findById(req.user.id);
        if(!user){
            return res.status(404).json({message: "User not found"});
        }

        if(!user.skills){
            user.skills = {technical: [], soft: []};
        }

        if(user.skills[type].includes(skill)){
            return res.status(400).json({message: "Skill already exists"});
        }

        user.skills[type].push(skill);

        await user.save();

        res.status(201).json({
            message: "Skill added successfully",
            skills: user.skills,
        });

    }catch(error){
        console.error("Add skill error: ", error);
        res.status(500).json({message: "Failed to add skill"});
    }
};

export const removeSkill = async(req,res) => {
    try{
        const {skill} = req.params;
        const {type} = req.query;

        if(!type || !["technical", "soft"].includes(type)){
            return res.status(400).json({message: "Valid type query param required (?type=technical or ?type=soft)"});
        }

        const user = await User.findById(req.user.id);
        if(!user){
            return res.status(400).json({message: "User not found"});
        }

        if(!user.skills || !user.skills[type].includes(skill)){
            return res.status(404).json({message: "Skill not found"});
        }

        user.skills[type] = user.skills[type].filter((s) => s != skill);
        await user.save();

        res.status(200).json({
            message: "Skill removed successfully",
            skills: user.skills,
        });
    }catch(error){
        console.error("Remove skill error: ", error);
        res.status(500).json({message: "Failed to remove skill"});
    }
};