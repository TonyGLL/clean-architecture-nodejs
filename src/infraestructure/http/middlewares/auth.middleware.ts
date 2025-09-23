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

const createAuthMiddleware = (serviceType: ServiceType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new HttpError(HttpStatusCode.UNAUTHORIZED, 'Unauthorized: No token provided or malformed header.'));
        }

        const [_, token] = authHeader.split(' ');

        if (!token) {
            return next(new HttpError(HttpStatusCode.UNAUTHORIZED, 'Unauthorized: No token provided.'));
        }

        try {
            const jwtService = container.get<IJwtService>(APPLICATION_TYPES.IJwtService);
            const decoded = jwtService.validateToken(token, serviceType);
            req.user = decoded;
            next();
        } catch (error) {
            if (error instanceof HttpError) {
                return next(error);
            }
            // Pass a new HttpError to the global error handler for consistent error handling
            return next(new HttpError(HttpStatusCode.FORBIDDEN, 'Forbidden: Invalid or expired token.'));
        }
    };
};

export const clientAuthMiddleware = createAuthMiddleware('client');
export const adminAuthMiddleware = createAuthMiddleware('admin');
