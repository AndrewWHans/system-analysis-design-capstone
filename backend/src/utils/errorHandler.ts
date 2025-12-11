import { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError";

export const errorHandler = (
    err: any, 
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    // Handle trusted AppErrors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: "error",
            message: err.message,
        });
    }

    // Handle database unique constraint violations
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            status: "error",
            message: "A record with this unique identifier already exists.",
        });
    }

    // Handle generic/unexpected errors
    console.error("Unexpected Error:", err);
    return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
    });
};