import express from "express";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import { globalErrorHandler } from "./middlewares/error.middleware";


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