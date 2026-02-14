import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import{
    getProfile,
    updateProfile,
    addSkill,
    removeSkill,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me",authMiddleware,getProfile);
router.put("/me",authMiddleware,updateProfile);
router.post("/me/skills", authMiddleware, addSkill);
router.delete("/me/skills/:skill",authMiddleware, removeSkill);

export default router;