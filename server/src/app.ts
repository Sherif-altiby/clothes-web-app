import express from "express";
import { globalErrorHandler } from "./shared/middlewares/error.middleware";
import { notFoundHandler } from "./shared/middlewares/notFound.middleware";
import { productUserRoutes } from "./features/products";
import authRoutes from "./features/auth";

const app = express();

app.use(express.json());

// product user routes
app.use("/api/user/products", productUserRoutes);


// auth routes
app.use("/api/auth", authRoutes);


// Not Found Middleware
app.use(notFoundHandler);

// Global Error Handler Middleware
app.use(globalErrorHandler);

export default app;