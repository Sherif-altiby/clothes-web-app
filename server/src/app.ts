import express from "express";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./shared/middlewares/error.middleware";
import { notFoundHandler } from "./shared/middlewares/notFound.middleware";
import { productAdminRoutes, productUserRoutes } from "./features/products";
import authRoutes from "./features/auth";
import { categoryAdminRoutes, categoryUserRoutes } from "./features/category";
import { cartRoutes } from "./features/cart";

const app = express();

// built-in middlewares
app.use(express.json());
app.use(cookieParser());


// auth routes
app.use("/api/auth", authRoutes);

// category user routes
app.use("/api/user/categories", categoryUserRoutes);
// category admin routes
app.use("/api/admin/category", categoryAdminRoutes);


// product user routes
app.use("/api/user/products", productUserRoutes);
// product admin routes
app.use("/api/admin/product", productAdminRoutes);

// cart routes
app.use("/api/user/cart", cartRoutes);


// Not Found Middleware
app.use(notFoundHandler);

// Global Error Handler Middleware
app.use(globalErrorHandler);

export default app;