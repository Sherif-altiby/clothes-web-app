import express from "express";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./shared/middlewares/error.middleware";
import { notFoundHandler } from "./shared/middlewares/notFound.middleware";
import { productAdminRoutes, productUserRoutes } from "./features/products";
import authRoutes from "./features/auth";
import { categoryAdminRoutes, categoryUserRoutes } from "./features/category";
import { cartRoutes } from "./features/cart";
import { langMiddleware } from "./shared/middlewares/lang.middleware";
import { favouritesRoutes } from "./features/favourites";
import reviewRoutes from "./features/review/review.routes";
import { orderAdminRoutes, orderRoutes } from "./features/orders";
import heroSlideRoutes from "./features/heroSlide/heroSlide.routes";
import { uploadRouter } from "./features/upload";

const app = express();

// built-in middlewares
app.use(express.json());
app.use(cookieParser());


// auth routes
app.use("/api/auth", authRoutes);

// language middleware
app.use(langMiddleware);

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

// order routes
app.use("/api/user/orders", orderRoutes);
app.use("/api/admin/orders", orderAdminRoutes);

// favourite routes
app.use("/api/user/favorites", favouritesRoutes);

// review routes
app.use("/api/user/reviews", reviewRoutes);

app.use("/api", heroSlideRoutes);

//upload images routes
app.use("/api/upload", uploadRouter);

// Not Found Middleware
app.use(notFoundHandler);

// Global Error Handler Middleware
app.use(globalErrorHandler);

export default app;