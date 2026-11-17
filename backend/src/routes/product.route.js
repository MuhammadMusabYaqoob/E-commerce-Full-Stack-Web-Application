import express from "express";
import {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Public browsing routes
router.get("/get-products", getAllProducts);
router.get("/single-product/:slug", getSingleProduct);

// Product management routes: admin or seller
router.post(
  "/create-product",
  verifyJWT,
  authorizeRoles("admin", "seller"),
  upload.array("photos", 5),
  createProduct
);
router.put(
  "/update-product/:id",
  verifyJWT,
  authorizeRoles("admin", "seller"),
  upload.array("photos", 5),
  updateProduct
);
router.delete(
  "/delete-product/:id",
  verifyJWT,
  authorizeRoles("admin", "seller"),
  deleteProduct
);

export default router;
