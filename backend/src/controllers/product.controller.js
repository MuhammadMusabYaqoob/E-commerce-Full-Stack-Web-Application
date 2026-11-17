import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import slugify from "slugify";
import { rm } from "node:fs/promises";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../models/category.model.js";
import { Products } from "../models/product.model.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";

const makeUniqueSlug = async (name, excludedProductId = null) => {
  const baseSlug = slugify(name, { lower: true, strict: true, trim: true });
  if (!baseSlug) throw new ApiError(400, "Product name must contain letters or numbers");

  const slugExists = (slug) => Products.exists({
    slug,
    ...(excludedProductId ? { _id: { $ne: excludedProductId } } : {}),
  });

  if (!(await slugExists(baseSlug))) return baseSlug;

  let candidate;
  do {
    candidate = `${baseSlug}-${randomUUID().slice(0, 8)}`;
  } while (await slugExists(candidate));
  return candidate;
};

const uploadProductImages = async (files) => {
  const assets = [];
  for (const file of files) {
    const asset = await uploadOnCloudinary(file.path);
    if (!asset?.secure_url || !asset?.public_id) {
      await Promise.all(assets.map((uploaded) => deleteOnCloudinary(uploaded.public_id)));
      throw new ApiError(502, "One of the product photo uploads failed");
    }
    assets.push(asset);
  }
  return assets;
};

const removeTempFiles = async (files) => {
  await Promise.all((files || []).map((file) =>
    rm(file.path, { force: true }).catch((error) => {
      console.error("Product temp-file cleanup failed:", error);
    })
  ));
};

const createProduct = asyncHandler(async (req, res) => {
  try {
    const name = req.body.name.trim();
    const description = req.body.description?.trim();
    const price = Number(req.body.price);
    const categoryId = req.body.category;

    if (!name || !description || req.body.price === undefined || req.body.price === "") {
      throw new ApiError(400, "Name, description, and price are required");
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new ApiError(400, "Price must be a valid non-negative number");
    }
    if (!mongoose.isValidObjectId(categoryId)) {
      throw new ApiError(400, "Choose a valid category");
    }
    if (!req.files?.length) throw new ApiError(400, "Choose at least one product photo");

    const category = await Category.findById(categoryId);
    if (!category) throw new ApiError(404, "Category not found");

    const slug = await makeUniqueSlug(name);
    const cloudinaryAssets = await uploadProductImages(req.files);

    try {
      const product = await Products.create({
        name,
        slug,
        description,
        price,
        category: categoryId,
        images: cloudinaryAssets.length == 0 ? cloudinaryAssets = null : cloudinaryAssets.map((asset) => ({ url: asset.secure_url, publicId: asset.public_id })),
        shipping: req.body.shipping === "true" || req.body.shipping === true,
      });
      return res.status(201).json(new ApiResponse(201, product, "Product created successfully"));
    } catch (error) {
      await Promise.all(cloudinaryAssets.map((asset) => deleteOnCloudinary(asset.public_id)));
      if (error.code === 11000) throw new ApiError(409, "A product with this slug already exists; try again");
      throw error;
    }
  } finally {
    await removeTempFiles(req.files);
  }
});

const getAllProducts = asyncHandler(async (req, res) => {
  const requestedPage = Number.parseInt(String(req.query.page ?? "1"), 10);
  if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) {
    throw new ApiError(400, "Page must be a positive whole number");
  }

  const filter = {};
  if (req.query.category) {
    const categoryIds = String(req.query.category).split(",").filter(Boolean);
    if (categoryIds.some((id) => !mongoose.isValidObjectId(id))) {
      throw new ApiError(400, "Invalid category filter");
    }
    filter.category = categoryIds.length === 1 ? categoryIds[0] : { $in: categoryIds };
  }

  const search = String(req.query.search ?? "").trim();
  if (search.length > 100) throw new ApiError(400, "Search text must be 100 characters or fewer");
  if (search) {
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const minPrice = req.query.minPrice === undefined ? undefined : Number(req.query.minPrice);
  const maxPrice = req.query.maxPrice === undefined ? undefined : Number(req.query.maxPrice);
  if (minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) {
    throw new ApiError(400, "Minimum price must be a valid non-negative number");
  }
  if (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) {
    throw new ApiError(400, "Maximum price must be a valid non-negative number");
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new ApiError(400, "Minimum price cannot be greater than maximum price");
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const perPage = 10;
  const totalProducts = await Products.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(totalProducts / perPage));
  const currentPage = Math.min(requestedPage, totalPages);
  const products = await Products.find(filter)
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  return res.status(200).json(new ApiResponse(200, {
    products,
    pagination: {
      currentPage,
      perPage,
      totalProducts,
      totalPages,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
    },
  }, "Products retrieved successfully"));
});

