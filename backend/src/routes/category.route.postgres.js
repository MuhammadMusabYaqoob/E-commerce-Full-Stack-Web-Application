import express from "express";
import { createCategory, updateCategory, getAllCategories, getSingleCategory, deleteCategory } from "../controllers/category.controller.postgres.js";
import verifyJWT from "../middlewares/auth.middleware.postgres.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();
router.get("/get-categories", getAllCategories);
router.get("/single-category/:slug", getSingleCategory);
router.post("/create-category", verifyJWT, authorizeRoles("admin"), createCategory);
router.put("/:categoryId", verifyJWT, authorizeRoles("admin"), updateCategory);
router.delete("/delete-category/:id", verifyJWT, authorizeRoles("admin"), deleteCategory);

export default router;