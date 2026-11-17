import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../models/category.model.js";
import { Products } from "../models/product.model.js";

const createCategory = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) {
    throw new ApiError(400, "Category name must contain letters or numbers");
  }

  const existingCategory = await Category.findOne({
    $or: [{ name }, { slug }],
  });

  if (existingCategory) {
    throw new ApiError(409, "A category with this name already exists");
  }

  const category = await Category.create({ name, slug });

  return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

const updateCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const name = req.body.name?.trim();

  if (!mongoose.isValidObjectId(categoryId)) {
    throw new ApiError(400, "Invalid category ID");
  }

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) {
    throw new ApiError(400, "Category name must contain letters or numbers");
  }

  const duplicateCategory = await Category.findOne({
    _id: { $ne: categoryId },
    $or: [{ name }, { slug }],
  });

  if (duplicateCategory) {
    throw new ApiError(409, "Another category already uses this name");
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    { $set: { name, slug } },
    { new: true, runValidators: true }
  );

  if (!updatedCategory) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCategory, "Category updated successfully"));
});

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories retrieved successfully"));
});

const getSingleCategory = asyncHandler(async (req, res) => {
  const slug = req.params.slug?.trim().toLowerCase();
  if (!slug) throw new ApiError(400, "Category slug is required");

  const category = await Category.findOne({ slug });
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category retrieved successfully"));
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const categoryHasProducts = await Products.exists({ category: id });
  if (categoryHasProducts) {
    throw new ApiError(409, "This category is used by products. Reassign or delete those products first.");
  }

  const deletedCategory = await Category.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, deletedCategory, "Category deleted successfully"));
});

export { createCategory, updateCategory, getAllCategories, getSingleCategory, deleteCategory };


