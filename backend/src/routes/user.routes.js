import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import{
    getProfile,
    updateProfile
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me",authMiddleware,getProfile);
router.put("/me",authMiddleware,updateProfile);

export default router;