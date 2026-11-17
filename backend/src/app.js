import express from 'express';
import userRoutes from "./routes/user.route.js";
import categoryRoutes from "./routes/category.route.js";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/order.route.js";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import cors from 'cors';



// Create Express application
export const app = express();

// Global middlewares
app.use(cors({origin: process.env.CORS_ORIGIN,credentials: true}))
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
// app.use(morgan("dev"));

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);

// Error handling middleware (must be last)
app.use(errorMiddleware);












// app.get("/", (req, res) => {
//   console.log("----------------------------------------------------------")
//   // console.log("REQUEST:", req);
//   console.log("REQUEST METHOD:", req.method);
//   console.log("REQUEST URL:", req.url);
//   console.log("REQUEST HEADERS:", req.headers);
//   // console.log("RESPONSE:", res);

//   res.send("<h1>E-commerce API is running</h1>");
// });












// app.post("/login", (req, res) => {
//     console.log("REQUEST BODY:", req.body);
//     console.log("USERNAME:", req.body.username);

//     res.send("Login route is working");
// });