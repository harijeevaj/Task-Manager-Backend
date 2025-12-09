import { Op } from "sequelize";
import { Task, Category, User, TaskShare } from "../models/index.js";
import {
  validateTaskTitle,
  validateDueDate,
  isValidStatus,
  isValidPriority,
  validateStatusTransition
} from "../utils/validation.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { TASK_STATUSES } from "../constants/task.js";

// Helper: ensure ownership or shared
const ensureTaskOwner = async (taskId, userId) => {
  const task = await Task.findByPk(taskId, { include: [{ model: Category, as: "category" }] });
  if (!task) return { error: "NOT_FOUND", task: null };

  if (task.user_id !== userId) {
    return { error: "FORBIDDEN", task: null };
  }
  return { error: null, task };
};

export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      category,
      tags, // not used in DB now but could be extended
      estimatedHours
    } = req.body;

    const details = [];

    if (!validateTaskTitle(title)) {
      details.push({ field: "title", message: "Title is required and max 200 characters" });
    }

    if (priority && !isValidPriority(priority)) {
      details.push({ field: "priority", message: "Invalid priority" });
    }

    if (!validateDueDate(dueDate)) {
      details.push({ field: "dueDate", message: "Due date must be in the future" });
    }

    if (details.length) {
      return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid input data", details);
    }

    let categoryId = null;
    if (category) {
      const cat = await Category.findOne({
        where: { id: category, user_id: req.user.id }
      });
      if (!cat) {
        return errorResponse(res, 404, "NOT_FOUND", "Category not found");
      }
      categoryId = cat.id;
    }

    const task = await Task.create({
      title,
      description,
      priority: priority || "medium",
      dueDate: dueDate || null,
      estimatedHours: estimatedHours || null,
      user_id: req.user.id,
      category_id: categoryId
    });

    if (categoryId) {
      await Category.increment("taskCount", { by: 1, where: { id: categoryId } });
    }

    return successResponse(res, 201, "Task created successfully", {
      task: {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        user: req.user.id,
        createdAt: task.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Failed to create task");
  }
};

export const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      status,
      priority,
      category,
      search,
      "dueDate[gte]": dueGte,
      "dueDate[lte]": dueLte,
      page = 1,
      limit = 10,
      sortBy = "createdAt:desc"
    } = req.query;

    const where = { user_id: userId };

    if (status) {
      const statuses = status.split(",").filter((s) => TASK_STATUSES.includes(s));
      if (statuses.length) where.status = { [Op.in]: statuses };
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category_id = category;
    }

    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    if (dueGte || dueLte) {
      where.dueDate = {};
      if (dueGte) where.dueDate[Op.gte] = new Date(dueGte);
      if (dueLte) where.dueDate[Op.lte] = new Date(dueLte);
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const [field, direction] = sortBy.split(":");
    const allowedSortFields = ["dueDate", "createdAt", "updatedAt", "priority", "status"];
    const orderField = allowedSortFields.includes(field) ? field : "createdAt";
    const orderDirection = direction === "asc" ? "ASC" : "DESC";

    const { rows, count } = await Task.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "color"]
        }
      ],
      order: [[orderField, orderDirection]],
      limit: limitNum,
      offset
    });

    // Stats
    const stats = {};
    for (const s of TASK_STATUSES) {
      const c = await Task.count({ where: { user_id: userId, status: s } });
      stats[s === "in-progress" ? "inProgress" : s] = c;
    }

    return successResponse(res, 200, "Tasks fetched", {
      tasks: rows.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        category: t.category
          ? { id: t.category.id, name: t.category.name, color: t.category.color }
          : null
      })),
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(count / limitNum)
      },
      stats
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch tasks");
  }
};

export const getTaskById = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (isNaN(taskId)) {
      return errorResponse(res, 400, "BAD_REQUEST", "Invalid task ID format");
    }

    const task = await Task.findOne({
      where: { id: taskId, user_id: req.user.id },
      include: [{ model: Category, as: "category" }]
    });

    if (!task) {
      return errorResponse(res, 404, "NOT_FOUND", "Task not found");
    }

    return successResponse(res, 200, "Task fetched", { task });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch task");
  }
};

