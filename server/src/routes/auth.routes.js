import { Router } from "express";
import { register, login, me, logout } from "../controllers/auth.controller.js";
import { authRequired } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.get("/me", authRequired, me);
router.post("/logout", authRequired, logout);

export default router;
