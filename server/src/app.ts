import express from "express";
import { globalErrorHandler } from "./shared/middlewares/error.middleware";
import { notFoundHandler } from "./shared/middlewares/notFound.middleware";


const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "API Running",
    });
});

app.use(notFoundHandler);

app.use(globalErrorHandler);

export default app;