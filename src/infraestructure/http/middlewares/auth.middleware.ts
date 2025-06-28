import { Request, Response, NextFunction } from 'express';
import { container } from '../../ioc/config';
import { APPLICATION_TYPES } from '../../../application/ioc.types';
import { IJwtService } from '../../../application/services/jwt.service';
import { HttpError } from '../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../domain/shared/http.status';
import { ServiceType } from '../../../application/dtos/auth.admin.dto';

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
        throw new HttpError(HttpStatusCode.UNAUTHORIZED, 'Unauthorized: No token provided or malformed header.');
    }

    const [_, token] = authHeader.split(' ');

    if (!token) {
        throw new HttpError(HttpStatusCode.UNAUTHORIZED, 'Unauthorized: No token provided.');
    }

    try {
        const jwtService = container.get<IJwtService>(APPLICATION_TYPES.IJwtService);
        const serviceType = req.baseUrl.split('/')[3] as ServiceType; // Assuming the service type is part of the URL path, e.g., /api/admin/...
        console.log(serviceType);

        const decoded = jwtService.validateToken(token, serviceType); // This should return the payload if valid, or throw if not
        req.user = decoded; // Attach decoded payload to request
        next();
    } catch (error) {
        // Log the error for debugging if necessary console.error("Token validation error:", error)
        if (error instanceof HttpError) {
            throw new HttpError(error.statusCode, error.message);
        }
        // Customize error messages based on the type of error from jwtService.validateToken if possible
        // For example, jwt libraries often throw specific errors for expired tokens vs. invalid signatures.
        res.status(HttpStatusCode.FORBIDDEN).json({ message: 'Forbidden: Invalid or expired token.' });
    }
};
