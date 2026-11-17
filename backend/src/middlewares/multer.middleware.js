import multer from "multer";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { ApiError } from "../utils/ApiError.js";

// Ensure the upload directory exists
const uploadDirectory = path.join(tmpdir(), "ecommerce-product-uploads");
mkdirSync(uploadDirectory, { recursive: true });

// setting destination and renaming file
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    callback(null, `${Date.now()}-${randomUUID()}${extname(file.originalname).toLowerCase()}`);
  },
});


// checking file type
const fileFilter = (_req, file, callback) => {
  if (!file.mimetype.startsWith("image/")) {
    return callback(new ApiError(400, "Please upload an image file"));
  }
  callback(null, true);
};


// setting up multer
const upload = multer({
  // dest: uploadDirectory,
  storage,
  // selecting file
  fileFilter,
  // 5MB limit
  limits: { fileSize: 5 * 1024 * 1024 },
});

export { upload };