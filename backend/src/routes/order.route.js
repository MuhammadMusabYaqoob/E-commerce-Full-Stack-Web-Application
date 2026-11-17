import express from "express";
import { getAllOrdersForAdmin, getMyOrders, placeOrder } from "../controllers/order.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();
router.post("/place-order", verifyJWT, authorizeRoles("customer"), placeOrder);
router.get("/my-orders", verifyJWT, authorizeRoles("customer"), getMyOrders);
router.get("/admin/orders", verifyJWT, authorizeRoles("admin"), getAllOrdersForAdmin);

export default router;