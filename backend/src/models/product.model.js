import mongoose, { Schema } from "mongoose";

const productImageSchema = new Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  images: {
    type: [productImageSchema],
    required: true,
    validate: {
      validator: (images) => images.length > 0,
      message: "At least one product image is required",
    },
  },
  shipping: { type: Boolean, default: false },
}, { timestamps: true });

export const Products = mongoose.model("Products", productSchema);
