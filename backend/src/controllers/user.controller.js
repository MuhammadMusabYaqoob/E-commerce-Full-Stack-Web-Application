import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch {
    throw new ApiError(500, "Something went wrong while generating access and refresh token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  const requestedRole = req.body.role || "customer";
  if ([name, email, password, phone, address].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  if (!["customer", "seller", "admin"].includes(requestedRole)) throw new ApiError(403, "Invalid account role");

  const existedUser = await User.findOne({ $or: [{ name }, { email }] });
  if (existedUser) throw new ApiError(409, "User with email or username already exists");

  const user = await User.create({ name, email, password, phone, address, role: requestedRole });
  if (!user) throw new ApiError(500, "User creation failed");

  return res.status(201).json({
    success: true,
    message: "User created successfully",
    user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role },
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");
  if (!(await user.isPasswordCorrect(password))) throw new ApiError(401, "Invalid credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  const options = { httpOnly: true, secure: true };
  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { user: loggedInUser }, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true });
  const options = { httpOnly: true, secure: true };
  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;
  if ([name, email, phone, address].some((value) => typeof value !== "string" || !value.trim())) {
    throw new ApiError(400, "Name, email, phone, and address are required");
  }
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ _id: { $ne: req.user._id }, $or: [{ name: normalizedName }, { email: normalizedEmail }] });
  if (existingUser) throw new ApiError(409, "That name or email is already being used by another account");

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");
  user.name = normalizedName;
  user.email = normalizedEmail;
  user.phone = phone.trim();
  user.address = address.trim();
  await user.save();
  const safeUser = await User.findById(user._id).select("-password -refreshToken");
  return res.status(200).json(new ApiResponse(200, { user: safeUser }, "Profile updated successfully"));
});

const changeUserPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== "string" || !currentPassword || typeof newPassword !== "string" || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/;
  if (!passwordPattern.test(newPassword)) throw new ApiError(400, "New password must be 8–16 characters and include uppercase, lowercase, number, and special character");

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");
  if (!(await user.isPasswordCorrect(currentPassword))) throw new ApiError(401, "Current password is incorrect");
  if (currentPassword === newPassword) throw new ApiError(400, "New password must be different from your current password");
  user.password = newPassword;
  await user.save();
  return res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
});

const getAllUsers = asyncHandler(async (req, res) => {
  const requestedPage = Number.parseInt(String(req.query.page ?? "1"), 10);
  if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) throw new ApiError(400, "Page must be a positive whole number");
  const perPage = 10;
  const totalUsers = await User.countDocuments();
  const groupedRoleCounts = await User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]);
  const roleCounts = { customer: 0, admin: 0, seller: 0 };
  for (const entry of groupedRoleCounts) if (Object.hasOwn(roleCounts, entry._id)) roleCounts[entry._id] = entry.count;
  const totalPages = Math.max(1, Math.ceil(totalUsers / perPage));
  const currentPage = Math.min(requestedPage, totalPages);
  const users = await User.find().select("-password -refreshToken").sort({ createdAt: -1 }).skip((currentPage - 1) * perPage).limit(perPage);
  return res.status(200).json(new ApiResponse(200, {
    users, roleCounts, pagination: { currentPage, perPage, totalUsers, totalPages },
  }, "Users retrieved successfully"));
});

export { registerUser, loginUser, logoutUser, updateUserProfile, changeUserPassword, getAllUsers };