import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { postgresPool } from "../db/postgres.js";

const verifyJWT = asyncHandler(async (req, _, next) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) throw new ApiError(401, "Unauthorized request");

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired access token");
  }

  try {
    const result = await postgresPool.query(
      `SELECT id, name, email, phone, address, role, created_at, updated_at
       FROM users WHERE id = $1`,
      [decodedToken?._id]
    );
    const row = result.rows[0];
    if (!row) throw new ApiError(401, "Invalid access token");

    req.user = {
      _id: row.id,
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.code === "22P02") throw new ApiError(401, "Invalid access token");
    throw error;
  }
});

export default verifyJWT;