const getSingleProduct = asyncHandler(async (req, res) => {
  const slug = req.params.slug?.trim().toLowerCase();
  if (!slug) throw new ApiError(400, "Product slug is required");

  const product = await Products.findOne({ slug }).populate("category", "name slug");
  if (!product) throw new ApiError(404, "Product not found");

  return res.status(200).json(new ApiResponse(200, product, "Product retrieved successfully"));
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid product ID");

  const uploadedFiles = req.files || [];
  let newAssets = [];
  let updateSaved = false;

  try {
    const product = await Products.findById(id);
    if (!product) throw new ApiError(404, "Product not found");

    const updates = {};
    if (req.body.name !== undefined) {
      const name = req.body.name.trim();
      if (!name) throw new ApiError(400, "Product name cannot be empty");
      updates.name = name;
      updates.slug = await makeUniqueSlug(name, id);
    }
    if (req.body.description !== undefined) {
      const description = req.body.description.trim();
      if (!description) throw new ApiError(400, "Product description cannot be empty");
      updates.description = description;
    }
    if (req.body.price !== undefined) {
      if (req.body.price === "" || !Number.isFinite(Number(req.body.price)) || Number(req.body.price) < 0) {
        throw new ApiError(400, "Price must be a valid non-negative number");
      }
      updates.price = Number(req.body.price);
    }
    if (req.body.category !== undefined) {
      if (!mongoose.isValidObjectId(req.body.category)) throw new ApiError(400, "Choose a valid category");
      if (!(await Category.exists({ _id: req.body.category }))) throw new ApiError(404, "Category not found");
      updates.category = req.body.category;
    }
    if (req.body.shipping !== undefined) {
      if (!["true", "false", true, false].includes(req.body.shipping)) {
        throw new ApiError(400, "Shipping must be true or false");
      }
      updates.shipping = req.body.shipping === "true" || req.body.shipping === true;
    }
    if (uploadedFiles.length) {
      newAssets = await uploadProductImages(uploadedFiles);
      updates.images = newAssets.map((asset) => ({ url: asset.secure_url, publicId: asset.public_id }));
    }
    if (!Object.keys(updates).length) throw new ApiError(400, "Provide at least one field to update");

    const updatedProduct = await Products.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("category", "name slug");
    if (!updatedProduct) throw new ApiError(404, "Product not found");
    updateSaved = true;

    // Old images are removed only after the database points to the replacements.
    if (newAssets.length) {
      const cleanupResults = await Promise.all(product.images.map((image) => deleteOnCloudinary(image.publicId)));
      if (cleanupResults.some((result) => !result || result.result !== "ok")) {
        console.error(`Some old Cloudinary images for product ${id} could not be removed`);
      }
    }
    return res.status(200).json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
  } catch (error) {
    if (!updateSaved && newAssets.length) {
      await Promise.all(newAssets.map((asset) => deleteOnCloudinary(asset.public_id)));
    }
    if (error.code === 11000) throw new ApiError(409, "A product with this slug already exists");
    throw error;
  } finally {
    await removeTempFiles(uploadedFiles);
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid product ID");

  const deletedProduct = await Products.findByIdAndDelete(id);
  if (!deletedProduct) throw new ApiError(404, "Product not found");

  const deletionResults = await Promise.all(
    deletedProduct.images.map((image) => deleteOnCloudinary(image.publicId))
  );
  const allImagesRemoved = deletionResults.every((result) => result?.result === "ok" || result?.result === "not found");
  const message = allImagesRemoved
    ? "Product and its images deleted successfully"
    : "Product deleted, but one or more Cloudinary images could not be removed";
  if (!allImagesRemoved) console.error(`Cloudinary cleanup incomplete for deleted product ${id}`);

  return res.status(200).json(new ApiResponse(200, deletedProduct, message));
});

export { createProduct, getAllProducts, getSingleProduct, updateProduct, deleteProduct };




