import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import {login, register, verifyOtp, resendOtp} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register",register);
router.post("/login",login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

change1
export default router;