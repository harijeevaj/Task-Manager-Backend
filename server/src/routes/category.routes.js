import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import {
  getCategories,
  createCategory,
  deleteCategory
} from "../controllers/category.controller.js";

const router = Router();

router.use(authRequired);

router.get("/", getCategories);
router.post("/", createCategory);
router.delete("/:id", deleteCategory);

export default router;
