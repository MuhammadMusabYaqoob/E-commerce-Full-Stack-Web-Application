import { ApiError } from "../utils/ApiError.js";

// Use after verifyJWT on role-restricted API routes. Never authorize from LocalStorage.
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, "Unauthorized request"));
  
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to perform this action"));
  }
  next();
};

export { authorizeRoles };