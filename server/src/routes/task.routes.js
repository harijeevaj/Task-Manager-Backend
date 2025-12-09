import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskPriority,
  shareTask,
  getSharedTasks
} from "../controllers/task.controller.js";

const router = Router();

router.use(authRequired);

router.get("/", getTasks);
router.post("/", createTask);
router.get("/shared", getSharedTasks);
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.put("/:id/status", updateTaskStatus);
router.put("/:id/priority", updateTaskPriority);
router.post("/:id/share", shareTask);

export default router;
