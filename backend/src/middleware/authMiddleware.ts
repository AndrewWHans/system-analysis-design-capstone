import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../utils/AppError";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

interface JwtPayload {
    userId: number;
    username: string;
    email: string;
    isAdmin: boolean;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return next(new UnauthorizedError("No token provided"));

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return next(new UnauthorizedError("Invalid token"));
        req.user = user as JwtPayload;
        next();
    });
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.isAdmin) {
        return next(new UnauthorizedError("Admin access required"));
    }
    next();
};