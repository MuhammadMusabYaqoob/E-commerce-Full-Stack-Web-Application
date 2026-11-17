import express from "express";
import { registerUser, loginUser, logoutUser, updateUserProfile, changeUserPassword, getAllUsers } from "../controllers/user.controller.postgres.js";
import verifyJWT from "../middlewares/auth.middleware.postgres.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.patch("/update-profile", verifyJWT, updateUserProfile);
router.patch("/change-password", verifyJWT, changeUserPassword);
router.get("/admin/users", verifyJWT, authorizeRoles("admin"), getAllUsers);

export default router;