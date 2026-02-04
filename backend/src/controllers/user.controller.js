import User from "../models/User.js";

/** GET /me */

export const getProfile = async (req,res) => {
    try{
        const user = await User.findById(req.user.id).select("-password");
        res.status(200).json(user);
    }
    catch(error){
        res.status(500).json({message: "Failed to fetch profile"});
    }
};

/** PUT /me */
export const updateProfile = async(req,res) =>{
    try{
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            req.body,
            {new: true, runValidators: true}
        ).select("-password");

        res.status(200).json(updatedUser);
    }
    catch(error){
        res.status(500).json({message: "Failed to update profile"});
    }
    
};