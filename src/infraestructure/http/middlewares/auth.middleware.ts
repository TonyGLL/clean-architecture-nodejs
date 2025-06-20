import { Request, Response, NextFunction } from 'express';
import { container } from '../../ioc/config';
import { APPLICATION_TYPES } from '../../../application/ioc.types';
import { IJwtService } from '../../../application/services/jwt.service';
import { HttpError } from '../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../domain/shared/http.status';

// Extend Express Request type to include 'user'
declare global {
    namespace Express {
        interface Request {
            user?: any; // You can define a more specific type for the user payload
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: 'Unauthorized: No token provided or malformed header.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: 'Unauthorized: No token provided.' });
    }

    try {
        const jwtService = container.get<IJwtService>(APPLICATION_TYPES.IJwtService);
        const decoded = jwtService.validateToken(token); // This should return the payload if valid, or throw if not
        req.user = decoded; // Attach decoded payload to request
        next();
    } catch (error) {
        // Log the error for debugging if necessary console.error("Token validation error:", error)
        if (error instanceof HttpError) {
             return res.status(error.statusCode).json({ message: error.message });
        }
        // Customize error messages based on the type of error from jwtService.validateToken if possible
        // For example, jwt libraries often throw specific errors for expired tokens vs. invalid signatures.
        return res.status(HttpStatusCode.FORBIDDEN).json({ message: 'Forbidden: Invalid or expired token.' });
    }
};
