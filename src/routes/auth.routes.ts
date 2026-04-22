import { Router } from "express";
import { login, me, changePassword } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/login", asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));
router.post("/change-password", requireAuth, asyncHandler(changePassword));

export default router;
