import { Category, Task } from "../models/index.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { user_id: req.user.id }
    });

    return successResponse(res, 200, "Categories fetched", { categories });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch categories");
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name || name.trim().length === 0) {
      return errorResponse(res, 400, "VALIDATION_ERROR", "Category name is required");
    }

    const category = await Category.create({
      name,
      color: color || "#3B82F6",
      user_id: req.user.id
    });

    return successResponse(res, 201, "Category created", { category });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Failed to create category");
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    if (isNaN(categoryId)) {
      return errorResponse(res, 400, "BAD_REQUEST", "Invalid category ID format");
    }

    const category = await Category.findOne({
      where: { id: categoryId, user_id: req.user.id }
    });

    if (!category) {
      return errorResponse(res, 404, "NOT_FOUND", "Category not found");
    }

    // Set category_id to null on all tasks with this category
    await Task.update(
      { category_id: null },
      { where: { category_id: category.id } }
    );

    await category.destroy();

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Failed to delete category");
  }
};
