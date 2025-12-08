import express from "express";
import cors from "cors";
import "reflect-metadata";
import { errorHandler } from "./utils/errorHandler";
import { initializeDatabase } from "./container";
import apiRouter from "./routes/api.routes";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use("/", apiRouter);
app.get("/", (_req, res) => { res.send("Therabot API is running"); });

// Global error handler
app.use(errorHandler);

// Start server
const start = async () => {
    await initializeDatabase();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

start();