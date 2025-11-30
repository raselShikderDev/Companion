/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { Request, Response, NextFunction } from 'express';
import customError from '../shared/customError';

// Checks if an error is a Prisma Client error
const isPrismaError = (error: any): boolean => {
    return typeof error.code === 'string' && error.code.startsWith('P');
};

// Checks if an error is a Zod validation error
const isZodError = (error: any): boolean => {
    return error.name === 'ZodError' && Array.isArray(error.errors);
};

// Checks if an error is a JWT authentication error
const isJWTError = (error: any): boolean => {
    return error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError';
};


const processRawError = (err: any): typeof customError.prototype => {
    
    // 1. ZOD VALIDATION ERRORS (400 Bad Request)
    if (isZodError(err)) {
        // Map Zod errors to the structured errors array
        const validationErrors = err.errors.map((error: any) => ({
            path: error.path.join('.'),
            message: error.message,
        }));
        
        return new customError(
            400, 
            'Validation failed. Check the errors array for details.',
            validationErrors 
        );
    }
    
    // 2. JWT AUTHENTICATION ERRORS (401 Unauthorized)
    if (isJWTError(err)) {
        let message = 'Authentication failed.';
        if (err.name === 'TokenExpiredError') {
            message = 'Access token has expired. Please log in again.';
        } else if (err.name === 'JsonWebTokenError') {
            message = 'Invalid token signature or format.';
        }
        return new customError(401, message);
    }

    // 3. PRISMA DATABASE ERRORS (404, 409, 500)
    if (isPrismaError(err)) {
        switch (err.code) {
            case 'P2002': { // Unique constraint failed
                const field = err.meta?.target?.[0] || 'Unknown field';
                return new customError(
                    409, // Conflict
                    `A record with this value already exists for the field: ${field}.`,
                );
            }
            case 'P2025': // Record not found
                return new customError(
                    404, // Not Found
                    'The requested resource was not found.',
                );
            default:
                console.error('Unhandled Prisma Error:', err.code, err.message);
                return new customError(500, 'A database error occurred.');
        }
    }
    
    // 4. ALREADY CUSTOM ERRORS
    if (err instanceof customError) {
        return err;
    }

    // 5. GENERIC ERRORS (RUNTIME, UNHANDLED EXCEPTIONS)
    const statusCode = err.statusCode || 500;
    
    return new customError(
        statusCode,
        err.message || 'An unexpected internal server error occurred.',
        err.stack
    );
};

// =============================================================================
// GLOBAL EXPRESS ERROR HANDLER MIDDLEWARE
// =============================================================================

/**
 * Global Express Error Handler. 
 * This must be the last middleware registered in your Express app.
 */
export const globalErrorHandler = (
    err: any, 
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    // Process the raw error into a standardized customError object
    const error = processRawError(err);

    // Log the detailed stack trace for all 500 errors
    if (error.statusCode >= 500) {
        console.error(`[FATAL] Server Error ${error.statusCode}:`, error.stack || error.message);
    }

    // Send the standardized JSON response to the client
    res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors, 
    });
};