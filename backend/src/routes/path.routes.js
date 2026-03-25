import express from 'express';
import {createPath,getAllPaths,getPathById,updateProgress} from "../controllers/path.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.post("/generate",createPath);
router.get("/",getAllPaths);
router.get("/:id",getPathById);
router.post("/:id/progress",updateProgress);


export default router;