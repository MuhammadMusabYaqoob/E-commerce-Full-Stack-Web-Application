import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Products } from "../models/product.model.js";
import { Order } from "../models/order.model.js";

const placeOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }
  if (items.length > 50) throw new ApiError(400, "An order cannot contain more than 50 different products");

  const cleanItems = items.map((item) => ({
    productId: String(item?.productId || ""),
    quantity: Number(item?.quantity),
  }));
  if (cleanItems.some((item) => !mongoose.isValidObjectId(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
    throw new ApiError(400, "Each cart item must have a valid product and quantity from 1 to 99");
  }
  if (new Set(cleanItems.map((item) => item.productId)).size !== cleanItems.length) {
    throw new ApiError(400, "The cart contains a duplicate product");
  }

  const { name, email, phone, address } = shippingAddress || {};
  if ([name, email, phone, address].some((value) => typeof value !== "string" || !value.trim())) {
    throw new ApiError(400, "Name, email, phone, and delivery address are required");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new ApiError(400, "Enter a valid email address");
  }

  // Never trust product names or prices sent by the browser; read current values from MongoDB.
  const products = await Products.find({ _id: { $in: cleanItems.map((item) => item.productId) } });
  if (products.length !== cleanItems.length) throw new ApiError(404, "One or more products are no longer available");
  const productsById = new Map(products.map((product) => [String(product._id), product]));

  let subtotalCents = 0;
  const orderItems = cleanItems.map(({ productId, quantity }) => {
    const product = productsById.get(productId);
    const unitPriceCents = Math.round(Number(product.price) * 100);
    const lineTotalCents = unitPriceCents * quantity;
    subtotalCents += lineTotalCents;
    return {
      product: product._id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.images?.[0]?.url || "",
      unitPrice: unitPriceCents / 100,
      quantity,
      lineTotal: lineTotalCents / 100,
    };
  });
  const subtotal = subtotalCents / 100;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
    },
    subtotal,
    total: subtotal,
    paymentStatus: "unpaid",
    orderStatus: "pending",
  });

  return res.status(201).json(new ApiResponse(201, { order }, "Order placed. Payment is not collected yet."));
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, { orders }, "Orders retrieved successfully"));
});


const getAllOrdersForAdmin = asyncHandler(async (req, res) => {
  const requestedPage = Number.parseInt(String(req.query.page ?? "1"), 10);
  if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) {
    throw new ApiError(400, "Page must be a positive whole number");
  }

  const perPage = 10;
  const totalOrders = await Order.countDocuments();
  const totalPages = Math.max(1, Math.ceil(totalOrders / perPage));
  const currentPage = Math.min(requestedPage, totalPages);
  const orders = await Order.find()
    .populate("user", "name email phone")
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  return res.status(200).json(new ApiResponse(200, {
    orders,
    pagination: { currentPage, perPage, totalOrders, totalPages },
  }, "All orders retrieved successfully"));
});
export { placeOrder, getMyOrders, getAllOrdersForAdmin };