import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../auth.middleware';
import { IJwtService } from '../../../../application/services/jwt.service';
import { container } from '../../../ioc/config'; // Assuming container is exported and configured
import { APPLICATION_TYPES } from '../../../../application/ioc.types';
import { HttpStatusCode } from '../../../../domain/shared/http.status';
import { HttpError } from '../../../../domain/errors/http.error';

// Mock Express Request, Response, NextFunction
const mockRequest = (authHeader?: string) => ({
    headers: {
        authorization: authHeader,
    },
} as Request);

const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

const mockNext: NextFunction = jest.fn();

// Mock IJwtService
const mockJwtService: jest.Mocked<IJwtService> = {
    generateToken: jest.fn(),
    validateToken: jest.fn(),
};

describe('Auth Middleware', () => {
    let originalJwtServiceBinding: any;

    beforeAll(() => {
        // Rebind IJwtService to our mock for testing purposes
        if (container.isBound(APPLICATION_TYPES.IJwtService)) {
            originalJwtServiceBinding = container.get(APPLICATION_TYPES.IJwtService);
            container.rebind<IJwtService>(APPLICATION_TYPES.IJwtService).toConstantValue(mockJwtService);
        } else {
            container.bind<IJwtService>(APPLICATION_TYPES.IJwtService).toConstantValue(mockJwtService);
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        // Restore original binding if it existed
        if (originalJwtServiceBinding) {
            container.rebind<IJwtService>(APPLICATION_TYPES.IJwtService).toConstantValue(originalJwtServiceBinding);
        } else {
            // If it was not bound before, unbind it.
            if(container.isBound(APPLICATION_TYPES.IJwtService)) {
                container.unbind(APPLICATION_TYPES.IJwtService);
            }
        }
    });


    it('should call next() if token is valid', () => {
        const req = mockRequest('Bearer validtoken123');
        const res = mockResponse();
        const decodedPayload = { userId: '123', email: 'test@example.com' };
        mockJwtService.validateToken.mockReturnValue(decodedPayload);

        authMiddleware(req, res, mockNext);

        expect(mockJwtService.validateToken).toHaveBeenCalledWith('validtoken123');
        expect(req.user).toEqual(decodedPayload);
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no Authorization header', () => {
        const req = mockRequest(undefined);
        const res = mockResponse();
        authMiddleware(req, res, mockNext);
        expect(res.status).toHaveBeenCalledWith(HttpStatusCode.UNAUTHORIZED);
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: No token provided or malformed header.' });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if Authorization header is not Bearer', () => {
        const req = mockRequest('Basic somecredentials');
        const res = mockResponse();
        authMiddleware(req, res, mockNext);
        expect(res.status).toHaveBeenCalledWith(HttpStatusCode.UNAUTHORIZED);
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: No token provided or malformed header.' });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is missing after Bearer', () => {
        const req = mockRequest('Bearer ');
        const res = mockResponse();
        authMiddleware(req, res, mockNext);
        expect(res.status).toHaveBeenCalledWith(HttpStatusCode.UNAUTHORIZED);
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: No token provided.' });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if token is invalid (validateToken throws generic error)', () => {
        const req = mockRequest('Bearer invalidtoken');
        const res = mockResponse();
        mockJwtService.validateToken.mockImplementation(() => {
            throw new Error('Validation failed');
        });
        authMiddleware(req, res, mockNext);
        expect(res.status).toHaveBeenCalledWith(HttpStatusCode.FORBIDDEN);
        expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: Invalid or expired token.' });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return specific HttpError if validateToken throws HttpError', () => {
        const req = mockRequest('Bearer expiredtoken');
        const res = mockResponse();
        mockJwtService.validateToken.mockImplementation(() => {
            throw new HttpError(HttpStatusCode.FORBIDDEN, 'Token has expired.');
        });
        authMiddleware(req, res, mockNext);
        expect(res.status).toHaveBeenCalledWith(HttpStatusCode.FORBIDDEN);
        expect(res.json).toHaveBeenCalledWith({ message: 'Token has expired.' });
        expect(mockNext).not.toHaveBeenCalled();
    });
});
