import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { postgresPool } from "../db/postgres.js";

function toPublicUser(row) {
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    role: row.role,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

function createAccessToken(userId) {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new ApiError(500, "ACCESS_TOKEN_SECRET is not configured");
  }
  return jwt.sign({ _id: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
  });
}

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  const role = req.body.role || "customer";

  if ([name, email, password, phone, address].some((value) => typeof value !== "string" || !value.trim())) {
    throw new ApiError(400, "All fields are required");
  }
  if (!["customer", "seller", "admin"].includes(role)) {
    throw new ApiError(400, "Invalid account role");
  }

  const normalizedName = name.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password.trim(), 10);

  try {
    const result = await postgresPool.query(
      `INSERT INTO users (name, email, password_hash, phone, address, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, address, role, created_at, updated_at`,
      [normalizedName, normalizedEmail, passwordHash, phone.trim(), address.trim(), role]
    );
    return res.status(201).json(new ApiResponse(201, { user: toPublicUser(result.rows[0]) }, "User created successfully"));
  } catch (error) {
    if (error.code === "23505") throw new ApiError(409, "User with email or name already exists");
    throw error;
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const result = await postgresPool.query(
    `SELECT id, name, email, password_hash, phone, address, role, created_at, updated_at
     FROM users WHERE email = $1`,
    [email.trim().toLowerCase()]
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, "Email or password is incorrect");
  }

  const accessToken = createAccessToken(user.id);
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions())
    .json(new ApiResponse(200, { user: toPublicUser(user) }, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  return res
    .clearCookie("accessToken", cookieOptions())
    .clearCookie("refreshToken", cookieOptions())
    .status(200)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;
  if ([name, email, phone, address].some((value) => typeof value !== "string" || !value.trim())) {
    throw new ApiError(400, "Name, email, phone, and address are required");
  }

  try {
    const result = await postgresPool.query(
      `UPDATE users
       SET name = $1, email = $2, phone = $3, address = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, email, phone, address, role, created_at, updated_at`,
      [name.trim().toLowerCase(), email.trim().toLowerCase(), phone.trim(), address.trim(), req.user.id]
    );
    if (!result.rows[0]) throw new ApiError(404, "User not found");
    return res.status(200).json(new ApiResponse(200, { user: toPublicUser(result.rows[0]) }, "Profile updated successfully"));
  } catch (error) {
    if (error.code === "23505") throw new ApiError(409, "That name or email is already being used by another account");
    throw error;
  }
});

const changeUserPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== "string" || !currentPassword || typeof newPassword !== "string" || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/;
  if (!passwordPattern.test(newPassword)) {
    throw new ApiError(400, "New password must be 8–16 characters and include uppercase, lowercase, number, and special character");
  }

  const currentResult = await postgresPool.query(
    "SELECT password_hash FROM users WHERE id = $1",
    [req.user.id]
  );
  const user = currentResult.rows[0];
  if (!user) throw new ApiError(404, "User not found");
  if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
    throw new ApiError(401, "Current password is incorrect");
  }
  if (currentPassword === newPassword) {
    throw new ApiError(400, "New password must be different from your current password");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await postgresPool.query(
    "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
    [passwordHash, req.user.id]
  );
  return res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
});

const getAllUsers = asyncHandler(async (req, res) => {
  const requestedPage = Number.parseInt(String(req.query.page ?? "1"), 10);
  if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) {
    throw new ApiError(400, "Page must be a positive whole number");
  }

  const perPage = 10;
  const countResult = await postgresPool.query("SELECT COUNT(*)::int AS total_users FROM users");
  const totalUsers = countResult.rows[0].total_users;
  const groupedRoleCounts = await postgresPool.query("SELECT role, COUNT(*)::int AS count FROM users GROUP BY role");
  const roleCounts = { customer: 0, admin: 0, seller: 0 };
  for (const row of groupedRoleCounts.rows) {
    if (Object.hasOwn(roleCounts, row.role)) roleCounts[row.role] = row.count;
  }

  const totalPages = Math.max(1, Math.ceil(totalUsers / perPage));
  const currentPage = Math.min(requestedPage, totalPages);
  const userResult = await postgresPool.query(
    `SELECT id, name, email, phone, address, role, created_at, updated_at
     FROM users ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [perPage, (currentPage - 1) * perPage]
  );
  const users = userResult.rows.map(toPublicUser);

  return res.status(200).json(new ApiResponse(200, {
    users,
    roleCounts,
    pagination: { currentPage, perPage, totalUsers, totalPages },
  }, "Users retrieved successfully"));
});

export { registerUser, loginUser, logoutUser, updateUserProfile, changeUserPassword, getAllUsers };