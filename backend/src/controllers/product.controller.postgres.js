import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import slugify from "slugify";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { postgresPool } from "../db/postgres.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const productSelect = `
  SELECT p.id, p.name, p.slug, p.description, p.price, p.shipping,
         p.created_at, p.updated_at,
         json_build_object('_id', c.id, 'id', c.id, 'name', c.name, 'slug', c.slug) AS category,
         COALESCE(
           json_agg(json_build_object('url', pi.url, 'publicId', pi.public_id) ORDER BY pi.image_order)
             FILTER (WHERE pi.id IS NOT NULL),
           '[]'::json
         ) AS images
  FROM products p
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN product_images pi ON pi.product_id = p.id
`;

function mapProduct(row) {
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    images: row.images,
    shipping: row.shipping,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getProductById(id) {
  const result = await postgresPool.query(`${productSelect} WHERE p.id = $1 GROUP BY p.id, c.id`, [id]);
  return result.rows[0] ? mapProduct(result.rows[0]) : null;
}

async function makeUniqueSlug(name, excludedId = null) {
  const baseSlug = slugify(name, { lower: true, strict: true, trim: true });
  if (!baseSlug) throw new ApiError(400, "Product name must contain letters or numbers");
  const query = excludedId
    ? await postgresPool.query("SELECT id FROM products WHERE slug = $1 AND id <> $2", [baseSlug, excludedId])
    : await postgresPool.query("SELECT id FROM products WHERE slug = $1", [baseSlug]);
  if (!query.rows.length) return baseSlug;
  let candidate;
  do {
    candidate = `${baseSlug}-${randomUUID().slice(0, 8)}`;
    const exists = await postgresPool.query("SELECT id FROM products WHERE slug = $1", [candidate]);
    if (!exists.rows.length) return candidate;
  } while (true);
}

async function uploadProductImages(files) {
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
}

async function removeTempFiles(files) {
  await Promise.all((files || []).map((file) => rm(file.path, { force: true }).catch((error) => {
    console.error("Product temp-file cleanup failed:", error);
  })));
}

const createProduct = asyncHandler(async (req, res) => {
  const files = req.files || [];
  let assets = [];
  let client;
  let committed = false;
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
    const price = Number(req.body.price);
    const categoryId = req.body.category;
    if (!name || !description || req.body.price === undefined || req.body.price === "") {
      throw new ApiError(400, "Name, description, and price are required");
    }
    if (!Number.isFinite(price) || price < 0) throw new ApiError(400, "Price must be a valid non-negative number");
    if (!uuidPattern.test(String(categoryId || ""))) throw new ApiError(400, "Choose a valid category");
    if (!files.length) throw new ApiError(400, "Choose at least one product photo");
    const category = await postgresPool.query("SELECT id FROM categories WHERE id = $1", [categoryId]);
    if (!category.rows[0]) throw new ApiError(404, "Category not found");

    const slug = await makeUniqueSlug(name);
    assets = await uploadProductImages(files);
    client = await postgresPool.connect();
    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO products (name, slug, description, price, category_id, shipping)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [name, slug, description, price, categoryId, req.body.shipping === "true" || req.body.shipping === true]
    );
    const productId = inserted.rows[0].id;
    for (let index = 0; index < assets.length; index += 1) {
      const asset = assets[index];
      await client.query(
        "INSERT INTO product_images (product_id, url, public_id, image_order) VALUES ($1, $2, $3, $4)",
        [productId, asset.secure_url, asset.public_id, index]
      );
    }
    await client.query("COMMIT");
    committed = true;
    const product = await getProductById(productId);
    return res.status(201).json(new ApiResponse(201, product, "Product created successfully"));
  } catch (error) {
    if (client && !committed) await client.query("ROLLBACK").catch(() => {});
    if (!committed && assets.length) await Promise.all(assets.map((asset) => deleteOnCloudinary(asset.public_id)));
    if (error.code === "23505") throw new ApiError(409, "A product with this slug already exists; try again");
    throw error;
  } finally {
    client?.release();
    await removeTempFiles(files);
  }
});

const getAllProducts = asyncHandler(async (req, res) => {
  const requestedPage = Number.parseInt(String(req.query.page ?? "1"), 10);
  if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) throw new ApiError(400, "Page must be a positive whole number");

  const filterValues = [];
  const filterSqlParts = [];
  if (req.query.category) {
    const categoryIds = String(req.query.category).split(",").filter(Boolean);
    if (categoryIds.some((id) => !uuidPattern.test(id))) throw new ApiError(400, "Invalid category filter");
    filterValues.push(categoryIds);
    filterSqlParts.push(`p.category_id = ANY($${filterValues.length}::uuid[])`);
  }
  const search = String(req.query.search ?? "").trim();
  if (search.length > 100) throw new ApiError(400, "Search text must be 100 characters or fewer");
  if (search) {
    filterValues.push(`%${search}%`);
    filterSqlParts.push(`(p.name ILIKE $${filterValues.length} OR p.description ILIKE $${filterValues.length})`);
  }
  const minPrice = req.query.minPrice === undefined ? undefined : Number(req.query.minPrice);
  const maxPrice = req.query.maxPrice === undefined ? undefined : Number(req.query.maxPrice);
  if (minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) throw new ApiError(400, "Minimum price must be a valid non-negative number");
  if (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) throw new ApiError(400, "Maximum price must be a valid non-negative number");
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) throw new ApiError(400, "Minimum price cannot be greater than maximum price");
  if (minPrice !== undefined) { filterValues.push(minPrice); filterSqlParts.push(`p.price >= $${filterValues.length}`); }
  if (maxPrice !== undefined) { filterValues.push(maxPrice); filterSqlParts.push(`p.price <= $${filterValues.length}`); }

  const whereSql = filterSqlParts.length ? ` WHERE ${filterSqlParts.join(" AND ")}` : "";
  const count = await postgresPool.query(`SELECT COUNT(*)::int AS total FROM products p${whereSql}`, filterValues);
  const totalProducts = count.rows[0].total;
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(totalProducts / perPage));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageValues = [...filterValues, perPage, (currentPage - 1) * perPage];
  const result = await postgresPool.query(
    `${productSelect}${whereSql} GROUP BY p.id, c.id ORDER BY p.created_at DESC LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`,
    pageValues
  );
  return res.status(200).json(new ApiResponse(200, {
    products: result.rows.map(mapProduct),
    pagination: { currentPage, perPage, totalProducts, totalPages, hasPreviousPage: currentPage > 1, hasNextPage: currentPage < totalPages },
  }, "Products retrieved successfully"));
});

const getSingleProduct = asyncHandler(async (req, res) => {
  const slug = req.params.slug?.trim().toLowerCase();
  if (!slug) throw new ApiError(400, "Product slug is required");
  const result = await postgresPool.query(`${productSelect} WHERE p.slug = $1 GROUP BY p.id, c.id`, [slug]);
  if (!result.rows[0]) throw new ApiError(404, "Product not found");
  return res.status(200).json(new ApiResponse(200, mapProduct(result.rows[0]), "Product retrieved successfully"));
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const files = req.files || [];
  if (!uuidPattern.test(id)) { await removeTempFiles(files); throw new ApiError(400, "Invalid product ID"); }
  let assets = [];
  let client;
  let committed = false;
  let oldImages = [];
  try {
    const currentResult = await postgresPool.query("SELECT * FROM products WHERE id = $1", [id]);
    const current = currentResult.rows[0];
    if (!current) throw new ApiError(404, "Product not found");

    const name = req.body.name === undefined ? current.name : String(req.body.name).trim();
    const description = req.body.description === undefined ? current.description : String(req.body.description).trim();
    const price = req.body.price === undefined ? Number(current.price) : Number(req.body.price);
    const categoryId = req.body.category === undefined ? current.category_id : String(req.body.category);
    let shipping = current.shipping;
    if (req.body.shipping !== undefined) {
      if (!["true", "false", true, false].includes(req.body.shipping)) throw new ApiError(400, "Shipping must be true or false");
      shipping = req.body.shipping === "true" || req.body.shipping === true;
    }
    if (!name || !description) throw new ApiError(400, "Product name and description cannot be empty");
    if (!Number.isFinite(price) || price < 0) throw new ApiError(400, "Price must be a valid non-negative number");
    if (!uuidPattern.test(categoryId)) throw new ApiError(400, "Choose a valid category");
    const category = await postgresPool.query("SELECT id FROM categories WHERE id = $1", [categoryId]);
    if (!category.rows[0]) throw new ApiError(404, "Category not found");

    const slug = name === current.name ? current.slug : await makeUniqueSlug(name, id);
    if (!files.length && req.body.name === undefined && req.body.description === undefined && req.body.price === undefined && req.body.category === undefined && req.body.shipping === undefined) {
      throw new ApiError(400, "Provide at least one field or photo to update");
    }
    if (files.length) {
      const imageResult = await postgresPool.query("SELECT public_id FROM product_images WHERE product_id = $1", [id]);
      oldImages = imageResult.rows;
      assets = await uploadProductImages(files);
    }

    client = await postgresPool.connect();
    await client.query("BEGIN");
    await client.query(
      `UPDATE products SET name = $1, slug = $2, description = $3, price = $4,
       category_id = $5, shipping = $6, updated_at = NOW() WHERE id = $7`,
      [name, slug, description, price, categoryId, shipping, id]
    );
    if (files.length) {
      await client.query("DELETE FROM product_images WHERE product_id = $1", [id]);
      for (let index = 0; index < assets.length; index += 1) {
        const asset = assets[index];
        await client.query("INSERT INTO product_images (product_id, url, public_id, image_order) VALUES ($1, $2, $3, $4)", [id, asset.secure_url, asset.public_id, index]);
      }
    }
    await client.query("COMMIT");
    committed = true;
    if (files.length) {
      const results = await Promise.all(oldImages.map((image) => deleteOnCloudinary(image.public_id)));
      if (results.some((result) => !result || !["ok", "not found"].includes(result.result))) console.error(`Some replaced images for product ${id} could not be removed`);
    }
    return res.status(200).json(new ApiResponse(200, await getProductById(id), "Product updated successfully"));
  } catch (error) {
    if (client && !committed) await client.query("ROLLBACK").catch(() => {});
    if (!committed && assets.length) await Promise.all(assets.map((asset) => deleteOnCloudinary(asset.public_id)));
    if (error.code === "23505") throw new ApiError(409, "A product with this slug already exists");
    throw error;
  } finally {
    client?.release();
    await removeTempFiles(files);
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!uuidPattern.test(id)) throw new ApiError(400, "Invalid product ID");
  const product = await getProductById(id);
  if (!product) throw new ApiError(404, "Product not found");
  const result = await postgresPool.query("DELETE FROM products WHERE id = $1 RETURNING id", [id]);
  if (!result.rows[0]) throw new ApiError(404, "Product not found");
  const deletions = await Promise.all(product.images.map((image) => deleteOnCloudinary(image.publicId)));
  const allRemoved = deletions.every((item) => item?.result === "ok" || item?.result === "not found");
  const message = allRemoved ? "Product and its images deleted successfully" : "Product deleted, but one or more Cloudinary images could not be removed";
  if (!allRemoved) console.error(`Cloudinary cleanup incomplete for deleted product ${id}`);
  return res.status(200).json(new ApiResponse(200, product, message));
});

export { createProduct, getAllProducts, getSingleProduct, updateProduct, deleteProduct };