import express from "express";
import { registerUser, loginUser, logoutUser, updateUserProfile, changeUserPassword, getAllUsers } from "../controllers/user.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

// routing
//REGISTER || POST
router.route("/register").post(registerUser);
//LOGIN || POST
router.route("/login").post(loginUser);

// secured routes can be added here, for example:
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/update-profile").patch(verifyJWT, updateUserProfile);
router.route("/change-password").patch(verifyJWT, changeUserPassword);
router.route("/admin/users").get(verifyJWT, authorizeRoles("admin"), getAllUsers);

export default router;