import slugify from "slugify";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { postgresPool } from "../db/postgres.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function toCategory(row) {
  return { _id: row.id, id: row.id, name: row.name, slug: row.slug, createdAt: row.created_at, updatedAt: row.updated_at };
}

const createCategory = asyncHandler(async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!name) throw new ApiError(400, "Category name is required");
  const slug = slugify(name, { lower: true, strict: true, trim: true });
  if (!slug) throw new ApiError(400, "Category name must contain letters or numbers");

  try {
    const result = await postgresPool.query(
      "INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id, name, slug, created_at, updated_at",
      [name, slug]
    );
    return res.status(201).json(new ApiResponse(201, toCategory(result.rows[0]), "Category created successfully"));
  } catch (error) {
    if (error.code === "23505") throw new ApiError(409, "A category with this name or slug already exists");
    throw error;
  }
});

const updateCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!uuidPattern.test(categoryId)) throw new ApiError(400, "Invalid category ID");
  if (!name) throw new ApiError(400, "Category name is required");
  const slug = slugify(name, { lower: true, strict: true, trim: true });
  if (!slug) throw new ApiError(400, "Category name must contain letters or numbers");

  try {
    const result = await postgresPool.query(
      `UPDATE categories SET name = $1, slug = $2, updated_at = NOW()
       WHERE id = $3 RETURNING id, name, slug, created_at, updated_at`,
      [name, slug, categoryId]
    );
    if (!result.rows[0]) throw new ApiError(404, "Category not found");
    return res.status(200).json(new ApiResponse(200, toCategory(result.rows[0]), "Category updated successfully"));
  } catch (error) {
    if (error.code === "23505") throw new ApiError(409, "Another category already uses this name or slug");
    throw error;
  }
});

const getAllCategories = asyncHandler(async (_req, res) => {
  const result = await postgresPool.query(
    "SELECT id, name, slug, created_at, updated_at FROM categories ORDER BY name ASC"
  );
  return res.status(200).json(new ApiResponse(200, result.rows.map(toCategory), "Categories retrieved successfully"));
});

const getSingleCategory = asyncHandler(async (req, res) => {
  const slug = req.params.slug?.trim().toLowerCase();
  if (!slug) throw new ApiError(400, "Category slug is required");
  const result = await postgresPool.query(
    "SELECT id, name, slug, created_at, updated_at FROM categories WHERE slug = $1",
    [slug]
  );
  if (!result.rows[0]) throw new ApiError(404, "Category not found");
  return res.status(200).json(new ApiResponse(200, toCategory(result.rows[0]), "Category retrieved successfully"));
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!uuidPattern.test(id)) throw new ApiError(400, "Invalid category ID");
  const exists = await postgresPool.query("SELECT id FROM categories WHERE id = $1", [id]);
  if (!exists.rows[0]) throw new ApiError(404, "Category not found");
  const product = await postgresPool.query("SELECT id FROM products WHERE category_id = $1 LIMIT 1", [id]);
  if (product.rows[0]) throw new ApiError(409, "This category is used by products. Reassign or delete those products first.");
  const deleted = await postgresPool.query(
    "DELETE FROM categories WHERE id = $1 RETURNING id, name, slug, created_at, updated_at",
    [id]
  );
  return res.status(200).json(new ApiResponse(200, toCategory(deleted.rows[0]), "Category deleted successfully"));
});

export { createCategory, updateCategory, getAllCategories, getSingleCategory, deleteCategory };