export const updateTask = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (isNaN(taskId)) {
      return errorResponse(res, 400, "BAD_REQUEST", "Invalid task ID format");
    }

    const { error, task } = await ensureTaskOwner(taskId, req.user.id);
    if (error === "NOT_FOUND") {
      return errorResponse(res, 404, "NOT_FOUND", "Task not found");
    }
    if (error === "FORBIDDEN") {
      return errorResponse(res, 403, "FORBIDDEN", "Cannot modify another user's task");
    }

    const {
      title,
      description,
      priority,
      dueDate,
      category,
      estimatedHours
    } = req.body;

    const updates = {};
    const details = [];

    if (title !== undefined) {
      if (!validateTaskTitle(title)) {
        details.push({ field: "title", message: "Invalid title" });
      } else {
        updates.title = title;
      }
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (priority !== undefined) {
      if (!isValidPriority(priority)) {
        details.push({ field: "priority", message: "Invalid priority" });
      } else {
        updates.priority = priority;
      }
    }

    if (dueDate !== undefined) {
      if (!validateDueDate(dueDate)) {
        details.push({ field: "dueDate", message: "Due date must be in the future" });
      } else {
        updates.dueDate = dueDate;
      }
    }

    if (estimatedHours !== undefined) {
      updates.estimatedHours = estimatedHours;
    }

    if (category !== undefined) {
      if (category === null) {
        updates.category_id = null;
      } else {
        const cat = await Category.findOne({
          where: { id: category, user_id: req.user.id }
        });
        if (!cat) {
          details.push({ field: "category", message: "Category not found" });
        } else {
          updates.category_id = category;
        }
      }
    }

    if (details.length) {
      return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid input data", details);
    }

    // adjust category counts if changed
    if (updates.category_id !== undefined) {
      const oldCategoryId = task.category_id;
      const newCategoryId = updates.category_id;

      if (oldCategoryId && oldCategoryId !== newCategoryId) {
        await Category.increment("taskCount", { by: -1, where: { id: oldCategoryId } });
      }
      if (newCategoryId && oldCategoryId !== newCategoryId) {
        await Category.increment("taskCount", { by: 1, where: { id: newCategoryId } });
      }
    }

    await task.update(updates);

    return successResponse(res, 200, "Task updated", { task });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Failed to update task");
  }
};

export const deleteTask = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (isNaN(taskId)) {
      return errorResponse(res, 400, "BAD_REQUEST", "Invalid task ID format");
    }

    const { error, task } = await ensureTaskOwner(taskId, req.user.id);
    if (error === "NOT_FOUND") {
      return errorResponse(res, 404, "NOT_FOUND", "Task not found");
    }
    if (error === "FORBIDDEN") {
      return errorResponse(res, 403, "FORBIDDEN", "Cannot delete another user's task");
    }

    const categoryId = task.category_id;
    await task.destroy();

    if (categoryId) {
      await Category.increment("taskCount", { by: -1, where: { id: categoryId } });
    }

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Failed to delete task");
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (isNaN(taskId)) {
      return errorResponse(res, 400, "BAD_REQUEST", "Invalid task ID format");
    }

    const { status } = req.body;
    if (!isValidStatus(status)) {
      return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid status");
    }

    const { error, task } = await ensureTaskOwner(taskId, req.user.id);
    if (error === "NOT_FOUND") {
      return errorResponse(res, 404, "NOT_FOUND", "Task not found");
    }
    if (error === "FORBIDDEN") {
      return errorResponse(res, 403, "FORBIDDEN", "Cannot modify another user's task");
    }

    if (!validateStatusTransition(task.status, status)) {
      return errorResponse(res, 400, "BAD_REQUEST", "Invalid status transition");
    }

    const updates = { status };

    if (status === "completed" && !task.completedAt) {
      updates.completedAt = new Date();
    }

    await task.update(updates);

    return successResponse(res, 200, "Task status updated", {
      task: {
        id: task.id,
        status: task.status,
        updatedAt: task.updatedAt
      }
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Failed to update task status");
  }
};

export const updateTaskPriority = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (isNaN(taskId)) {
      return errorResponse(res, 400, "BAD_REQUEST", "Invalid task ID format");
    }

    const { priority } = req.body;

    if (!isValidPriority(priority)) {
      return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid priority");
    }

    const { error, task } = await ensureTaskOwner(taskId, req.user.id);
    if (error === "NOT_FOUND") {
      return errorResponse(res, 404, "NOT_FOUND", "Task not found");
    }
    if (error === "FORBIDDEN") {
      return errorResponse(res, 403, "FORBIDDEN", "Cannot modify another user's task");
    }

    await task.update({ priority });

    return successResponse(res, 200, "Task priority updated", { task });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Failed to update task priority");
  }
};

export const shareTask = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (isNaN(taskId)) {
      return errorResponse(res, 400, "BAD_REQUEST", "Invalid task ID format");
    }

    const { targetUserId, canEdit = false } = req.body;

    const { error, task } = await ensureTaskOwner(taskId, req.user.id);
    if (error === "NOT_FOUND") {
      return errorResponse(res, 404, "NOT_FOUND", "Task not found");
    }
    if (error === "FORBIDDEN") {
      return errorResponse(res, 403, "FORBIDDEN", "Cannot share another user's task");
    }

    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return errorResponse(res, 404, "NOT_FOUND", "Target user not found");
    }

    await TaskShare.create({
      task_id: taskId,
      owner_id: req.user.id,
      shared_with_id: targetUserId,
      canEdit
    });

    return successResponse(res, 200, "Task shared successfully");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Failed to share task");
  }
};

export const getSharedTasks = async (req, res) => {
  try {
    const shares = await TaskShare.findAll({
      where: { shared_with_id: req.user.id },
      include: [
        {
          model: Task,
          as: "task",
          include: [{ model: Category, as: "category" }]
        },
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "email"]
        }
      ]
    });

    const tasks = shares.map((s) => ({
      id: s.task.id,
      title: s.task.title,
      status: s.task.status,
      priority: s.task.priority,
      dueDate: s.task.dueDate,
      category: s.task.category
        ? {
            id: s.task.category.id,
            name: s.task.category.name,
            color: s.task.category.color
          }
        : null,
      owner: s.owner
    }));

    return successResponse(res, 200, "Shared tasks fetched", { tasks });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch shared tasks");
  }
};
