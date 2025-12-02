export class AppError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

// 400 Bad Request (input issues)
export class BadRequestError extends AppError {
    constructor(message: string = "Bad Request") {
        super(message, 400);
    }
}

// 404 Not Found (database misses)
export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
        super(message, 404);
    }
}

// 401 Unauthorized (login failures)
export class UnauthorizedError extends AppError {
    constructor(message: string = "Unauthorized") {
        super(message, 401);
    }
}