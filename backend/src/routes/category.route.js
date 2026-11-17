import express from "express";
import {
  createCategory,
  updateCategory,
  getAllCategories,
  getSingleCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

// Anyone can browse categories.
router.get("/get-categories", getAllCategories);
router.get("/single-category/:slug", getSingleCategory);

// Only an authenticated administrator can change categories.
router.route("/create-category").post(verifyJWT, authorizeRoles("admin"), createCategory);
router.route("/:categoryId").put(verifyJWT, authorizeRoles("admin"), updateCategory);
router.delete("/delete-category/:id", verifyJWT, authorizeRoles("admin"), deleteCategory);

export default router;
