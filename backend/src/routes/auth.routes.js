import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import {login, register} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register",register);
router.post("/login",login);

// router.get("/protected",authMiddleware, (req,res) => {
//     res.json({
//         message: "You accessed a protected route",
//         user: req.user,
//     });
// });

export default router;